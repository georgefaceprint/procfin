import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from './Toast';

const PLANS = {
    SME_FREE: {
        name: 'Free Starter Plan',
        price: 0,
        color: 'gray',
        icon: '🌱',
        perks: [
            'Broadcast up to 3 RFQs per month',
            'Basic matchmaking with local suppliers',
            'View quotes and accept bids'
        ]
    },
    SME_PRO: {
        name: 'SME Pro Plan',
        price: 499,
        color: 'blue',
        icon: '🚀',
        perks: [
            'Broadcast up to 10 RFQs per month',
            'Priority matching for your categories',
            'Real-time bid tracking dashboard',
            'Escrow-backed supplier contracts',
        ]
    },
    SME_ENTERPRISE: {
        name: 'SME Enterprise',
        price: 1999,
        color: 'violet',
        icon: '🏢',
        perks: [
            'Broadcast unlimited RFQs to all suppliers',
            'Dedicated account manager badge',
            'Priority Funder routing & 24hr fast-track',
            'Complete Escrow & Supply Chain Guarantee',
        ]
    },
    SUPPLIER_GOLD: {
        name: 'Gold Supplier',
        price: 499,
        color: 'emerald',
        icon: '🥇',
        perks: [
            'Up to 25 custom quotes per month',
            'Receive live RFQ notifications in your category',
            'Guaranteed milestone payouts via escrow',
            'SME & Funder verified badge',
        ]
    },
    SUPPLIER_DIAMOND: {
        name: 'Diamond Supplier',
        price: 999,
        color: 'blue',
        icon: '💎',
        perks: [
            'Up to 50 custom quotes per month',
            'Listed at the top of your categories',
            'Active placement in the Sourcing Warehouse catalog',
            'Immediate boost to visibility and quotes traction'
        ]
    },
    SUPPLIER_PLATINUM: {
        name: 'Platinum Supplier',
        price: 3999,
        color: 'amber',
        icon: '👑',
        perks: [
            'Submit unlimited custom quotes to all active RFQs',
            'Always listed at the top of your categories',
            'Featured rotating Sourcing Warehouse Carousel placement',
            'Qualify for elite Platinum Trust Badge status',
            'Direct funder introduction & deal structuring priority',
            'Complete Digital Vault compliance auditing & verification'
        ]
    },
    FUNDER: {
        name: 'Funder Access Plan',
        price: 999,
        color: 'violet',
        icon: '💼',
        perks: [
            'Full deal flow pipeline access',
            'Structure & approve funding requests',
            'Due diligence document review',
            'Capital deployment analytics',
            'Co-funding network access',
        ]
    }
};

export default function Subscription({ user, onBack, onSuccess }) {
    const [selectedPlanKey, setSelectedPlanKey] = useState(user.type === 'SUPPLIER' ? 'SUPPLIER_GOLD' : (user.type === 'SME' ? 'SME_PRO' : user.type));
    const plan = PLANS[selectedPlanKey] || PLANS.SME_PRO;
    const [step, setStep] = useState('review'); // 'review' | 'invoice' | 'success' | 'eft_success'
    const [loading, setLoading] = useState(false);
    const [payMethod, setPayMethod] = useState('card'); // 'card' | 'eft'
    const [popFile, setPopFile] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState(null);
    const [paystackConfig, setPaystackConfig] = useState(null);
    const toast = useToast();

    // Initialize Paystack config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docSnap = await getDoc(doc(db, "settings", "payments"));
                if (docSnap.exists() && docSnap.data().publicKey) {
                    setPaystackConfig(docSnap.data());
                } else {
                    // Fallback test key for Paystack
                    setPaystackConfig({ publicKey: 'pk_test_f449c076e0ce64949620f520d9071c0c1e42e1bb' });
                }
            } catch (_) {
                setPaystackConfig({ publicKey: 'pk_test_f449c076e0ce64949620f520d9071c0c1e42e1bb' });
            }
        };
        fetchConfig();
    }, []);

    const handlePayment = () => {
        if (!paystackConfig) return;
        setLoading(true);

        const handler = window.PaystackPop.setup({
            key: paystackConfig.publicKey,
            email: user.email || 'user@procfin.online',
            amount: plan.price * 100, // in cents/kobo
            currency: 'ZAR', // Paystack supports ZAR for South African businesses
            ref: 'procfin_' + Math.floor(Math.random() * 1000000000 + 1),
            metadata: {
                custom_fields: [
                    {
                        display_name: "User ID",
                        variable_name: "user_id",
                        value: user.uid || user.id
                    },
                    {
                        display_name: "Plan Key",
                        variable_name: "plan_key",
                        value: selectedPlanKey
                    }
                ]
            },
            callback: async (response) => {
                if (response.status === 'success') {
                    try {
                        const isFeatured = selectedPlanKey === 'SUPPLIER_DIAMOND' || selectedPlanKey === 'SUPPLIER_PLATINUM';
                        const days = selectedPlanKey === 'SUPPLIER_DIAMOND' ? 30 : 365; // Let's just give Diamond 30 days featured, Platinum 1 year for legacy logic
                        const featuredUntil = isFeatured ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;
                        
                        await setDoc(doc(db, 'users', user.uid || user.id), {
                            subscribed: true,
                            featured: isFeatured,
                            promoted: isFeatured, // backward compatibility
                            featuredUntil: featuredUntil,
                            plan: plan.name,
                            subscribedAt: new Date().toISOString(),
                            paystackReference: response.reference,
                        }, { merge: true });

                        // Update current local user session fields
                        user.subscribed = true;
                        user.featured = isFeatured;
                        user.promoted = isFeatured;

                        setStep('success');
                        setTimeout(() => {
                            onSuccess && onSuccess();
                        }, 2500);
                    } catch (err) {
                        toast.error("Activation failed. Contact support.");
                        setLoading(false);
                    }
                } else {
                    toast.error("Payment failed. Please try again.");
                    setLoading(false);
                }
            },
            onClose: () => {
                toast.error("Payment cancelled.");
                setLoading(false);
            }
        });

        handler.openIframe();
    };

    const handleEftSubmit = async (e) => {
        e.preventDefault();
        if (!popFile) {
            toast.warning('Please select a Proof of Payment file.');
            return;
        }

        setLoading(true);
        try {
            const isFeatured = selectedPlanKey === 'SUPPLIER_DIAMOND' || selectedPlanKey === 'SUPPLIER_PLATINUM';
            
            // Upload POP to Firebase Storage
            const ext = popFile.name.split('.').pop();
            const filename = `pop_${user.uid || user.id}_${Date.now()}.${ext}`;
            const storageRef = ref(storage, `subscriptions/${filename}`);
            const uploadTask = await uploadBytesResumable(storageRef, popFile);
            const downloadUrl = await getDownloadURL(uploadTask.ref);

            // Flag user account as pending EFT
            await setDoc(doc(db, 'users', user.uid || user.id), {
                pendingEFT: true,
                popUrl: downloadUrl,
                requestedPlan: plan.name,
                requestedFeatured: isFeatured,
                invoiceNumber: invoiceNumber,
                eftSubmittedAt: new Date().toISOString()
            }, { merge: true });

            setStep('eft_success');
            setTimeout(() => {
                onSuccess && onSuccess();
            }, 4000);

        } catch (err) {
            console.error(err);
            toast.error('Failed to submit Proof of Payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const colorMap = {
        blue: { badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20', ring: 'focus:ring-blue-500', border: 'border-blue-200 dark:border-blue-800', glow: 'from-blue-600 to-indigo-750' },
        emerald: { badge: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20', ring: 'focus:ring-emerald-500', border: 'border-emerald-200 dark:border-emerald-800', glow: 'from-emerald-500 to-teal-650' },
        amber: { badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', btn: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/20', ring: 'focus:ring-amber-500', border: 'border-amber-200 dark:border-amber-800', glow: 'from-amber-500 to-yellow-600' },
        violet: { badge: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20', ring: 'focus:ring-violet-500', border: 'border-violet-200 dark:border-violet-800', glow: 'from-violet-600 to-purple-750' },
    };
    const c = colorMap[plan.color] || colorMap.blue;

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center px-6">
                <div className="text-center max-w-sm animate-fade-in-up">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${c.glow} flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">You're Verified! 🎉</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                        Your <strong>{plan.name}</strong> is now active. Redirecting to your dashboard...
                    </p>
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'invoice') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6 transition-colors duration-300">
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => setStep('review')} className="mb-6 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                        <span>&larr;</span> Back to Checkout
                    </button>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                        {/* Invoice Header */}
                        <div className="flex justify-between items-start mb-10 border-b border-gray-100 dark:border-gray-700 pb-8">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">PROFORMA INVOICE</h2>
                                <p className="text-gray-500 font-mono text-sm">{invoiceNumber}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-gray-900 dark:text-white">ProcFin Capital</div>
                                <p className="text-gray-500 text-xs">Johannesburg, South Africa</p>
                                <p className="text-gray-500 text-xs">hello@procfin.online</p>
                            </div>
                        </div>

                        {/* Bill To */}
                        <div className="mb-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Billed To</h3>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">{user.name || user.email.split('@')[0]}</div>
                            <div className="text-gray-500 text-sm">{user.email}</div>
                            <div className="text-gray-500 text-sm uppercase">{user.type}</div>
                        </div>

                        {/* Order Details */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 mb-10 border border-gray-100 dark:border-gray-700">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="pb-3 text-xs font-black uppercase tracking-widest text-gray-400">Description</th>
                                        <th className="pb-3 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Total (ZAR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="pt-4 pb-2">
                                            <div className="font-bold text-gray-900 dark:text-white">{plan.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">Platform Subscription / Featured Placement</div>
                                        </td>
                                        <td className="pt-4 pb-2 text-right font-bold text-gray-900 dark:text-white">
                                            R{plan.price.toLocaleString()}.00
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-200 dark:border-gray-700">
                                        <td className="pt-4 text-sm font-black text-gray-900 dark:text-white text-right">Total Due:</td>
                                        <td className="pt-4 text-xl font-black text-emerald-600 text-right">R{plan.price.toLocaleString()}.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Banking Details */}
                        <div className="mb-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">EFT Settlement Details</h3>
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Bank Name:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">FNB (First National Bank)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Account Name:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">ProcFin Capital</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Account No:</span>
                                    <span className="font-bold text-gray-900 dark:text-white font-mono">6200 0000 000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Branch Code:</span>
                                    <span className="font-bold text-gray-900 dark:text-white font-mono">250655</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800 mt-2">
                                    <span className="text-gray-500 font-bold">Use Reference:</span>
                                    <span className="font-black text-blue-600 bg-white dark:bg-gray-900 px-2 py-0.5 rounded shadow-sm">{invoiceNumber}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">Please use <strong className="text-gray-900 dark:text-white">{invoiceNumber}</strong> as your payment reference to avoid delays.</p>
                        </div>

                        {/* Upload Form */}
                        <div className="border-t-4 border-dashed border-gray-100 dark:border-gray-700 pt-8 mt-8">
                            <form onSubmit={handleEftSubmit}>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 text-center">Upload Proof of Payment (POP)</label>
                                <input 
                                    type="file" 
                                    accept="image/*,.pdf"
                                    required
                                    onChange={(e) => setPopFile(e.target.files[0])}
                                    className="w-full mb-6 text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-900 file:text-white hover:file:bg-gray-800 dark:file:bg-white dark:file:text-gray-900 text-center mx-auto block cursor-pointer"
                                />
                                
                                <button
                                    type="submit"
                                    disabled={loading || !popFile}
                                    className={`w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-emerald-700`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>Submit POP for Verification</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'eft_success') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center px-6">
                <div className="text-center max-w-sm animate-fade-in-up">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">POP Received! ⏳</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                        We have received your Proof of Payment for the <strong>{plan.name}</strong>. An admin will verify the transaction and activate your account shortly.
                    </p>
                    <p className="text-sm text-amber-600 font-bold mb-6">Redirecting to your dashboard...</p>
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6 transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                    <span>&larr;</span> Back
                </button>

                {/* SME Plan Switch */}
                {user.type === 'SME' && (
                    <div className="flex justify-center mb-8 flex-wrap">
                        <div className="bg-[#121318] p-1.5 rounded-2xl border border-gray-800 flex flex-wrap gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => setSelectedPlanKey('SME_PRO')}
                                className={`px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                                    selectedPlanKey === 'SME_PRO'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                SME Pro (10 RFQs)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedPlanKey('SME_ENTERPRISE')}
                                className={`px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                                    selectedPlanKey === 'SME_ENTERPRISE'
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Enterprise (Unlimited)
                            </button>
                        </div>
                    </div>
                )}

                {/* Role-specific Selection Switch */}
                {user.type === 'SUPPLIER' && (
                    <div className="flex justify-center mb-8 flex-wrap">
                        <div className="bg-[#121318] p-1.5 rounded-2xl border border-gray-800 flex flex-wrap gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => setSelectedPlanKey('SUPPLIER_GOLD')}
                                className={`px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                                    selectedPlanKey === 'SUPPLIER_GOLD'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Gold (25 Quotes)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedPlanKey('SUPPLIER_DIAMOND')}
                                className={`px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                                    selectedPlanKey === 'SUPPLIER_DIAMOND'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Diamond (50 Quotes)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedPlanKey('SUPPLIER_PLATINUM')}
                                className={`px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                                    selectedPlanKey === 'SUPPLIER_PLATINUM'
                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/10'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Platinum (Unlimited)
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    {/* Plan Summary */}
                    <div className="lg:col-span-2">
                        <div className={`bg-gradient-to-br ${c.glow} rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <div className="relative z-10">
                                <div className="text-5xl mb-4">{plan.icon}</div>
                                <h2 className="text-2xl font-black mb-1">{plan.name}</h2>
                                <p className="text-white/70 text-sm mb-6">Unlock the full ProcFin experience</p>
                                <div className="text-5xl font-black font-mono mb-1">R{plan.price}</div>
                                <p className="text-white/60 text-xs uppercase font-bold tracking-widest">Per Month — Cancel Anytime</p>

                                <ul className="mt-8 space-y-3">
                                    {plan.perks.map((perk, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-white/90">
                                            <span className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">✓</span>
                                            {perk}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-8 pt-6 border-t border-white/20 flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest">
                                    <span>🔒</span> Secured by Paystack
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                                Subscription payments are processed securely via Paystack. Your card details are never stored on our servers.
                            </p>
                        </div>
                    </div>

                    {/* Payment CTA */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 lg:p-10 shadow-xl h-full flex flex-col justify-center">
                            
                            {/* Payment Method Toggle */}
                            <div className="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1 mb-8 border border-gray-200 dark:border-gray-700">
                                <button onClick={() => setPayMethod('card')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${payMethod === 'card' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                    Pay via Card
                                </button>
                                <button onClick={() => setPayMethod('eft')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${payMethod === 'eft' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                    Manual EFT / POP
                                </button>
                            </div>

                            {payMethod === 'card' ? (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
                                        🔒
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Secure Checkout</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                                        Click the button below to open the secure Paystack checkout and activate your <strong>{plan.name}</strong>.
                                    </p>

                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className={`w-full py-5 ${c.btn} text-white rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                                Opening Portal...
                                            </>
                                        ) : (
                                            <>Pay R{plan.price.toLocaleString()}.00 Now</>
                                        )}
                                    </button>

                                    <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale">
                                        <span className="font-black text-xs uppercase tracking-widest">Visa</span>
                                        <span className="font-black text-xs uppercase tracking-widest">Mastercard</span>
                                        <span className="font-black text-xs uppercase tracking-widest">EFT</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
                                        📄
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">EFT / Bank Transfer</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed max-w-sm mx-auto">Generate a proforma invoice to process this payment manually through your bank. Once paid, you can upload the Proof of Payment.</p>
                                    
                                    <button
                                        onClick={() => {
                                            setInvoiceNumber(`INV-${Math.floor(Math.random() * 90000) + 10000}`);
                                            setStep('invoice');
                                        }}
                                        className={`w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3`}
                                    >
                                        Generate Invoice
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
