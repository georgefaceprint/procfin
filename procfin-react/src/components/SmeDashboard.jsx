import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from './Toast';
import { Search, ClipboardList, Banknote, UserCircle, ShieldCheck, Calculator, ShoppingCart, Sparkles, ChevronRight } from 'lucide-react';

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
    
    const gridItems = [
        { id: 'rfq', label: 'Tenders', icon: ClipboardList, color: 'text-cyan-400', action: () => onNavigate('rfq-form') },
        { id: 'funding', label: 'Funding', icon: Banknote, color: 'text-emerald-400', action: () => onNavigate('funding-request') },
        { id: 'suppliers', label: 'Suppliers', icon: ShoppingCart, color: 'text-orange-400', action: () => onNavigate('suppliers') },
        { id: 'vault', label: 'Vault', icon: ShieldCheck, color: 'text-purple-400', action: () => onNavigate('vault') },
        { id: 'calculator', label: 'Calculator', icon: Calculator, color: 'text-blue-400', action: () => onNavigate('calculator') },
        { id: 'profile', label: 'Profile', icon: UserCircle, color: 'text-pink-400', action: () => onNavigate('profile-edit') },
        { id: 'upgrade', label: 'Pro', icon: Sparkles, color: 'text-amber-400', action: () => onNavigate('subscription') },
    ];

    return (
        <div className="w-full pb-10 animate-fade-in-up">
            
            {/* HERO BANNER */}
            <div className="relative w-full rounded-3xl overflow-hidden mb-6 bg-gradient-to-r from-[#005c6e] to-[#0b0c10] border border-cyan-900/30 shadow-[0_10px_40px_rgba(6,182,212,0.15)] group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-400/30 transition-all duration-700"></div>
                <div className="relative z-10 p-8 sm:p-10 flex flex-col justify-end min-h-[220px]">
                    <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] tracking-tight max-w-[280px] sm:max-w-md drop-shadow-md">
                        ProcFin is<br />the plug<br />for business
                    </h1>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-cyan-400" />
                </div>
                <input 
                    type="text" 
                    placeholder="How can we help you?"
                    className="block w-full pl-14 pr-4 py-4 sm:py-5 bg-[#121318] border border-gray-800 rounded-2xl text-white placeholder-gray-500 font-bold text-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 shadow-inner transition-all"
                />
            </div>

            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap gap-3 sm:gap-4 mb-12">
                {gridItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <div 
                            key={i} 
                            onClick={item.action}
                            className="bg-[#121318] border border-gray-800 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#1a1c23] hover:border-gray-700 transition-all shadow-sm active:scale-95 group md:w-[120px]"
                        >
                            <Icon strokeWidth={1.5} size={36} className={`${item.color} group-hover:scale-110 transition-transform duration-300`} />
                            <span className="text-gray-300 font-medium text-[11px] sm:text-xs tracking-wide">{item.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* DESKTOP DATA EXPANSION (Also visible on mobile by scrolling) */}
            <div className="space-y-6">
                {/* SME Analytics Top Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                    <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-700"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Total Tenders Posted</p>
                        <p className="text-4xl font-black text-white font-mono relative z-10">{rfqs.length}</p>
                    </div>
                    <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Total Quotes Received</p>
                        <p className="text-4xl font-black text-amber-400 font-mono relative z-10">
                            {rfqs.reduce((acc, r) => acc + (r.quotes?.length || 0), 0)}
                        </p>
                    </div>
                    <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Value in Funding</p>
                        <p className="text-4xl font-black text-emerald-400 font-mono relative z-10">
                            R{deals.reduce((acc, d) => acc + Number(d.amount || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">Activity</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* RFQS */}
                    <div className="bg-[#121318] border border-gray-800 rounded-3xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <ClipboardList className="text-cyan-400" size={24} />
                            <h4 className="text-lg font-bold text-white">Tenders (RFQs)</h4>
                        </div>
                        <div className="space-y-4">
                            {rfqs.length > 0 ? rfqs.map((rfq, i) => (
                                <div key={i} className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-5 flex justify-between items-center cursor-pointer hover:border-cyan-900 transition-all" onClick={() => setReviewingRfq(rfq)}>
                                    <div className="overflow-hidden flex-1 pr-4">
                                        <p className="font-bold text-white truncate text-sm">{rfq.title}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{rfq.category}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${rfq.status === 'Closed (Quote Accepted)' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{rfq.status}</span>
                                        <span className="text-xs text-gray-400 mt-2 font-bold">{rfq.quotes?.length || 0} Quotes</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 italic px-2">No active tenders.</p>
                            )}
                        </div>
                    </div>

                    {/* FUNDING DEALS */}
                    <div className="bg-[#121318] border border-gray-800 rounded-3xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Banknote className="text-emerald-400" size={24} />
                            <h4 className="text-lg font-bold text-white">Funding Deals</h4>
                        </div>
                        <div className="space-y-4">
                            {deals.length > 0 ? deals.map((deal, i) => (
                                <div key={i} className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-5 flex justify-between items-center cursor-pointer hover:border-emerald-900 transition-all" onClick={() => onNavigate('funding-details', { dealId: deal.id })}>
                                    <div className="overflow-hidden flex-1 pr-4">
                                        <p className="font-bold text-emerald-400 truncate text-lg">R{Number(deal.amount || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{deal.category}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400`}>{deal.status}</span>
                                        <ChevronRight size={16} className="text-gray-500 mt-2" />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 italic px-2">No active funding deals.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Keep existing modals */}
            {renderQuoteDrawer()}

            {/* Accept Quote Confirmation Modal */}
            {showAcceptModal && acceptingQuote && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] px-6">
                    <div className="bg-[#121318] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="text-4xl text-center mb-4">🤝</div>
                        <h3 className="text-xl font-black text-white mb-2 text-center">Accept This Quote?</h3>
                        <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
                            You are accepting{' '}
                            <strong className="text-white">{acceptingQuote.name}</strong>'s
                            quote of{' '}
                            <strong className="text-cyan-400 font-mono">R{Number(acceptingQuote.amount).toLocaleString()}</strong>.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowAcceptModal(false); setAcceptingQuote(null); }}
                                className="flex-1 py-3 border border-gray-800 text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcceptQuote}
                                disabled={acceptingQuote?.accepting}
                                className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                            >
                                {acceptingQuote?.accepting ? 'Accepting...' : '✓ Accept & Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
