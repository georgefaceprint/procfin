import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

const DOC_TYPES = [
    { key: 'csd', label: 'CSD Registration', icon: '🏛️' },
    { key: 'tax', label: 'SARS Tax Clearance', icon: '📋' },
    { key: 'bbbee', label: 'B-BBEE Certificate', icon: '🤝' },
    { key: 'financials', label: 'Management Accounts', icon: '📊' },
    { key: 'id', label: 'Director ID / Passport', icon: '🪪' },
];

export default function FunderReview({ user, dealId, onBack, onApprove }) {
    const [deal, setDeal] = useState(null);
    const [smeDocs, setSmeDocs] = useState([]);
    const [smeProfile, setSmeProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [declining, setDeclining] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [extractedSpecs, setExtractedSpecs] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);

    useEffect(() => {
        if (!dealId) return;
        const load = async () => {
            try {
                // Load deal
                const dealSnap = await getDoc(doc(db, 'deals', dealId));
                if (!dealSnap.exists()) { setLoading(false); return; }
                const dealData = { id: dealSnap.id, ...dealSnap.data() };
                setDeal(dealData);

                // Load SME profile
                const smeSnap = await getDoc(doc(db, 'users', dealData.smeId));
                if (smeSnap.exists()) setSmeProfile(smeSnap.data());

                // Load SME vault docs (collection written by Vault.jsx)
                const vaultSnap = await getDocs(
                    query(collection(db, 'user_documents'), where('uid', '==', dealData.smeId))
                );
                setSmeDocs(vaultSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error('Error loading deal:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dealId]);

    const getDocStatus = (docType) => {
        const found = smeDocs.find(d => d.type === docType);
        if (found) return { status: 'uploaded', url: found.url, name: found.name };
        return { status: 'missing' };
    };

    const completeness = DOC_TYPES.filter(dt => getDocStatus(dt.key).status === 'uploaded').length;
    const pct = Math.round((completeness / DOC_TYPES.length) * 100);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Loading Deal File...</p>
                </div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-gray-400 text-xl mb-4">Deal not found.</p>
                    <button onClick={onBack} className="text-blue-500 font-bold hover:underline">← Back to Pipeline</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6">
            <div className="max-w-3xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                    <span>&larr;</span> Back to Pipeline
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Due Diligence Review</p>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">{deal.smeName}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            R{Number(deal.amount).toLocaleString()} · {deal.category} · Requested {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : '—'}
                        </p>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest ${deal.status === 'Capital Secured' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>{deal.status}</span>
                </div>

                {/* SME Profile Summary */}
                {smeProfile && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span>🏢</span> SME Business Profile
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Reg. Number', value: smeProfile.registrationNumber || 'N/A' },
                                { label: 'Province', value: smeProfile.province || 'N/A' },
                                { label: 'Phone', value: smeProfile.phone || 'N/A' },
                                { label: 'Email', value: smeProfile.email || 'N/A' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">{label}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                        {smeProfile.address && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Business Address</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{smeProfile.address}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* KYC Document Vault */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>🗄️</span> SME Compliance Vault
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg ${pct >= 80 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                pct >= 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                    'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                }`}>{completeness}/{DOC_TYPES.length} Docs</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {DOC_TYPES.map(dt => {
                            const docInfo = getDocStatus(dt.key);
                            return (
                                <div key={dt.key} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${docInfo.status === 'uploaded'
                                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                                    : 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-700'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{dt.icon}</span>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{dt.label}</p>
                                            {docInfo.status === 'uploaded' && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{docInfo.name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {docInfo.status === 'uploaded' ? (
                                            <>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">✓ Uploaded</span>
                                                {docInfo.url && (
                                                    <a href={docInfo.url} target="_blank" rel="noreferrer"
                                                        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                                                        View →
                                                    </a>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Missing</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Funding Request Details */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-8 shadow-sm">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>💰</span> Funding Request Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Amount Requested</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">R{Number(deal.amount).toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Category</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{deal.category}</p>
                        </div>
                    </div>
                    {deal.description && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Purpose of Funding</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{deal.description}</p>
                        </div>
                    )}
                    {deal.docUrl && (
                        <a href={deal.docUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">
                            📎 View Supporting Document →
                        </a>
                    )}
                </div>

                {/* Actions */}
                {deal.status !== 'Capital Secured' && deal.status !== 'Bidding Open' && (
                    <>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeclineModal(true)}
                                className="flex-1 py-4 border-2 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                ✕ Decline Application
                            </button>
                            <button
                                onClick={() => setShowBroadcastModal(true)}
                                className="flex-1 py-4 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95"
                            >
                                📢 Extract Specs & Broadcast
                            </button>
                            <button
                                onClick={() => onApprove(deal)}
                                className="flex-[1.5] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Structure Deal Directly →
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-4">
                            Extracting specs allows you to broadcast to suppliers for competitive bidding without revealing client margins.
                        </p>
                    </>
                )}

                {deal.status === 'Bidding Open' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 text-center mb-6">
                        <p className="text-blue-700 dark:text-blue-400 font-bold mb-4">📢 Bidding is currently open for this deal.</p>
                        <button
                            onClick={() => onApprove(deal)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                        >
                            Review Bids &amp; Structure Deal →
                        </button>
                    </div>
                )}

                {deal.status === 'Capital Secured' && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 text-center">
                        <p className="text-emerald-700 dark:text-emerald-400 font-bold">✓ This deal has already been structured and capital deployed.</p>
                        <button onClick={onBack} className="mt-3 text-sm text-emerald-600 font-bold hover:underline">← Back to Pipeline</button>
                    </div>
                )}
            </div>

            {/* Decline Modal */}
            {showDeclineModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Decline Application</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Briefly state the reason. The SME will receive this feedback automatically.</p>
                        <textarea
                            rows="4"
                            value={declineReason}
                            onChange={e => setDeclineReason(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none mb-6"
                            placeholder="e.g. Insufficient documentation, outside our current mandate..."
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeclineModal(false)}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                disabled={declining || !declineReason.trim()}
                                onClick={async () => {
                                    setDeclining(true);
                                    const { setDoc, doc: firestoreDoc } = await import('firebase/firestore');
                                    await setDoc(firestoreDoc(db, 'deals', deal.id), {
                                        status: 'Declined',
                                        declineReason,
                                        declinedBy: user.uid || user.id,
                                        declinedAt: new Date().toISOString()
                                    }, { merge: true });
                                    setShowDeclineModal(false);
                                    onBack();
                                }}
                                className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                {declining ? 'Declining...' : 'Confirm Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Modal */}
            {showBroadcastModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Extract Specs &amp; Broadcast</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Translate the SME's request into technical specifications for suppliers. <strong>Do not include the SME's requested funding amount or their pricing.</strong>
                        </p>
                        
                        <div className="mb-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Original Description from SME</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{deal.description}"</p>
                        </div>

                        <textarea
                            rows="5"
                            value={extractedSpecs}
                            onChange={e => setExtractedSpecs(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-6"
                            placeholder="e.g. Supply and delivery of 50x Dell Latitude 5420 laptops, Core i7, 16GB RAM. Delivery to Johannesburg within 14 days."
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowBroadcastModal(false)}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                disabled={broadcasting || !extractedSpecs.trim()}
                                onClick={async () => {
                                    setBroadcasting(true);
                                    const { setDoc, doc: firestoreDoc } = await import('firebase/firestore');
                                    await setDoc(firestoreDoc(db, 'deals', deal.id), {
                                        status: 'Bidding Open',
                                        specs: extractedSpecs,
                                        bids: [],
                                        biddingOpenedAt: new Date().toISOString()
                                    }, { merge: true });
                                    setShowBroadcastModal(false);
                                    // Let the view refresh naturally via onSnapshot if we had one, but we are using getDoc in useEffect.
                                    // To simplify, just go back.
                                    onBack();
                                }}
                                className="flex-[2] py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                {broadcasting ? 'Broadcasting...' : 'Broadcast to Suppliers'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
