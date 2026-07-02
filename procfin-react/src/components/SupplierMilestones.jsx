import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from './Toast';

const MILESTONES = [
    {
        id: 1,
        phase: 'Deposit Paid',
        pct: 30,
        icon: '✓',
        trigger: 'Paid automatically upon contract execution.',
        doneStatus: ['Capital Secured', 'Waybill Uploaded', 'Delivery Confirmed'],
    },
    {
        id: 2,
        phase: 'Waybill Upload',
        pct: 40,
        icon: '2',
        trigger: 'Upload a waybill or proof of dispatch to unlock this payment.',
        doneStatus: ['Waybill Uploaded', 'Delivery Confirmed'],
    },
    {
        id: 3,
        phase: 'Final Delivery Sign-Off',
        pct: 30,
        icon: '3',
        trigger: 'SME confirms receipt of goods/services to release final payment.',
        doneStatus: ['Delivery Confirmed'],
    },
];

export default function SupplierMilestones({ user, dealId, onBack }) {
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
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

    const handleWaybillUpload = async () => {
        if (!file) { setFileError('Please select a file first.'); return; }
        setFileError('');
        setUploading(true);
        try {
            const storageRef = ref(storage, `waybills/${dealId}_${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await setDoc(doc(db, 'deals', dealId), {
                status: 'Waybill Uploaded',
                waybillUrl: downloadURL,
                waybillUploadedAt: new Date().toISOString(),
            }, { merge: true });

            // Notify SME to confirm delivery
            if (deal?.smeId) {
                const notifRef = doc(db, 'user_notifications', deal.smeId);
                const notifSnap = await getDoc(notifRef);
                const existing = notifSnap.exists() ? (notifSnap.data().data || []) : [];
                existing.unshift({
                    id: Date.now(),
                    text: `📦 ${user.name} has uploaded a waybill for your ${deal.category} contract. Please confirm delivery to release the final 30% payment.`,
                    read: false,
                    timestamp: Date.now()
                });
                await setDoc(notifRef, { data: existing }, { merge: true });
            }

            // Refresh deal
            const updated = await getDoc(doc(db, 'deals', dealId));
            setDeal({ id: updated.id, ...updated.data() });
        } catch (e) {
            console.error('Waybill upload error:', e);
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
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
                <p className="text-gray-400 text-xl mb-4">Contract not found.</p>
                <button onClick={onBack} className="text-blue-500 font-bold hover:underline">← Back to Dashboard</button>
            </div>
        </div>
    );

    const principal = Number(deal.dealTerms?.principal || deal.amount || 0);
    const upfront = principal * 0.30;
    const mid = principal * 0.40;
    const final = principal * 0.30;

    const getMilestoneState = (m) => {
        if (m.doneStatus.includes(deal.status)) return 'done';
        if (m.id === 2 && deal.status === 'Capital Secured') return 'active';
        if (m.id === 3 && deal.status === 'Waybill Uploaded') return 'active';
        return 'pending';
    };

    const totalPaid = deal.status === 'Delivery Confirmed' ? principal
        : deal.status === 'Waybill Uploaded' ? upfront + mid
            : deal.status === 'Capital Secured' ? upfront
                : 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                    <span>&larr;</span> Back to Dashboard
                </button>

                <div className="mb-8">
                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Active Contract</p>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">{deal.category}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        SME: <strong>{deal.smeName}</strong> · Funder: <strong>{deal.funderName}</strong>
                    </p>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Contract', value: `R${principal.toLocaleString()}`, color: 'blue' },
                        { label: 'Paid to Date', value: `R${totalPaid.toLocaleString()}`, color: 'emerald' },
                        { label: 'Remaining', value: `R${(principal - totalPaid).toLocaleString()}`, color: deal.status === 'Delivery Confirmed' ? 'gray' : 'amber' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center shadow-sm`}>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">{label}</p>
                            <p className={`text-xl font-black font-mono text-${color}-600 dark:text-${color}-400`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Milestone Timeline */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-8">Escrow Payment Timeline</h3>

                    <div className="relative">
                        {/* Connector line */}
                        <div className="absolute left-[22px] top-6 bottom-12 w-0.5 bg-gray-100 dark:bg-gray-700" />

                        <div className="space-y-8">
                            {MILESTONES.map((m) => {
                                const state = getMilestoneState(m);
                                const amounts = [upfront, mid, final];
                                const amount = amounts[m.id - 1];

                                return (
                                    <div key={m.id} className="relative flex gap-6 items-start">
                                        {/* Icon dot */}
                                        <div className={`relative z-10 w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${state === 'done'
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : state === 'active'
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 animate-pulse'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400'
                                            }`}>
                                            {state === 'done' ? '✓' : m.id}
                                        </div>

                                        <div className="flex-1 pb-2">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`font-bold ${state === 'done' ? 'text-emerald-600 dark:text-emerald-400' : state === 'active' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    Milestone {m.id}: {m.phase}
                                                </h4>
                                                <span className={`text-sm font-black font-mono ${state === 'done' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {m.pct}% — R{amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>

                                            {state === 'done' ? (
                                                <div>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ Payment Released from Escrow</p>
                                                    {m.id === 2 && deal.waybillUrl && (
                                                        <a href={deal.waybillUrl} target="_blank" rel="noreferrer"
                                                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                                            📎 View Uploaded Waybill →
                                                        </a>
                                                    )}
                                                </div>
                                            ) : state === 'active' ? (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{m.trigger}</p>

                                                    {/* Milestone 2: Waybill Upload */}
                                                    {m.id === 2 && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                                                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-widest">Upload Proof of Dispatch</p>
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                onChange={e => { setFile(e.target.files[0]); setFileError(''); }}
                                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-3"
                                                            />
                                                            {file && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                                    📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                                                                </p>
                                                            )}
                                                            {fileError && <p className="text-xs text-red-500 mb-3">{fileError}</p>}
                                                            <button
                                                                onClick={handleWaybillUpload}
                                                                disabled={uploading || !file}
                                                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                                            >
                                                                {uploading ? (
                                                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                                                                ) : `Upload & Claim R${mid.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Milestone 3: waiting for SME */}
                                                    {m.id === 3 && (
                                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4">
                                                            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                                                                ⏳ Awaiting SME delivery confirmation. They have been notified via the platform.
                                                            </p>
                                                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                                                R{final.toLocaleString('en-ZA', { maximumFractionDigits: 0 })} will be automatically released once confirmed.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 dark:text-gray-600">{m.trigger}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Fully Paid Banner */}
                {deal.status === 'Delivery Confirmed' && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white text-center shadow-xl shadow-emerald-500/20">
                        <div className="text-4xl mb-3">🎉</div>
                        <h3 className="text-xl font-black mb-1">Contract Complete!</h3>
                        <p className="text-white/80 text-sm">All escrow milestones are settled. R{principal.toLocaleString()} fully disbursed.</p>
                    </div>
                )}

                {/* Contract Details Footer */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mt-6">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-widest">Contract Reference</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        {[
                            { label: 'Deal Ref', value: dealId?.substring(0, 10).toUpperCase() },
                            { label: 'Category', value: deal.category },
                            { label: 'Repayment', value: deal.dealTerms?.term || 'Net 30 Days' },
                            { label: 'Structured On', value: deal.structuredAt ? new Date(deal.structuredAt).toLocaleDateString() : 'N/A' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-gray-400 uppercase font-black tracking-widest mb-0.5" style={{ fontSize: '9px' }}>{label}</p>
                                <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
