import Image from "next/image";
import ChatInterface from "@/components/ChatInterface";
import "katex/dist/katex.min.css";

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="container mx-auto px-4 py-8 h-screen">
                <div className="flex flex-col h-full">
                    <h1 className="text-3xl font-bold text-center mb-8">
                        Local AI Assistant
                    </h1>
                    <div className="flex-1 relative">
                        <ChatInterface />
                    </div>
                </div>
            </div>
        </main>
    );
}
