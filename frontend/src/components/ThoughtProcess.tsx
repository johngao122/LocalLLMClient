import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface ThoughtProcessProps {
    content: string;
    duration?: number;
}

export const ThoughtProcess = ({ content, duration }: ThoughtProcessProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gray-800 text-gray-300 rounded-lg opacity-70"
        >
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-400 font-medium">
                <Clock className="w-4 h-4" />
                <span>Thinking Process ({duration || "..."} seconds)</span>
            </div>
            <div className="whitespace-pre-wrap opacity-80">{content}</div>
        </motion.div>
    );
};

export interface ChatMessageContent {
    thought?: string;
    response: string;
}

export interface ExtendedChatMessage {
    role: "user" | "assistant";
    content: string | ChatMessageContent;
}

export const ChatMessageItem = ({
    message,
}: {
    message: ExtendedChatMessage;
}) => {
    if (message.role === "user" || typeof message.content === "string") {
        return (
            <div className="mb-4">
                <div
                    className={`${
                        message.role === "user"
                            ? "ml-auto bg-blue-500 text-white"
                            : "bg-gray-200 text-black"
                    } p-3 rounded-lg max-w-md`}
                >
                    {message.content as string}
                </div>
            </div>
        );
    }

    // Ensure we have a valid response
    const content = {
        ...(message.content as ChatMessageContent),
        response:
            (message.content as ChatMessageContent).response ||
            "No response generated. Please try again.",
    };

    return (
        <div className="mb-4 space-y-4">
            {content.thought && <ThoughtProcess content={content.thought} />}
            <div className="border-t border-gray-300 pt-2">
                <div className="bg-gray-200 text-black p-3 rounded-lg max-w-md">
                    {content.response}
                </div>
            </div>
        </div>
    );
};
