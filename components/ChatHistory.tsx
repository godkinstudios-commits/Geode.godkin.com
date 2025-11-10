import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { GeodeIcon, UserIcon, SendIcon, LoadingIcon, SparklesIcon, BrainIcon } from './IconComponents';

interface ChatHistoryProps {
    aiEnabled: boolean;
    history: ChatMessage[];
    isChatting: boolean;
    onSendMessage: (message: string) => void;
    isDeepThinkEnabled: boolean;
    onToggleDeepThink: () => void;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute right-0 bottom-full mb-2 w-max max-w-xs bg-geode-crust border border-geode-surface text-center text-sm text-geode-light rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {text}
        </div>
    </div>
);

const ChatHistory: React.FC<ChatHistoryProps> = ({ aiEnabled, history, isChatting, onSendMessage, isDeepThinkEnabled, onToggleDeepThink }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isChatting && aiEnabled) {
            onSendMessage(input);
            setInput('');
        }
    };

    const ThinkingIndicator = () => (
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-geode-surface flex items-center justify-center">
                <GeodeIcon className="h-5 w-5 text-geode-teal" />
            </div>
            <div className="bg-geode-surface rounded-lg p-3 max-w-lg flex items-center gap-2">
                 <LoadingIcon className="animate-spin h-4 w-4 text-geode-overlay" />
                 <span className="text-sm text-geode-overlay">{isDeepThinkEnabled ? 'Thinking deeply...' : 'Thinking...'}</span>
            </div>
        </div>
    );

    return (
        <div className="bg-geode-mantle rounded-lg shadow-lg border border-geode-surface h-full flex flex-col min-h-[400px] max-h-[600px]">
            <header className="flex items-center justify-between gap-3 p-4 border-b border-geode-surface bg-geode-crust">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="h-5 w-5 text-geode-teal" />
                    <h2 className="text-lg font-bold text-geode-light">AI Chat</h2>
                </div>
                <Tooltip text="Enables deeper reasoning for complex code generation, but may take longer.">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-geode-light hover:text-geode-teal transition-colors">
                        <BrainIcon className="h-5 w-5"/>
                        <span>Deep Think</span>
                        <div className="relative">
                            <input type="checkbox" checked={isDeepThinkEnabled} onChange={onToggleDeepThink} className="sr-only peer" disabled={!aiEnabled || isChatting} />
                            <div className="w-10 h-6 bg-geode-surface rounded-full peer-checked:bg-geode-blue transition-colors"></div>
                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-full"></div>
                        </div>
                    </label>
                </Tooltip>
            </header>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                             <div className="flex-shrink-0 h-8 w-8 rounded-full bg-geode-surface flex items-center justify-center">
                                <GeodeIcon className="h-5 w-5 text-geode-teal" />
                            </div>
                        )}
                        <div
                            className={`rounded-lg p-3 max-w-lg text-sm ${
                                msg.role === 'user'
                                    ? 'bg-geode-blue text-geode-crust'
                                    : 'bg-geode-surface text-geode-light'
                            }`}
                            style={{ whiteSpace: 'pre-wrap' }}
                        >
                            {msg.parts[0].text}
                        </div>
                        {msg.role === 'user' && (
                             <div className="flex-shrink-0 h-8 w-8 rounded-full bg-geode-surface flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-geode-light" />
                            </div>
                        )}
                    </div>
                ))}
                {isChatting && <ThinkingIndicator />}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-geode-surface">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={aiEnabled ? "Ask a question..." : "AI Chat is disabled."}
                        disabled={!aiEnabled || isChatting}
                        className="w-full bg-geode-crust border border-geode-surface rounded-md px-3 py-2 text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal disabled:cursor-not-allowed"
                        aria-label="Chat message"
                    />
                    <button
                        type="submit"
                        disabled={!aiEnabled || isChatting || !input.trim()}
                        className="p-2 bg-geode-blue text-geode-crust rounded-md hover:bg-opacity-90 transition-colors disabled:bg-geode-surface disabled:text-geode-overlay disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatHistory;
