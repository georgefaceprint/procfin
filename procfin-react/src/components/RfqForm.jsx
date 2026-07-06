import React, { useState, useEffect, useRef } from 'react';
import { db, storage, functions } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { CATEGORIES } from '../constants/categories';
import { useToast } from './Toast';
import { doc, getDoc } from 'firebase/firestore';

import { Sparkles, Search, Building2, Calendar, Clock, ArrowRight, Bot, Loader2 } from 'lucide-react';

const TenderCard = React.memo(({ t, onSelect, onNavigate }) => {
    const daysLeft = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return (
        <div
            onClick={() => onSelect(t)}
            className="bg-[#121318] border border-gray-800/80 rounded-3xl p-6 hover:border-cyan-700/40 hover:bg-[#141820] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer group"
        >
            <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-black rounded-full border border-cyan-500/20">{t.category}</span>
                    {daysLeft > 0 ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <Clock size={10} /> {daysLeft} days left
                        </span>
                    ) : (
                        <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">Closed</span>
                    )}
                </div>
                <h4 className="font-black text-white text-base leading-snug">{t.title}</h4>
                <p className="text-xs text-gray-400 flex items-center gap-1.5"><Building2 size={11} className="text-cyan-500" />{t.procuringEntity}</p>
                
                <div className="flex gap-5 pt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Calendar size={11} /> Closing: {new Date(t.endDate).toLocaleDateString()}</span>
                    {t.amount > 0 && <span className="text-emerald-400 font-black">Value: R{t.amount.toLocaleString()}</span>}
                </div>
            </div>

            <div className="flex flex-col gap-2 items-start md:items-end flex-shrink-0">
                <button
                    onClick={e => { e.stopPropagation(); onNavigate('funding-request', {
                        clientName: t.procuringEntity,
                        category: t.category,
                        description: `Tender Bid Preparation: ${t.title}`
                    }); }}
                    className="w-full md:w-auto px-5 py-3.5 bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-black rounded-xl shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                >
                    PO Financing <ArrowRight size={13} />
                </button>
                <span className="text-[10px] text-gray-600 font-medium group-hover:text-gray-400 transition-colors">Click to view details →</span>
            </div>
        </div>
    );
});

export default function RfqForm({ user, rfqCount, onBack, onNavigate }) {
    const planName = user.plan || 'Free';
    const [paywalls, setPaywalls] = useState({ smeFreeRfqLimit: 3, smeProRfqLimit: 10 });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Tab state: 'gov' (Gov Tenders) or 'local' (Request Quote)
    const [tab, setTab] = useState('gov');
    const [tenders, setTenders] = useState([]);
    const [tenderSearch, setTenderSearch] = useState('');
    const [loadingTenders, setLoadingTenders] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateRange, setDateRange] = useState(30); // days
    const [showOpenOnly, setShowOpenOnly] = useState(false);
    const [selectedTender, setSelectedTender] = useState(null);
    
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const snap = await getDoc(doc(db, "settings", "paywalls"));
                if (snap.exists()) {
                    setPaywalls({
                        smeFreeRfqLimit: snap.data().smeFreeRfqLimit || 3,
                        smeProRfqLimit: snap.data().smeProRfqLimit || 10
                    });
                }
            } catch (e) {}
        };
        fetchSettings();
    }, []);

    // Listen to tenders in Firestore
    useEffect(() => {
        setLoadingTenders(true);
        const q = query(collection(db, 'tenders'), orderBy('endDate', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setTenders(list);
            setLoadingTenders(false);
        }, (err) => {
            console.error("Error reading tenders:", err);
            setLoadingTenders(false);
        });
        return () => unsubscribe();
    }, []);

    // Sync tenders from OCDS API via Cloud Function
    const handleSyncTenders = async () => {
        setLoadingTenders(true);
        try {
            const res = await fetch('https://synctenders-yswbgz5kpa-uc.a.run.app');
            const data = await res.json();
            if (data.success) {
                toast.success('Successfully synced latest tenders from National Treasury!');
            } else {
                toast.error('Sync completed with issues.');
            }
        } catch (e) {
            console.error("Sync error:", e);
            toast.error('Failed to contact National Treasury API.');
        } finally {
            setLoadingTenders(false);
        }
    };

    let currentLimit = paywalls.smeFreeRfqLimit;
    let tierName = "Free";
    if (planName === 'SME Pro Plan') {
        currentLimit = paywalls.smeProRfqLimit;
        tierName = "Pro";
    } else if (planName === 'SME Enterprise') {
        currentLimit = Infinity;
        tierName = "Enterprise";
    }

    const isLimitReached = rfqCount >= currentLimit;

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        specs: '',
        location: '',
        file: null,
        isVip: false
    });

    const handleAIFill = async () => {
        if (!formData.file) {
            toast.error("Please select a document first.");
            return;
        }
        setLoading(true);
        toast.info("Scanning document with AI...");
        try {
            const storageRef = ref(storage, `temp_rfq_docs/${user.id}_${Date.now()}_${formData.file.name}`);
            const snapshot = await uploadBytes(storageRef, formData.file);
            const fileUrl = await getDownloadURL(snapshot.ref);

            const parsePurchaseOrder = httpsCallable(functions, 'parsePurchaseOrder');
            const result = await parsePurchaseOrder({ fileUrl });
            
            if (result.data.success) {
                setFormData(prev => ({
                    ...prev,
                    title: result.data.data.title || prev.title,
                    category: result.data.data.category || prev.category,
                    specs: result.data.data.specs || prev.specs
                }));
                toast.success("Form auto-filled successfully!");
            }
        } catch (e) {
            console.error("AI Scan Error:", e);
            toast.error("AI could not read this document.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isLimitReached) {
            if (onNavigate) {
                onNavigate('subscription');
            } else {
                toast.error(`Limit reached (${currentLimit} RFQs). Upgrade your plan.`);
            }
            return;
        }
        setLoading(true);

        try {
            let fileUrl = null;
            if (formData.file) {
                const storageRef = ref(storage, `rfq_docs/${user.id}_${Date.now()}_${formData.file.name}`);
                const snapshot = await uploadBytes(storageRef, formData.file);
                fileUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, "rfqs"), {
                smeId: user.id,
                smeName: user.name,
                smeTier: planName,
                title: formData.title,
                category: formData.category,
                specs: formData.specs,
                location: formData.location,
                docUrl: fileUrl,
                status: "Bidding Open",
                isVip: formData.isVip,
                createdAt: new Date().toISOString(),
            });

            toast.success('Quotation request securely broadcasted to verified suppliers!');
            onBack();
        } catch (error) {
            console.error("Error submitting RFQ:", error);
            toast.error('Failed to broadcast RFQ. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter tenders
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);

    const filteredTenders = tenders.filter(t => {
        const q = tenderSearch.toLowerCase();
        const matchesSearch = (
            (t.title || '').toLowerCase().includes(q) ||
            (t.procuringEntity || '').toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
        const matchesCategory = !categoryFilter || (t.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
        const publishedDate = t.startDate ? new Date(t.startDate) : new Date(t.createdAt);
        const matchesDate = publishedDate >= cutoffDate;
        const daysLeft = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        const matchesStatus = !showOpenOnly || daysLeft > 0;
        return matchesSearch && matchesCategory && matchesDate && matchesStatus;
    });

    const uniqueCategories = [...new Set(tenders.map(t => t.category).filter(Boolean))].sort();

    return (
        <div className="max-w-2xl mx-auto py-10 animate-fade-in px-4">
            <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                ← Back to Dashboard
            </button>

            <div className="mb-8">
                <h2 className="text-3xl font-black text-white">Tenders & RFQs</h2>
                <p className="text-gray-500 mt-2 leading-relaxed text-sm">
                    Browse active government tender opportunities or broadcast your own request to find local suppliers.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-[#121318] p-1.5 rounded-2xl border border-gray-800/80 mb-8">
                <button
                    onClick={() => setTab('gov')}
                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${tab === 'gov' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:text-white'}`}
                >
                    🏛️ Gov Opportunities ({filteredTenders.length})
                </button>
                <button
                    onClick={() => setTab('local')}
                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${tab === 'local' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:text-white'}`}
                >
                    📢 Broadcast RFQ
                </button>
            </div>

            {/* Tab 1: Gov Tenders */}
            {tab === 'gov' && (
                <div className="space-y-4">
                    {/* Search bar + sync */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by department, category, reference..."
                                value={tenderSearch}
                                onChange={e => setTenderSearch(e.target.value)}
                                className="w-full bg-[#121318]/60 border border-gray-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
                            />
                        </div>
                        <button
                            onClick={handleSyncTenders}
                            disabled={loadingTenders}
                            className="px-5 py-3 bg-[#121318] border border-gray-800 hover:border-cyan-500/30 text-xs font-black rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {loadingTenders ? '⏳ Syncing...' : '🔄 Sync'}
                        </button>
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="flex-1 min-w-[160px] bg-[#121318] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-cyan-500/50"
                        >
                            <option value="">All Categories</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={dateRange}
                            onChange={e => setDateRange(Number(e.target.value))}
                            className="bg-[#121318] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-cyan-500/50"
                        >
                            <option value={30}>Last 30 Days</option>
                            <option value={60}>Last 60 Days</option>
                            <option value={90}>Last 90 Days</option>
                            <option value={365}>All Tenders</option>
                        </select>
                        <button
                            onClick={() => setShowOpenOnly(v => !v)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
                                showOpenOnly
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                    : 'bg-[#121318] border-gray-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            {showOpenOnly ? '✅ Open Only' : '🔵 All Status'}
                        </button>
                        {(categoryFilter || showOpenOnly || dateRange !== 30) && (
                            <button
                                onClick={() => { setCategoryFilter(''); setShowOpenOnly(false); setDateRange(30); }}
                                className="px-4 py-2.5 rounded-xl text-xs font-black border border-red-800/40 text-red-400 hover:bg-red-900/20 transition-all"
                            >
                                ✕ Clear Filters
                            </button>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium">{filteredTenders.length} tender{filteredTenders.length !== 1 ? 's' : ''} found</p>

                    {loadingTenders && tenders.length === 0 ? (
                        <div className="py-20 text-center text-gray-500">Connecting to eTenders database...</div>
                    ) : filteredTenders.length === 0 ? (
                        <div className="py-16 text-center bg-[#121318] rounded-3xl border border-gray-800">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-gray-500 text-sm">No matching government tenders found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-900 border border-gray-700 rounded-2xl flex gap-3 items-start">
                                <span className="text-cyan-400 text-base flex-shrink-0">💡</span>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    <span className="text-white font-bold">Value Added Service:</span> These are live public sector tender advertisements from National Treasury. Browse bidding opportunities — when you win, request <span className="text-cyan-400 font-bold">Purchase Order Financing</span> to cover supplier costs!
                                </p>
                            </div>
                            
                            {filteredTenders.map(t => (
                                <TenderCard
                                    key={t.id}
                                    t={t}
                                    onSelect={setSelectedTender}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Tender Detail Drawer ── */}
            {selectedTender && (() => {
                const t = selectedTender;
                const daysLeft = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                const ocid = t.id || '';
                const etendersUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases?ocid=${encodeURIComponent(ocid)}`;
                return (
                    <div
                        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                        onClick={() => setSelectedTender(null)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                        {/* Panel */}
                        <div
                            onClick={e => e.stopPropagation()}
                            className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0d0f14] border border-gray-800 rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-[#0d0f14] border-b border-gray-800/60 px-7 py-5 flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-black rounded-full border border-cyan-500/20">{t.category}</span>
                                        {daysLeft > 0 ? (
                                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                <Clock size={10} /> {daysLeft} days left
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">Closed</span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-black text-white leading-snug">{t.title}</h3>
                                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5"><Building2 size={12} className="text-cyan-500" />{t.procuringEntity}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTender(null)}
                                    className="text-gray-500 hover:text-white transition-colors text-xl font-bold flex-shrink-0"
                                >✕</button>
                            </div>

                            {/* Body */}
                            <div className="px-7 py-6 space-y-6">

                                {/* Description */}
                                <div>
                                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Description</p>
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{t.description || 'No description available.'}</p>
                                </div>

                                {/* Key Dates & Value */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Published</p>
                                        <p className="text-sm text-white font-bold">{new Date(t.startDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Closing Date</p>
                                        <p className={`text-sm font-bold ${daysLeft > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {new Date(t.endDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    {t.amount > 0 && (
                                        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 col-span-2 md:col-span-1">
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Contract Value</p>
                                            <p className="text-sm text-emerald-400 font-black">{t.currency} {t.amount.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Person */}
                                <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-3">Procurement Contact</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">👤</span>
                                            <span className="text-sm text-white font-bold">{t.contactPerson?.name || 'Procurement Officer'}</span>
                                        </div>
                                        {t.contactPerson?.email && t.contactPerson.email !== 'tenders@etenders.gov.za' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">✉️</span>
                                                <a href={`mailto:${t.contactPerson.email}`} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">{t.contactPerson.email}</a>
                                            </div>
                                        )}
                                        {t.contactPerson?.phone && t.contactPerson.phone !== 'N/A' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">📞</span>
                                                <a href={`tel:${t.contactPerson.phone}`} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">{t.contactPerson.phone}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                    <button
                                        onClick={() => { onNavigate('funding-request', {
                                            clientName: t.procuringEntity,
                                            category: t.category,
                                            description: `Tender Bid Preparation: ${t.title}`
                                        }); setSelectedTender(null); }}
                                        className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-black rounded-2xl shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition-all"
                                    >
                                        💰 Request PO Financing <ArrowRight size={15} />
                                    </button>
                                    <a
                                        href="https://www.etenders.gov.za/content/advertised-tenders"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-black rounded-2xl border border-gray-700 flex items-center justify-center gap-2 transition-all"
                                    >
                                        🔗 View on eTenders
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Tab 2: Local RFQ Form */}
            {tab === 'local' && (
                <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What do you need?</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 50 Dell Laptops, or 20 Tons Cement"
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Supplier Category</label>
                            <select
                                required
                                value={formData.category}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select Category...</option>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Detailed Specifications</label>
                            <textarea
                                required
                                rows="4"
                                value={formData.specs}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Mention specific grades, delivery timelines, etc."
                                onChange={e => setFormData({ ...formData, specs: e.target.value })}
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Delivery Location</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="City/Province"
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Reference Document (Optional)</label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="file"
                                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                />
                                {formData.file && (
                                    <button
                                        type="button"
                                        onClick={handleAIFill}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all"
                                    >
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />} AI Auto-Fill
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-4 items-start cursor-pointer hover:bg-amber-500/20 transition-colors" onClick={() => setFormData({ ...formData, isVip: !formData.isVip })}>
                            <div className="pt-1">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isVip} 
                                    onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                                    className="w-5 h-5 rounded border-amber-500 text-amber-600 focus:ring-amber-500 bg-white"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                            <div>
                                <p className="font-bold text-amber-900 dark:text-amber-500 flex items-center gap-1.5"><Sparkles size={16} /> Mark as VIP / Urgent (R299)</p>
                                <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-1">Blasts your RFQ to all suppliers instantly via SMS and pins it to the top of the bid board to guarantee immediate quotes.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isLimitReached ? 'bg-indigo-600 text-white' : (formData.isVip ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/30' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900')}`}
                        >
                            {loading ? 'Processing...' : isLimitReached ? `💎 Upgrade Tier (Limit of ${currentLimit} reached)` : (formData.isVip ? 'Pay R299 & Broadcast VIP RFQ' : 'Broadcast Request')}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
