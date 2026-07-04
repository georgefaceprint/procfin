import React, { useState } from 'react';
import SmeDashboard from './SmeDashboard';
import FunderDashboard from './FunderDashboard';
import SupplierDashboard from './SupplierDashboard';
import AdminDashboard from './AdminDashboard';
import NotificationBell from './NotificationBell';
import { Home, Banknote, ShieldCheck, UserCircle, Menu, LogOut } from 'lucide-react';

export default function Dashboard({ user, onLogout, onNavigate, onUpdateUser }) {
    if (!user) return null;
    
    const [activeTab, setActiveTab] = useState('home');

    // Safe fallback for user name rendering
    const displayName = user.name || user.phone || user.email || 'User';

    const handleNav = (tab, route) => {
        setActiveTab(tab);
        if(route === 'logout') {
            onLogout();
        } else {
            onNavigate(route);
        }
    }

    const renderDashboard = () => {
        switch (user.type) {
            case 'ADMIN': return <AdminDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} />;
            case 'SME': return <SmeDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} />;
            case 'FUNDER': return <FunderDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} />;
            case 'SUPPLIER': return <SupplierDashboard user={user} onLogout={onLogout} onNavigate={onNavigate} onUpdateUser={onUpdateUser} />;
            default: return <div>Unknown User Type</div>;
        }
    };

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, route: 'dashboard' },
        { id: 'bank', label: 'Deals', icon: Banknote, route: 'dashboard' },
        { id: 'vault', label: 'Vault', icon: ShieldCheck, route: 'vault' },
        { id: 'profile', label: 'Profile', icon: UserCircle, route: 'profile-edit' },
        { id: 'logout', label: 'Log Out', icon: LogOut, route: 'logout' }, 
    ];

    return (
        <div className="min-h-screen bg-[#0b0c10] text-white flex transition-colors duration-300">
            
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col w-72 bg-[#121318] border-r border-gray-800/50 fixed h-full z-50">
                <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('home')}>
                    <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]">P</div>
                    <span className="text-3xl font-black tracking-tight text-white">ProcFin</span>
                </div>
                
                <nav className="flex-1 px-4 mt-8 space-y-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id, item.route)}
                                className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Icon size={26} strokeWidth={isActive ? 2.5 : 1.5} />
                                <span className="font-bold text-lg">{item.label}</span>
                            </button>
                        )
                    })}
                </nav>
                
                <div className="p-6">
                    <div className="bg-[#1a1c23] rounded-2xl p-4 flex items-center gap-4 border border-gray-700/50 shadow-inner">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center font-black text-lg text-white">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-bold truncate text-white">{displayName}</p>
                            <p className="text-[11px] font-black text-cyan-500 uppercase tracking-widest mt-0.5">{user.type}</p>
                        </div>
                        <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Log Out">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen relative pb-24 md:pb-0 w-full overflow-x-hidden">
                
                {/* MOBILE TOP BAR */}
                <header className="md:hidden flex justify-between items-center p-6 bg-[#0b0c10]/90 backdrop-blur-2xl sticky top-0 z-40 border-b border-gray-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">P</div>
                        <span className="font-black text-xl tracking-tight text-white">ProcFin</span>
                    </div>
                    <div className="flex items-center gap-5">
                        <NotificationBell user={user} />
                        <button onClick={() => onNavigate('profile-edit')} className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/20 uppercase">
                            {displayName.charAt(0)}
                        </button>
                    </div>
                </header>

                {/* DESKTOP TOP BAR */}
                <header className="hidden md:flex justify-end p-8 sticky top-0 z-40 bg-[#0b0c10]/80 backdrop-blur-2xl">
                     <NotificationBell user={user} />
                </header>

                <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8">
                    {renderDashboard()}
                </main>

            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#121318]/95 backdrop-blur-2xl border-t border-gray-800/80 z-50 px-6 py-3 pb-8 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button 
                            key={item.id} 
                            onClick={() => handleNav(item.id, item.route)}
                            className="flex flex-col items-center gap-1.5 min-w-[60px] relative"
                        >
                            {isActive && <div className="absolute -top-3 w-8 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
                            <Icon size={26} className={`transition-all ${isActive ? 'text-cyan-400 translate-y-0' : 'text-gray-500 translate-y-1'}`} strokeWidth={isActive ? 2.5 : 1.5} />
                            <span className={`text-[11px] transition-all ${isActive ? 'text-cyan-400 font-bold opacity-100' : 'text-gray-500 font-medium opacity-80'}`}>{item.label}</span>
                        </button>
                    )
                })}
            </nav>

        </div>
    );
}
