import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const STATUS_COLOR = {
    'Pending Review': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-400' },
    'Capital Secured': { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    'Waybill Uploaded': { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
    'Delivery Confirmed': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

export default function FunderDashboard({ user, onNavigate }) {
    const [allDeals, setAllDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pipeline'); // 'pipeline' | 'portfolio'

    const funderId = user?.uid || user?.id;

    useEffect(() => {
        if (!funderId) return;
        const unsubscribe = onSnapshot(collection(db, 'deals'), (snapshot) => {
            setAllDeals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [funderId]);

    // Pipeline = deals the funder hasn't acted on yet (Pending Review, matching categories)
    const userCats = Array.isArray(user.preferredCategories) ? user.preferredCategories
        : (Array.isArray(user.industry) ? user.industry : []);

    const pipelineDeals = allDeals.filter(deal => {
        if (deal.status !== 'Pending Review') return false;
        if (userCats.length === 0) return true;
        return userCats.includes(deal.category);
    });

    // My Portfolio = deals this funder has structured (funderId matches)
    const portfolioDeals = allDeals.filter(d => d.funderId === funderId);

    const portfolioValue = portfolioDeals.reduce((sum, d) =>
        sum + Number(d.dealTerms?.principal || d.amount || 0), 0);

    const closedDeals = portfolioDeals.filter(d => d.status === 'Delivery Confirmed').length;

    const deals = tab === 'pipeline' ? pipelineDeals : portfolioDeals;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Funder Dashboard</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review deal flow and manage your funding portfolio.</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-end">
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 leading-none mb-1">Portfolio Value</span>
                        <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {portfolioValue >= 1_000_000
                                ? `R${(portfolioValue / 1_000_000).toFixed(1)}M`
                                : `R${(portfolioValue / 1000).toFixed(0)}K`}
                        </span>
                    </div>
                    <div className="px-5 py-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-end">
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 leading-none mb-1">Deals Closed</span>
                        <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">{closedDeals}</span>
                    </div>
                </div>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
                {[
                    { key: 'pipeline', label: `📥 Deal Pipeline`, count: pipelineDeals.length },
                    { key: 'portfolio', label: `💼 My Portfolio`, count: portfolioDeals.length },
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${tab === key
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {label}
                        {count > 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${tab === key
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab: Pipeline */}
            {tab === 'pipeline' && (
                <div>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : pipelineDeals.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="text-6xl mb-4 opacity-10">📉</div>
                            <p className="text-xl text-gray-400 font-bold">No pending deals match your mandate.</p>
                            <p className="text-sm text-gray-400 mt-2">Update your categories in Profile to see more deals.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pipelineDeals.map(deal => (
                                <DealCard key={deal.id} deal={deal} onNavigate={onNavigate} showActions />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: My Portfolio */}
            {tab === 'portfolio' && (
                <div>
                    {portfolioDeals.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="text-6xl mb-4 opacity-10">💼</div>
                            <p className="text-xl text-gray-400 font-bold">No deals structured yet.</p>
                            <p className="text-sm text-gray-400 mt-2">Once you structure a deal it will appear here.</p>
                            <button
                                onClick={() => setTab('pipeline')}
                                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all"
                            >
                                Browse Deal Pipeline →
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {portfolioDeals.map(deal => (
                                <DealCard key={deal.id} deal={deal} onNavigate={onNavigate} showActions={false} />
                            ))}
                        </div>
                    )}

                    {/* Portfolio Summary */}
                    {portfolioDeals.length > 0 && (
                        <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                            <h3 className="font-black text-gray-900 dark:text-white mb-6">Portfolio Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Deals', value: portfolioDeals.length, color: 'blue' },
                                    { label: 'Active', value: portfolioDeals.filter(d => d.status !== 'Delivery Confirmed').length, color: 'amber' },
                                    { label: 'Closed', value: closedDeals, color: 'emerald' },
                                    {
                                        label: 'Total Deployed',
                                        value: portfolioValue >= 1_000_000
                                            ? `R${(portfolioValue / 1_000_000).toFixed(1)}M`
                                            : `R${(portfolioValue / 1000).toFixed(0)}K`,
                                        color: 'purple'
                                    },
                                ].map(({ label, value, color }) => (
                                    <div key={label}>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">{label}</p>
                                        <p className={`text-2xl font-black font-mono text-${color}-600 dark:text-${color}-400`}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Deal Card Sub-component ────────────────────────────────────────────────────
function DealCard({ deal, onNavigate, showActions }) {
    const sc = STATUS_COLOR[deal.status] || STATUS_COLOR['Pending Review'];

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full translate-x-12 -translate-y-12 transition-transform group-hover:scale-150" />

            <div className="flex justify-between items-start mb-5 relative z-10">
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{deal.smeName}</h4>
                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-1">{deal.category}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {deal.status === 'Pending Review' ? 'Pending'
                        : deal.status === 'Capital Secured' ? 'Secured'
                            : deal.status === 'Waybill Uploaded' ? 'In Transit'
                                : 'Closed'}
                </span>
            </div>

            <div className="mb-6 relative z-10">
                <span className="text-gray-400 text-xs font-bold">Amount</span>
                <div className="text-3xl font-black text-gray-900 dark:text-white font-mono mt-1">
                    R{Number(deal.dealTerms?.principal || deal.amount || 0).toLocaleString()}
                </div>
                {deal.dealTerms?.interest && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        {deal.dealTerms.interest}% p.a. · {deal.dealTerms.term}
                    </p>
                )}
            </div>

            {showActions && (
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={() => onNavigate('funder-review', { dealId: deal.id })}
                        className="flex-1 py-3 text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        Review Application
                    </button>
                    <button
                        onClick={() => onNavigate('structure-deal', { dealId: deal.id })}
                        className="flex-1 py-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                    >
                        Structure Deal
                    </button>
                </div>
            )}

            {!showActions && (
                <div className="relative z-10">
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                            style={{
                                width: deal.status === 'Delivery Confirmed' ? '100%'
                                    : deal.status === 'Waybill Uploaded' ? '70%'
                                        : deal.status === 'Capital Secured' ? '30%' : '0%'
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[9px] text-gray-400 font-bold upper tracking-widest">
                        <span>30%</span><span>70%</span><span>100%</span>
                    </div>
                </div>
            )}
        </div>
    );
}
