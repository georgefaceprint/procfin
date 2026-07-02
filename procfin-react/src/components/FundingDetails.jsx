import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from './Toast';

const STATUS_STEPS = [
    { key: 'Pending Review', label: 'Submitted', icon: '📤', desc: 'Your funding request has been received and is in the funder pipeline.' },
    { key: 'Bidding Open', label: 'Bidding Open', icon: '📢', desc: 'Technical specifications broadcasted. Accredited suppliers are currently bidding.' },
    { key: 'Capital Secured', label: 'Supplier Secured', icon: '🔐', desc: 'Winning bid selected. 100% Cashless fulfillment directly from supplier.' },
    { key: 'Waybill Uploaded', label: 'Goods Dispatched', icon: '📦', desc: 'Your supplier has uploaded proof of dispatch. First milestone payment released.' },
    { key: 'Delivery Confirmed', label: 'Delivery Confirmed', icon: '✅', desc: 'You confirmed receipt of goods. Final supplier payout released. Deal closed.' },
];

export default function FundingDetails({ user, dealId, onBack }) {
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!dealId) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'deals', dealId));
                if (snap.exists()) setDeal({ id: snap.id, ...snap.data() });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [dealId]);

    const handleConfirmDelivery = async () => {
        setConfirming(true);
        try {
            await setDoc(doc(db, 'deals', dealId), {
                status: 'Delivery Confirmed',
                deliveryConfirmedAt: new Date().toISOString(),
                deliveryConfirmedBy: user.uid || user.id,
            }, { merge: true });

            // Notify Funder and Supplier of closure
            const notifyUser = async (userId, message) => {
                const notifRef = doc(db, 'user_notifications', userId);
                const snap = await getDoc(notifRef);
                const existing = snap.exists() ? (snap.data().data || []) : [];
                existing.unshift({ id: Date.now(), text: message, read: false, timestamp: Date.now() });
                await setDoc(notifRef, { data: existing }, { merge: true });
            };

            if (deal.funderId) {
                await notifyUser(deal.funderId,
                    `✅ ${user.name} has confirmed delivery for the ${deal.category} contract. Final 30% released from escrow.`);
            }
            if (deal.supplierId) {
                await notifyUser(deal.supplierId,
                    `💰 ${user.name} confirmed delivery! Your final 30% escrow payment (R${(Number(deal.dealTerms?.principal || deal.amount) * 0.30).toFixed(0)}) has been released.`);
            }

            // Refresh
            const updated = await getDoc(doc(db, 'deals', dealId));
            setDeal({ id: updated.id, ...updated.data() });
            setShowConfirmModal(false);
        } catch (e) {
            console.error('Delivery confirm error:', e);
            toast.error('Failed to confirm delivery. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!deal) return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center px-6">
            <div className="text-center">
                <p className="text-gray-400 text-xl mb-4">Deal not found.</p>
                <button onClick={onBack} className="text-blue-500 font-bold hover:underline">← Back to Dashboard</button>
            </div>
        </div>
    );

    const principal = Number(deal.dealTerms?.principal || deal.amount || 0);
    const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === deal.status);
    const clampedIdx = currentStepIdx === -1 ? 0 : currentStepIdx;

    const paidPct = deal.status === 'Delivery Confirmed' ? 100
        : deal.status === 'Waybill Uploaded' ? 70
            : deal.status === 'Capital Secured' ? 30
                : 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                    <span>&larr;</span> Back to Dashboard
                </button>

                <div className="mb-8">
                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Funding Deal Status</p>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">{deal.category}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Ref #{dealId?.substring(0, 10).toUpperCase()} · Submitted {new Date(deal.createdAt).toLocaleDateString()}
                    </p>
                </div>

                {/* Cashless Banner */}
                {deal.status !== 'Pending Review' && deal.status !== 'Bidding Open' && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-5 mb-8 flex items-start gap-4">
                        <span className="text-2xl mt-0.5">🤝</span>
                        <div>
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-400">100% Cashless Fulfillment</h4>
                            <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                                Platform has secured the winning bid from <strong>{deal.supplierName}</strong>. You will receive the requested goods/services directly (No cash is disbursed to the SME).
                            </p>
                        </div>
                    </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Amount', value: `R${principal.toLocaleString()}`, sub: 'approved' },
                        { label: 'Paid Out', value: `${paidPct}%`, sub: 'of escrow' },
                        { label: 'Funder', value: deal.funderName || '—', sub: 'verified' },
                        { label: 'Supplier', value: deal.supplierName || '—', sub: 'fulfilling' },
                    ].map(({ label, value, sub }) => (
                        <div key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">{label}</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{value}</p>
                            <p className="text-[10px] text-gray-400">{sub}</p>
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Escrow Progress</h3>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{paidPct}% Released</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${paidPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>30% Deposit</span>
                        <span>70% Waybill</span>
                        <span>100% Final</span>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-8">Deal Progression</h3>

                    <div className="relative">
                        <div className="absolute left-[22px] top-6 bottom-10 w-0.5 bg-gray-100 dark:bg-gray-700" />

                        <div className="space-y-8">
                            {STATUS_STEPS.map((step, idx) => {
                                const isDone = idx <= clampedIdx;
                                const isActive = idx === clampedIdx;

                                return (
                                    <div key={step.key} className="relative flex gap-6 items-start">
                                        <div className={`relative z-10 w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center text-lg border-2 transition-all ${isDone
                                            ? isActive && deal.status !== 'Delivery Confirmed'
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 opacity-40'
                                            }`}>
                                            {step.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-sm mb-1 ${isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                                                {step.label}
                                            </h4>
                                            <p className={`text-xs leading-relaxed ${isDone ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-700'}`}>
                                                {step.desc}
                                            </p>

                                            {/* Waybill link for SME in step 3 */}
                                            {step.key === 'Waybill Uploaded' && isDone && deal.waybillUrl && (
                                                <a href={deal.waybillUrl} target="_blank" rel="noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                                    📎 View Supplier Waybill →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Deal Terms */}
                {deal.dealTerms && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm mb-6">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-widest">Funding Terms</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            {[
                                { label: 'Interest Rate', value: `${deal.dealTerms.interest}% p.a.` },
                                { label: 'Platform Fee', value: `R${Number(deal.dealTerms.fees).toLocaleString()}` },
                                { label: 'Total Facility', value: `R${Number(deal.dealTerms.total).toLocaleString()}` },
                                { label: 'Repayment', value: deal.dealTerms.term },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-gray-400 uppercase font-black tracking-widest mb-0.5" style={{ fontSize: '9px' }}>{label}</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Confirm Delivery CTA */}
                {deal.status === 'Waybill Uploaded' && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-3xl p-6">
                        <div className="flex items-start gap-4">
                            <span className="text-3xl flex-shrink-0">📦</span>
                            <div className="flex-1">
                                <h3 className="font-black text-gray-900 dark:text-white mb-1">Goods Received?</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                                    Your supplier has uploaded a waybill confirming dispatch. If you have received the goods or services, confirm delivery to release the <strong>final R{(principal * 0.30).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</strong> from escrow.
                                </p>
                                {deal.waybillUrl && (
                                    <a href={deal.waybillUrl} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline mb-5 block">
                                        📎 Review Supplier Waybill →
                                    </a>
                                )}
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    ✅ Confirm Delivery & Release Final Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Complete Banner */}
                {deal.status === 'Delivery Confirmed' && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-emerald-500/20">
                        <div className="text-5xl mb-3">🎉</div>
                        <h3 className="text-2xl font-black mb-2">Deal Successfully Closed!</h3>
                        <p className="text-white/80 leading-relaxed">
                            All escrow payments have been released. Your contract with {deal.funderName} and {deal.supplierName} is now complete.
                        </p>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
                        <div className="text-4xl text-center mb-4">⚠️</div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 text-center">Confirm Delivery?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 leading-relaxed">
                            This action is <strong>irreversible</strong>. By confirming, you acknowledge that goods/services have been received and authorise the release of the final <strong>R{(principal * 0.30).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</strong> from escrow.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelivery}
                                disabled={confirming}
                                className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-lg transition-all disabled:opacity-50">
                                {confirming ? 'Confirming...' : '✅ Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
