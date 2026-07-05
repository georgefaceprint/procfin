import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, RefreshCw, Send, MessageCircle } from 'lucide-react';
import { getGenerativeModel } from "firebase/ai";
import { ai, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function PesaChatbot({ user, liveContext }) {
    const role = user?.role || user?.type || 'GUEST';
    const [isOpen, setIsOpen] = useState(false);
    const [platformKnowledge, setPlatformKnowledge] = useState('');

    const getInitialGreeting = () => {
        const namePart = user?.name ? ` ${user.name.split(' ')[0]}` : '';
        if (role === 'SME') return `Sawubona${namePart}! I'm Zandile. How can I help with your purchase order funding, RFQs, or sourcing products today?`;
        if (role === 'SUPPLIER') return `Sawubona${namePart}! I'm Zandile. Need help uploading your catalog products or tracking escrow payouts?`;
        return `Sawubona${namePart}! I'm Zandile, your ProcFin digital advisor. How can I help you today?`;
    };

    const [messages, setMessages] = useState([
        { role: 'assistant', text: getInitialGreeting() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const chatRef = useRef(null);

    useEffect(() => {
        // Fetch Platform Knowledge Base
        const fetchKnowledge = async () => {
            try {
                const q = query(collection(db, 'users'), where('type', '==', 'SUPPLIER'));
                const snaps = await getDocs(q);
                let knowledge = "PROCFIN PLATFORM KNOWLEDGE BASE:\n\n-- VERIFIED SUPPLIERS & CATEGORIES --\n";
                snaps.forEach(doc => {
                    const data = doc.data();
                    knowledge += `- ${data.companyName} (${data.province}): Categories: [${(data.preferredCategories || []).join(', ')}]. Rating: ${data.rating}. Completed Deals: ${data.completedDeals}.\n`;
                });
                knowledge += "\n-- SYSTEM PRICING & FEES --\n- Platform Fee: 2.5% of funded amount.\n- Standard Escrow Payout: 24-48 hours after delivery verification.\n- Subscription Tier: R1,499/month for suppliers to access Catalog features.\n";
                setPlatformKnowledge(knowledge);
            } catch (err) {
                console.error("Failed to fetch knowledge base", err);
            }
        };
        fetchKnowledge();
    }, []);

    useEffect(() => {
        // Initialize the Gemini model for Zandile
        try {
            const model = getGenerativeModel(ai, {
                model: "gemini-2.5-flash", // Best model for general chat
                generationConfig: {
                    temperature: 0.4, // Professional but helpful
                },
                systemInstruction: `You are Zandile, the expert Chief Financial Officer and digital advisor for ProcFin (a South African B2B Purchase Order funding platform).
The user you are speaking to is a ${role} named ${user?.name || 'User'}.
Your tone is professional, warm, highly intelligent, and helpful. You speak South African English and occasionally use polite South African greetings.
You have the power to analyze deals, draft contract terms, and answer any questions about ProcFin's Escrow, RFQ Sourcing, or Funding mechanics.
Keep your answers very concise and formatted nicely in markdown. Do NOT make up information if you don't know it.

${platformKnowledge}`
            });
            chatRef.current = model.startChat({
                history: [
                    { role: "user", parts: [{ text: "Hello!" }] },
                    { role: "model", parts: [{ text: getInitialGreeting() }] }
                ]
            });
        } catch (error) {
            console.error("Failed to initialize Zandile AI:", error);
        }
    }, [user, role, platformKnowledge]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            if (!chatRef.current) throw new Error("Chat not initialized");
            // Inject live context as hidden prompt context if we have it
            let prompt = text;
            if (liveContext) {
                 prompt = `[SYSTEM NOTE: User's current context: ${JSON.stringify(liveContext)}]\n\nUser Question: ${text}`;
            }

            const result = await chatRef.current.sendMessage(prompt);
            const responseText = result.response.text();
            
            setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
        } catch (error) {
            console.error("Zandile Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', text: "Uxolo (Sorry), I'm having trouble connecting to my brain right now. Please try again in a moment." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleReset = () => {
        setMessages([{ role: 'assistant', text: getInitialGreeting() }]);
        setInput('');
        setIsTyping(false);
        
        // Re-initialize chat
        if (ai) {
             const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
             chatRef.current = model.startChat({
                 history: [
                     { role: "user", parts: [{ text: "Hello!" }] },
                     { role: "model", parts: [{ text: getInitialGreeting() }] }
                 ]
             });
        }
    };

    const getQuickQuestions = () => {
        if (role === 'SME') return [
            "How do I secure funding?",
            "How does the Sourcing Warehouse work?",
            "What funding categories do you support?",
            "What are the fees for PO financing?",
            "Is my document vault safe?",
            "How are payments guaranteed?"
        ];
        if (role === 'SUPPLIER') return [
            "How do I submit a quote?",
            "How does the Sourcing Catalog work?",
            "How does escrow work?",
            "What are the fees?",
            "Tell me about the Digital Vault",
            "How do I become a verified supplier?"
        ];
        return [
            "How does it work?",
            "What funding categories do you support?",
            "What are the fees?",
            "How are payments guaranteed?",
            "Register as SME",
            "Register as Supplier"
        ];
    };

    const quickQuestions = getQuickQuestions();

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[520px] bg-[#121318] rounded-3xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-fade-in-up text-white">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-5 flex justify-between items-center shrink-0 border-b border-gray-850">
                        <div className="flex items-center gap-3">
                            <img 
                                src="/zandile_avatar.png" 
                                className="w-11 h-11 rounded-2xl object-cover border border-white/20 shadow-md" 
                                alt="Zandile" 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60";
                                }}
                            />
                            <div>
                                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                                    Zandile <Sparkles size={12} className="text-yellow-300 animate-pulse" />
                                </h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-cyan-200">ProcFin Advisor</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleReset}
                                className="p-2 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors"
                                title="Reset Conversation"
                            >
                                <RefreshCw size={14} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0b0c10]">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${m.role === 'user'
                                    ? 'bg-cyan-500 text-white rounded-tr-none'
                                    : 'bg-[#161820] text-gray-200 border border-gray-800/65 rounded-tl-none'
                                    } shadow-sm`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-[#161820] border border-gray-800/65 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}

                        {/* Quick Questions Labels */}
                        {messages.length === 1 && (
                            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-800/50">
                                <p className="text-[9px] uppercase font-black text-gray-500 tracking-wider mb-1">Suggested Discussion Topics</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickQuestions.map(q => (
                                        <button
                                            key={q}
                                            onClick={() => handleSend(q)}
                                            className="text-[11px] text-left px-3.5 py-2 bg-gray-800/50 hover:bg-gray-800 text-cyan-400 hover:text-white font-bold rounded-xl border border-gray-800 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-800 shrink-0 bg-[#121318]">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Zandile about ProcFin..."
                                className="flex-1 bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder-gray-500"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="w-10 h-10 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-800 text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 transition-all active:scale-95 shrink-0"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bubble Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 relative overflow-hidden group ${isOpen
                    ? 'bg-gray-900 border border-gray-800 text-white'
                    : 'bg-cyan-500 text-white shadow-cyan-500/20'
                    }`}
            >
                {isOpen ? <X size={20} /> : (
                    <>
                        <img 
                            src="/zandile_avatar.png" 
                            className="w-full h-full object-cover rounded-2xl" 
                            alt="Zandile Avatar Toggle"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60";
                            }}
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0b0c10] rounded-full"></span>
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12"></div>
                    </>
                )}
            </button>
        </div>
    );
}
