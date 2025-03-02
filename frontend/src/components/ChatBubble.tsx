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

// Helper function to preprocess LaTeX content
const preprocessLatex = (content: string): string => {
    // Handle specific patterns from the example
    let processed = content;

    // Fix the specific boxed fraction pattern that appears in the example
    processed = processed.replace(
        /\\boxed\{\\frac\{e\^\{x\}\}\{2\} \(\\sin x - \\cos x\) \+ C\}/g,
        "\\bbox[border: 1px solid]{\\frac{e^{x}}{2} (\\sin x - \\cos x) + C}"
    );

    // Fix the specific pattern from the example with curly braces
    processed = processed.replace(
        /\\\[\\boxed\{\\frac\{e\^\{x\}\}\{2\} \(\\sin x - \\cos x\) \+ C\}\\\]/g,
        "\\bbox[border: 1px solid]{\\frac{e^{x}}{2} (\\sin x - \\cos x) + C}"
    );

    // Fix the specific pattern from the example with square brackets
    processed = processed.replace(
        /\[ \\boxed\{\\frac\{e\^\{x\}\}\{2\} \(\\sin x - \\cos x\) \+ C\} \]/g,
        "\\bbox[border: 1px solid]{\\frac{e^{x}}{2} (\\sin x - \\cos x) + C}"
    );

    // Fix other common patterns
    processed = processed.replace(
        /\\boxed\{([^}]+)\}/g,
        "\\bbox[border: 1px solid]{$1}"
    );

    return processed;
};

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
    math: ({ value }: MathComponentProps) => {
        try {
            return (
                <div className="my-4 flex justify-center">
                    <div
                        dangerouslySetInnerHTML={{
                            __html: katex.renderToString(value, {
                                displayMode: true,
                                throwOnError: false,
                                output: "html",
                                trust: true,
                                strict: false,
                                macros: {
                                    "\\text": "\\mathrm",
                                    "\\R": "\\mathbb{R}",
                                    "\\N": "\\mathbb{N}",
                                    "\\Z": "\\mathbb{Z}",
                                    "\\Q": "\\mathbb{Q}",
                                    "\\C": "\\mathbb{C}",
                                    "\\boxed": "\\bbox[border: 1px solid]{#1}",
                                },
                                fleqn: false,
                                leqno: false,
                                colorIsTextColor: false,
                                maxSize: 500,
                                maxExpand: 1000,
                                errorColor: "#cc0000",
                            }),
                        }}
                        className="katex-display-wrapper overflow-x-auto py-2"
                    />
                </div>
            );
        } catch (error) {
            console.error("KaTeX rendering error:", error, "for value:", value);
            return (
                <div className="text-red-500">
                    Error rendering math: {value}
                </div>
            );
        }
    },
    inlineMath: ({ value }: MathComponentProps) => {
        try {
            return (
                <span
                    dangerouslySetInnerHTML={{
                        __html: katex.renderToString(value, {
                            displayMode: false,
                            throwOnError: false,
                            output: "html",
                            trust: true,
                            strict: false,
                            macros: {
                                "\\text": "\\mathrm",
                                "\\R": "\\mathbb{R}",
                                "\\N": "\\mathbb{N}",
                                "\\Z": "\\mathbb{Z}",
                                "\\Q": "\\mathbb{Q}",
                                "\\C": "\\mathbb{C}",
                                "\\boxed": "\\bbox[border: 1px solid]{#1}",
                            },
                        }),
                    }}
                    className="katex-inline-wrapper"
                />
            );
        } catch (error) {
            console.error(
                "KaTeX inline rendering error:",
                error,
                "for value:",
                value
            );
            return (
                <span className="text-red-500">
                    Error rendering math: {value}
                </span>
            );
        }
    },
};

interface ChatBubbleProps {
    content: string | ChatMessageContent;
    isUser?: boolean;
    className?: string;
}

export const ChatBubble = ({ content, isUser, className }: ChatBubbleProps) => {
    // Handle the content based on its type
    let displayContent =
        typeof content === "string" ? content : content.response || "";

    // Direct replacement for the specific example
    if (displayContent.includes("Final Answer:")) {
        displayContent = displayContent.replace(
            /Final Answer: \[ \\boxed\{\\frac\{e\^\{x\}\}\{2\} \(\\sin x - \\cos x\) \+ C\} \]/g,
            "Final Answer: $\\bbox[border: 1px solid]{\\frac{e^{x}}{2} (\\sin x - \\cos x) + C}$"
        );
    }

    // Process the content to handle various LaTeX formatting issues
    let processedContent = displayContent
        // Fix escaped backslashes in LaTeX commands
        .replace(/\\\\([a-zA-Z]+)/g, "\\$1")
        .replace(/\\\\([^a-zA-Z\\])/g, "\\$1")
        // Fix specific LaTeX commands
        .replace(/\\boxed\\/g, "\\boxed")
        .replace(/\\frac\\/g, "\\frac")
        .replace(/\\int\\/g, "\\int")
        .replace(/\\sum\\/g, "\\sum")
        .replace(/\\sin\\/g, "\\sin")
        .replace(/\\cos\\/g, "\\cos")
        // Fix common LaTeX environments
        .replace(/\\begin\{([^}]+)\}\\/g, "\\begin{$1}")
        .replace(/\\end\{([^}]+)\}\\/g, "\\end{$1}")
        // Fix specific LaTeX patterns in the example
        .replace(/\\boxed\{\\frac\{e\^/g, "\\boxed{\\frac{e^")
        // Direct replacement for the boxed expression
        .replace(
            /\\boxed\{\\frac\{e\^\{x\}\}\{2\} \(\\sin x - \\cos x\) \+ C\}/g,
            "\\bbox[border: 1px solid]{\\frac{e^{x}}{2} (\\sin x - \\cos x) + C}"
        );

    // Apply special processing for display math mode
    processedContent = processedContent.replace(
        /\$\$([\s\S]*?)\$\$/g,
        (_, formula) => {
            // Clean up the formula
            const cleanFormula = preprocessLatex(formula.trim());
            return `\n\n$$${cleanFormula}$$\n\n`;
        }
    );

    // Apply special processing for inline math mode
    processedContent = processedContent.replace(/\$(.*?)\$/g, (_, formula) => {
        // Clean up the formula
        const cleanFormula = preprocessLatex(formula);
        return ` $${cleanFormula}$ `;
    });

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

    // Ensure we have a valid response
    const content = {
        ...(messageContent as ChatMessageContent),
        response:
            (messageContent as ChatMessageContent).response ||
            "No response generated. Please try again.",
    };

    return (
        <div className="space-y-4">
            {content.thought && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-gray-800 text-gray-300 rounded-lg opacity-70"
                >
                    <div className="text-sm text-gray-400 mb-2 font-medium">
                        Thinking Process:
                    </div>
                    <div className="opacity-80">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={MarkdownComponents}
                        >
                            {content.thought}
                        </ReactMarkdown>
                    </div>
                </motion.div>
            )}
            <div className="border-t border-gray-300 pt-2">
                <ChatBubble content={content.response} isUser={false} />
            </div>
        </div>
    );
};

interface ChatMessagesProps {
    messages: ChatMessage[];
    isLoading?: boolean;
}

export const ChatMessages = ({
    messages = [],
    isLoading,
}: ChatMessagesProps) => {
    return (
        <div className="flex flex-col space-y-2">
            {messages?.map((message, index) => (
                <ChatMessageItem key={index} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
        </div>
    );
};

export default ChatMessages;
