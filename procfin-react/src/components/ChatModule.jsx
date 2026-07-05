import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { Send, X, ShieldCheck } from 'lucide-react';
import { useToast } from './Toast';

export default function ChatModule({ user, contextId, contextType, contextTitle, recipientId, recipientName, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatRoomId, setChatRoomId] = useState(null);
    const messagesEndRef = useRef(null);
    const toast = useToast();

    // 1. Find or establish the Chat Room
    useEffect(() => {
        if (!user?.id || !recipientId || !contextId) return;

        const findOrCreateRoom = async () => {
            const q = query(
                collection(db, 'chats'),
                where('contextId', '==', contextId),
                where('participants', 'array-contains', user.id)
            );
            
            const snapshot = await getDocs(q);
            let roomId = null;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.participants.includes(recipientId)) {
                    roomId = doc.id;
                }
            });

            if (!roomId) {
                // We'll create the room only when the first message is sent to prevent empty rooms
            } else {
                setChatRoomId(roomId);
            }
        };

        findOrCreateRoom();
    }, [user, recipientId, contextId]);

    // 2. Listen to messages once chatRoomId is known
    useEffect(() => {
        if (!chatRoomId) return;

        const q = query(
            collection(db, 'chats', chatRoomId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [chatRoomId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            let activeRoomId = chatRoomId;

            // Create room if it doesn't exist
            if (!activeRoomId) {
                const roomRef = await addDoc(collection(db, 'chats'), {
                    contextId,
                    contextType, // 'RFQ' or 'DEAL'
                    contextTitle,
                    participants: [user.id, recipientId],
                    participantNames: {
                        [user.id]: user.name,
                        [recipientId]: recipientName
                    },
                    createdAt: serverTimestamp(),
                    lastMessageAt: serverTimestamp()
                });
                activeRoomId = roomRef.id;
                setChatRoomId(activeRoomId);
            }

            // Add message
            await addDoc(collection(db, 'chats', activeRoomId, 'messages'), {
                senderId: user.id,
                senderName: user.name,
                text: newMessage.trim(),
                timestamp: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message.");
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-md bg-[#121318] border border-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slide-up">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800/60 bg-[#1a1c23] rounded-t-3xl sm:rounded-t-3xl">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {recipientName} <ShieldCheck size={14} className="text-cyan-400" />
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">
                            {contextType}: {contextTitle}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white bg-gray-800 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d0f14]">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-6">
                            <span className="text-4xl mb-3">💬</span>
                            <p className="text-sm font-bold text-gray-300">Secure Direct Messaging</p>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                Keep your communication secure. Discuss specifications, pricing, and delivery timelines directly.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.senderId === user.id;
                            return (
                                <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-gray-600 mt-1 px-1 font-bold">
                                        {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 pb-8 sm:pb-4 bg-[#1a1c23] border-t border-gray-800 rounded-b-none sm:rounded-b-3xl">
                    <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#121318] border border-gray-700 rounded-full pl-5 pr-12 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
