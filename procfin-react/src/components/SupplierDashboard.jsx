import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { useToast } from './Toast';
import SupplierCatalog from './SupplierCatalog';
import SupplierAnalytics from './SupplierAnalytics';
import SupplierStorefrontBuilder from './SupplierStorefrontBuilder';
import SupplierBranding from './SupplierBranding';
import ChatModule from './ChatModule';
import { MessageCircle } from 'lucide-react';
import { calculateSupplierScore } from '../utils/SupplierReadinessScore';

export default function SupplierDashboard({ user, onNavigate, onUpdateUser }) {
    const [bidRequests, setBidRequests] = useState([]);
    const [myQuotes, setMyQuotes] = useState([]);
    const [activeDeals, setActiveDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quoting, setQuoting] = useState(null);
    const [quoteForm, setQuoteForm] = useState({ amount: '', deliveryDays: '', note: '', canDeliver: false });
    const [submittingQuote, setSubmittingQuote] = useState(false);
    const [activeTab, setActiveTab] = useState('analytics');
    const [activeChat, setActiveChat] = useState(null);
    const toast = useToast();

    const [supplierDocs, setSupplierDocs] = useState({});
    const [scoreCard, setScoreCard] = useState({ score: 0, grade: 'E', tier: 'Silver', checks: {} });
    const [addingReference, setAddingReference] = useState('');

    const [paywalls, setPaywalls] = useState({
        supplierFreeQuoteLimit: 7,
        supplierMaxQuoteValue: 25000,
        goldQuoteLimit: 25,
        diamondQuoteLimit: 50
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const snap = await getDoc(doc(db, "settings", "paywalls"));
                if (snap.exists()) {
                    setPaywalls({
                        supplierFreeQuoteLimit: snap.data().supplierFreeQuoteLimit || 7,
                        supplierMaxQuoteValue: snap.data().supplierMaxQuoteValue || 25000,
                        goldQuoteLimit: snap.data().goldQuoteLimit || 25,
                        diamondQuoteLimit: snap.data().diamondQuoteLimit || 50
                    });
                }
            } catch (e) {}
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!user.id) return;

        // Matching Logic: Fetch all Bidding Open RFQs and filter by Supplier category
        const qBidRequests = query(collection(db, "rfqs"), where("status", "==", "Bidding Open"));
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

        // Listen for all RFQs to track "My Quotes"
        const supplierId = user.uid || user.id;
        const qAllRfqs = query(collection(db, "rfqs"));
        const unsubAllRfqs = onSnapshot(qAllRfqs, (snapshot) => {
            const allRfqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyQuotes(allRfqs.filter(rfq => rfq.quotes && rfq.quotes.some(q => q.supplierId === supplierId)));
        });

        // Listen for active deals — query by supplierId (UID-based, reliable)
        // Fallback: also match by supplierName for legacy deals that predate the supplierId fix
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
            unsubAllRfqs();
            unsubDeals();
        };
    }, [user.id, user.industry, user.name]);

    useEffect(() => {
        if (!user.id) return;
        const qDocs = query(collection(db, "user_documents"), where("uid", "==", user.id));
        return onSnapshot(qDocs, (snap) => {
            const docsMap = {};
            snap.docs.forEach(d => {
                const data = d.data();
                if (data.docTypeId) {
                    docsMap[data.docTypeId] = data;
                }
            });
            setSupplierDocs(docsMap);
        });
    }, [user.id]);

    useEffect(() => {
        const card = calculateSupplierScore(user, supplierDocs);
        setScoreCard(card);
    }, [user, supplierDocs]);

    useEffect(() => {
        if (!user.id || !scoreCard.grade) return;
        if (user.readinessScore !== scoreCard.score || user.readinessGrade !== scoreCard.grade || user.trustBadge !== scoreCard.tier) {
            updateDoc(doc(db, "users", user.id), {
                readinessScore: scoreCard.score,
                readinessGrade: scoreCard.grade,
                trustBadge: scoreCard.tier
            }).catch(e => console.error("Error updating user score:", e));
        }
    }, [user.id, scoreCard, user.readinessScore, user.readinessGrade, user.trustBadge]);

    const handleToggleBusinessModel = async (model) => {
        try {
            await updateDoc(doc(db, "users", user.id), {
                businessModel: model
            });
            toast.success(`Business model updated to ${model}`);
        } catch (e) {
            toast.error("Failed to update business model.");
        }
    };

    const handleAddReference = async () => {
        if (!addingReference.trim()) return;
        try {
            const currentRefs = Array.isArray(user.tradeReferences) ? user.tradeReferences : [];
            if (currentRefs.includes(addingReference.trim())) {
                toast.warning("Reference already added.");
                return;
            }
            const updatedRefs = [...currentRefs, addingReference.trim()];
            await updateDoc(doc(db, "users", user.id), {
                tradeReferences: updatedRefs,
                tradeReferencesCount: updatedRefs.length
            });
            setAddingReference('');
            toast.success("Trade reference added successfully!");
        } catch (e) {
            toast.error("Failed to add trade reference.");
        }
    };

    const handleRemoveReference = async (refToRemove) => {
        try {
            const currentRefs = Array.isArray(user.tradeReferences) ? user.tradeReferences : [];
            const updatedRefs = currentRefs.filter(r => r !== refToRemove);
            await updateDoc(doc(db, "users", user.id), {
                tradeReferences: updatedRefs,
                tradeReferencesCount: updatedRefs.length
            });
            toast.success("Trade reference removed.");
        } catch (e) {
            toast.error("Failed to remove trade reference.");
        }
    };

    const handleSubmitQuote = async (deal) => {
        if (!quoteForm.amount || isNaN(Number(quoteForm.amount))) {
            toast.warning('Please enter a valid bid amount.');
            return;
        }
        setSubmittingQuote(true);
        try {
            const supplierId_ = user.uid || user.id;
            const rfqRef = doc(db, 'rfqs', deal.id);
            const bidAmount = Number(quoteForm.amount);

            // Guard: prevent double bidding
            const existingSnap = await getDoc(rfqRef);
            const existingQuotes = existingSnap.data()?.quotes || [];
            if (existingQuotes.some(q => q.supplierId === supplierId_)) {
                toast.warning('You have already submitted a bid on this tender.');
                setSubmittingQuote(false);
                return;
            }

            const newQuote = {
                supplierId: supplierId_,
                supplierName: user.name,
                isGold: user.subscribed || user.promoted || false,
                supplierVerified: user.subscribed || false,
                supplierPlatinum: user.promoted || false,
                amount: bidAmount,
                deliveryDays: Number(quoteForm.deliveryDays) || null,
                note: quoteForm.note,
                submittedAt: new Date().toISOString(),
            };

            const updates = { quotes: arrayUnion(newQuote) };

            if (bidAmount < (deal.winningBidAmount || Infinity)) {
                updates.winningBidAmount = bidAmount;
            }

            await updateDoc(rfqRef, updates);

            // Notify SME that a quote was received
            try {
                const { setDoc } = await import('firebase/firestore');
                const notifRef = doc(db, 'user_notifications', deal.smeId);
                const notifSnap = await getDoc(notifRef);
                const existing = notifSnap.exists() ? (notifSnap.data().data || []) : [];
                existing.unshift({
                    id: Date.now(),
                    text: `📢 New bid received on tender ${deal.id.substring(0,8).toUpperCase()}: R${bidAmount.toLocaleString()} — ${quoteForm.deliveryDays ? quoteForm.deliveryDays + ' day delivery' : ''}`,
                    read: false,
                    timestamp: Date.now()
                });
                await setDoc(notifRef, { data: existing }, { merge: true });
            } catch (_) {}

            setQuoting(null);
            setQuoteForm({ amount: '', deliveryDays: '', note: '', canDeliver: false });
            toast.success('Bid submitted! ProcFin will notify you if you win.');
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

            <div className="space-y-6">
                    {/* Procurement Readiness Scorecard */}
                    <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-8 shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                            
                            {/* SVG Gauge & Tier Badge */}
                            <div className="flex flex-col items-center justify-center text-center bg-gray-900/40 p-6 rounded-2xl border border-gray-800/50">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        {/* Background Circle */}
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="50"
                                            className="stroke-gray-800"
                                            strokeWidth="8"
                                            fill="transparent"
                                        />
                                        {/* Foreground Circle */}
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="50"
                                            className={`transition-all duration-1000 ease-out ${
                                                scoreCard.tier === 'Platinum' ? 'stroke-cyan-500' :
                                                scoreCard.tier === 'Gold' ? 'stroke-emerald-500' : 'stroke-amber-500'
                                            }`}
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 50}
                                            strokeDashoffset={(2 * Math.PI * 50) - (scoreCard.score / 100) * (2 * Math.PI * 50)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-3xl font-black text-white font-mono">{scoreCard.grade}</span>
                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{scoreCard.score}% PRS</span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg border ${
                                        scoreCard.tier === 'Platinum' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                        scoreCard.tier === 'Gold' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                        ⭐ {scoreCard.tier} Tier Supplier
                                    </span>
                                </div>
                            </div>

                            {/* Verification Metrics Checklist */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Procurement Readiness Scorecard</h3>
                                        <p className="text-xs text-gray-500">Calculate eligibility for commercial & state contracts.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleBusinessModel('Government / Public Sector')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                !scoreCard.isPrivate ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' : 'bg-transparent text-gray-400 border-gray-800'
                                            }`}
                                        >
                                            🏛️ Government Vendor (CSD)
                                        </button>
                                        <button
                                            onClick={() => handleToggleBusinessModel('Private B2B / Corporate')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                scoreCard.isPrivate ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' : 'bg-transparent text-gray-400 border-gray-800'
                                            }`}
                                        >
                                            💼 Private Corporate
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    {/* CSD or references */}
                                    {scoreCard.isPrivate ? (
                                        <div className="flex items-center justify-between bg-gray-900/20 border border-gray-800/40 px-4 py-2.5 rounded-xl">
                                            <span className="text-gray-400">🤝 Trade References (2 min)</span>
                                            <span className={scoreCard.checks.references ? 'text-emerald-400 font-bold' : 'text-gray-500 font-bold'}>
                                                {scoreCard.checks.references ? '✓ ' : ''}{user.tradeReferencesCount || 0}/2
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-gray-900/20 border border-gray-800/40 px-4 py-2.5 rounded-xl">
                                            <span className="text-gray-400">🏛️ CSD Registered (+20)</span>
                                            <span className={scoreCard.checks.csd ? 'text-emerald-400 font-bold' : 'text-gray-500 font-bold'}>
                                                {scoreCard.checks.csd ? '✓ Active' : 'Missing'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Tax PIN */}
                                    <div className="flex items-center justify-between bg-gray-900/20 border border-gray-800/40 px-4 py-2.5 rounded-xl">
                                        <span className="text-gray-400">💸 Tax Clearance Status (+20)</span>
                                        <span className={scoreCard.checks.tax ? 'text-emerald-400 font-bold' : 'text-gray-500 font-bold'}>
                                            {scoreCard.checks.tax ? '✓ Compliant' : 'Missing'}
                                        </span>
                                    </div>

                                    {/* CIPC */}
                                    <div className="flex items-center justify-between bg-gray-900/20 border border-gray-800/40 px-4 py-2.5 rounded-xl">
                                        <span className="text-gray-400">🏢 CIPC Registered (+15)</span>
                                        <span className={scoreCard.checks.cipc ? 'text-emerald-400 font-bold' : 'text-gray-500 font-bold'}>
                                            {scoreCard.checks.cipc ? '✓ Active' : 'Missing'}
                                        </span>
                                    </div>

                                    {/* Bank Confirm */}
                                    <div className="flex items-center justify-between bg-gray-900/20 border border-gray-800/40 px-4 py-2.5 rounded-xl">
                                        <span className="text-gray-400">🏦 Bank Confirmation (+15)</span>
                                        <span className={scoreCard.checks.bank ? 'text-emerald-400 font-bold' : 'text-gray-500 font-bold'}>
                                            {scoreCard.checks.bank ? '✓ Uploaded' : 'Missing'}
                                        </span>
                                    </div>

                                    {/* BEE */}
                                    <div className="flex items-center justify-between bg-gray-900/20 border border-gray-800/40 px-4 py-2.5 rounded-xl">
                                        <span className="text-gray-400">⭐ B-BBEE Certificate (+10)</span>
                                        <span className={scoreCard.checks.bee ? 'text-emerald-400 font-bold' : 'text-gray-500 font-bold'}>
                                            {scoreCard.checks.bee ? '✓ Uploaded' : 'Missing'}
                                        </span>
                                    </div>

                                    {/* Catalog count */}
                                    <div className="flex items-center justify-between bg-gray-900/20 border border-gray-800/40 px-4 py-2.5 rounded-xl">
                                        <span className="text-gray-400">🏪 Active Storefront (+10)</span>
                                        <span className={scoreCard.checks.catalog ? 'text-emerald-400 font-bold' : 'text-gray-500 font-bold'}>
                                            {scoreCard.checks.catalog ? '✓ Live' : `${Number(user.catalogCount) || 0}/3 Products`}
                                        </span>
                                    </div>
                                </div>

                                {/* Private Trade Reference Manager */}
                                {scoreCard.isPrivate && (
                                    <div className="bg-purple-950/10 border border-purple-500/20 p-4 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Manage Corporate Trade References</h4>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={addingReference}
                                                onChange={e => setAddingReference(e.target.value)}
                                                className="flex-1 bg-[#121318] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500"
                                                placeholder="e.g. Acme Mining Ltd"
                                            />
                                            <button
                                                onClick={handleAddReference}
                                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                        {Array.isArray(user.tradeReferences) && user.tradeReferences.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {user.tradeReferences.map((ref, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-800 text-gray-200 rounded-lg border border-gray-700">
                                                        {ref}
                                                        <button onClick={() => handleRemoveReference(ref)} className="text-red-400 hover:text-red-300 font-bold ml-1">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Metrics Top Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-700"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Total Quotes Sent</p>
                            <p className="text-4xl font-black text-white font-mono relative z-10">{myQuotes.length}</p>
                        </div>
                        <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Quotes Won</p>
                            <p className="text-4xl font-black text-emerald-400 font-mono relative z-10">
                                {myQuotes.filter(q => q.status === 'Closed (Quote Accepted)' && q.acceptedQuote?.supplierId === (user.uid || user.id)).length}
                            </p>
                        </div>
                        <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-700"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Active Contracts</p>
                            <p className="text-4xl font-black text-purple-400 font-mono relative z-10">{activeDeals.length}</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-800/60 overflow-x-auto whitespace-nowrap mb-6">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'analytics' ? 'border-cyan-500 text-cyan-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            📊 Analytics & Leads
                        </button>
                        <button
                            onClick={() => setActiveTab('bids')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'bids' ? 'border-cyan-500 text-cyan-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            🎯 Active Bid Board
                        </button>
                        <button
                            onClick={() => setActiveTab('myquotes')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'myquotes' ? 'border-emerald-500 text-emerald-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            📋 My Quotes & Contracts
                        </button>
                        <button
                            onClick={() => setActiveTab('storefront')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'storefront' ? 'border-purple-500 text-purple-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            🏪 My Storefront
                        </button>
                        <button
                            onClick={() => setActiveTab('branding')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'branding' ? 'border-blue-500 text-blue-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            🎨 Branding & Invoice
                        </button>
                    </div>

                    {activeTab === 'analytics' ? (
                        <SupplierAnalytics user={user} myQuotes={myQuotes} activeDeals={activeDeals} bidRequests={bidRequests} />
                    ) : activeTab === 'storefront' ? (
                        <SupplierStorefrontBuilder user={user} onUpdateUser={onUpdateUser} />
                    ) : activeTab === 'branding' ? (
                        <SupplierBranding user={user} onUpdateUser={onUpdateUser} />
                    ) : activeTab === 'catalog' ? (
                        <SupplierCatalog user={user} onUpdateUser={onUpdateUser} onNavigate={onNavigate} />
                    ) : activeTab === 'myquotes' ? (
                        <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">My Quotes & Contracts</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Track the status of all your submitted quotes.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {myQuotes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 font-bold mb-2">You haven't submitted any quotes yet.</p>
                                        <p className="text-sm text-gray-600">Head over to the Active Bid Board to find opportunities!</p>
                                    </div>
                                ) : (
                                    myQuotes.map(rfq => {
                                        const myQuote = rfq.quotes?.find(q => q.supplierId === (user.uid || user.id));
                                        const isWon = rfq.status === 'Closed (Quote Accepted)' && rfq.acceptedQuote?.supplierId === (user.uid || user.id);
                                        const isLost = rfq.status === 'Closed (Quote Accepted)' && !isWon;
                                        
                                        let statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                        let statusText = "Pending Review";
                                        
                                        if (isWon) {
                                            statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                            statusText = "Won - Active Contract";
                                        } else if (isLost) {
                                            statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
                                            statusText = "Rejected (Lost Bid)";
                                        }

                                        return (
                                            <div key={rfq.id} className="bg-[#1a1c23]/60 border border-gray-800/60 p-5 rounded-2xl flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-lg ${statusColor}`}>
                                                            {statusText}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">{new Date(myQuote?.submittedAt || rfq.createdAt).toLocaleDateString('en-ZA')}</span>
                                                    </div>
                                                    <h4 className="text-base font-bold text-white mt-2">{rfq.title}</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <p className="text-xs text-gray-500">Category: {rfq.category}</p>
                                                        <button
                                                            onClick={() => setActiveChat({
                                                                contextId: rfq.id,
                                                                contextType: 'RFQ',
                                                                contextTitle: rfq.title,
                                                                recipientId: rfq.smeId,
                                                                recipientName: rfq.smeName || 'SME'
                                                            })}
                                                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                                                        >
                                                            <MessageCircle size={14} /> Message Client
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Your Bid</p>
                                                    <p className="text-2xl font-black text-white font-mono">R{myQuote?.amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Bid Board</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Funding requests open for competitive bidding in your category.</p>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-800">Supplier Verified</span>
                                    </div>

                                    <div className="space-y-4">
                                        {bidRequests.map(deal => (
                                            <div key={deal.id} className="bg-[#121318] border border-gray-800/60 rounded-2xl p-6 hover:border-cyan-500/20 transition-all relative">
                                                {/* Header — NO client name, NO funding value shown to supplier */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1 max-w-[70%]">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">📢 Open Tender</span>
                                                            <span className="text-[10px] text-gray-600">{deal.quotes?.length || 0} quotes received</span>
                                                        </div>
                                                        <h4 className="text-base font-black text-white">Category: {deal.category}</h4>
                                                        <p className="text-xs text-gray-600 mt-0.5">Tender ID: {deal.id.substring(0, 8).toUpperCase()} · Opened {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('en-ZA') : '—'}</p>
                                                    </div>
                                                    {deal.quotes?.some(q => q.supplierId === (user.uid || user.id)) && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">✓ Bid Submitted</span>
                                                    )}
                                                </div>

                                                {/* De-priced specs — safe to show */}
                                                <div className="bg-[#1a1c23]/60 border border-gray-800/60 p-4 rounded-xl mb-5">
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Procurement Specifications</p>
                                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{deal.specs}</p>
                                                </div>

                                                {/* Current lowest bid — anonymous */}
                                                {deal.winningBidAmount && (
                                                    <div className="flex items-center gap-2 mb-4 text-xs">
                                                        <span className="text-gray-600">Current lowest bid:</span>
                                                        <span className="font-black text-cyan-400 font-mono">R{deal.winningBidAmount.toLocaleString()}</span>
                                                        <span className="text-gray-700">— beat this to lead</span>
                                                    </div>
                                                )}

                                                {/* Submit Bid button */}
                                                {!deal.quotes?.some(q => q.supplierId === (user.uid || user.id)) ? (
                                                    <div>
                                                        <button
                                                            onClick={() => {
                                                                setQuoting(quoting === deal.id ? null : deal.id);
                                                                setQuoteForm({ amount: '', deliveryDays: '', note: '', canDeliver: false });
                                                            }}
                                                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-black transition-all active:scale-95">
                                                            {quoting === deal.id ? 'Cancel' : '📤 Submit Your Bid'}
                                                        </button>

                                                        {quoting === deal.id && (
                                                            <div className="mt-4 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-4">
                                                                <p className="text-xs font-black uppercase tracking-widest text-cyan-400">Your Competitive Bid — Suppliers Quote Blind</p>
                                                                <p className="text-[10px] text-gray-600">⚠️ You cannot see the SME's contract value or client. ProcFin selects the lowest verified bid.</p>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Your Total Price (ZAR) *</label>
                                                                        <div className="relative">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R</span>
                                                                            <input type="number" placeholder="e.g. 280000"
                                                                                value={quoteForm.amount}
                                                                                onChange={e => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                                                                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 font-mono" />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Delivery (Days) *</label>
                                                                        <input type="number" placeholder="e.g. 14"
                                                                            value={quoteForm.deliveryDays}
                                                                            onChange={e => setQuoteForm({ ...quoteForm, deliveryDays: e.target.value })}
                                                                            className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 font-mono" />
                                                                    </div>
                                                                </div>
                                                                <input type="text" placeholder="Notes: brands, certifications, logistics detail..."
                                                                    value={quoteForm.note}
                                                                    onChange={e => setQuoteForm({ ...quoteForm, note: e.target.value })}
                                                                    className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                                                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                                    <input type="checkbox" checked={quoteForm.canDeliver}
                                                                        onChange={e => setQuoteForm({ ...quoteForm, canDeliver: e.target.checked })}
                                                                        className="accent-cyan-500" />
                                                                    <span className="text-xs text-gray-400">I confirm I can deliver the full specification on time</span>
                                                                </label>
                                                                
                                                                {(() => {
                                                                    const isFreeTier = !user.subscribed && !user.promoted;
                                                                    const quoteAmountNum = Number(quoteForm.amount || 0);
                                                                    const supplierBidCount = myQuotes.length;
                                                                    
                                                                    let quoteLimit = paywalls.supplierFreeQuoteLimit;
                                                                    let tierName = "Free";
                                                                    
                                                                    if (!isFreeTier) {
                                                                        if (user.plan === 'Diamond Supplier') {
                                                                            quoteLimit = paywalls.diamondQuoteLimit;
                                                                            tierName = "Diamond";
                                                                        } else if (user.plan === 'Platinum Supplier' || user.plan === 'Featured Partner (Monthly Platinum)') {
                                                                            quoteLimit = Infinity;
                                                                            tierName = "Platinum";
                                                                        } else {
                                                                            quoteLimit = paywalls.goldQuoteLimit; // Default to gold for any legacy paid plans
                                                                            tierName = "Gold";
                                                                        }
                                                                    }
                                                                    
                                                                    const limitValueHit = isFreeTier && quoteAmountNum > paywalls.supplierMaxQuoteValue;
                                                                    const limitCountHit = supplierBidCount >= quoteLimit;
                                                                    
                                                                    if (limitValueHit) {
                                                                        return (
                                                                            <button onClick={() => onNavigate('subscription')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-500/20">
                                                                                🛡️ Upgrade to Gold to quote over R{paywalls.supplierMaxQuoteValue.toLocaleString()}
                                                                            </button>
                                                                        );
                                                                    }
                                                                    if (limitCountHit) {
                                                                        return (
                                                                            <button onClick={() => onNavigate('subscription')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-500/20">
                                                                                💎 Upgrade Tier (Quote limit of {quoteLimit} reached for {tierName} Plan)
                                                                            </button>
                                                                        );
                                                                    }
                                                                    
                                                                    return (
                                                                        <button
                                                                            onClick={() => handleSubmitQuote(deal)}
                                                                            disabled={submittingQuote || !quoteForm.amount || !quoteForm.deliveryDays || !quoteForm.canDeliver}
                                                                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl font-black text-sm transition-all disabled:opacity-50">
                                                                            {submittingQuote ? 'Submitting...' : `📤 Submit Bid — R${quoteAmountNum.toLocaleString()}`}
                                                                        </button>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="py-3 text-center text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                                        ✓ Your bid is in. ProcFin will notify you of the outcome.
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
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Escrow Payouts &amp; Active Contracts</h3>
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

            {/* Chat Module */}
            {activeChat && (
                <ChatModule 
                    user={user}
                    contextId={activeChat.contextId}
                    contextType={activeChat.contextType}
                    contextTitle={activeChat.contextTitle}
                    recipientId={activeChat.recipientId}
                    recipientName={activeChat.recipientName}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
}

