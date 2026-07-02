import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            delete timers.current[id];
        }, 300);
    }, []);

    const addToast = useCallback((message, type = 'success', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);
        timers.current[id] = setTimeout(() => removeToast(id), duration);
        return id;
    }, [removeToast]);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error', 6000),
        warning: (msg) => addToast(msg, 'warning', 5000),
        info: (msg) => addToast(msg, 'info'),
    };

    useEffect(() => {
        return () => Object.values(timers.current).forEach(clearTimeout);
    }, []);

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = {
        success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-300' },
        error: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-300' },
        warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-300' },
        info: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300' },
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none" style={{ maxWidth: '380px' }}>
                {toasts.map(t => {
                    const c = colors[t.type] || colors.info;
                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto ${c.bg} border ${c.border} rounded-2xl p-4 shadow-2xl shadow-black/10 flex items-start gap-3 transition-all duration-300 ${t.exiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'
                                }`}
                            style={{ animation: t.exiting ? '' : 'toastSlideIn 0.3s ease-out' }}
                        >
                            <span className="text-xl flex-shrink-0 mt-0.5">{icons[t.type]}</span>
                            <p className={`text-sm font-bold leading-snug flex-1 ${c.text}`}>{t.message}</p>
                            <button onClick={() => removeToast(t.id)} className={`${c.text} opacity-50 hover:opacity-100 text-lg leading-none flex-shrink-0`}>×</button>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(40px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
