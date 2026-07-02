import React, { useState, useEffect, useRef } from 'react';
import { getPesaResponse, PESA_KNOWLEDGE } from '../constants/pesaKnowledge';

export default function PesaChatbot({ user, liveContext }) {
    const role = user?.role || 'GUEST';
    const [isOpen, setIsOpen] = useState(false);

    const getInitialGreeting = () => {
        if (role === 'SME') return `Sawubona! I'm Pesa. How can I help with your business funding or RFQs today?`;
        if (role === 'SUPPLIER') return `Sawubona! I'm Pesa. Need help with your quotes or escrow payouts?`;
        return `Sawubona! I'm Pesa, your ProcFin assistant. How can I help you today?`;
    };

    const [messages, setMessages] = useState([
        { role: 'assistant', text: getInitialGreeting() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (text = input) => {
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        // Simulate typing delay
        setTimeout(() => {
            const response = getPesaResponse(text, liveContext);
            setMessages([...newMessages, { role: 'assistant', text: response }]);
            setIsTyping(false);
        }, 800);
    };

    const handleReset = () => {
        setMessages([{ role: 'assistant', text: getInitialGreeting() }]);
        setInput('');
        setIsTyping(false);
    };

    const getQuickQuestions = () => {
        if (role === 'SME') return [
            "How do I create an RFQ?",
            "What is SME Pro?",
            "How does funding work?",
            "Tell me about the Vault"
        ];
        if (role === 'SUPPLIER') return [
            "How do I submit a quote?",
            "What is a Gold Supplier?",
            "How does escrow work?",
            "Upgrade to Verified"
        ];
        return [
            "How does it work?",
            "What are the categories?",
            "Register as SME",
            "Register as Supplier"
        ];
    };

    const quickQuestions = getQuickQuestions();

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[500px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-blue-600 p-6 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">💸</div>
                            <div>
                                <h3 className="font-bold">Pesa</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Platform Assistant</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleReset}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                title="Reset Conversation"
                            >
                                <span>🔄</span> Start Again
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                            >×</button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                    } shadow-sm`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}

                        {/* Quick Questions Labels */}
                        {messages.length === 1 && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                {quickQuestions.map(q => (
                                    <button
                                        key={q}
                                        onClick={() => handleSend(q)}
                                        className="text-xs px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-900/50">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Pesa about the platform..."
                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all active:scale-95"
                            >
                                🚀
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bubble Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-2xl transition-all active:scale-90 relative overflow-hidden group ${isOpen
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-blue-600 text-white animate-pulse'
                    }`}
            >
                {isOpen ? '×' : (
                    <>
                        <span>💸</span>
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12"></div>
                    </>
                )}
            </button>
        </div>
    );
}
