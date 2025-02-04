"use client";

import React, { useState, useEffect, useRef } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const ServerStatus = () => {
    const [status, setStatus] = useState("checking");
    const [modelLoaded, setModelLoaded] = useState(false);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch(
                    "http://127.0.0.1:5000/api/health"
                );
                const data = await response.json();

                if (response.ok) {
                    setStatus("online");
                    setModelLoaded(data.model_loaded);
                } else {
                    setStatus("error");
                }
            } catch (error) {
                setStatus("offline");
            }
        };

        // Initial check
        checkHealth();

        // Set up polling every 5 seconds
        const interval = setInterval(checkHealth, 5000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case "online":
                return modelLoaded ? "bg-green-500" : "bg-yellow-500";
            case "offline":
                return "bg-red-500";
            case "error":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusText = () => {
        if (status === "online") {
            return modelLoaded ? "Server Online" : "Model Loading";
        }
        return `Server ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    };

    return (
        <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
            <Badge variant={status === "online" ? "default" : "secondary"}>
                {getStatusText()}
            </Badge>
        </div>
    );
};

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hello! How can I assist you today?" },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages]);

    const handleSubmit = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: "user", content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:5000/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: input,
                    stream: false,
                    max_tokens: 512,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const assistantMessage = {
                    role: "assistant",
                    content: data.text || data.choices?.[0]?.text,
                };
                setMessages([...newMessages, assistantMessage]);
            } else {
                throw new Error(data.error || "Failed to generate response");
            }
        } catch (error) {
            console.error("Error:", error);
            const errorMessage = {
                role: "assistant",
                content:
                    "I apologize, but I encountered an error generating a response. Please try again.",
            };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(
                e as unknown as React.MouseEvent<HTMLButtonElement, MouseEvent>
            );
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Chat Session</h2>
                <ServerStatus />
            </div>

            <ScrollArea ref={chatRef} className="flex-1 p-6 overflow-y-auto">
                {messages.map((message, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-2 p-2 max-w-xs rounded-lg ${
                            message.role === "user"
                                ? "ml-auto bg-blue-500 text-white"
                                : "bg-gray-200 text-black"
                        }`}
                    >
                        {message.content}
                    </motion.div>
                ))}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 bg-gray-200 text-black mb-2 p-2 max-w-xs rounded-lg"
                    >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Thinking...</span>
                    </motion.div>
                )}
            </ScrollArea>

            <div className="flex p-4 border-t">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 p-2 border rounded-lg"
                    placeholder="Type a message..."
                />
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()}
                    className="ml-2"
                >
                    <SendHorizontal className="w-4 h-4 mr-2" />
                    Send
                </Button>
            </div>
        </div>
    );
};

export default ChatInterface;
