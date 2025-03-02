import React, { useState, useEffect } from "react";
import { Plus, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from "./ChatInterface";
import { ExtendedChatMessage } from "./ThoughtProcess";

// Define a type for a chat session
interface ChatSession {
    id: string;
    name: string;
    messages: ExtendedChatMessage[];
    createdAt: Date;
}

const ChatSessionManager = () => {
    // State for managing sessions
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Load sessions from localStorage on component mount
    useEffect(() => {
        const savedSessions = localStorage.getItem("chatSessions");
        if (savedSessions) {
            try {
                const parsedSessions = JSON.parse(savedSessions);
                // Convert string dates back to Date objects
                const sessionsWithDates = parsedSessions.map(
                    (session: any) => ({
                        ...session,
                        createdAt: new Date(session.createdAt),
                    })
                );
                setSessions(sessionsWithDates);

                // Set the active session to the most recent one
                if (sessionsWithDates.length > 0) {
                    setActiveSessionId(sessionsWithDates[0].id);
                }
            } catch (error) {
                console.error("Error loading sessions:", error);
                // If there's an error, start fresh
                createNewSession();
            }
        } else {
            // If no sessions exist, create a new one
            createNewSession();
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem("chatSessions", JSON.stringify(sessions));
        }
    }, [sessions]);

    // Create a new chat session
    const createNewSession = () => {
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            name: `Chat ${sessions.length + 1}`,
            messages: [
                {
                    role: "assistant",
                    content: "Hello! How can I assist you today?",
                },
            ],
            createdAt: new Date(),
        };

        setSessions((prevSessions) => [newSession, ...prevSessions]);
        setActiveSessionId(newSession.id);
    };

    // Delete a chat session
    const deleteSession = (sessionId: string, event: React.MouseEvent) => {
        event.stopPropagation();

        // Filter out the session to be deleted
        const updatedSessions = sessions.filter(
            (session) => session.id !== sessionId
        );
        setSessions(updatedSessions);

        // If we deleted the active session, set a new active session
        if (sessionId === activeSessionId) {
            if (updatedSessions.length > 0) {
                setActiveSessionId(updatedSessions[0].id);
            } else {
                // If no sessions left, create a new one
                createNewSession();
            }
        }

        // If no sessions left after deletion, remove from localStorage
        if (updatedSessions.length === 0) {
            localStorage.removeItem("chatSessions");
        }
    };

    // Update a session's messages
    const updateSessionMessages = (
        sessionId: string,
        messages: ExtendedChatMessage[]
    ) => {
        setSessions((prevSessions) =>
            prevSessions.map((session) =>
                session.id === sessionId ? { ...session, messages } : session
            )
        );
    };

    // Rename a session based on its first user message
    const renameSessionFromContent = (
        sessionId: string,
        messages: ExtendedChatMessage[]
    ) => {
        // Find the first user message
        const firstUserMessage = messages.find((msg) => msg.role === "user");

        if (firstUserMessage && typeof firstUserMessage.content === "string") {
            // Get the first few words (up to 4) of the message
            const contentText = firstUserMessage.content;
            const words = contentText.split(" ");
            const sessionName =
                words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");

            // Update the session name
            setSessions((prevSessions) =>
                prevSessions.map((session) =>
                    session.id === sessionId
                        ? { ...session, name: sessionName }
                        : session
                )
            );
        }
    };

    // Get the active session
    const activeSession = sessions.find(
        (session) => session.id === activeSessionId
    );

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto rounded-lg bg-white shadow-lg">
            {/* Session tabs */}
            <div className="border-b">
                <ScrollArea className="whitespace-nowrap">
                    <div className="flex items-center p-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => setActiveSessionId(session.id)}
                                className={`flex items-center px-3 py-2 mr-2 rounded-md cursor-pointer transition-colors ${
                                    session.id === activeSessionId
                                        ? "bg-blue-100 text-blue-800"
                                        : "hover:bg-gray-100"
                                }`}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium truncate max-w-[150px]">
                                    {session.name}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 p-0 h-6 w-6 rounded-full"
                                    onClick={(e) =>
                                        deleteSession(session.id, e)
                                    }
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={createNewSession}
                            className="p-2 ml-1"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            <span>New Chat</span>
                        </Button>
                    </div>
                </ScrollArea>
            </div>

            {/* Active chat session */}
            {activeSession && (
                <ChatInterface
                    key={activeSession.id}
                    sessionId={activeSession.id}
                    initialMessages={activeSession.messages}
                    onMessagesUpdate={(messages) => {
                        updateSessionMessages(activeSession.id, messages);
                        // If this is a new chat (only has the initial assistant message),
                        // and we now have a user message, rename the session
                        if (
                            activeSession.messages.length === 1 &&
                            activeSession.messages[0].role === "assistant" &&
                            messages.length > 1
                        ) {
                            renameSessionFromContent(
                                activeSession.id,
                                messages
                            );
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ChatSessionManager;
