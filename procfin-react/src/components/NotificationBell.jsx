import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

// ── Relative Time Helper ───────────────────────────────────────────────────────
function timeAgo(value) {
    if (!value) return 'Just now';
    let date;
    // Handle Firestore Timestamp objects
    if (value?.seconds) {
        date = new Date(value.seconds * 1000);
    } else if (typeof value === 'number') {
        date = new Date(value);
    } else {
        date = new Date(value);
    }
    if (isNaN(date.getTime())) return 'Just now';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 30) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export default function NotificationBell({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [marking, setMarking] = useState(false);
    const ref = useRef(null);

    const userId = user?.uid || user?.id;
    const unreadCount = notifications.filter(n => !n.read).length;

    // Live listener on user_notifications
    useEffect(() => {
        if (!userId) return;
        const notifRef = doc(db, 'user_notifications', userId);
        const unsub = onSnapshot(notifRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data().data || [];
                setNotifications(data.slice(0, 50));
            } else {
                setNotifications([]);
            }
        });
        return () => unsub();
    }, [userId]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = async () => {
        if (!userId || marking) return;
        setMarking(true);
        try {
            const notifRef = doc(db, 'user_notifications', userId);
            const snap = await getDoc(notifRef);
            if (snap.exists()) {
                const updated = (snap.data().data || []).map(n => ({ ...n, read: true }));
                await setDoc(notifRef, { data: updated }, { merge: true });
            }
        } catch (e) { console.error(e); }
        finally { setMarking(false); }
    };

    const handleOpen = () => {
        setOpen(prev => !prev);
        if (!open && unreadCount > 0) markAllRead();
    };

    const getIcon = (text) => {
        if (text?.includes('🎉') || text?.includes('APPROVED') || text?.includes('ACCEPTED')) return '🎉';
        if (text?.includes('📦') || text?.includes('waybill') || text?.includes('dispatch')) return '📦';
        if (text?.includes('💬') || text?.includes('quote')) return '💬';
        if (text?.includes('✅') || text?.includes('confirmed') || text?.includes('Confirmed')) return '✅';
        if (text?.includes('💰') || text?.includes('payment') || text?.includes('Released')) return '💰';
        if (text?.includes('⚠️') || text?.includes('Declined')) return '⚠️';
        if (text?.includes('📋') || text?.includes('not selected')) return '📋';
        return '🔔';
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${open
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                aria-label="Notifications"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full animate-bounce-once border-2 border-white dark:border-gray-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-14 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden z-[100]"
                    style={{ animation: 'fadeSlideDown 0.15s ease-out' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="font-black text-gray-900 dark:text-white text-sm">Notifications</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={markAllRead}
                                disabled={marking || unreadCount === 0}
                                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline disabled:opacity-40 transition-opacity"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-96">
                        {notifications.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="text-4xl mb-3 opacity-20">🔔</div>
                                <p className="text-gray-400 font-bold text-sm">No notifications yet</p>
                                <p className="text-gray-400 text-xs mt-1">Platform activity will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {notifications.map((n, i) => (
                                    <div
                                        key={n.id || i}
                                        className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-base ${!n.read
                                            ? 'bg-blue-100 dark:bg-blue-900/40'
                                            : 'bg-gray-100 dark:bg-gray-800'
                                            }`}>
                                            {getIcon(n.text)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${!n.read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {n.text}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                                                {timeAgo(n.timestamp || n.time)}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!n.read && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                Showing last {notifications.length} notifications
                            </p>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes fadeSlideDown {
                    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes bounce-once {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                }
                .animate-bounce-once { animation: bounce-once 0.3s ease; }
            `}</style>
        </div>
    );
}
