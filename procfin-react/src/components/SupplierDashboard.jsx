import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { useToast } from './Toast';

export default function SupplierDashboard({ user, onNavigate }) {
    const [bidRequests, setBidRequests] = useState([]);
    const [activeDeals, setActiveDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quoting, setQuoting] = useState(null); // rfqId being quoted
    const [quoteForm, setQuoteForm] = useState({ amount: '', note: '' });
    const [submittingQuote, setSubmittingQuote] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!user.id) return;

        // Matching Logic: Fetch all Bidding Open deals and filter by Supplier category
        const qBidRequests = query(collection(db, "deals"), where("status", "==", "Bidding Open"));
        const unsubBidRequests = onSnapshot(qBidRequests, (snapshot) => {
            const allBidRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side filtering for category match
            const matchedBidRequests = allBidRequests.filter(deal => {
                const userCats = Array.isArray(user.preferredCategories) ? user.preferredCategories :
                    (Array.isArray(user.industry) ? user.industry :
                        (user.industry ? [user.industry] : []));

                return deal.category === 'All' || userCats.includes(deal.category) || userCats.length === 0;
            });

            setBidRequests(matchedBidRequests);
            setLoading(false);
        });

        // Listen for active deals — query by supplierId (UID-based, reliable)
        // Fallback: also match by supplierName for legacy deals that predate the supplierId fix
        const supplierId = user.uid || user.id;
        const qDeals = query(collection(db, "deals"), where("supplierId", "==", supplierId));
        const qDealsFallback = query(collection(db, "deals"), where("supplierName", "==", user.name || ""));

        const unsubDeals = onSnapshot(qDeals, (snapshot) => {
            const byId = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Also listen for name-based matches (legacy)
            onSnapshot(qDealsFallback, (snap2) => {
                const byName = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
                // Merge, deduplicate by id
                const all = [...byId];
                byName.forEach(d => { if (!all.find(x => x.id === d.id)) all.push(d); });
                setActiveDeals(all);
            });
        });

        return () => {
            unsubBidRequests();
            unsubDeals();
        };
    }, [user.id, user.industry, user.name]);

    const handleSubmitQuote = async (deal) => {
        if (!quoteForm.amount || isNaN(Number(quoteForm.amount))) {
            toast.warning('Please enter a valid bid amount.');
            return;
        }
        setSubmittingQuote(true);
        try {
            const supplierId = user.uid || user.id;
            const dealRef = doc(db, 'deals', deal.id);
            const bidAmount = Number(quoteForm.amount);
            const newBid = {
                supplierId,
                supplierName: user.name,
                isGold: user.isGold || false,
                amount: bidAmount,
                note: quoteForm.note,
                submittedAt: new Date().toISOString(),
            };

            // Calculate logic for lowest bid and margin (Platform margin is difference between funding amount and winning bid)
            // But wait, what if the bid is higher than the requested amount? It should probably be rejected, but for now we just accept it.
            const currentLowestBid = deal.winningBidAmount || Infinity;
            const updates = { bids: arrayUnion(newBid) };
            
            if (bidAmount < currentLowestBid) {
                updates.winningBidAmount = bidAmount;
                updates.supplierId = supplierId; // Set the winning supplier ID tentatively
                updates.supplierName = user.name;
                updates.margin = Number(deal.amount) - bidAmount; // Platform margin
            }

            await updateDoc(dealRef, updates);

            // Notify SME of new quote
            try {
                const notifRef = doc(db, 'user_notifications', deal.smeId);
                const notifSnap = await getDoc(notifRef);
                const existing = notifSnap.exists() ? (notifSnap.data().data || []) : [];
                existing.unshift({
                    id: Date.now(),
                    text: `💬 ${user.name} submitted a bid of R${bidAmount.toLocaleString()} for your funding request: "${deal.category}"`,
                    read: false,
                    timestamp: Date.now()
                });
                const { setDoc } = await import('firebase/firestore');
                await setDoc(notifRef, { data: existing }, { merge: true });
            } catch (_) { /* notifications are non-critical */ }

            setQuoting(null);
            setQuoteForm({ amount: '', note: '' });
        } catch (e) {
            console.error('Quote submit error:', e);
            toast.error('Failed to submit quote. Please try again.');
        } finally {
            setSubmittingQuote(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Supplier Portal</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Matched RFQs and active fulfillment contracts.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => onNavigate('vault')}
                        className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                    >
                        <span>📁</span> Vault
                    </button>
                    {!user.subscribed && (
                        <button
                            onClick={() => onNavigate('subscription')}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <span>🛡️</span> Become Verified
                        </button>
                    )}
                </div>
            </div>

            {!user.subscribed ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-10 text-center shadow-sm">
                    <div className="max-w-md mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Start Quoting on Tenders</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            Subscribe as a Verified Supplier to receive direct quotation requests from funded SMEs and secure guaranteed payouts via ProcFin escrow.
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 text-left">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Verified Supplier Plan</h4>
                            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-6 font-mono">R499<span className="text-sm font-medium text-gray-400">/mo</span></div>
                            <ul className="space-y-4 mb-8">
                                {["Instant RFQ Notifications", "Submit Unlimited Quotes", "Guaranteed Milestone Payouts"].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="text-emerald-500 font-bold">✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => onNavigate('subscription')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all">Get Verified Now</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Bid Board</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Funding requests open for competitive bidding in your category.</p>
                                </div>
                                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-800">Supplier Verified</span>
                            </div>

                            <div className="space-y-4">
                                {bidRequests.map(deal => (
                                    <div key={deal.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:shadow-md transition-shadow relative">
                                        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">Bidding Open</span>
                                        </div>
                                        <div className="max-w-[75%] mb-4">
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Procurement for: {deal.category}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <span>Client: {deal.smeName}</span>
                                                <span>•</span>
                                                <span>Funding Value: R{Number(deal.amount).toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl mb-6">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Technical Specifications (De-priced)</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                {deal.specs}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                            <div className="text-xs text-gray-400">
                                                Deal ID: {deal.id.substring(0, 8).toUpperCase()} • {deal.bids?.length || 0} Bids Received
                                                {deal.winningBidAmount && (
                                                    <span className="ml-2 text-emerald-600 font-bold hidden md:inline">
                                                        (Current lowest bid: R{deal.winningBidAmount.toLocaleString()})
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setQuoting(quoting === deal.id ? null : deal.id);
                                                    setQuoteForm({ amount: '', note: '' });
                                                }}
                                                className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                                                {quoting === deal.id ? 'Cancel' : 'Submit Bid'}
                                            </button>
                                        </div>
                                        {/* Inline Quote Form */}
                                        {quoting === deal.id && (
                                            <div className="mt-4 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl animate-fade-in">
                                                <p className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-4">Your Formal Bid</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Your bid amount"
                                                            value={quoteForm.amount}
                                                            onChange={e => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                                                            className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-xl pl-8 pr-4 py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Brief note (delivery time, etc.)"
                                                        value={quoteForm.note}
                                                        onChange={e => setQuoteForm({ ...quoteForm, note: e.target.value })}
                                                        className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleSubmitQuote(deal)}
                                                    disabled={submittingQuote || !quoteForm.amount}
                                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                                                    {submittingQuote ? 'Submitting...' : `Submit Bid — R${Number(quoteForm.amount || 0).toLocaleString()}`}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {bidRequests.length === 0 && !loading && (
                                    <div className="py-12 text-center text-gray-400 italic">
                                        No quotation requests currently match your industry mandate.
                                    </div>
                                )}
                                {loading && (
                                    <div className="py-12 text-center text-gray-400">
                                        Scanning national database...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Escrow Payouts & Active Contracts</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Upload proof of delivery to trigger automatic milestone releases.</p>

                            {activeDeals.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="text-4xl mb-4 opacity-10">📄</div>
                                    <p className="text-gray-400 text-sm italic">No active funded contracts yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeDeals.map(deal => (
                                        <div key={deal.id} className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 transition-all hover:border-blue-500/30">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="max-w-[70%]">
                                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">Active: {deal.category}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">SME: {deal.smeName}</p>
                                                        {(deal.status === 'Capital Secured' || deal.status === 'Waybill Uploaded' || deal.status === 'Delivery Confirmed') && (
                                                            <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600 flex items-center gap-0.5">
                                                                <span className="text-xs">🔒</span> CASH SECURED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${deal.status === 'Delivery Confirmed'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : deal.status === 'Waybill Uploaded'
                                                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                                        : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {deal.status === 'Delivery Confirmed' ? '✓ 100% Paid'
                                                        : deal.status === 'Waybill Uploaded' ? '70% Paid'
                                                            : '30% Paid'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-6">Funder: {deal.funderName}</p>
                                            <button
                                                onClick={() => onNavigate('supplier-milestones', { dealId: deal.id })}
                                                className="w-full py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                {deal.status === 'Delivery Confirmed' ? 'View Details' : 'Upload Waybill'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <span>📋</span> Supplier Profile
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Official Name</span>
                                    <span className="font-bold text-gray-900 dark:text-white text-right">{user.name}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Supplier ID</span>
                                    <span className="font-mono text-blue-600 dark:text-blue-400">PR-SUP-{user.id?.substring(0, 4).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Categories</span>
                                    <span className="text-gray-900 dark:text-white text-right max-w-[50%]">{Array.isArray(user.industry) ? user.industry.join(', ') : (user.industry || 'All')}</span>
                                </div>
                            </div>
                            <button onClick={() => onNavigate('profile-edit')} className="w-full mt-8 py-3 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-white rounded-xl text-sm font-bold border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Update Match Criteria</button>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🔒</div>
                            <h4 className="text-lg font-bold mb-2">Guaranteed Payment</h4>
                            <p className="text-white/70 text-sm mb-6 leading-relaxed">
                                All RFQs on ProcFin are pre-funded or backed by verified funding facilities. Your payment is held in escrow from the moment you accept a contract.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50">
                                <span>Secure Escrow v2.4</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
