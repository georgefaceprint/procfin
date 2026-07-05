import React from 'react';
import { BarChart3, TrendingUp, Eye, Target, Award } from 'lucide-react';

export default function SupplierAnalytics({ user, myQuotes, activeDeals, bidRequests }) {
    const isPremium = user.subscribed || user.promoted;

    // Mock analytics data
    const profileViews = isPremium ? 142 : 12;
    const winRate = myQuotes.length > 0 
        ? Math.round((myQuotes.filter(q => q.status === 'Closed (Quote Accepted)' && q.acceptedQuote?.supplierId === (user.uid || user.id)).length / myQuotes.length) * 100) 
        : 0;

    return (
        <div className="space-y-6">
            <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="text-cyan-500" /> Performance Analytics
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your visibility and conversion rates.</p>
                    </div>
                    {!isPremium && (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
                            Free Tier (Limited Data)
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#1a1c23]/60 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye className="text-gray-400" size={16} />
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Profile Views (30d)</span>
                        </div>
                        <p className="text-3xl font-mono font-black text-white">{profileViews}</p>
                        <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1"><TrendingUp size={12} /> +14% this week</p>
                    </div>

                    <div className="bg-[#1a1c23]/60 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="text-gray-400" size={16} />
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">RFQ Win Rate</span>
                        </div>
                        <p className="text-3xl font-mono font-black text-white">{winRate}%</p>
                        <p className="text-xs text-gray-500 mt-2">Based on {myQuotes.length} quotes</p>
                    </div>

                    <div className="bg-[#1a1c23]/60 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="text-gray-400" size={16} />
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Current Rating</span>
                        </div>
                        <p className="text-3xl font-mono font-black text-amber-400">{user.rating || "New"}</p>
                        <p className="text-xs text-gray-500 mt-2">{user.reviewCount || 0} reviews</p>
                    </div>

                    <div className="bg-[#1a1c23]/60 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="text-gray-400" size={16} />
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Market Demand</span>
                        </div>
                        <p className="text-3xl font-mono font-black text-cyan-400">High</p>
                        <p className="text-xs text-gray-500 mt-2">In {user.industry || 'your category'}</p>
                    </div>
                </div>

                {!isPremium && (
                    <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="text-white font-bold text-lg mb-1">Unlock Premium Leads & Storefront</h4>
                            <p className="text-sm text-cyan-100/70">Upgrade to get matched instantly with high-value tenders, priority placement in SME search results, and a custom branded storefront.</p>
                        </div>
                        <button className="whitespace-nowrap px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all">
                            Upgrade to Premium
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
