import React from 'react';
import SmeDashboard from './SmeDashboard';
import FunderDashboard from './FunderDashboard';
import SupplierDashboard from './SupplierDashboard';
import AdminDashboard from './AdminDashboard';
import NotificationBell from './NotificationBell';

export default function Dashboard({ user, onLogout, onNavigate }) {
    if (!user) return null;

    const renderDashboard = () => {
        switch (user.type) {
            case 'ADMIN':
                return <AdminDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} />;
            case 'SME':
                return <SmeDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} />;
            case 'FUNDER':
                return <FunderDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} />;
            case 'SUPPLIER':
                return <SupplierDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} />;
            default:
                return <div>Unknown User Type</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] pb-20 transition-colors duration-300">
            <nav className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 backdrop-blur-md sticky top-0 z-50">
                <div className="text-xl font-bold cursor-pointer flex items-center gap-2" onClick={() => onNavigate('home')}>
                    <span>💸</span> ProcFin
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.type?.toLowerCase()}</span>
                    </div>
                    <NotificationBell user={user} />
                    <button
                        onClick={onLogout}
                        className="text-xs font-bold px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-8 animate-fade-in-up">
                {renderDashboard()}
            </main>

            <footer className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-500">ProcFin Engine v13.0 &bull; Status: Operational &bull; React Native Mode</p>
            </footer>
        </div>
    );
}
