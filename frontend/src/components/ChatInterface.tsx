"use client";

import React, { useState, useEffect, useRef } from "react";
import { SendHorizontal, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessages } from "./ChatBubble";
import type { ChatMessage } from "./ChatBubble";

interface ServerStatusProps {
    onStatusChange: (isOnline: boolean) => void;
}

const ServerStatus = ({ onStatusChange }: ServerStatusProps) => {
    const [status, setStatus] = useState("checking");
    const [modelLoaded, setModelLoaded] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const checkHealth = async (isManualCheck: boolean = false) => {
        if (isManualCheck) {
            setIsChecking(true);
        }
        try {
            const response = await fetch("http://127.0.0.1:5000/api/health", {
                signal: AbortSignal.timeout(3000),
            });
            const data = await response.json();

            if (response.ok) {
                setStatus("online");
                setModelLoaded(data.model_loaded);
                onStatusChange(true);
            } else {
                setStatus("error");
                onStatusChange(false);
            }
        } catch (error) {
            setStatus("offline");
            onStatusChange(false);
        } finally {
            if (isManualCheck) {
                setIsChecking(false);
            }
        }
    };

    useEffect(() => {
        let isSubscribed = true;

        // Initial check
        checkHealth();

        // Set up polling
        const interval = setInterval(() => {
            if (isSubscribed) {
                checkHealth();
            }
        }, 3000);

        // Cleanup
        return () => {
            isSubscribed = false;
            clearInterval(interval);
        };
    }, []);

    const handleManualCheck = async () => {
        await checkHealth(true);
    };

    const getStatusColor = () => {
        switch (status) {
            case "online":
                return modelLoaded ? "bg-green-500" : "bg-yellow-500";
            case "offline":
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
            {(status === "offline" || status === "error") && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleManualCheck}
                    disabled={isChecking}
                    className="p-1"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${
                            isChecking ? "animate-spin" : ""
                        }`}
                    />
                </Button>
            )}
        </div>
    );
};

const ChatInterface = () => {
    const [isServerOnline, setIsServerOnline] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
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

        const userMessage: ChatMessage = { role: "user", content: input };
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
                    max_tokens: 4096,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: data.text || data.choices?.[0]?.text,
                };
                setMessages([...newMessages, assistantMessage]);
            } else {
                throw new Error(data.error || "Failed to generate response");
            }
        } catch (error) {
            console.error("Error:", error);
            const errorMessage: ChatMessage = {
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
                <ServerStatus onStatusChange={setIsServerOnline} />
            </div>

            <ScrollArea ref={chatRef} className="flex-1 p-6 overflow-y-auto">
                <ChatMessages messages={messages} isLoading={isLoading} />
                {!isServerOnline && (
                    <div className="flex items-center justify-center p-4 mt-4 bg-red-50 text-red-600 rounded-lg">
                        <p>
                            Server is currently offline. Please wait for it to
                            come back online.
                        </p>
                    </div>
                )}
            </ScrollArea>

            <div className="flex p-4 border-t">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 p-2 border rounded-lg"
                    placeholder={
                        isServerOnline
                            ? "Type a message..."
                            : "Server is offline"
                    }
                    disabled={!isServerOnline}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim() || !isServerOnline}
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
