import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';

// ── Mini Bar Chart ─────────────────────────────────────────────────────────────
const BarChart = ({ data, color = '#3b82f6' }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end gap-1.5 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t-md transition-all duration-700"
                        style={{
                            height: `${Math.max((d.value / max) * 52, d.value > 0 ? 6 : 2)}px`,
                            backgroundColor: color,
                            opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.4,
                        }}
                    />
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

// ── Donut Chart ────────────────────────────────────────────────────────────────
const DonutChart = ({ segments }) => {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let offset = 0;
    const r = 36, cx = 44, cy = 44, circumference = 2 * Math.PI * r;

    return (
        <div className="flex items-center gap-6">
            <svg width="88" height="88" className="flex-shrink-0">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
                    strokeWidth="12" className="text-gray-100 dark:text-gray-800" />
                {segments.map((seg, i) => {
                    const pct = seg.value / total;
                    const dash = pct * circumference;
                    const gap = circumference - dash;
                    const el = (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset * circumference}
                            strokeLinecap="butt"
                            transform={`rotate(-90 ${cx} ${cy})`}
                            style={{ transition: 'stroke-dasharray 0.7s ease' }}
                        />
                    );
                    offset += pct;
                    return el;
                })}
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                    className="fill-gray-900 dark:fill-white" fontSize="14" fontWeight="900">
                    {total}
                </text>
            </svg>
            <div className="space-y-2 flex-1">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{seg.label}</span>
                        </div>
                        <span className="text-xs font-black text-gray-900 dark:text-white font-mono">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, trend, color = 'blue', loading }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl
                bg-${color}-50 dark:bg-${color}-900/20`}>
                {icon}
            </div>
            {trend !== undefined && (
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${trend >= 0
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
            )}
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">{label}</p>
        {loading ? (
            <div className="h-8 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        ) : (
            <p className={`text-3xl font-black text-${color}-600 dark:text-${color}-400 font-mono`}>{value}</p>
        )}
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard({ user, onNavigate }) {
    const [stats, setStats] = useState({
        users: { total: 0, sme: 0, supplier: 0, funder: 0, admin: 0 },
        deals: { total: 0, pending: 0, secured: 0, waybill: 0, confirmed: 0 },
        rfqs: { total: 0, active: 0, closed: 0 },
        capitalDeployed: 0,
        subscribed: 0,
        verifiedFunders: 0,
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentDeals, setRecentDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Build a 7-day activity histogram from an array of objects with createdAt
    const buildWeeklyHistogram = (items) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const counts = Array(7).fill(0);
        const now = new Date();
        items.forEach(item => {
            if (!item.createdAt) return;
            const d = new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt);
            const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
            if (diff < 7) {
                const dayOfWeek = d.getDay(); // 0=Sun
                const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0
                counts[idx]++;
            }
        });
        return days.map((label, i) => ({ label, value: counts[i] }));
    };

    useEffect(() => {
        let allUsers = [], allDeals = [], allRfqs = [];
        let usersLoaded = false, dealsLoaded = false, rfqsLoaded = false;

        const computeStats = () => {
            if (!usersLoaded || !dealsLoaded || !rfqsLoaded) return;

            const userBuckets = allUsers.reduce((acc, u) => {
                const t = u.type || 'UNKNOWN';
                acc[t] = (acc[t] || 0) + 1;
                return acc;
            }, {});

            const dealBuckets = allDeals.reduce((acc, d) => {
                acc[d.status] = (acc[d.status] || 0) + 1;
                return acc;
            }, {});

            const capitalDeployed = allDeals
                .filter(d => ['Capital Secured', 'Waybill Uploaded', 'Delivery Confirmed'].includes(d.status))
                .reduce((sum, d) => sum + Number(d.amount || d.dealTerms?.principal || 0), 0);

            const rfqActive = allRfqs.filter(r => r.status === 'Requested').length;
            const rfqClosed = allRfqs.filter(r => r.status === 'Closed (Quote Accepted)').length;

            setStats({
                users: {
                    total: allUsers.length,
                    sme: userBuckets['SME'] || 0,
                    supplier: userBuckets['SUPPLIER'] || 0,
                    funder: userBuckets['FUNDER'] || 0,
                    admin: userBuckets['ADMIN'] || 0,
                },
                deals: {
                    total: allDeals.length,
                    pending: dealBuckets['Pending Review'] || 0,
                    secured: dealBuckets['Capital Secured'] || 0,
                    waybill: dealBuckets['Waybill Uploaded'] || 0,
                    confirmed: dealBuckets['Delivery Confirmed'] || 0,
                },
                rfqs: { total: allRfqs.length, active: rfqActive, closed: rfqClosed },
                capitalDeployed,
                subscribed: allUsers.filter(u => u.subscribed).length,
                verifiedFunders: allUsers.filter(u => u.type === 'FUNDER' && u.verified).length,
            });

            // Most recent 5 of each
            setRecentUsers(
                [...allUsers]
                    .sort((a, b) => {
                        const ta = a.createdAt?.seconds || 0;
                        const tb = b.createdAt?.seconds || 0;
                        return tb - ta;
                    })
                    .slice(0, 5)
            );
            setRecentDeals(
                [...allDeals]
                    .sort((a, b) => {
                        const ta = new Date(a.createdAt || 0).getTime();
                        const tb = new Date(b.createdAt || 0).getTime();
                        return tb - ta;
                    })
                    .slice(0, 5)
            );
            setLoading(false);
        };

        const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
            allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            usersLoaded = true;
            computeStats();
        });

        const unsubDeals = onSnapshot(collection(db, 'deals'), snap => {
            allDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            dealsLoaded = true;
            computeStats();
        });

        const unsubRfqs = onSnapshot(collection(db, 'rfqs'), snap => {
            allRfqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            rfqsLoaded = true;
            computeStats();
        });

        return () => { unsubUsers(); unsubDeals(); unsubRfqs(); };
    }, []);

    const formatCurrency = (n) => {
        if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
        return `R${n.toFixed(0)}`;
    };

    const dealStatusColor = {
        'Pending Review': '#f59e0b',
        'Capital Secured': '#3b82f6',
        'Waybill Uploaded': '#8b5cf6',
        'Delivery Confirmed': '#10b981',
    };

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* ── Header ── */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 border border-gray-700 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                <div>
                    <p className="text-[10px] uppercase font-black tracking-[0.25em] text-gray-400 mb-2">System Overview</p>
                    <h2 className="text-3xl font-black text-white">Admin Analytics</h2>
                    <p className="text-gray-400 mt-1 text-sm">Live platform intelligence — all data from Firestore in real-time.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-emerald-400 text-xs font-black">Live</span>
                    </div>
                    <button
                        onClick={() => onNavigate('admin-panel')}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        Control Center →
                    </button>
                </div>
            </div>

            {/* ── Top KPI Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.users.total} icon="👥" color="blue"
                    sub={`${stats.subscribed} subscribed`} loading={loading} />
                <StatCard label="Active Deals" value={stats.deals.total} icon="🤝" color="emerald"
                    sub={`${stats.deals.confirmed} closed`} loading={loading} />
                <StatCard label="Total RFQs" value={stats.rfqs.total} icon="📋" color="amber"
                    sub={`${stats.rfqs.active} open · ${stats.rfqs.closed} closed`} loading={loading} />
                <StatCard label="Capital Deployed" value={formatCurrency(stats.capitalDeployed)} icon="💰" color="purple"
                    sub="across all active deals" loading={loading} />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* User Breakdown Donut */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-5">User Breakdown</p>
                    <DonutChart segments={[
                        { label: 'SMEs', value: stats.users.sme, color: '#3b82f6' },
                        { label: 'Suppliers', value: stats.users.supplier, color: '#10b981' },
                        { label: 'Funders', value: stats.users.funder, color: '#8b5cf6' },
                        { label: 'Admins', value: stats.users.admin, color: '#ef4444' },
                    ]} />
                </div>

                {/* Deal Pipeline Donut */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-5">Deal Pipeline</p>
                    <DonutChart segments={[
                        { label: 'Pending Review', value: stats.deals.pending, color: '#f59e0b' },
                        { label: 'Capital Secured', value: stats.deals.secured, color: '#3b82f6' },
                        { label: 'Goods Dispatched', value: stats.deals.waybill, color: '#8b5cf6' },
                        { label: 'Delivery Confirmed', value: stats.deals.confirmed, color: '#10b981' },
                    ]} />
                </div>

                {/* Platform Health */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-5">Platform Health</p>
                    <div className="space-y-4">
                        {[
                            {
                                label: 'Subscription Rate',
                                value: stats.users.total > 0 ? Math.round((stats.subscribed / stats.users.total) * 100) : 0,
                                color: 'blue',
                                suffix: '%'
                            },
                            {
                                label: 'Verified Funders',
                                value: stats.users.funder > 0 ? Math.round((stats.verifiedFunders / Math.max(stats.users.funder, 1)) * 100) : 0,
                                color: 'purple',
                                suffix: '%'
                            },
                            {
                                label: 'Deal Close Rate',
                                value: stats.deals.total > 0 ? Math.round((stats.deals.confirmed / Math.max(stats.deals.total, 1)) * 100) : 0,
                                color: 'emerald',
                                suffix: '%'
                            },
                            {
                                label: 'RFQ Conversion',
                                value: stats.rfqs.total > 0 ? Math.round((stats.rfqs.closed / Math.max(stats.rfqs.total, 1)) * 100) : 0,
                                color: 'amber',
                                suffix: '%'
                            },
                        ].map(({ label, value, color, suffix }) => (
                            <div key={label}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">{label}</span>
                                    <span className={`text-xs font-black text-${color}-600 dark:text-${color}-400 font-mono`}>
                                        {loading ? '—' : `${value}${suffix}`}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`}
                                        style={{ width: `${loading ? 0 : value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Activity Tables ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Users */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Recent Registrations</p>
                            <h4 className="font-black text-gray-900 dark:text-white text-sm mt-0.5">Newest Users</h4>
                        </div>
                        <button onClick={() => onNavigate('admin-panel')}
                            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                            View all →
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-3/5" />
                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-2/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentUsers.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8 italic">No users registered yet.</p>
                    ) : (
                        <div className="space-y-1">
                            {recentUsers.map((u, i) => {
                                const typeColors = {
                                    SME: 'blue', SUPPLIER: 'emerald', FUNDER: 'purple', ADMIN: 'red'
                                };
                                const color = typeColors[u.type] || 'gray';
                                const typeIcons = { SME: '🏢', SUPPLIER: '🚚', FUNDER: '💎', ADMIN: '🔑' };
                                return (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-${color}-50 dark:bg-${color}-900/20`}>
                                            {typeIcons[u.type] || '👤'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{u.name || u.email}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{u.email}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                                                {u.type}
                                            </span>
                                            {u.subscribed && (
                                                <span className="text-[9px] font-black text-emerald-500">PRO</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Deals */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Deal Flow</p>
                            <h4 className="font-black text-gray-900 dark:text-white text-sm mt-0.5">Recent Deals</h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Live
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : recentDeals.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8 italic">No deals in the system yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {recentDeals.map((deal, i) => {
                                const statusColor = {
                                    'Pending Review': 'amber',
                                    'Capital Secured': 'blue',
                                    'Waybill Uploaded': 'purple',
                                    'Delivery Confirmed': 'emerald',
                                }[deal.status] || 'gray';

                                return (
                                    <div key={i} className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className={`w-2 self-stretch rounded-full bg-${statusColor}-500 flex-shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{deal.smeName || 'Unknown SME'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {deal.category} · R{Number(deal.amount || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-${statusColor}-50 dark:bg-${statusColor}-900/20 text-${statusColor}-600 dark:text-${statusColor}-400 flex-shrink-0`}>
                                            {deal.status === 'Pending Review' ? 'Pending'
                                                : deal.status === 'Capital Secured' ? 'Secured'
                                                    : deal.status === 'Waybill Uploaded' ? 'In Transit'
                                                        : 'Closed'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Secondary KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'SME Businesses', value: stats.users.sme, icon: '🏢', color: 'blue' },
                    { label: 'Verified Suppliers', value: stats.users.supplier, icon: '🚚', color: 'emerald' },
                    { label: 'Active Funders', value: stats.users.funder, icon: '💎', color: 'purple' },
                    { label: 'Open RFQs', value: stats.rfqs.active, icon: '📨', color: 'amber' },
                ].map(({ label, value, icon, color }) => (
                    <div key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-${color}-50 dark:bg-${color}-900/20 flex-shrink-0`}>
                            {icon}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">{label}</p>
                            <p className={`text-2xl font-black text-${color}-600 dark:text-${color}-400 font-mono leading-tight`}>
                                {loading ? '—' : value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer CTA ── */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-600/20 text-white">
                <div>
                    <h3 className="text-xl font-black mb-1">Ready to manage the platform?</h3>
                    <p className="text-white/70 text-sm">Approve funders, manage users, and monitor system compliance.</p>
                </div>
                <button
                    onClick={() => onNavigate('admin-panel')}
                    className="px-8 py-4 bg-white text-red-600 rounded-2xl font-black shadow-xl hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap"
                >
                    Open Control Center →
                </button>
            </div>
        </div>
    );
}
