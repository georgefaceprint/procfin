import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from './Toast';
import { CATEGORY_GROUPS } from '../constants/categories';
import {
    Search, Sparkles, MapPin, ChevronRight, ChevronLeft,
    Star, Building2, Package, Send, X, Layers, Plus, Minus,
    FileText, Award, ShieldCheck, Clock, Tag
} from 'lucide-react';

// Flatten CATEGORY_GROUPS into the format SmeSourcing needs: { id, icon, color, border, text }
const CATEGORIES = CATEGORY_GROUPS.map(g => ({
    id: g.group,
    icon: g.icon,
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    subItems: g.items,
}));


// ─── Badge Component ────────────────────────────────────────────────────────────
function TrustBadge({ badge, size = 'sm' }) {
    const base = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]';
    if (badge === 'Platinum') return (
        <span className={`${base} bg-gradient-to-r from-amber-500/15 to-yellow-500/10 text-amber-400 border border-amber-500/30 rounded-lg font-black uppercase tracking-widest flex items-center gap-1`}>
            💎 Platinum
        </span>
    );
    if (badge === 'Gold') return (
        <span className={`${base} bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg font-black uppercase tracking-widest flex items-center gap-1`}>
            🥇 Gold
        </span>
    );
    if (badge === 'Top Rated') return (
        <span className={`${base} bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg font-black uppercase tracking-widest flex items-center gap-1`}>
            ⭐ Top Rated
        </span>
    );
    return (
        <span className={`${base} bg-gray-800/80 text-gray-400 border border-gray-700/60 rounded-lg font-bold uppercase tracking-widest`}>
            🥈 Silver
        </span>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function SmeSourcing({ user, onBack, onNavigate }) {
    // Navigation state
    const [view, setView] = useState('categories'); // 'categories' | 'suppliers' | 'inventory' | 'search'
    const [globalSearch, setGlobalSearch] = useState(''); // global search across all categories
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Data
    const [suppliers, setSuppliers] = useState([]);       // all supplier profiles
    const [allProducts, setAllProducts] = useState([]);   // all catalog items
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Carousel for featured (Platinum) suppliers
    const [carouselIdx, setCarouselIdx] = useState(0);

    // RFQ state
    const [rfqItems, setRfqItems] = useState([]);    // [{ product, qty }]
    const [rfqNote, setRfqNote] = useState('');
    const [isRfqOpen, setIsRfqOpen] = useState(false);
    const [submittingRfq, setSubmittingRfq] = useState(false);

    // Search
    const [search, setSearch] = useState('');

    const toast = useToast();

    // ── Load all suppliers ────────────────────────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, 'users'), where('type', '==', 'SUPPLIER'));
        return onSnapshot(q, snap => {
            const data = snap.docs.map(d => {
                const s = { id: d.id, ...d.data() };
                let badge = 'Silver';
                if (s.promoted) badge = 'Platinum';
                else if (s.subscribed) badge = 'Gold';
                else if (s.rating >= 4.5) badge = 'Top Rated';
                return { ...s, trustBadge: badge };
            });
            setSuppliers(data);
            setLoadingSuppliers(false);
        });
    }, []);

    // ── Load all catalog items ─────────────────────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, 'catalog_items'), where('inStock', '==', true));
        return onSnapshot(q, snap => {
            setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadingProducts(false);
        });
    }, []);

    // ── Auto-rotate featured carousel ─────────────────────────────────────────
    const featuredSuppliers = suppliers.filter(s => s.promoted);
    useEffect(() => {
        if (featuredSuppliers.length <= 1) return;
        const iv = setInterval(() => setCarouselIdx(i => (i + 1) % featuredSuppliers.length), 5000);
        return () => clearInterval(iv);
    }, [featuredSuppliers.length]);

    // ── Derived data ───────────────────────────────────────────────────────────
    const suppliersInCategory = suppliers.filter(s => {
        const cats = [
            ...(Array.isArray(s.preferredCategories) ? s.preferredCategories : []),
            ...(Array.isArray(s.industry) ? s.industry : (s.industry ? [s.industry] : []))
        ];
        const group = CATEGORY_GROUPS.find(g => g.group === selectedCategory);
        const validGroupItems = group ? group.items : [];
        return cats.includes(selectedCategory) || cats.some(c => validGroupItems.includes(c));
    }).sort((a, b) => {
        const rank = { Platinum: 4, Gold: 3, 'Top Rated': 2, Silver: 1 };
        const rankDiff = (rank[b.trustBadge] || 1) - (rank[a.trustBadge] || 1);
        if (rankDiff !== 0) return rankDiff;
        // If badges are equal, sort by rating
        return (b.rating || 0) - (a.rating || 0);
    });

    // Products for selected supplier
    const supplierProducts = allProducts
        .filter(p => p.supplierId === selectedSupplier?.id)
        .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

    // Count products per category (for category cards)
    const productCountByCategory = {};
    allProducts.forEach(p => {
        const group = CATEGORY_GROUPS.find(g => g.items.includes(p.category) || g.group === p.category);
        if (group) {
            productCountByCategory[group.group] = (productCountByCategory[group.group] || 0) + 1;
        }
    });

    // Count suppliers per category
    const supplierCountByCategory = {};
    suppliers.forEach(s => {
        const cats = [
            ...(Array.isArray(s.preferredCategories) ? s.preferredCategories : []),
            ...(Array.isArray(s.industry) ? s.industry : (s.industry ? [s.industry] : []))
        ];

        const uniqueGroups = new Set();
        cats.forEach(c => {
            const group = CATEGORY_GROUPS.find(g => g.items.includes(c) || g.group === c);
            if (group) uniqueGroups.add(group.group);
        });

        uniqueGroups.forEach(g => {
            supplierCountByCategory[g] = (supplierCountByCategory[g] || 0) + 1;
        });
    });

    // ── RFQ Logic ──────────────────────────────────────────────────────────────
    const toggleRfqItem = (product) => {
        const exists = rfqItems.find(x => x.product.id === product.id);
        if (exists) {
            setRfqItems(rfqItems.filter(x => x.product.id !== product.id));
        } else {
            setRfqItems([...rfqItems, { product, qty: product.minOrderQty || 1 }]);
        }
    };

    const updateQty = (productId, delta) => {
        setRfqItems(rfqItems.map(x => {
            if (x.product.id !== productId) return x;
            const min = x.product.minOrderQty || 1;
            return { ...x, qty: Math.max(min, x.qty + delta) };
        }));
    };

    const isInRfq = (productId) => rfqItems.some(x => x.product.id === productId);

    const handleSubmitRfq = async () => {
        if (rfqItems.length === 0) { toast.warning('Select at least one product.'); return; }
        if (!selectedSupplier) return;
        setSubmittingRfq(true);
        try {
            const specs = rfqItems.map(x =>
                `• ${x.product.name} — Qty: ${x.qty} ${x.product.unit} (From R${x.product.price} / ${x.product.unit})`
            ).join('\n');

            const totalIndicative = rfqItems.reduce((sum, x) => sum + x.product.price * x.qty, 0);

            const rfqPayload = {
                smeId: user.uid || user.id,
                smeName: user.name || 'SME Client',
                supplierId: selectedSupplier.id,
                supplierName: selectedSupplier.name,
                category: selectedCategory || selectedSupplier.industry || 'General',
                status: 'Pending',
                specs: `Sourcing RFQ — ${selectedSupplier.name}\n\nRequested Items:\n${specs}${rfqNote ? `\n\nNotes: ${rfqNote}` : ''}`,
                indicativeTotal: totalIndicative,
                createdAt: new Date().toISOString(),
            };

            await addDoc(collection(db, 'rfqs'), rfqPayload);

            // Notify supplier
            try {
                const notifRef = doc(db, 'user_notifications', selectedSupplier.id);
                const snap = await getDoc(notifRef);
                const prev = snap.exists() ? (snap.data().data || []) : [];
                prev.unshift({
                    id: Date.now(),
                    text: `📋 ${user.name} sent a sourcing RFQ for ${rfqItems.length} product(s) — R${totalIndicative.toLocaleString()} indicative value`,
                    read: false,
                    timestamp: Date.now()
                });
                await setDoc(notifRef, { data: prev }, { merge: true });
            } catch (_) { }

            toast.success('RFQ sent to supplier! They will respond with a formal quote.');
            setRfqItems([]);
            setRfqNote('');
            setIsRfqOpen(false);
        } catch (e) {
            console.error(e);
            toast.error('Failed to submit RFQ. Please try again.');
        } finally {
            setSubmittingRfq(false);
        }
    };

    // ── Breadcrumb nav ─────────────────────────────────────────────────────────
    const breadcrumb = () => (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
            <button onClick={() => { setView('categories'); setSelectedCategory(null); setSelectedSupplier(null); setSearch(''); }}
                className="hover:text-white transition-colors font-bold">
                Sourcing Warehouse
            </button>
            {selectedCategory && (
                <>
                    <ChevronRight size={12} className="text-gray-700" />
                    <button onClick={() => { setView('suppliers'); setSelectedSupplier(null); setSearch(''); }}
                        className="hover:text-white transition-colors font-bold">
                        {selectedCategory}
                    </button>
                </>
            )}
            {selectedSupplier && (
                <>
                    <ChevronRight size={12} className="text-gray-700" />
                    <span className="text-white font-bold">{selectedSupplier.name}</span>
                </>
            )}
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER: LEVEL 1 — CATEGORY BROWSER
    // ══════════════════════════════════════════════════════════════════════════
    const renderCategories = () => (
        <div className="space-y-8">
            {/* Featured Platinum Supplier Carousel */}
            {featuredSuppliers.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-600/5 to-transparent border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-amber-500/5">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.04] text-8xl font-black select-none">💎</div>
                    <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                        <div className="flex-1 space-y-2">
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-500/30 flex items-center gap-1.5 w-fit">
                                <Sparkles size={11} className="animate-pulse" /> Platinum Featured Partner
                            </span>
                            <h3 className="text-xl font-black text-white leading-tight mt-2">
                                {featuredSuppliers[carouselIdx]?.name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                <MapPin size={10} className="text-amber-400" />
                                {featuredSuppliers[carouselIdx]?.province || 'South Africa'}
                                {featuredSuppliers[carouselIdx]?.industry && (
                                    <span className="ml-2 px-2 py-0.5 bg-gray-800 rounded text-gray-400">
                                        {Array.isArray(featuredSuppliers[carouselIdx].industry)
                                            ? featuredSuppliers[carouselIdx].industry[0]
                                            : featuredSuppliers[carouselIdx].industry}
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {allProducts.filter(p => p.supplierId === featuredSuppliers[carouselIdx]?.id).length} products in catalog
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const sup = featuredSuppliers[carouselIdx];
                                const cats = Array.isArray(sup.preferredCategories) ? sup.preferredCategories
                                    : Array.isArray(sup.industry) ? sup.industry
                                        : sup.industry ? [sup.industry] : [];
                                setSelectedCategory(cats[0] || 'All');
                                setSelectedSupplier(sup);
                                setView('inventory');
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            View Catalog <ChevronRight size={14} />
                        </button>
                    </div>
                    {featuredSuppliers.length > 1 && (
                        <div className="flex gap-1.5 mt-5 justify-center md:justify-start">
                            {featuredSuppliers.map((_, i) => (
                                <button key={i} onClick={() => setCarouselIdx(i)}
                                    className={`h-1 rounded-full transition-all ${i === carouselIdx ? 'w-6 bg-amber-500' : 'w-2 bg-gray-700'}`} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Global Search Bar */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={globalSearch}
                    onChange={e => { setGlobalSearch(e.target.value); if (e.target.value) setView('search'); else setView('categories'); }}
                    placeholder="Search suppliers, categories or services (e.g. printing, cleaning, ICT)..."
                    className="w-full bg-gray-900/60 border border-gray-700/60 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all"
                />
                {globalSearch && (
                    <button onClick={() => { setGlobalSearch(''); setView('categories'); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Category Grid */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-black text-white">Browse by Category</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Select a category to find verified South African suppliers</p>
                    </div>
                    <span className="text-xs text-gray-600 font-bold">{suppliers.length} Suppliers</span>
                </div>
                {loadingSuppliers ? (
                    <div className="py-20 text-center text-gray-500">Loading supplier directory...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {CATEGORIES.map(cat => {
                            const supplierCount = supplierCountByCategory[cat.id] || 0;
                            const productCount = productCountByCategory[cat.id] || 0;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedCategory(cat.id); setView('suppliers'); }}
                                    className={`bg-gradient-to-br ${cat.color} border ${cat.border} rounded-2xl p-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm hover:shadow-md`}
                                >
                                    <div className="text-3xl mb-3">{cat.icon}</div>
                                    <h4 className={`font-black text-sm ${cat.text} leading-tight`}>{cat.id}</h4>
                                    <div className="mt-3 space-y-1">
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Building2 size={9} /> {supplierCount} supplier{supplierCount !== 1 ? 's' : ''}
                                        </p>
                                        {productCount > 0 && (
                                            <p className="text-[10px] text-gray-600 flex items-center gap-1">
                                                <Package size={9} /> {productCount} product{productCount !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className={`mt-3 ${cat.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER: LEVEL 2 — SUPPLIER DIRECTORY (within category)
    // ══════════════════════════════════════════════════════════════════════════
    const renderSuppliers = () => (
        <div className="space-y-6">
            {breadcrumb()}

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.icon} {selectedCategory} Suppliers
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{suppliersInCategory.length} verified supplier{suppliersInCategory.length !== 1 ? 's' : ''} in this category</p>
                </div>
            </div>

            {/* Featured Suppliers in this Category */}
            {suppliersInCategory.filter(s => s.promoted).length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-600/5 to-transparent border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-amber-500/5">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.04] text-8xl font-black select-none">💎</div>
                    <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                        <div className="flex-1 space-y-2">
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-500/30 flex items-center gap-1.5 w-fit">
                                <Sparkles size={11} className="animate-pulse" /> Featured {selectedCategory} Partner
                            </span>
                            <h3 className="text-xl font-black text-white leading-tight mt-2">
                                {suppliersInCategory.filter(s => s.promoted)[0]?.name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                <MapPin size={10} className="text-amber-400" />
                                {suppliersInCategory.filter(s => s.promoted)[0]?.province || 'South Africa'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const sup = suppliersInCategory.filter(s => s.promoted)[0];
                                setSelectedSupplier(sup);
                                setView('inventory');
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            View Catalog <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {suppliersInCategory.length === 0 ? (
                <div className="py-24 bg-[#121318] border border-gray-800/80 rounded-2xl text-center">
                    <Building2 size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 text-sm">No suppliers listed in this category yet.</p>
                    <p className="text-gray-600 text-xs mt-1">Suppliers can list here by subscribing to the Verified Supplier plan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {suppliersInCategory.map(sup => {
                        const prodCount = allProducts.filter(p => p.supplierId === sup.id).length;
                        return (
                            <button
                                key={sup.id}
                                onClick={() => { setSelectedSupplier(sup); setView('inventory'); setSearch(''); setRfqItems([]); }}
                                className={`text-left bg-[#121318] border rounded-2xl p-6 hover:border-gray-600 hover:scale-[1.01] active:scale-[0.99] transition-all group shadow-md ${sup.promoted ? 'border-amber-500/30 shadow-amber-500/5' : 'border-gray-800/50'
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    {sup.logoUrl ? (
                                        <img src={sup.logoUrl} alt={sup.name} className="w-12 h-12 rounded-xl object-cover border border-gray-700/50 shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl flex items-center justify-center text-xl font-black text-gray-400 shrink-0">
                                            {sup.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <TrustBadge badge={sup.trustBadge} />
                                </div>

                                <h4 className="font-extrabold text-white text-base leading-tight truncate">{sup.name}</h4>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                    <MapPin size={10} className="text-gray-600 shrink-0" />
                                    {[sup.suburb, sup.city, sup.province].filter(Boolean).join(', ') || 'South Africa'}
                                </p>
                                {sup.description && (
                                    <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                        {sup.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800/60">
                                    <div className="text-center">
                                        <div className="text-base font-black text-white font-mono">{prodCount}</div>
                                        <div className="text-[10px] text-gray-600 uppercase tracking-wide">Products</div>
                                    </div>
                                    {sup.rating && (
                                        <div className="text-center">
                                            <div className="text-base font-black text-yellow-400 flex items-center gap-0.5">
                                                <Star size={12} fill="currentColor" /> {sup.rating}
                                            </div>
                                            <div className="text-[10px] text-gray-600 uppercase tracking-wide">Rating</div>
                                        </div>
                                    )}
                                    <div className="ml-auto">
                                        <span className="text-xs text-cyan-400 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                            View Catalog <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>

                                {prodCount === 0 && (
                                    <p className="text-[10px] text-gray-600 italic mt-2">No catalog items listed yet — contact to request quote</p>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER: LEVEL 3 — SUPPLIER INVENTORY
    // ══════════════════════════════════════════════════════════════════════════
    const renderInventory = () => {
        const sup = selectedSupplier;
        if (!sup) return null;

        return (
            <div className="space-y-6">
                {breadcrumb()}

                {/* Supplier Profile Banner */}
                <div className={`bg-[#121318] border rounded-2xl p-6 ${sup.promoted ? 'border-amber-500/25 shadow-lg shadow-amber-500/5' : 'border-gray-800/50'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {sup.logoUrl ? (
                                <img src={sup.logoUrl} alt={sup.name} className="w-14 h-14 rounded-xl object-cover border border-gray-700 shrink-0 shadow-lg shadow-black/20" />
                            ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl flex items-center justify-center text-2xl font-black text-white shrink-0">
                                    {sup.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-xl font-black text-white">{sup.name}</h2>
                                    <TrustBadge badge={sup.trustBadge} size="lg" />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><MapPin size={10} /> {[sup.suburb, sup.city, sup.province].filter(Boolean).join(', ') || 'South Africa'}</span>
                                    {sup.rating && <span className="flex items-center gap-1 text-yellow-400"><Star size={10} fill="currentColor" /> {sup.rating} / 5</span>}
                                </p>
                                {sup.description && (
                                    <p className="text-sm text-gray-400 mt-3 leading-relaxed max-w-3xl">
                                        {sup.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {rfqItems.length > 0 && (
                                <button
                                    onClick={() => setIsRfqOpen(true)}
                                    className="relative px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                                >
                                    <FileText size={14} /> Request Quote ({rfqItems.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Trust signals */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800/60">
                        {sup.subscribed && (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                <ShieldCheck size={10} /> Verified Supplier
                            </span>
                        )}
                        {sup.promoted && (
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                <Award size={10} /> Featured Partner
                            </span>
                        )}
                        {sup.province && (
                            <span className="px-2.5 py-1 bg-gray-800/80 text-gray-400 border border-gray-700/60 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                <MapPin size={10} /> {sup.province}
                            </span>
                        )}
                    </div>
                </div>

                {/* Search within supplier */}
                {supplierProducts.length > 3 && (
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search this supplier's products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#121318] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>
                )}

                {/* Products */}
                {loadingProducts ? (
                    <div className="py-16 text-center text-gray-500">Loading catalog...</div>
                ) : supplierProducts.length === 0 ? (
                    <div className="py-20 bg-[#121318] border border-gray-800/80 rounded-2xl text-center">
                        <Package size={44} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-500 text-sm font-bold">No catalog items yet</p>
                        <p className="text-gray-600 text-xs mt-1">This supplier hasn't listed products yet. Send them an RFQ directly.</p>
                        <button
                            onClick={() => setIsRfqOpen(true)}
                            className="mt-6 px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-xl text-xs font-bold transition-all"
                        >
                            Send General RFQ
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white">{supplierProducts.length} Product{supplierProducts.length !== 1 ? 's' : ''}</h4>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Select items to include in your RFQ</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {supplierProducts.map(prod => {
                                const selected = isInRfq(prod.id);
                                const rfqItem = rfqItems.find(x => x.product.id === prod.id);
                                return (
                                    <div
                                        key={prod.id}
                                        className={`bg-[#121318] border rounded-2xl overflow-hidden transition-all ${selected ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/5' : 'border-gray-800/50 hover:border-gray-700'
                                            }`}
                                    >
                                        {/* Product image */}
                                        <div className="relative h-40 bg-gray-900 overflow-hidden">
                                            {prod.imageUrl ? (
                                                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-800">
                                                    <Package size={40} />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex gap-1.5">
                                                <span className="px-2 py-0.5 bg-black/70 backdrop-blur text-[10px] font-black uppercase text-cyan-400 rounded-md border border-cyan-500/20">
                                                    {prod.category}
                                                </span>
                                            </div>
                                            {selected && (
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="text-white text-xs font-black">✓</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product info */}
                                        <div className="p-5 space-y-3">
                                            <div>
                                                <h4 className="font-extrabold text-white text-sm leading-tight">{prod.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{prod.description}</p>
                                            </div>

                                            {/* Pricing & specs */}
                                            <div className="bg-[#1a1c23]/60 p-3.5 rounded-xl space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 flex items-center gap-1"><Tag size={10} /> Indicative Price</span>
                                                    <span className="font-black text-white font-mono">From R{prod.price} / {prod.unit}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 flex items-center gap-1"><Package size={10} /> Min Order (MOQ)</span>
                                                    <span className="font-bold text-white">{prod.minOrderQty} {prod.unit}s</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 flex items-center gap-1"><Clock size={10} /> Lead Time</span>
                                                    <span className="font-bold text-white">{prod.leadTimeDays} Days</span>
                                                </div>
                                                {prod.volumeTiers?.length > 0 && (
                                                    <div className="text-[10px] text-emerald-400 font-bold pt-1 border-t border-gray-800/50 flex items-center gap-1">
                                                        <Layers size={9} /> Volume discounts available — ask in RFQ
                                                    </div>
                                                )}
                                            </div>

                                            {/* RFQ quantity stepper */}
                                            {selected ? (
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2 bg-gray-800 rounded-xl p-1.5 border border-gray-700">
                                                        <button onClick={() => updateQty(prod.id, -1)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="text-sm font-mono font-bold text-white px-2">{rfqItem?.qty}</span>
                                                        <button onClick={() => updateQty(prod.id, 1)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleRfqItem(prod)}
                                                        className="flex-1 py-2.5 bg-cyan-500/10 hover:bg-red-500/10 border border-cyan-500/30 hover:border-red-500/30 text-cyan-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <X size={12} /> Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => toggleRfqItem(prod)}
                                                    className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={12} /> Add to RFQ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {rfqItems.length > 0 && (
                            <div className="sticky bottom-6 z-30">
                                <button
                                    onClick={() => setIsRfqOpen(true)}
                                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl font-black text-sm shadow-2xl shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={16} /> Request Formal Quote — {rfqItems.length} Item{rfqItems.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ══════════════════════════════════════════════════════════════════════════
    // RFQ SUBMISSION DRAWER
    // ══════════════════════════════════════════════════════════════════════════
    const renderRfqDrawer = () => (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <div className="bg-[#121318] border-l border-gray-800 w-full max-w-md h-full flex flex-col shadow-2xl">
                <header className="p-6 border-b border-gray-800/60 flex justify-between items-center shrink-0">
                    <div>
                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                            <FileText size={18} className="text-cyan-400" /> Request for Quote
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">To: <strong className="text-gray-300">{selectedSupplier?.name}</strong></p>
                    </div>
                    <button onClick={() => setIsRfqOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Items summary */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Items Requested</p>
                        <div className="space-y-2">
                            {rfqItems.map(({ product, qty }) => (
                                <div key={product.id} className="flex justify-between items-start bg-[#1a1c23]/60 p-3.5 rounded-xl border border-gray-800/60">
                                    <div className="flex-1 pr-3">
                                        <p className="text-sm font-bold text-white">{product.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{product.category}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-mono font-bold text-white">x {qty} {product.unit}s</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">~R{(product.price * qty).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Indicative total */}
                    <div className="flex justify-between items-center p-3.5 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Indicative Value</span>
                        <span className="font-mono font-black text-cyan-400">
                            R{rfqItems.reduce((s, x) => s + x.product.price * x.qty, 0).toLocaleString()}
                        </span>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Notes to Supplier (optional)</label>
                        <textarea
                            value={rfqNote}
                            onChange={e => setRfqNote(e.target.value)}
                            rows={3}
                            placeholder="e.g. Delivery needed within 7 days, specific colour requirements, delivery address..."
                            className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                        />
                    </div>

                    <div className="bg-[#1a1c23]/40 border border-gray-800/60 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
                        📋 The supplier will receive your RFQ and respond with a formal quote. Once accepted, you can convert this into a PO Financing request.
                    </div>
                </div>

                <div className="p-6 border-t border-gray-800/60 shrink-0">
                    <button
                        onClick={handleSubmitRfq}
                        disabled={submittingRfq || rfqItems.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Send size={16} />
                        {submittingRfq ? 'Sending RFQ...' : `Send RFQ to ${selectedSupplier?.name}`}
                    </button>
                </div>
            </div>
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ══════════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-[#0b0c10] w-full px-4 md:px-8 py-6">
            <div className="space-y-6 pb-12 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="flex justify-between items-center bg-[#121318] p-6 rounded-2xl border border-gray-800/50 shadow-md">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors">
                            <X size={16} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                Sourcing Warehouse <Sparkles size={16} className="text-cyan-400 animate-pulse" />
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Browse verified suppliers → drill into their catalog → request a formal quote</p>
                        </div>
                    </div>

                    {/* Back navigation inside header when drilling down */}
                    {view !== 'categories' && (
                        <button
                            onClick={() => {
                                if (view === 'inventory') { setView('suppliers'); setSelectedSupplier(null); setRfqItems([]); }
                                else if (view === 'suppliers') { setView('categories'); setSelectedCategory(null); }
                                setSearch('');
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    )}
                </div>

                {/* View Router */}
                {view === 'categories' && renderCategories()}
                {view === 'suppliers' && renderSuppliers()}
                {view === 'inventory' && renderInventory()}
                {view === 'search' && (() => {
                    const q = globalSearch.toLowerCase();
                    const results = suppliers.filter(s => {
                        const cats = Array.isArray(s.preferredCategories) ? s.preferredCategories
                            : Array.isArray(s.industry) ? s.industry : s.industry ? [s.industry] : [];
                        return (
                            (s.name || '').toLowerCase().includes(q) ||
                            (s.companyName || '').toLowerCase().includes(q) ||
                            (s.description || '').toLowerCase().includes(q) ||
                            (s.province || '').toLowerCase().includes(q) ||
                            cats.some(c => c.toLowerCase().includes(q))
                        );
                    }).sort((a, b) => { const r = { Platinum: 3, Gold: 2, Silver: 1 }; return (r[b.trustBadge] || 0) - (r[a.trustBadge] || 0); });

                    return (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-500">{results.length} supplier{results.length !== 1 ? 's' : ''} found for <span className="text-white font-bold">"{globalSearch}"</span></p>
                            {results.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <p className="text-gray-500 text-sm">No suppliers found. Try a different keyword.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.map(s => {
                                        const cats = Array.isArray(s.preferredCategories) ? s.preferredCategories : Array.isArray(s.industry) ? s.industry : [];
                                        return (
                                            <button key={s.id} onClick={() => { setSelectedSupplier(s); setSelectedCategory(cats[0] || null); setView('inventory'); setGlobalSearch(''); }}
                                                className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-5 text-left hover:border-blue-500/40 hover:bg-gray-800/60 transition-all group">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <h4 className="font-black text-white text-sm group-hover:text-blue-400 transition-colors">{s.name || s.companyName}</h4>
                                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={9} />{s.province || 'South Africa'}</p>
                                                    </div>
                                                    {s.trustBadge && <TrustBadge badge={s.trustBadge} />}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {cats.slice(0, 3).map(c => (
                                                        <span key={c} className="text-[9px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full border border-gray-700">{c}</span>
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}


                {/* RFQ Drawer */}
                {isRfqOpen && renderRfqDrawer()}
            </div>
        </div>
    );
}
