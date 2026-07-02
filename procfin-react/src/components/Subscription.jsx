import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from './Toast';

const PLANS = {
    SME: {
        name: 'SME Growth Plan',
        price: 299,
        color: 'blue',
        icon: '🏢',
        perks: [
            'Broadcast unlimited RFQs to verified suppliers',
            'Apply for direct funding from vetted funders',
            'Real-time bid tracking dashboard',
            'Escrow-backed supplier contracts',
            'Priority matching for your categories',
        ]
    },
    SUPPLIER: {
        name: 'Verified Supplier Plan',
        price: 499,
        color: 'emerald',
        icon: '🚚',
        perks: [
            'Receive live RFQ notifications in your category',
            'Submit unlimited custom quotes',
            'Guaranteed milestone payouts via escrow',
            'Priority listing in supplier search',
            'SME & Funder verified badge',
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
    const plan = PLANS[user.type] || PLANS.SME;
    const [step, setStep] = useState('review'); // 'review' | 'success'
    const [loading, setLoading] = useState(false);
    const [yocoConfig, setYocoConfig] = useState(null);
    const toast = useToast();

    // Initialize Yoco when config is fetched
    useEffect(() => {
        const fetchConfig = async () => {
            const { getDoc, doc } = await import('firebase/firestore');
            const docSnap = await getDoc(doc(db, "settings", "payments"));
            if (docSnap.exists() && docSnap.data().publicKey) {
                setYocoConfig(docSnap.data());
            } else {
                // Fallback to test key
                setYocoConfig({ publicKey: 'pk_test_ed3c8433y8p9pjs79998' });
            }
        };
        fetchConfig();
    }, []);

    const handlePayment = () => {
        if (!yocoConfig) return;
        setLoading(true);

        const yoco = new window.YocoSDK({
            publicKey: yocoConfig.publicKey,
        });

        yoco.showPopup({
            amountInCents: plan.price * 100,
            currency: 'ZAR',
            name: 'ProcFin',
            description: plan.name,
            callback: async (result) => {
                // This callback is called when the token is generated
                if (result.error) {
                    toast.error("Payment failed: " + result.error.message);
                    setLoading(false);
                } else {
                    // Success! result.id is the token
                    // In a production app, you'd send result.id to your server to charge it
                    // For this implementation, we treat token generation as successful commitment
                    try {
                        await setDoc(doc(db, 'users', user.uid || user.id), {
                            subscribed: true,
                            plan: plan.name,
                            subscribedAt: new Date().toISOString(),
                            yocoToken: result.id,
                            yocoPubKey: yocoConfig.publicKey
                        }, { merge: true });

                        setStep('success');
                        setTimeout(() => {
                            onSuccess && onSuccess();
                        }, 2500);
                    } catch (err) {
                        toast.error("Activation failed. Contact support.");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        });
    };

    const colorMap = {
        blue: { badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20', ring: 'focus:ring-blue-500', border: 'border-blue-200 dark:border-blue-800', glow: 'from-blue-600 to-indigo-700' },
        emerald: { badge: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20', ring: 'focus:ring-emerald-500', border: 'border-emerald-200 dark:border-emerald-800', glow: 'from-emerald-500 to-teal-600' },
        violet: { badge: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20', ring: 'focus:ring-violet-500', border: 'border-violet-200 dark:border-violet-800', glow: 'from-violet-600 to-purple-700' },
    };
    const c = colorMap[plan.color];

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6 transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                    <span>&larr;</span> Back
                </button>

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
                                    <span>🔒</span> Secured by Yoco
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                                Subscription payments are processed securely via Yoco. Your card details are never stored on our servers.
                            </p>
                        </div>
                    </div>

                    {/* Payment CTA */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-10 shadow-xl text-center h-full flex flex-col justify-center">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
                                🔒
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Secure Checkout</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                                Click the button below to open the secure Yoco payment portal and activate your <strong>{plan.name}</strong>.
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
                                    <>Pay R{plan.price}.00 Now</>
                                )}
                            </button>

                            <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale">
                                <span className="font-black text-xs uppercase tracking-widest">Visa</span>
                                <span className="font-black text-xs uppercase tracking-widest">Mastercard</span>
                                <span className="font-black text-xs uppercase tracking-widest">EFT</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
