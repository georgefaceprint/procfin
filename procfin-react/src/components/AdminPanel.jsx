import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useToast } from './Toast';

const ADMIN_MODULES = [
    { id: 'compliance', title: 'Compliance Engine', desc: 'Manage mandatory CSD, Tax, and FICA document requirements across all roles.', icon: '📄', color: 'blue' },
    { id: 'growth', title: 'Growth Analytics', desc: 'Bird\'s-eye view of MRR, capital matched, and platform growth velocity.', icon: '📈', color: 'emerald' },
    { id: 'categories', title: 'Funding Categories', desc: 'Update the platform taxonomy and matching logic for SME funding requests.', icon: '🏷️', color: 'emerald' },
    { id: 'users', title: 'User Management', desc: 'Audit the entire user base including SMEs, Funders, and Suppliers.', icon: '👥', color: 'amber' },
    { id: 'funder_approval', title: 'Funder Verification', desc: 'Approve or reject high-net-worth individuals and corporate funding entities.', icon: '🛡️', color: 'purple' },
    { id: 'subscriptions', title: 'Subscription Manager', desc: 'Manage SME pricing tiers, pro upgrades, and billing status.', icon: '💳', color: 'indigo' },
    { id: 'activity', title: 'System Activity', desc: 'Live feed of platform notifications, deal statuses, and user sign-ups.', icon: '🔔', color: 'red' },
    { id: 'paywalls', title: 'Paywalls & Upsells', desc: 'Dynamically control SME limits, Supplier free quotas, and pricing logic.', icon: '🚧', color: 'red' },
    { id: 'payments', title: 'Payment Settings', desc: 'Securely manage Yoco API keys and platform subscription pricing.', icon: '💰', color: 'indigo' },
    { id: 'secrets', title: 'API & Secrets', desc: 'Manage backend keys, Firestore limits, and third-party integration secrets.', icon: '🔑', color: 'gray' }
];

export default function AdminPanel({ user, onBack }) {
    const [currentModule, setCurrentModule] = useState(null);
    const [users, setUsers] = useState([]);
    const [deals, setDeals] = useState([]);
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [stats] = useState({
        deals: 24,
        rfqs: 156,
        categories: 12
    });

    useEffect(() => {
        if (currentModule === 'users' || currentModule === 'funder_approval' || currentModule === 'growth' || currentModule === 'subscriptions') {
            setLoading(true);
            const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
                const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(userList);
                setLoading(false);
            });

            const unsubDeals = onSnapshot(collection(db, "deals"), (snapshot) => {
                setDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

            const unsubRfqs = onSnapshot(collection(db, "rfqs"), (snapshot) => {
                setRfqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

            return () => {
                unsubUsers();
                unsubDeals();
                unsubRfqs();
            };
        }
    }, [currentModule]);

    const toggleSubscription = async (userId, currentTier) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                "subscription.tier": currentTier === 'pro' ? 'free' : 'pro',
                "subscription.updatedAt": new Date()
            });
            toast.success(`SME upgraded to ${currentTier === 'pro' ? 'Free' : 'Pro'} successfully!`);
        } catch (error) {
            console.error("Error toggling subscription:", error);
            toast.error('Failed to update subscription.');
        }
    };

    const verifyEFT = async (userId, requestedPlan, requestedFeatured) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                subscribed: true,
                plan: requestedPlan,
                featured: requestedFeatured,
                promoted: requestedFeatured, // backward compatibility
                pendingEFT: false,
                popUrl: null,
                subscribedAt: new Date().toISOString(),
                paymentMethod: 'EFT'
            });
            toast.success('EFT Verified & Subscription Activated!');
        } catch (error) {
            console.error("Error verifying EFT:", error);
            toast.error('Failed to verify EFT.');
        }
    };

    const toggleVerification = async (userId, currentStatus) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                verified: !currentStatus
            });
            toast.success(`User ${currentStatus ? 'unverified' : 'verified'} successfully!`);
        } catch (error) {
            console.error("Error toggling verification:", error);
            toast.error('Failed to update user status.');
        }
    };

    const toggleGoldStatus = async (userId, currentStatus) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                isGold: !currentStatus
            });
            toast.success(`Supplier ${currentStatus ? 'removed from Gold' : 'upgraded to Gold'} successfully!`);
        } catch (error) {
            console.error("Error toggling Gold status:", error);
            toast.error('Failed to update Supplier tier.');
        }
    };

    const runEmailDiagnosis = async () => {
        setLoading(true);
        try {
            const testEmail = httpsCallable(functions, 'testEmailSystem');
            const result = await testEmail();
            toast.success(result.data.message || 'Diagnosis email sent!');
        } catch (error) {
            console.error("Diagnosis error:", error);
            toast.error(error.message || 'Failed to run diagnosis.');
        } finally {
            setLoading(false);
        }
    };

    if (currentModule === 'compliance') {
        return (
            <div className="max-w-4xl mx-auto py-10 animate-fade-in">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Compliance Engine</h2>
                        <p className="text-gray-500">Manage mandatory KYC/KYB document requirements.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['CIPC Registration', 'Tax Clearance', 'BEE Certificate', 'Director ID Copies', 'Proof of Address', 'Bank Confirmation'].map(docName => (
                        <div key={docName} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">📄</div>
                                <div className="font-bold text-gray-900 dark:text-white">{docName}</div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (currentModule === 'categories') {
        const categories = ['Construction', 'Logistics', 'Agriculture', 'Healthcare', 'Information Tech', 'Manufacturing', 'Retail', 'Mining'];
        return (
            <div className="max-w-4xl mx-auto py-10 animate-fade-in">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Funding Categories</h2>
                        <p className="text-gray-500">Industry taxonomy for deal matching.</p>
                    </div>
                    <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Add Category</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {categories.map(cat => (
                        <div key={cat} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-3xl group hover:border-emerald-500/30 transition-all">
                            <div className="text-2xl mb-4 group-hover:scale-110 transition-transform text-center">🏷️</div>
                            <div className="font-bold text-gray-900 dark:text-white text-center">{cat}</div>
                            <div className="text-[10px] text-gray-400 mt-2 text-center">42 Active Deals</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (currentModule === 'users') {
        return (
            <div className="max-w-6xl mx-auto py-10 animate-fade-in">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">User Management</h2>
                <p className="text-gray-500 mb-10">Audit and verify platform participants.</p>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User / Entity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{u.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{u.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${u.type === 'SME' ? 'bg-blue-50 text-blue-600' :
                                            u.type === 'SUPPLIER' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                                            }`}>
                                            {u.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-xs font-bold ${u.verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.verified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                            {u.verified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {u.type === 'SUPPLIER' && (
                                                <button
                                                    onClick={() => toggleGoldStatus(u.id, u.isGold)}
                                                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${u.isGold
                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {u.isGold ? '⭐ Gold' : 'Standard'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => toggleVerification(u.id, u.verified)}
                                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${u.verified
                                                    ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                                                    }`}
                                            >
                                                {u.verified ? 'Revoke' : 'Approve'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="p-10 text-center text-gray-400 italic">Scanning decentralized database...</div>}
                </div>
            </div>
        );
    }

    if (currentModule === 'funder_approval') {
        const funders = users.filter(u => u.type === 'FUNDER');
        return (
            <div className="max-w-6xl mx-auto py-10 animate-fade-in">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Funder Verification</h2>
                        <p className="text-gray-500">Authorize capital partners to deploy liquidity on the platform.</p>
                    </div>
                    <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-purple-100 dark:border-purple-800">
                        {funders.length} Registered Funders
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {funders.map(f => (
                        <div key={f.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center shadow-sm">
                            <div className="flex items-center gap-6 mb-4 md:mb-0">
                                <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-2xl">
                                    💎
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{f.name || f.email.split('@')[0]}</h4>
                                        {f.verified && <span className="text-blue-500 text-sm">🛡️</span>}
                                    </div>
                                    <p className="text-sm text-gray-500">{f.email}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-900 py-1 px-2 rounded text-gray-400 border border-gray-100 dark:border-gray-700">AUM: R{f.aum || '0'}M</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-900 py-1 px-2 rounded text-gray-400 border border-gray-100 dark:border-gray-700">HNWI Verified</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-bold ${f.verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {f.verified ? 'Authorized' : 'Pending Authorization'}
                                </span>
                                <button
                                    onClick={() => toggleVerification(f.id, f.verified)}
                                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${f.verified
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-purple-600/20'
                                        }`}
                                >
                                    {f.verified ? 'Revoke Access' : 'Approve Funder'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {funders.length === 0 && !loading && (
                        <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="text-5xl mb-4 opacity-20">🛡️</div>
                            <p className="text-gray-400 italic">No funder applications pending review.</p>
                        </div>
                    )}
                    {loading && <div className="p-10 text-center text-gray-400 italic">Synchronizing with capital markets...</div>}
                </div>
            </div>
        );
    }

    if (currentModule === 'subscriptions') {
        const smes = users.filter(u => u.type === 'SME');
        return (
            <div className="max-w-6xl mx-auto py-10 animate-fade-in">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">SME Subscription Manager</h2>
                        <p className="text-gray-500">Manage pricing tiers and premium access for platform SMEs.</p>
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-800">
                        {smes.length} SMEs Registered
                    </div>
                </div>

                {users.filter(u => u.pendingEFT).length > 0 && (
                    <div className="mb-12 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6">
                        <h3 className="text-xl font-black text-amber-900 dark:text-amber-500 mb-4 flex items-center gap-2">
                            <span>⏳</span> Pending EFT Verifications
                        </h3>
                        <div className="space-y-4">
                            {users.filter(u => u.pendingEFT).map(u => (
                                <div key={u.id} className="bg-white dark:bg-gray-800 border border-amber-100 dark:border-gray-700 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-sm">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{u.name || u.email.split('@')[0]}</div>
                                        <div className="text-sm text-gray-500">{u.email}</div>
                                        <div className="mt-2 text-xs font-bold text-gray-500 uppercase">
                                            Requested: <span className="text-amber-600">{u.requestedPlan}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-4 md:mt-0">
                                        <a href={u.popUrl} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                                            <span>📄</span> View POP
                                        </a>
                                        <button onClick={() => verifyEFT(u.id, u.requestedPlan, u.requestedFeatured)} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all">
                                            Verify & Activate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">SME Entity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Current Tier</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {smes.map(sme => {
                                const tier = sme.subscription?.tier || 'free';
                                return (
                                    <tr key={sme.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{sme.name || sme.email.split('@')[0]}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{sme.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${tier === 'pro' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-100 text-gray-500'}`}>
                                                {tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-gray-500 uppercase">
                                                {tier === 'pro' ? 'R499 / Month' : 'Limited Access'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleSubscription(sme.id, tier)}
                                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tier === 'pro'
                                                    ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                                                    }`}
                                            >
                                                {tier === 'pro' ? 'Downgrade' : 'Upgrade to Pro'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {loading && <div className="p-10 text-center text-gray-400 italic">Scanning decentralized database...</div>}
                </div>
            </div>
        );
    }

    if (currentModule === 'activity') {
        const activities = [
            { type: 'signup', user: 'GreenPower Ltd', detail: 'New SME registration verified.', time: '2 mins ago', icon: '🌱' },
            { type: 'deal', user: 'Thabo Mndau', detail: 'Funded R250k for Construction Tender.', time: '15 mins ago', icon: '💰' },
            { type: 'rfq', user: 'Alpha Logistics', detail: 'New RFQ broadcast to 12 suppliers.', time: '1 hour ago', icon: '📦' },
            { type: 'compliance', user: 'Sipho Nkosi', detail: 'BEE Certificate updated and verified.', time: '3 hours ago', icon: '🛡️' },
            { type: 'funder', user: 'Zenith Capital', detail: 'New funder application pending review.', time: '5 hours ago', icon: '💎' }
        ];

        return (
            <div className="max-w-4xl mx-auto py-10 animate-fade-in">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">System Activity</h2>
                        <p className="text-gray-500">Live feed of global platform operations.</p>
                    </div>
                    <span className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Live Stream
                    </span>
                </div>
                <div className="space-y-4">
                    {activities.map((act, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-3xl flex items-center justify-between hover:translate-x-2 transition-transform cursor-pointer group">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                    {act.icon}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{act.user}</div>
                                    <div className="text-xs text-gray-500 mt-1">{act.detail}</div>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{act.time}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (currentModule === 'growth') {
        const totalCapital = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const proSmes = users.filter(u => u.type === 'SME' && u.subscription?.tier === 'pro').length;
        const mrr = proSmes * 499;
        const supplierCount = users.filter(u => u.type === 'SUPPLIER').length;
        const smeCount = users.filter(u => u.type === 'SME').length;

        const growthStats = [
            { label: 'Total Capital Matched', value: `R${(totalCapital / 1000000).toFixed(1)}M`, trend: '+12%', color: 'emerald' },
            { label: 'Monthly Recurring Revenue', value: `R${mrr.toLocaleString()}`, trend: '+5%', color: 'indigo' },
            { label: 'SME Base Expansion', value: smeCount, trend: '+18%', color: 'blue' },
            { label: 'Supplier Ecosystem', value: supplierCount, trend: '+8%', color: 'amber' }
        ];

        return (
            <div className="max-w-5xl mx-auto py-10 animate-fade-in">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="mb-12">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Growth Analytics</h2>
                    <p className="text-gray-500">Real-time performance metrics and revenue tracking.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {growthStats.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 rounded-3xl shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{stat.label}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                                <span className="text-xs font-bold text-emerald-500">{stat.trend}</span>
                            </div>
                            <div className={`h-1 w-full bg-${stat.color}-500/10 rounded-full mt-6 overflow-hidden`}>
                                <div className={`h-full bg-${stat.color}-500 w-2/3 rounded-full opacity-50`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-900 rounded-3xl p-10 text-white relative h-64 overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Revenue Velocity</h4>
                            <div className="text-4xl font-black mb-2">R{mrr.toLocaleString()}<span className="text-sm font-medium opacity-50 ml-2">MRR</span></div>
                            <p className="text-white/40 text-sm max-w-[200px]">Projected year-end revenue based on current growth delta.</p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end px-4 gap-2">
                            {[40, 60, 45, 75, 55, 90, 85].map((h, i) => (
                                <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg transition-all hover:bg-blue-500" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-3xl">💎</div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Pro Tier Conversion</h4>
                                <p className="text-sm text-gray-500">{(proSmes / (smeCount || 1) * 100).toFixed(1)}% of SMEs are on paid plans.</p>
                            </div>
                        </div>
                        <button onClick={() => setCurrentModule('subscriptions')} className="mt-8 w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors">Manage Subscriptions &rarr;</button>
                    </div>
                </div>
            </div>
        );
    }

    if (currentModule === 'payments') {
        const [yocoKeys, setYocoKeys] = useState({ publicKey: '', secretKey: '' });
        const [saving, setSaving] = useState(false);

        useEffect(() => {
            const fetchKeys = async () => {
                const { getDoc } = await import('firebase/firestore');
                const docSnap = await getDoc(doc(db, "settings", "payments"));
                if (docSnap.exists()) {
                    setYocoKeys(docSnap.data());
                }
            };
            fetchKeys();
        }, []);

        const saveKeys = async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
                const { setDoc } = await import('firebase/firestore');
                await setDoc(doc(db, "settings", "payments"), yocoKeys, { merge: true });
                toast.success('Payment keys updated successfully!');
            } catch (err) {
                toast.error('Failed to update keys. Check console.');
            } finally {
                setSaving(false);
            }
        };

        return (
            <div className="max-w-4xl mx-auto py-10 animate-fade-in px-6">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[2.5rem] p-10 shadow-xl">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Payment Settings</h2>
                    <p className="text-gray-500 mb-10">Configure your Yoco API integration keys here.</p>

                    <form onSubmit={saveKeys} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yoco Public Key</label>
                            <input
                                type="text"
                                required
                                value={yocoKeys.publicKey}
                                onChange={e => setYocoKeys({ ...yocoKeys, publicKey: e.target.value })}
                                placeholder="pk_test_..."
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yoco Secret Key</label>
                            <input
                                type="password"
                                required
                                value={yocoKeys.secretKey}
                                onChange={e => setYocoKeys({ ...yocoKeys, secretKey: e.target.value })}
                                placeholder="sk_test_..."
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {saving ? 'Saving System Config...' : 'Save Configuration'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (currentModule === 'paywalls') {
        const [paywallSettings, setPaywallSettings] = useState({
            smeFreeRfqLimit: 3,
            smeProRfqLimit: 10,
            supplierFreeQuoteLimit: 7,
            supplierMaxQuoteValue: 25000,
            goldQuoteLimit: 25,
            diamondQuoteLimit: 50,
            featuredPrice3d: 999,
            featuredPrice30d: 3999
        });
        const [saving, setSaving] = useState(false);

        useEffect(() => {
            const fetchSettings = async () => {
                const { getDoc } = await import('firebase/firestore');
                const docSnap = await getDoc(doc(db, "settings", "paywalls"));
                if (docSnap.exists()) {
                    setPaywallSettings(docSnap.data());
                }
            };
            fetchSettings();
        }, []);

        const saveSettings = async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
                const { setDoc } = await import('firebase/firestore');
                await setDoc(doc(db, "settings", "paywalls"), paywallSettings, { merge: true });
                toast.success('Paywall settings updated securely!');
            } catch (err) {
                toast.error('Failed to update paywall settings.');
            } finally {
                setSaving(false);
            }
        };

        return (
            <div className="max-w-4xl mx-auto py-10 animate-fade-in px-6">
                <button onClick={() => setCurrentModule(null)} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Control Center</button>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[2.5rem] p-10 shadow-xl">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Paywalls & Upsells</h2>
                    <p className="text-gray-500 mb-10">Control the exact limits where free users are forced to upgrade to a paid tier.</p>

                    <form onSubmit={saveSettings} className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-6 mb-6">
                            <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-4">SME RFQ Limits (Per Month)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Free RFQ Limit</label>
                                    <input
                                        type="number" required
                                        value={paywallSettings.smeFreeRfqLimit}
                                        onChange={e => setPaywallSettings({ ...paywallSettings, smeFreeRfqLimit: Number(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pro RFQ Limit</label>
                                    <input
                                        type="number" required
                                        value={paywallSettings.smeProRfqLimit}
                                        onChange={e => setPaywallSettings({ ...paywallSettings, smeProRfqLimit: Number(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Enterprise tier is hardcoded to unlimited RFQs.</p>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-6 mb-6">
                            <h3 className="font-bold text-emerald-900 dark:text-emerald-400 mb-4">Supplier Quote Limits (Per Month)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Free Quotes</label>
                                    <input
                                        type="number" required
                                        value={paywallSettings.supplierFreeQuoteLimit}
                                        onChange={e => setPaywallSettings({ ...paywallSettings, supplierFreeQuoteLimit: Number(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Gold Quotes</label>
                                    <input
                                        type="number" required
                                        value={paywallSettings.goldQuoteLimit}
                                        onChange={e => setPaywallSettings({ ...paywallSettings, goldQuoteLimit: Number(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Diamond Quotes</label>
                                    <input
                                        type="number" required
                                        value={paywallSettings.diamondQuoteLimit}
                                        onChange={e => setPaywallSettings({ ...paywallSettings, diamondQuoteLimit: Number(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Max Free Value (ZAR)</label>
                                    <input
                                        type="number" required
                                        value={paywallSettings.supplierMaxQuoteValue}
                                        onChange={e => setPaywallSettings({ ...paywallSettings, supplierMaxQuoteValue: Number(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Platinum tier is hardcoded to unlimited quotes.</p>
                        </div>
                        
                        <button type="submit" disabled={saving} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-lg shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                            {saving ? 'Saving System Config...' : 'Save Configuration'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-10 animate-fade-in">
            <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Dashboard</button>

            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white">Platform Control Center</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Internal administration engine for ProcFin operations.</p>
                </div>
                <span className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest rounded-full border border-red-100 dark:border-red-900/50">Root Admin Access</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 rounded-2xl p-6 shadow-sm">
                    <div className="text-3xl font-black text-blue-600 font-mono">{stats.deals}</div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Active Funding Deals</p>
                </div>
                <div className="bg-white dark:bg-gray-800 border-l-4 border-emerald-500 rounded-2xl p-6 shadow-sm">
                    <div className="text-3xl font-black text-emerald-500 font-mono">{stats.rfqs}</div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Live Escrow RFQs</p>
                </div>
                <div className="bg-white dark:bg-gray-800 border-l-4 border-amber-500 rounded-2xl p-6 shadow-sm">
                    <div className="text-3xl font-black text-amber-500 font-mono">{stats.categories}</div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Mandate Categories</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ADMIN_MODULES.map(module => {
                    const colorMap = {
                        blue: 'bg-blue-50 dark:bg-blue-900/20',
                        emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
                        amber: 'bg-amber-50 dark:bg-amber-900/20',
                        purple: 'bg-purple-50 dark:bg-purple-900/20',
                        indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
                        red: 'bg-red-50 dark:bg-red-900/20',
                        gray: 'bg-gray-50 dark:bg-gray-900/20'
                    };
                    return (
                        <div
                            key={module.id}
                            onClick={() => setCurrentModule(module.id)}
                            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${colorMap[module.color]} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-6`}>
                                {module.icon}
                            </div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{module.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{module.desc}</p>
                            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span>Manager Module</span>
                                <span className="group-hover:text-blue-600">&rarr;</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Engine Security Operations v12.66</p>
                <div className="flex justify-center gap-4">
                    <button className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/20 hover:opacity-90 transition-opacity">Global System Shutdown</button>
                    <button className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-black hover:bg-gray-100 transition-colors">Audit Trails (SOC2)</button>
                </div>
            </div>
        </div>
    );
}
