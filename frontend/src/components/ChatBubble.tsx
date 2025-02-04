import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatBubbleProps {
    content: string;
    isUser?: boolean;
    className?: string;
}

export const ChatBubble = ({ content, isUser, className }: ChatBubbleProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "mb-2 p-3 rounded-lg max-w-md",
                isUser
                    ? "ml-auto bg-blue-500 text-white"
                    : "bg-gray-200 text-black",
                className
            )}
        >
            {content}
        </motion.div>
    );
};

export const LoadingBubble = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 bg-gray-200 text-black mb-2 p-3 max-w-xs rounded-lg"
        >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
        </motion.div>
    );
};

interface ChatMessageItemProps {
    message: ChatMessage;
}

export const ChatMessageItem = ({ message }: ChatMessageItemProps) => {
    return (
        <ChatBubble
            content={message.content}
            isUser={message.role === "user"}
        />
    );
};

interface ChatMessagesProps {
    messages: ChatMessage[];
    isLoading?: boolean;
}

export const ChatMessages = ({ messages, isLoading }: ChatMessagesProps) => {
    return (
        <div className="flex flex-col space-y-2">
            {messages.map((message, index) => (
                <ChatMessageItem key={index} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
        </div>
    );
};

export default ChatMessages;
