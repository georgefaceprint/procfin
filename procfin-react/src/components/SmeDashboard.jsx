import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from './Toast';

export default function SmeDashboard({ user, onNavigate }) {
    const [rfqs, setRfqs] = useState([]);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Quote review state
    const [reviewingRfq, setReviewingRfq] = useState(null); // full rfq object
    const [acceptingQuote, setAcceptingQuote] = useState(null); // supplierId being accepted
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!user.id) return;

        // Listen for SME's own RFQs
        const qRfqs = query(collection(db, "rfqs"), where("smeId", "==", user.id));
        const unsubRfqs = onSnapshot(qRfqs, (snapshot) => {
            const updated = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setRfqs(updated);
            // If we are reviewing an RFQ that updated, sync it
            setReviewingRfq(prev => prev ? (updated.find(r => r.id === prev.id) || prev) : null);
        });

        // Listen for SME's own Funding Deals
        const qDeals = query(collection(db, "deals"), where("smeId", "==", user.id));
        const unsubDeals = onSnapshot(qDeals, (snapshot) => {
            setDeals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => { unsubRfqs(); unsubDeals(); };
    }, [user.id]);

    // ─── Quote Accept Logic ───────────────────────────────────────────────────
    const handleAcceptQuote = async () => {
        if (!acceptingQuote || !reviewingRfq) return;
        setAcceptingQuote(prev => ({ ...prev, accepting: true }));
        try {
            const quote = reviewingRfq.quotes.find(q => q.supplierId === acceptingQuote.supplierId);
            const rfqRef = doc(db, 'rfqs', reviewingRfq.id);
            await updateDoc(rfqRef, {
                status: 'Closed (Quote Accepted)',
                acceptedQuote: quote,
            });

            // Notify winning supplier
            if (quote?.supplierId) {
                const notifRef = doc(db, 'user_notifications', quote.supplierId);
                const notifSnap = await getDoc(notifRef);
                const existing = notifSnap.exists() ? (notifSnap.data().data || []) : [];
                existing.unshift({
                    id: Date.now(),
                    text: `🎉 Your quote of R${Number(quote.amount).toLocaleString()} for "${reviewingRfq.title}" has been ACCEPTED by ${user.name}!`,
                    read: false,
                    timestamp: Date.now()
                });
                await setDoc(notifRef, { data: existing }, { merge: true });
            }

            // Notify other suppliers their quote was not selected
            const losers = (reviewingRfq.quotes || []).filter(q => q.supplierId !== quote?.supplierId);
            for (const loser of losers) {
                if (!loser.supplierId) continue;
                try {
                    const notifRef = doc(db, 'user_notifications', loser.supplierId);
                    const snap = await getDoc(notifRef);
                    const existing = snap.exists() ? (snap.data().data || []) : [];
                    existing.unshift({
                        id: Date.now(),
                        text: `📋 Your quote for "${reviewingRfq.title}" was not selected this time. Keep submitting!`,
                        read: false,
                        timestamp: Date.now()
                    });
                    await setDoc(notifRef, { data: existing }, { merge: true });
                } catch (_) { }
            }

            setShowAcceptModal(false);
            setReviewingRfq(null);
            setAcceptingQuote(null);
        } catch (e) {
            console.error('Accept quote error:', e);
            toast.error('Failed to accept quote. Please try again.');
            setAcceptingQuote(prev => ({ ...prev, accepting: false }));
        }
    };

    const renderSuggestiveActions = () => {
        const actions = [];
        const tier = user.subscription?.tier || 'free';

        if (!user.industry || (Array.isArray(user.industry) && user.industry.length === 0)) {
            actions.push({
                title: "Complete Your Matching Profile",
                desc: "Select up to 5 categories to get matched with the right suppliers.",
                icon: "🏷️",
                action: () => onNavigate('profile-edit'),
                color: "blue"
            });
        }

        if (tier === 'free') {
            actions.push({
                title: "Upgrade to Pro",
                desc: "Get unlimited RFQs and priority matching for just R499/month.",
                icon: "💎",
                action: () => onNavigate('subscription'), // Future subscription page
                color: "indigo"
            });
        }

        if (rfqs.length === 0) {
            actions.push({
                title: "Create Your First RFQ",
                desc: "Broadcast a request to verified suppliers for your business needs.",
                icon: "🚚",
                action: () => onNavigate('rfq-form'),
                color: "purple"
            });
        }

        // Phase 3: Check for RFQs with accepted quotes that need funding
        const needsFunding = rfqs.find(r => r.status === 'Closed (Quote Accepted)');
        if (needsFunding && deals.length === 0) {
            actions.push({
                title: "Secure Deal Funding",
                desc: `Phase 3 started! Apply for funding for "${needsFunding.title}" quoting R${Number(needsFunding.acceptedQuote?.amount || 0).toLocaleString()}.`,
                icon: "💰",
                action: () => onNavigate('funding-request', {
                    amount: needsFunding.acceptedQuote?.amount,
                    category: needsFunding.category,
                    description: `Funding needed for ${needsFunding.title} with ${needsFunding.acceptedQuote?.supplierName}. RFQ Specs: ${needsFunding.specs}`
                }),
                color: "emerald"
            });
        }

        if (actions.length === 0) return null;

        const colorMap = {
            blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
            emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
            purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
            indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {actions.map((action, i) => {
                    const colors = colorMap[action.color] || colorMap.blue;
                    return (
                        <div key={i} className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={action.action}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} text-xl`}>
                                    {action.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{action.title}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{action.desc}</p>
                                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        Take Action <span>&rarr;</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ─── Quote Review Drawer ──────────────────────────────────────────────────
    const renderQuoteDrawer = () => {
        if (!reviewingRfq) return null;
        // Sort quotes: isGold first, then by lowest price
        const quotes = [...(reviewingRfq.quotes || [])].sort((a, b) => {
            if (a.isGold && !b.isGold) return -1;
            if (!a.isGold && b.isGold) return 1;
            return a.amount - b.amount;
        });
        const isClosed = reviewingRfq.status === 'Closed (Quote Accepted)';
        const acceptedQuote = reviewingRfq.acceptedQuote;

        return (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-6">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setReviewingRfq(null)}
                />

                {/* Drawer */}
                <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Quote Review</p>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">{reviewingRfq.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {quotes.length} quote{quotes.length !== 1 ? 's' : ''} received · {reviewingRfq.category} · {reviewingRfq.location}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${isClosed
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>{reviewingRfq.status}</span>
                            <button
                                onClick={() => setReviewingRfq(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg"
                            >×</button>
                        </div>
                    </div>

                    {isClosed && (
                        <div className="px-6 py-4 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/30 flex justify-between items-center transition-all animate-fade-in">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🚀</span>
                                <div>
                                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Phase 3: Deal Securitization</p>
                                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-bold uppercase tracking-tighter">Ready to secure capital for this contract?</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setReviewingRfq(null);
                                    onNavigate('funding-request', {
                                        amount: acceptedQuote?.amount,
                                        category: reviewingRfq.category,
                                        description: `Funding for ${reviewingRfq.title} with ${acceptedQuote?.supplierName}.`
                                    });
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                Apply for Funding →
                            </button>
                        </div>
                    )}

                    {/* Quote Specs */}
                    <div className="px-6 pt-4 pb-2 flex-shrink-0">
                        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Specification</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{reviewingRfq.specs}</p>
                        </div>
                    </div>

                    {/* Quotes list */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        {quotes.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="text-5xl mb-4 opacity-20">💬</div>
                                <p className="text-gray-400 font-bold">No quotes received yet.</p>
                                <p className="text-gray-400 text-sm mt-1">Verified suppliers in your category will respond shortly.</p>
                            </div>
                        ) : (
                            quotes.map((q, idx) => {
                                const isAccepted = acceptedQuote?.supplierId === q.supplierId;
                                const isLowest = quotes.length > 1 && q.amount === Math.min(...quotes.map(x => x.amount));

                                return (
                                    <div key={idx} className={`relative rounded-2xl border-2 p-5 transition-all ${isAccepted
                                        ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-blue-200 dark:hover:border-blue-800'
                                        }`}>
                                        {/* Badges */}
                                        <div className="absolute top-4 right-4 flex flex-wrap justify-end gap-2">
                                            {q.isGold && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-500/20 ring-2 ring-amber-200">⭐ Gold Verified</span>
                                            )}
                                            {isAccepted && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-500 text-white rounded-lg">✓ Accepted</span>
                                            )}
                                            {isLowest && !isAccepted && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800">💡 Lowest</span>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-4 max-w-[85%]">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">🏭</div>
                                            <div className="flex-1">
                                                <p className="font-black text-gray-900 dark:text-white">{q.supplierName}</p>
                                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                                                    R{Number(q.amount).toLocaleString()}
                                                </p>
                                                {q.note && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed italic">"{q.note}"</p>
                                                )}
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-2">
                                                    Submitted {new Date(q.submittedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        {!isClosed && (
                                            <button
                                                onClick={() => {
                                                    setAcceptingQuote({ supplierId: q.supplierId, name: q.supplierName, amount: q.amount });
                                                    setShowAcceptModal(true);
                                                }}
                                                className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                            >
                                                Accept This Quote
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {!isClosed && quotes.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900/60">
                            <p className="text-xs text-gray-400 text-center">
                                Accepting a quote closes this RFQ and notifies all suppliers automatically.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome, {user.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your business funding and supply chain from one secure dashboard.</p>
                </div>
                {user.subscribed && (
                    <div className="flex gap-3">
                        {user.subscription?.tier === 'free' && rfqs.length >= 2 ? (
                            <button
                                onClick={() => onNavigate('subscription')}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                💎 Upgrade for more RFQs
                            </button>
                        ) : (
                            <button onClick={() => onNavigate('rfq-form')} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Request Quote</button>
                        )}
                        <button onClick={() => onNavigate('funding-request')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">Apply for Funding</button>
                    </div>
                )}
            </div>

            {renderSuggestiveActions()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Info Card */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl">🏢</div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{user.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mt-1">SME Representative</p>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-gray-100 dark:border-gray-700/50 pt-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Account Status</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Verified SME</span>
                        </div>
                        <div className="flex justify-between items-start text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Categories</span>
                            <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                                {Array.isArray(user.industry) ? user.industry.join(', ') : (user.industry || 'None')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Official Email</span>
                            <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Subscription Tier</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${user.subscription?.tier === 'pro' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                {user.subscription?.tier || 'Free'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">ProcFin ID</span>
                            <span className="font-mono text-xs bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded text-blue-600 dark:text-blue-400">PR-{user.id?.substring(0, 8).toUpperCase() || 'NEW'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-10">
                        <button onClick={() => onNavigate('profile-edit')} className="py-3 text-sm font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Edit Profile</button>
                        <button onClick={() => onNavigate('vault')} className="py-3 text-sm font-bold bg-gray-900 dark:bg-blue-600 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10">My Vault</button>
                    </div>
                </div>

                {/* RFQ / Funding List */}
                <div className="lg:col-span-2 space-y-6">
                    {user.subscription?.tier !== 'pro' ? (
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <div className="relative z-10 max-w-md">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-white/60">Expansion Opportunity</h2>
                                <h3 className="text-3xl font-black mb-4 italic">SME Pro: Scale Your Operations</h3>
                                <p className="text-white/80 mb-8 leading-relaxed font-medium">
                                    Subscribe for **R499/mo** for unlimited RFQs, priority supplier matching, and dedicated funding support.
                                </p>
                                <button onClick={() => onNavigate('subscription')} className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all shadow-xl active:scale-95">
                                    Upgrade to Pro &rarr;
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Active RFQs */}
                            <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Quotation Requests (RFQs)</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {tier === 'free' ? `${rfqs.length}/2 RFQs used in Free Tier` : 'Unlimited Pro RFQs active'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${tier === 'pro'
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800'
                                        : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'}`}>
                                        SME {tier === 'pro' ? 'Pro' : 'Starter'} Active
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {rfqs.length > 0 ? rfqs.map((rfq, i) => {
                                        const quoteCount = rfq.quotes?.length || 0;
                                        const hasNewQuotes = quoteCount > 0 && rfq.status !== 'Closed (Quote Accepted)';
                                        const isClosed = rfq.status === 'Closed (Quote Accepted)';

                                        return (
                                            <div key={i} className={`border-2 rounded-2xl p-5 transition-all hover:shadow-md ${hasNewQuotes
                                                ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10'
                                                : isClosed
                                                    ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/5'
                                                    : 'border-gray-100 dark:border-gray-700'
                                                }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-900 dark:text-white pr-2">{rfq.title}</h4>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${isClosed
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>{rfq.status}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-4 truncate">{rfq.specs}</p>

                                                {/* Quote count indicator */}
                                                {quoteCount > 0 && (
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="flex -space-x-1">
                                                            {Array.from({ length: Math.min(quoteCount, 3) }).map((_, i) => (
                                                                <div key={i} className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[8px] text-white font-black">🏭</div>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                            {quoteCount} supplier quote{quoteCount !== 1 ? 's' : ''} received
                                                        </span>
                                                        {hasNewQuotes && (
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                        )}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setReviewingRfq(rfq)}
                                                    className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${hasNewQuotes
                                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                                        : isClosed
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                                                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-100 dark:border-gray-600'
                                                        }`}>
                                                    {isClosed
                                                        ? '✓ View Accepted Quote'
                                                        : quoteCount > 0
                                                            ? `Review ${quoteCount} Quote${quoteCount !== 1 ? 's' : ''} →`
                                                            : 'Awaiting Quotes...'}
                                                </button>
                                            </div>
                                        );
                                    }) : (
                                        <div className="col-span-2 py-12 text-center">
                                            <div className="text-4xl mb-4 opacity-20">📦</div>
                                            <p className="text-gray-400 text-sm italic">You have no active quotation requests.</p>
                                            <button onClick={() => onNavigate('rfq-form')} className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">
                                                Create your first RFQ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Funding Deals Section */}
                            <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tender Funding Status</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Track your funding applications and capital deployment.</p>

                                <div className="space-y-4">
                                    {deals.length > 0 ? deals.map(deal => (
                                        <div key={deal.id} className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-all hover:border-blue-500/30">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">R{Number(deal.amount || 0).toLocaleString()} Funding Request</h4>
                                                <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-1">{deal.category}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${deal.status === 'Capital Secured' || deal.status === 'Delivery Confirmed'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900'
                                                    : deal.status === 'Waybill Uploaded'
                                                        ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900'
                                                        : deal.status === 'Bidding Open'
                                                            ? 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900'
                                                            : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900'
                                                    }`}>
                                                    {deal.status === 'Bidding Open' && deal.bids?.length > 0 ? `Bids Received (${deal.bids.length})` : deal.status}
                                                </span>
                                                <button
                                                    onClick={() => onNavigate('funding-details', { dealId: deal.id })}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-blue-400 transition-all text-sm font-bold"
                                                >
                                                    →
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                                            <p className="text-gray-400 text-sm">No active funding deals found.</p>
                                            <button onClick={() => onNavigate('funding-request')} className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">Apply for funding →</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Quote Review Drawer */}
            {renderQuoteDrawer()}

            {/* Accept Quote Confirmation Modal */}
            {showAcceptModal && acceptingQuote && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] px-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="text-4xl text-center mb-4">🤝</div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 text-center">Accept This Quote?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
                            You are accepting{' '}
                            <strong className="text-gray-900 dark:text-white">{acceptingQuote.name}</strong>'s
                            quote of{' '}
                            <strong className="text-blue-600 dark:text-blue-400 font-mono">R{Number(acceptingQuote.amount).toLocaleString()}</strong>.
                            <br /><br />
                            This will <strong>close the RFQ</strong> and notify all suppliers of the outcome.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowAcceptModal(false); setAcceptingQuote(null); }}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcceptQuote}
                                disabled={acceptingQuote?.accepting}
                                className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                            >
                                {acceptingQuote?.accepting ? 'Accepting...' : '✓ Accept & Close RFQ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
