import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

const KYC_DOCS = [
    { id: '1', label: 'CSD Registration Report',  icon: '🏛️' },
    { id: '2', label: 'Valid Tax Clearance Certificate', icon: '📋' },
    { id: '3', label: 'Company Registration (CIPC)',     icon: '🏢' },
    { id: '4', label: 'Bank Confirmation Letter',  icon: '🏦' },
    { id: '5', label: 'Directors ID Copies',       icon: '🪪' },
    { id: '6', label: 'Proof of Address',          icon: '📍' },
    { id: '7', label: 'B-BBEE Certificate',        icon: '🤝' },
];

export default function FunderReview({ user, dealId, onBack, onApprove }) {
    const [deal, setDeal]           = useState(null);
    const [smeDocs, setSmeDocs]     = useState([]);
    const [smeProfile, setSmeProfile] = useState(null);
    const [loading, setLoading]     = useState(true);

    // Modals
    const [showDecline, setShowDecline]   = useState(false);
    const [showInfo,    setShowInfo]      = useState(false);
    const [showTender,  setShowTender]    = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [infoRequest,   setInfoRequest]   = useState('');
    const [extractedSpecs, setExtractedSpecs] = useState('');
    const [declining,   setDeclining]   = useState(false);
    const [requesting,  setRequesting]  = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);

    useEffect(() => {
        if (!dealId) return;
        (async () => {
            try {
                const dealSnap = await getDoc(doc(db, 'deals', dealId));
                if (!dealSnap.exists()) { setLoading(false); return; }
                const d = { id: dealSnap.id, ...dealSnap.data() };
                setDeal(d);

                const smeSnap = await getDoc(doc(db, 'users', d.smeId));
                if (smeSnap.exists()) setSmeProfile(smeSnap.data());

                const vaultSnap = await getDocs(
                    query(collection(db, 'user_documents'), where('uid', '==', d.smeId))
                );
                setSmeDocs(vaultSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [dealId]);

    const getDoc_ = (id) => {
        const f = smeDocs.find(d => String(d.docTypeId) === String(id));
        return f ? { status: 'uploaded', url: f.url, name: f.name || 'document' } : { status: 'missing' };
    };

    const kycComplete = KYC_DOCS.filter(d => getDoc_(d.id).status === 'uploaded').length;
    const kycPct = Math.round((kycComplete / KYC_DOCS.length) * 100);

    const handleBroadcast = async () => {
        setBroadcasting(true);
        const { setDoc: sd, doc: fd } = await import('firebase/firestore');
        await sd(fd(db, 'deals', deal.id), {
            status: 'Bidding Open',
            specs: extractedSpecs,
            bids: [],
            biddingOpenedAt: new Date().toISOString(),
        }, { merge: true });

        // Notify SME that their request is now out to tender
        try {
            const nRef = fd(db, 'user_notifications', deal.smeId);
            const nSnap = await getDoc(nRef);
            const prev = nSnap.exists() ? (nSnap.data().data || []) : [];
            prev.unshift({ id: Date.now(), text: `📢 ProcFin has opened your procurement request to verified suppliers for competitive pricing. You'll be notified once bids close.`, read: false, timestamp: Date.now() });
            await sd(nRef, { data: prev }, { merge: true });
        } catch (_) {}

        setShowTender(false);
        onBack();
    };

    const handleDecline = async () => {
        setDeclining(true);
        const { setDoc: sd, doc: fd } = await import('firebase/firestore');
        await sd(fd(db, 'deals', deal.id), {
            status: 'Declined',
            declineReason,
            declinedBy: user.uid || user.id,
            declinedAt: new Date().toISOString(),
        }, { merge: true });

        // Notify SME
        try {
            const nRef = fd(db, 'user_notifications', deal.smeId);
            const nSnap = await getDoc(nRef);
            const prev = nSnap.exists() ? (nSnap.data().data || []) : [];
            prev.unshift({ id: Date.now(), text: `❌ Your financing application was not approved. Reason: ${declineReason}`, read: false, timestamp: Date.now() });
            await sd(nRef, { data: prev }, { merge: true });
        } catch (_) {}

        setShowDecline(false);
        onBack();
    };

    const handleRequestInfo = async () => {
        setRequesting(true);
        const { setDoc: sd, doc: fd } = await import('firebase/firestore');
        await sd(fd(db, 'deals', deal.id), {
            status: 'More Info Required',
            infoRequest,
            infoRequestedAt: new Date().toISOString(),
        }, { merge: true });

        try {
            const nRef = fd(db, 'user_notifications', deal.smeId);
            const nSnap = await getDoc(nRef);
            const prev = nSnap.exists() ? (nSnap.data().data || []) : [];
            prev.unshift({ id: Date.now(), text: `📋 ProcFin needs more information for your application: "${infoRequest}"`, read: false, timestamp: Date.now() });
            await sd(nRef, { data: prev }, { merge: true });
        } catch (_) {}

        setShowInfo(false);
        onBack();
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Loading Deal File...</p>
            </div>
        </div>
    );

    if (!deal) return (
        <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center px-6">
            <div className="text-center">
                <p className="text-gray-400 text-xl mb-4">Deal not found.</p>
                <button onClick={onBack} className="text-cyan-400 font-bold hover:underline">← Back to Pipeline</button>
            </div>
        </div>
    );

    // ── Deal Economics ─────────────────────────────────────────────────────────
    const contractVal     = Number(deal.contractValue) || 0;
    const supplierPmt     = Number(deal.amount) || 0;
    const procfinFee      = Number(deal.procfinFeeIndicative) || supplierPmt * 0.05;
    const smeProfit       = contractVal - supplierPmt - procfinFee;
    const procfinReturn   = supplierPmt + procfinFee; // what ProcFin recoups at intercept

    const statusColor = {
        'Pending Review':       'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'Capital Secured':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'More Info Required':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Declined':             'bg-red-500/10 text-red-400 border-red-500/20',
        'Delivery Confirmed':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    }[deal.status] || 'bg-gray-700/40 text-gray-400 border-gray-700';

    return (
        <div className="min-h-screen bg-[#0d0f14] py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Back */}
                <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                    ← Back to Pipeline
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-1">ProcFin Credit Review</p>
                        <h2 className="text-3xl font-black text-white">{deal.smeName}</h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            {deal.clientName && <span className="text-gray-400 font-bold">{deal.clientName}</span>}
                            {deal.clientType && <span className="text-gray-600"> · {deal.clientType}</span>}
                            <span className="text-gray-700"> · Submitted {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('en-ZA') : '—'}</span>
                        </p>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${statusColor} shrink-0`}>
                        {deal.status}
                    </span>
                </div>

                {/* ── DEAL ECONOMICS ─────────────────────────────────────────── */}
                <div className="bg-gradient-to-br from-cyan-600/15 to-blue-700/10 border border-cyan-500/20 rounded-3xl p-7">
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-5">Deal Economics — Cession Intercept Model</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Contract Value',        value: `R${contractVal.toLocaleString()}`,     sub: `Paid by ${deal.clientName || 'Client'}`,  color: 'text-white' },
                            { label: 'ProcFin Pays Supplier', value: `R${supplierPmt.toLocaleString()}`,     sub: 'Direct from warchest',                    color: 'text-red-400' },
                            { label: 'ProcFin Recovers',      value: `R${procfinReturn.toLocaleString()}`,   sub: `Incl. ~5% fee (R${procfinFee.toLocaleString('en-ZA', { maximumFractionDigits: 0 })})`, color: 'text-amber-400' },
                            { label: 'SME Payout',            value: `R${smeProfit > 0 ? smeProfit.toLocaleString() : '—'}`, sub: 'After intercept & fee', color: 'text-emerald-400' },
                        ].map(({ label, value, sub, color }) => (
                            <div key={label} className="bg-[#121318]/80 rounded-2xl p-4 border border-gray-800/60">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                                <p className={`text-xl font-black font-mono ${color}`}>{value}</p>
                                <p className="text-[10px] text-gray-600 mt-1 leading-tight">{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Flow diagram */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                        <span className="px-3 py-1.5 bg-[#121318] border border-gray-800 rounded-xl font-bold text-gray-400">{deal.clientName || 'Client'} pays</span>
                        <span className="text-cyan-500 font-black">→</span>
                        <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl font-bold text-cyan-400">ProcFin intercepts</span>
                        <span className="text-cyan-500 font-black">→</span>
                        <span className="px-3 py-1.5 bg-[#121318] border border-gray-800 rounded-xl font-bold text-gray-400">Recoups R{procfinReturn.toLocaleString()}</span>
                        <span className="text-emerald-500 font-black">→</span>
                        <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-bold text-emerald-400">{deal.smeName} gets R{smeProfit > 0 ? smeProfit.toLocaleString() : '?'}</span>
                    </div>
                </div>

                {/* ── CONTRACT & CESSION DETAILS ─────────────────────────────── */}
                <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7">
                    <h3 className="font-black text-white mb-5 flex items-center gap-2 text-sm">
                        <span>📄</span> Contract & Cession Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Client / Issuer',         value: deal.clientName || '—' },
                            { label: 'Client Type',             value: deal.clientType || '—' },
                            { label: 'Tender Reference',        value: deal.tenderRefNumber || '—' },
                            { label: 'Contract Value',          value: contractVal > 0 ? `R${contractVal.toLocaleString()}` : '—' },
                            { label: 'Expected Client Payment', value: deal.contractPaymentDue ? new Date(deal.contractPaymentDue).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                            { label: 'Cession Status',          value: deal.cessionStatus || '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-[#1a1c23]/60 rounded-2xl p-3.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                                <p className="text-sm font-bold text-white leading-snug">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Documents */}
                    <div className="mt-5 pt-5 border-t border-gray-800/60 space-y-2">
                        {deal.tenderAwardUrl && (
                            <a href={deal.tenderAwardUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 p-3.5 bg-[#1a1c23]/60 hover:bg-[#1a1c23] border border-gray-800/60 rounded-xl text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-all">
                                <span>📋</span> View Tender Award Letter →
                            </a>
                        )}
                        {deal.supplierQuoteUrl && (
                            <a href={deal.supplierQuoteUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 p-3.5 bg-[#1a1c23]/60 hover:bg-[#1a1c23] border border-gray-800/60 rounded-xl text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-all">
                                <span>🧾</span> View Supplier Quote Document →
                            </a>
                        )}
                        {deal.description && (
                            <div className="p-3.5 bg-[#1a1c23]/60 rounded-xl border border-gray-800/60">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">What supplier will deliver</p>
                                <p className="text-sm text-gray-300 leading-relaxed">{deal.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── SME PROFILE ────────────────────────────────────────────── */}
                {smeProfile && (
                    <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7">
                        <h3 className="font-black text-white mb-5 flex items-center gap-2 text-sm">
                            <span>🏢</span> SME Business Profile
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Reg. Number', value: smeProfile.registrationNumber || 'N/A' },
                                { label: 'Province',    value: smeProfile.province || 'N/A' },
                                { label: 'Phone',       value: smeProfile.phone || 'N/A' },
                                { label: 'Email',       value: smeProfile.email || 'N/A' },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-[#1a1c23]/60 rounded-2xl p-3.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                                    <p className="text-sm font-bold text-white truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                        {smeProfile.address && (
                            <div className="mt-4 pt-4 border-t border-gray-800/60">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Business Address</p>
                                <p className="text-sm text-gray-400">{smeProfile.address}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── KYC COMPLIANCE VAULT ───────────────────────────────────── */}
                <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-white flex items-center gap-2 text-sm">
                            <span>🗄️</span> KYC Compliance Vault
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${kycPct >= 80 ? 'bg-emerald-500' : kycPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${kycPct}%` }} />
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                                kycPct >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                kycPct >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {kycComplete}/{KYC_DOCS.length} Docs
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {KYC_DOCS.map(dt => {
                            const info = getDoc_(dt.id);
                            return (
                                <div key={dt.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                    info.status === 'uploaded'
                                        ? 'bg-emerald-500/5 border-emerald-500/15'
                                        : 'bg-[#1a1c23]/40 border-gray-800/60'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{dt.icon}</span>
                                        <div>
                                            <p className="font-bold text-sm text-white">{dt.label}</p>
                                            {info.status === 'uploaded' && info.name && (
                                                <p className="text-xs text-gray-500 truncate max-w-[180px]">{info.name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {info.status === 'uploaded' ? (
                                            <>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">✓ Uploaded</span>
                                                {info.url && (
                                                    <a href={info.url} target="_blank" rel="noreferrer"
                                                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg text-xs font-bold transition-colors">
                                                        View →
                                                    </a>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Missing</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── ACTIONS ────────────────────────────────────────────────── */}
                {deal.status !== 'Capital Secured' && deal.status !== 'Declined' && deal.status !== 'Delivery Confirmed' && deal.status !== 'Bidding Open' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button onClick={() => setShowDecline(true)}
                                className="py-4 border border-red-500/20 text-red-400 rounded-2xl font-bold text-sm hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2">
                                ✕ Decline
                            </button>
                            <button onClick={() => setShowInfo(true)}
                                className="py-4 border border-gray-700 text-gray-300 rounded-2xl font-bold text-sm hover:bg-gray-800/60 transition-colors flex items-center justify-center gap-2">
                                📋 More Info
                            </button>
                            <button
                                onClick={() => {
                                    setExtractedSpecs(deal.description || '');
                                    setShowTender(true);
                                }}
                                className="py-4 border border-amber-500/20 text-amber-400 rounded-2xl font-bold text-sm hover:bg-amber-500/5 transition-colors flex items-center justify-center gap-2">
                                📢 Open Tender
                            </button>
                            <button onClick={() => onApprove(deal)}
                                className="py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                ⚡ Structure →
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <p className="text-xs text-gray-700">📢 <span className="text-amber-500/70">Open Tender</span> — broadcast de-priced specs to all verified suppliers for competitive bids. Best price wins. Maximum SME profit.</p>
                            <p className="text-xs text-gray-700">⚡ <span className="text-cyan-500/70">Structure</span> — use the SME's nominated supplier directly. Faster but no price competition.</p>
                        </div>
                    </div>
                )}
                {deal.status === 'Bidding Open' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-amber-400 font-black">📢 Supplier Tender is Open</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 animate-pulse">Live</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Verified suppliers are submitting competitive bids. Once you've reviewed bids, click Structure Deal to select the winner and deploy capital.</p>
                        <button onClick={() => onApprove(deal)}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-black text-sm transition-all active:scale-95">
                            Review Bids &amp; Structure Deal →
                        </button>
                    </div>
                )}

                {deal.status === 'Capital Secured' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
                        <p className="text-emerald-400 font-bold">✓ Capital deployed. Awaiting client payment intercept.</p>
                        <button onClick={onBack} className="mt-3 text-sm text-emerald-400 font-bold hover:underline">← Back to Pipeline</button>
                    </div>
                )}

                {deal.status === 'Declined' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
                        <p className="text-red-400 font-bold">This application was declined.</p>
                        {deal.declineReason && <p className="text-xs text-gray-500 mt-1">{deal.declineReason}</p>}
                        <button onClick={onBack} className="mt-3 text-sm text-red-400 font-bold hover:underline">← Back to Pipeline</button>
                    </div>
                )}
            </div>

            {/* ── DECLINE MODAL ──────────────────────────────────────────────── */}
            {showDecline && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-[#121318] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-black text-white mb-2">Decline Application</h3>
                        <p className="text-sm text-gray-500 mb-6">Provide a reason. The SME will be notified automatically.</p>
                        <textarea rows={4} value={declineReason} onChange={e => setDeclineReason(e.target.value)}
                            className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-red-500 resize-none mb-6"
                            placeholder="e.g. Contract value insufficient for our current mandate, missing tender award documentation..." />
                        <div className="flex gap-3">
                            <button onClick={() => setShowDecline(false)}
                                className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button disabled={declining || !declineReason.trim()} onClick={handleDecline}
                                className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                {declining ? 'Declining...' : 'Confirm Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REQUEST MORE INFO MODAL ────────────────────────────────────── */}
            {showInfo && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-[#121318] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-black text-white mb-2">Request Additional Information</h3>
                        <p className="text-sm text-gray-500 mb-6">The SME will be notified to supply the missing details.</p>
                        <textarea rows={4} value={infoRequest} onChange={e => setInfoRequest(e.target.value)}
                            className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none mb-6"
                            placeholder="e.g. Please upload the signed contract (not just the award letter), and provide your supplier's company registration number." />
                        <div className="flex gap-3">
                            <button onClick={() => setShowInfo(false)}
                                className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button disabled={requesting || !infoRequest.trim()} onClick={handleRequestInfo}
                                className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                {requesting ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── OPEN TENDER MODAL ─────────────────────────────────────── */}
            {showTender && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-[#121318] border border-amber-500/20 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                        <h3 className="text-xl font-black text-white mb-1">📢 Open Supplier Tender</h3>
                        <p className="text-sm text-gray-500 mb-2">Broadcast procurement specs to all verified platform suppliers. They bid on price only — <strong className="text-amber-400">do not include contract value, client name, or SME margin.</strong></p>
                        <div className="bg-[#1a1c23]/80 rounded-xl p-3 mb-4 border border-gray-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Original SME Description (internal only)</p>
                            <p className="text-xs text-gray-400 italic">"{deal.description}"</p>
                        </div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">De-priced Specs for Suppliers *</label>
                        <textarea rows={5} value={extractedSpecs} onChange={e => setExtractedSpecs(e.target.value)}
                            className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 resize-none mb-2"
                            placeholder="e.g. Supply and delivery of 500 units branded workwear (polo shirts, sizes S-3XL, logo embroidery). Delivery to Ekurhuleni depot within 14 working days. Provide unit price and total quote." />
                        <p className="text-[10px] text-amber-500/70 mb-5">⚠️ Do not mention the client, contract value, or what the SME will earn. Suppliers quote blind.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowTender(false)}
                                className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button disabled={broadcasting || !extractedSpecs.trim()} onClick={handleBroadcast}
                                className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black text-sm transition-all disabled:opacity-50">
                                {broadcasting ? 'Broadcasting...' : '📢 Broadcast to Suppliers'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
