"use client";

import React, { useState, useEffect, useRef } from "react";
import { SendHorizontal, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessages } from "./ChatBubble";
import { ExtendedChatMessage, ChatMessageContent } from "./ThoughtProcess";

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

interface ChatInterfaceProps {
    sessionId?: string;
    initialMessages?: ExtendedChatMessage[];
    onMessagesUpdate?: (messages: ExtendedChatMessage[]) => void;
}

const ChatInterface = ({
    sessionId = "default",
    initialMessages = [],
    onMessagesUpdate,
}: ChatInterfaceProps) => {
    const [isServerOnline, setIsServerOnline] = useState(false);
    const [messages, setMessages] =
        useState<ExtendedChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [thoughtStartTime, setThoughtStartTime] = useState<number | null>(
        null
    );
    const [maxThinkingTime, setMaxThinkingTime] = useState(10); // 10 seconds max thinking time
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages]);

    // Update parent component when messages change
    useEffect(() => {
        onMessagesUpdate?.(messages);
    }, [messages, onMessagesUpdate]);

    const handleSubmit = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ExtendedChatMessage = {
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setThoughtStartTime(Date.now());

        // Add placeholder for assistant's response
        const placeholderMessage: ExtendedChatMessage = {
            role: "assistant",
            content: {
                thought: "",
                response: "",
            },
        };
        setMessages((prev) => [...prev, placeholderMessage]);

        // Initialize variables for tracking response content
        let accumulatedThought = "";
        let accumulatedResponse = "";
        let isThoughtPhase = true;

        try {
            const response = await fetch("http://127.0.0.1:5000/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: input,
                    stream: true,
                    max_tokens: 4096,
                    temperature: 0.9,
                    session_id: sessionId, // Pass the session ID to the backend
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            while (reader) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(5).trim();
                        if (data === "[DONE]") break;
                        if (!data) continue;

                        try {
                            const parsed = JSON.parse(data);
                            if (!parsed.choices?.[0]?.text) continue;

                            const newText = parsed.choices[0].text;
                            const finishReason =
                                parsed.choices[0]?.finish_reason;

                            // If we received a finish_reason, handle it
                            if (finishReason) {
                                console.log(
                                    `Generation finished with reason: ${finishReason}`
                                );

                                // If we're still in thought phase but received a finish reason,
                                // force transition to response phase
                                if (isThoughtPhase) {
                                    isThoughtPhase = false;
                                    accumulatedThought +=
                                        "\n\nGeneration completed.";

                                    // If we have no response yet, create one from the thought
                                    if (!accumulatedResponse.trim()) {
                                        accumulatedResponse =
                                            "Based on my analysis, here's what I found: ";

                                        // Extract key points from thought to form a response
                                        const thoughtLines = accumulatedThought
                                            .split("\n")
                                            .filter(
                                                (line) => line.trim().length > 0
                                            );

                                        if (thoughtLines.length > 0) {
                                            // Take the last few lines as they're likely most relevant
                                            const relevantThoughts =
                                                thoughtLines.slice(
                                                    Math.max(
                                                        0,
                                                        thoughtLines.length - 3
                                                    )
                                                );
                                            if (relevantThoughts.length > 0) {
                                                accumulatedResponse +=
                                                    relevantThoughts.join(" ");
                                            }
                                        }
                                    }
                                }

                                // If finish reason is error, add error message
                                if (finishReason === "error" && newText) {
                                    accumulatedResponse += `\n\n${newText}`;
                                }

                                // Handle timeout case
                                if (finishReason === "timeout") {
                                    if (isThoughtPhase) {
                                        isThoughtPhase = false;
                                        accumulatedThought +=
                                            "\n\nModel generation timed out.";
                                    }

                                    if (!accumulatedResponse.trim()) {
                                        accumulatedResponse =
                                            "I started analyzing your request, but the generation process took too long and timed out. ";

                                        // Try to extract something useful from the thought process
                                        if (accumulatedThought.trim()) {
                                            accumulatedResponse +=
                                                "Based on my partial analysis: ";

                                            const thoughtLines =
                                                accumulatedThought
                                                    .split("\n")
                                                    .filter(
                                                        (line) =>
                                                            line.trim().length >
                                                            0
                                                    );

                                            if (thoughtLines.length > 0) {
                                                // Take the last few lines as they're likely most relevant
                                                const relevantThoughts =
                                                    thoughtLines.slice(
                                                        Math.max(
                                                            0,
                                                            thoughtLines.length -
                                                                3
                                                        )
                                                    );
                                                if (
                                                    relevantThoughts.length > 0
                                                ) {
                                                    accumulatedResponse +=
                                                        relevantThoughts.join(
                                                            " "
                                                        );
                                                }
                                            }
                                        }

                                        accumulatedResponse +=
                                            "\n\nPlease try again with a simpler query or break your question into smaller parts.";
                                    } else {
                                        accumulatedResponse +=
                                            newText ||
                                            "\n\n[Generation timed out. The response may be incomplete.]";
                                    }
                                }
                            }

                            // Check for thought process completion
                            if (newText.includes("</think>")) {
                                const parts = newText.split("</think>");
                                accumulatedThought += parts[0];
                                isThoughtPhase = false;

                                // If there's content after </think>, it's part of the response
                                if (parts.length > 1 && parts[1].trim()) {
                                    accumulatedResponse += parts[1].trim();
                                }
                            } else {
                                // Add content to either thought or response based on phase
                                if (isThoughtPhase) {
                                    accumulatedThought += newText;

                                    // Check if thinking time has exceeded the maximum
                                    if (
                                        thoughtStartTime &&
                                        (Date.now() - thoughtStartTime) / 1000 >
                                            maxThinkingTime
                                    ) {
                                        // Force transition to response phase
                                        isThoughtPhase = false;
                                        accumulatedThought +=
                                            "\n\nThinking time limit reached.";

                                        // Initialize the response if it's empty
                                        if (!accumulatedResponse.trim()) {
                                            accumulatedResponse =
                                                "Based on my analysis of your request, I can provide the following answer. ";

                                            // Extract key points from the thought process to form a basic response
                                            const thoughtLines =
                                                accumulatedThought
                                                    .split("\n")
                                                    .filter(
                                                        (line) =>
                                                            line.trim().length >
                                                            0
                                                    );
                                            if (thoughtLines.length > 0) {
                                                // Take the last few lines of thought as they're likely most relevant
                                                const relevantThoughts =
                                                    thoughtLines.slice(
                                                        Math.max(
                                                            0,
                                                            thoughtLines.length -
                                                                3
                                                        )
                                                    );
                                                if (
                                                    relevantThoughts.length > 0
                                                ) {
                                                    accumulatedResponse +=
                                                        "Here's what I found: " +
                                                        relevantThoughts.join(
                                                            " "
                                                        );
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    accumulatedResponse += newText;
                                }
                            }

                            const thoughtDuration = thoughtStartTime
                                ? Math.round(
                                      (Date.now() - thoughtStartTime) / 1000
                                  )
                                : null;

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                const lastMessage =
                                    newMessages[newMessages.length - 1];
                                if (lastMessage.role === "assistant") {
                                    lastMessage.content = {
                                        thought: accumulatedThought,
                                        response: accumulatedResponse,
                                    } as ChatMessageContent;
                                }
                                return newMessages;
                            });
                        } catch (e) {
                            console.error("Error parsing SSE data:", e);
                            continue;
                        }
                    }
                }
            }

            reader?.releaseLock();

            // Final check to ensure we have a response
            if (!accumulatedResponse.trim() && accumulatedThought.trim()) {
                // If we have thoughts but no response, create a response
                accumulatedResponse =
                    "I've analyzed your request but couldn't generate a complete response. Please try again or rephrase your question.";

                // Update the message one last time
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === "assistant") {
                        lastMessage.content = {
                            thought: accumulatedThought,
                            response: accumulatedResponse,
                        } as ChatMessageContent;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error:", error);

            // If we have any accumulated thought or response, preserve it
            if (accumulatedThought.trim() || accumulatedResponse.trim()) {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === "assistant") {
                        // If we have a thought but no response, add an error message as response
                        if (
                            accumulatedThought.trim() &&
                            !accumulatedResponse.trim()
                        ) {
                            accumulatedResponse =
                                "I encountered an error while generating a response. Please try again.";
                        }

                        lastMessage.content = {
                            thought: accumulatedThought,
                            response:
                                accumulatedResponse ||
                                "I encountered an error while generating a response. Please try again.",
                        } as ChatMessageContent;
                    }
                    return newMessages;
                });
            } else {
                // If we have no accumulated content at all, replace with error message
                setMessages((prev) => [
                    ...prev.slice(0, -1),
                    {
                        role: "assistant",
                        content: {
                            response:
                                "I apologize, but I encountered an error generating a response. Please try again.",
                        },
                    },
                ]);
            }
        } finally {
            setIsLoading(false);
            setThoughtStartTime(null);
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
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
                <h2 className="text-lg font-semibold">Chat Session</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                            Max Thinking Time:
                        </span>
                        <input
                            type="range"
                            min="3"
                            max="30"
                            value={maxThinkingTime}
                            onChange={(e) =>
                                setMaxThinkingTime(parseInt(e.target.value))
                            }
                            className="w-24"
                        />
                        <span className="text-sm text-gray-500">
                            {maxThinkingTime}s
                        </span>
                    </div>
                    <ServerStatus onStatusChange={setIsServerOnline} />
                </div>
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
