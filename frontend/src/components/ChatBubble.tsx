import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";

export interface ChatMessageContent {
    thought?: string;
    response: string;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string | ChatMessageContent;
}

// Define specific props type for code component
interface CodeComponentProps {
    className?: string;
    children?: React.ReactNode;
    inline?: boolean;
}

// Define specific props type for math components
interface MathComponentProps {
    value: string;
}

const MarkdownComponents = {
    code: ({ className, children, inline }: CodeComponentProps) => {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
            <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-md"
            >
                {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
        ) : (
            <code
                className={cn(
                    "px-1.5 py-0.5 rounded font-mono text-sm",
                    className
                )}
            >
                {children}
            </code>
        );
    },
    math: ({ value }: MathComponentProps) => (
        <div className="my-2">
            <div
                dangerouslySetInnerHTML={{
                    __html: katex.renderToString(value, {
                        displayMode: true,
                        throwOnError: false,
                        output: "html",
                        macros: { "\\text": "\\mathrm" },
                    }),
                }}
            />
        </div>
    ),
    inlineMath: ({ value }: MathComponentProps) => (
        <span
            dangerouslySetInnerHTML={{
                __html: katex.renderToString(value, {
                    displayMode: false,
                    throwOnError: false,
                    output: "html",
                    macros: { "\\text": "\\mathrm" },
                }),
            }}
        />
    ),
};

interface ChatBubbleProps {
    content: string | ChatMessageContent;
    isUser?: boolean;
    className?: string;
}

export const ChatBubble = ({ content, isUser, className }: ChatBubbleProps) => {
    // Handle the content based on its type
    const displayContent =
        typeof content === "string" ? content : content.response || "";

    // Process the content to handle escaped LaTeX commands
    const processedContent = displayContent.replace(/\\\\text/g, "\\text");

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "mb-2 p-3 rounded-lg",
                isUser
                    ? "ml-auto bg-blue-500 text-white max-w-md"
                    : "bg-gray-200 text-black max-w-2xl",
                className
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={MarkdownComponents}
            >
                {processedContent}
            </ReactMarkdown>
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
    const messageContent = message.content;

    if (typeof messageContent === "string") {
        return (
            <ChatBubble
                content={messageContent}
                isUser={message.role === "user"}
            />
        );
    }

    return (
        <div className="space-y-2">
            {messageContent.thought && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-gray-800 text-gray-300 rounded-lg"
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={MarkdownComponents}
                    >
                        {messageContent.thought}
                    </ReactMarkdown>
                </motion.div>
            )}
            <ChatBubble content={messageContent.response} isUser={false} />
        </div>
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
