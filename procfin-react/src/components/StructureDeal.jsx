import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from './Toast';

export default function StructureDeal({ user, dealId, onBack, onContractGenerated }) {
    const [deal, setDeal]         = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [generating, setGenerating] = useState(false);
    const [contractDone, setContractDone] = useState(false);
    const [contractData, setContractData] = useState(null);
    const toast = useToast();

    const [terms, setTerms] = useState({
        supplierPayment:    '',   // what ProcFin pays the supplier
        procfinFeePercent:  '5',  // ProcFin's fee %
        supplierName:       '',
        supplierId:         '',
        cessionRecoveryDate: '',  // when the client will pay (= contractPaymentDue)
        notes:              '',
    });

    useEffect(() => {
        if (!dealId) return;
        (async () => {
            try {
                const snap = await getDoc(doc(db, 'deals', dealId));
                if (snap.exists()) {
                    const d = { id: snap.id, ...snap.data() };
                    setDeal(d);
                    setTerms(prev => ({
                        ...prev,
                        supplierPayment:    String(d.amount || ''),
                        cessionRecoveryDate: d.contractPaymentDue || '',
                        supplierName:       d.supplierName || '',
                        supplierId:         d.supplierId   || '',
                    }));

                    // Load verified suppliers for the dropdown
                    const q = query(collection(db, 'users'),
                        where('type', '==', 'SUPPLIER'),
                        where('subscribed', '==', true)
                    );
                    const supSnap = await getDocs(q);
                    // Also include promoted suppliers
                    const q2 = query(collection(db, 'users'),
                        where('type', '==', 'SUPPLIER'),
                        where('promoted', '==', true)
                    );
                    const supSnap2 = await getDocs(q2);
                    const combined = [...supSnap.docs, ...supSnap2.docs];
                    const unique = Array.from(new Map(combined.map(d => [d.id, d])).values());
                    setSuppliers(unique.map(s => ({ id: s.id, ...s.data() })));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [dealId]);

    // Live calculations
    const supplierPayment    = parseFloat(terms.supplierPayment)    || 0;
    const feePercent         = parseFloat(terms.procfinFeePercent)  || 5;
    const contractVal        = Number(deal?.contractValue)          || 0;
    const procfinFee         = supplierPayment * (feePercent / 100);
    const procfinRecovery    = supplierPayment + procfinFee;         // intercepted from client
    const smeProfit          = contractVal - procfinRecovery;
    // Supplier payment schedule (30/40/30)
    const s30 = supplierPayment * 0.30;
    const s40 = supplierPayment * 0.40;
    const s30f = supplierPayment * 0.30;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!terms.supplierName) { toast.warning('Please link a verified supplier.'); return; }
        if (supplierPayment <= 0)  { toast.warning('Supplier payment amount is required.'); return; }
        setGenerating(true);

        const contractPayload = {
            status:      'Capital Secured',
            approvedBy:  user.uid || user.id,
            approverName: user.name,
            supplierName: terms.supplierName,
            supplierId:   terms.supplierId || suppliers.find(s => s.name === terms.supplierName)?.id || null,
            dealTerms: {
                // ProcFin deploys
                supplierPayment:     supplierPayment.toFixed(2),
                procfinFeePercent:   feePercent.toFixed(1),
                procfinFee:          procfinFee.toFixed(2),
                procfinRecovery:     procfinRecovery.toFixed(2),
                // Client pays / SME gets
                contractValue:       contractVal.toFixed(2),
                smeProfit:           smeProfit.toFixed(2),
                // Cession
                cessionRecoveryDate: terms.cessionRecoveryDate,
                // Supplier schedule
                stage1_30pct:        s30.toFixed(2),
                stage2_40pct:        s40.toFixed(2),
                stage3_30pct:        s30f.toFixed(2),
            },
            notes:        terms.notes,
            structuredAt: new Date().toISOString(),
        };

        try {
            await setDoc(doc(db, 'deals', dealId), contractPayload, { merge: true });

            // Notify SME
            if (deal?.smeId) {
                const nRef = doc(db, 'user_notifications', deal.smeId);
                const nSnap = await getDoc(nRef);
                const prev = nSnap.exists() ? (nSnap.data().data || []) : [];
                prev.unshift({
                    id: Date.now(),
                    text: `🎉 APPROVED! ProcFin will pay ${terms.supplierName} R${supplierPayment.toLocaleString()} directly. Your profit of R${smeProfit > 0 ? smeProfit.toLocaleString() : '—'} will be released when ${deal.clientName || 'your client'} settles.`,
                    read: false,
                    timestamp: Date.now()
                });
                await setDoc(nRef, { data: prev }, { merge: true });
            }

            // Notify supplier
            const selectedSup = suppliers.find(s => s.name === terms.supplierName);
            if (selectedSup?.id) {
                const nRef = doc(db, 'user_notifications', selectedSup.id);
                const nSnap = await getDoc(nRef);
                const prev = nSnap.exists() ? (nSnap.data().data || []) : [];
                prev.unshift({
                    id: Date.now(),
                    text: `💰 New contract! ProcFin will pay you R${s30.toLocaleString()} upfront (30%) for fulfillment of: ${deal?.description?.substring(0, 80)}...`,
                    read: false,
                    timestamp: Date.now()
                });
                await setDoc(nRef, { data: prev }, { merge: true });
            }

            setContractData({ ...contractPayload, deal });
            setContractDone(true);
            onContractGenerated?.();
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate contract. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // ── SUCCESS: Show the Contract ─────────────────────────────────────────────
    if (contractDone && contractData) {
        const d = contractData.deal;
        const t = contractData.dealTerms;
        return (
            <div className="min-h-screen bg-[#0d0f14] py-10 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Banner */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white text-center mb-8 shadow-xl shadow-emerald-500/20">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
                        <h2 className="text-2xl font-black mb-1">Deal Approved — Capital Deployed!</h2>
                        <p className="text-white/80 text-sm">
                            ProcFin is paying <strong>{contractData.supplierName}</strong> directly. {d.smeName} has been notified.
                        </p>
                    </div>

                    {/* Contract Document */}
                    <div className="bg-white border-l-8 border-cyan-600 rounded-2xl p-8 shadow-2xl mb-6">
                        <div className="text-center mb-8 pb-6 border-b border-gray-100">
                            <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                ProcFin Capital — Funding Facility Agreement
                            </h1>
                            <p className="text-gray-400 text-sm">Generated {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-black uppercase tracking-widest border border-cyan-100">
                                🔒 Binding Contract — Ref #{dealId?.substring(0, 8).toUpperCase()}
                            </div>
                        </div>

                        {/* Three Parties */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {[
                                { label: 'PROCFIN CAPITAL', value: 'ProcFin (Pty) Ltd', sub: 'Capital Provider & Cession Holder' },
                                { label: 'CONTRACT HOLDER (SME)', value: d.smeName, sub: d.clientName ? `Contract with ${d.clientName}` : d.category },
                                { label: 'FULFILLMENT PARTY', value: contractData.supplierName, sub: 'Verified Supplier — Paid Directly' },
                            ].map(({ label, value, sub }) => (
                                <div key={label} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-2">{label}</p>
                                    <p className="font-black text-gray-900 text-sm">{value}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Financial Terms */}
                        <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
                            <h3 className="font-black text-gray-900 mb-4 text-sm">Cession Intercept Economics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'ProcFin Pays Supplier',    value: `R${Number(t.supplierPayment).toLocaleString()}`,  highlight: false },
                                    { label: `ProcFin Fee (${t.procfinFeePercent}%)`, value: `R${Number(t.procfinFee).toLocaleString()}`, highlight: false },
                                    { label: 'ProcFin Recovers',         value: `R${Number(t.procfinRecovery).toLocaleString()}`, highlight: false },
                                    { label: 'SME Profit After Intercept', value: `R${Number(t.smeProfit).toLocaleString()}`,    highlight: true  },
                                ].map(({ label, value, highlight }) => (
                                    <div key={label}>
                                        <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">{label}</p>
                                        <p className={`font-black text-sm ${highlight ? 'text-emerald-600 text-lg' : 'text-gray-900'}`}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            {t.cessionRecoveryDate && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Expected Client Payment / Cession Recovery Date</p>
                                    <p className="font-bold text-gray-900">{new Date(t.cessionRecoveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            )}
                        </div>

                        {/* Supplier Payment Schedule */}
                        <div className="mb-6">
                            <h3 className="font-black text-gray-900 mb-4 text-sm">Supplier Payment Schedule (from ProcFin)</h3>
                            {[
                                { phase: '30% Upfront',      amount: Number(t.stage1_30pct), trigger: 'Released immediately upon contract execution', active: true },
                                { phase: '40% on Delivery',  amount: Number(t.stage2_40pct), trigger: 'Released upon supplier waybill / proof of delivery upload', active: false },
                                { phase: '30% Final',        amount: Number(t.stage3_30pct), trigger: 'Released upon SME delivery sign-off', active: false },
                            ].map(({ phase, amount, trigger, active }) => (
                                <div key={phase} className={`flex items-center gap-4 p-4 rounded-xl mb-2 border ${active ? 'bg-cyan-50 border-cyan-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${active ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {active ? '✓' : '○'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-sm">{phase} — <span className="font-black">R{amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}</span></p>
                                        <p className="text-xs text-gray-500">{trigger}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legal clauses */}
                        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 border border-gray-100 space-y-1.5 leading-relaxed">
                            <p><strong>1.</strong> ProcFin Capital (Pty) Ltd ("ProcFin") will pay <strong>{contractData.supplierName}</strong> directly. {d.smeName} (the "SME") shall receive no cash advance.</p>
                            <p><strong>2.</strong> The SME hereby cedes and assigns to ProcFin all rights to receive payment from <strong>{d.clientName || 'the contracted client'}</strong> under the referenced contract, until ProcFin has recovered R{Number(t.procfinRecovery).toLocaleString()} in full.</p>
                            <p><strong>3.</strong> Upon full recovery, ProcFin shall release the remaining balance (R{Number(t.smeProfit).toLocaleString()}) to the SME's nominated bank account within 2 business days.</p>
                            <p><strong>4.</strong> This arrangement is 100% cashless to the SME. The platform retains a <strong>{t.procfinFeePercent}% facilitation fee</strong> (R{Number(t.procfinFee).toLocaleString()}) deducted at intercept.</p>
                            <p><strong>5.</strong> This contract is legally binding upon digital acceptance by all parties.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => window.print()}
                            className="flex-1 py-4 border border-gray-700 text-gray-300 rounded-2xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                            🖨️ Print / Save PDF
                        </button>
                        <button onClick={onBack}
                            className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-black shadow-xl shadow-cyan-500/20 transition-all">
                            Return to Pipeline →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── DEAL STRUCTURING FORM ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0d0f14] py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                    ← Back to Review
                </button>

                <div className="mb-8">
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-1">Deal Structuring</p>
                    <h2 className="text-3xl font-black text-white">{deal?.smeName}</h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        Confirm the capital terms. ProcFin will pay the supplier directly and register the cession against <strong className="text-gray-400">{deal?.clientName || 'the client'}</strong>.
                    </p>
                </div>

                {/* Live Calculator */}
                <div className="bg-gradient-to-br from-cyan-600/20 to-blue-700/10 border border-cyan-500/20 rounded-3xl p-7 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-5">Live Deal Calculator</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        {[
                            { label: 'Contract Value',        value: `R${contractVal.toLocaleString()}`,            color: 'text-white'       },
                            { label: 'ProcFin Pays Supplier', value: `R${supplierPayment.toLocaleString()}`,         color: 'text-red-400'     },
                            { label: `ProcFin Fee (${feePercent}%)`, value: `R${procfinFee.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`, color: 'text-amber-400' },
                            { label: 'SME Profit',            value: smeProfit > 0 ? `R${smeProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` : '⚠️ Check', color: smeProfit > 0 ? 'text-emerald-400' : 'text-red-400' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-[#121318]/80 border border-gray-800/60 rounded-2xl p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                                <p className={`text-xl font-black font-mono ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-600 flex gap-4 flex-wrap">
                        <span>→ Supplier 30% upfront: R{s30.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
                        <span>→ On delivery: R{s40.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
                        <span>→ Final sign-off: R{s30f.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6">
                    {/* Terms */}
                    <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7 space-y-5">
                        <h3 className="font-black text-white flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">📐</span>
                            Capital Terms
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Supplier Payment (ZAR) *</label>
                                <p className="text-[10px] text-gray-600 mb-2">Amount ProcFin will wire directly to the supplier</p>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</span>
                                    <input type="number" required value={terms.supplierPayment}
                                        onChange={e => setTerms({ ...terms, supplierPayment: e.target.value })}
                                        className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ProcFin Fee (%)</label>
                                <p className="text-[10px] text-gray-600 mb-2">Platform facilitation fee deducted at cession intercept</p>
                                <div className="relative">
                                    <input type="number" step="0.5" min="1" max="20" value={terms.procfinFeePercent}
                                        onChange={e => setTerms({ ...terms, procfinFeePercent: e.target.value })}
                                        className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 pr-10 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 font-mono" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cession Recovery Date</label>
                                <p className="text-[10px] text-gray-600 mb-2">Expected date {deal?.clientName || 'client'} settles payment — ProcFin intercepts on this date</p>
                                <input type="date" value={terms.cessionRecoveryDate}
                                    onChange={e => setTerms({ ...terms, cessionRecoveryDate: e.target.value })}
                                    className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                            </div>
                        </div>
                    </div>

                    {/* Supplier Link */}
                    <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7 space-y-4">
                        <h3 className="font-black text-white flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">🚚</span>
                            Link Fulfillment Supplier
                        </h3>
                        <p className="text-xs text-gray-500">Select the verified supplier ProcFin will pay. They receive 30% upfront upon execution.</p>

                        {suppliers.length > 0 ? (
                            <div className="space-y-2">
                                {suppliers.map(s => (
                                    <label key={s.id}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                                            terms.supplierName === s.name
                                                ? 'bg-cyan-500/5 border-cyan-500/30'
                                                : 'bg-[#1a1c23]/40 border-gray-800/60 hover:border-gray-600'
                                        }`}>
                                        <input type="radio" name="supplier" value={s.name}
                                            checked={terms.supplierName === s.name}
                                            onChange={() => setTerms({ ...terms, supplierName: s.name, supplierId: s.id })}
                                            className="accent-cyan-500" />
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-sm">{s.name}</p>
                                            <p className="text-xs text-gray-500">{Array.isArray(s.industry) ? s.industry.join(', ') : s.industry} · {s.province}</p>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                                            s.promoted
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>{s.promoted ? '💎 Platinum' : '✓ Verified'}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-amber-400 mb-3">No platform suppliers found — enter supplier name manually:</p>
                                <input type="text" placeholder="Supplier company name"
                                    value={terms.supplierName}
                                    onChange={e => setTerms({ ...terms, supplierName: e.target.value })}
                                    className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Credit Committee Notes (internal)</label>
                        <textarea rows={3} value={terms.notes}
                            onChange={e => setTerms({ ...terms, notes: e.target.value })}
                            placeholder="Internal credit notes, conditions, risk flags..."
                            className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none" />
                    </div>

                    {/* T&C preview */}
                    <div className="bg-[#121318]/60 border border-gray-800/60 rounded-2xl p-5 text-xs text-gray-600 leading-relaxed space-y-1.5">
                        <p className="font-black text-gray-400 text-xs uppercase tracking-widest mb-2">Standard ProcFin Cashless Terms</p>
                        <p>1. ProcFin Capital pays the supplier directly — the SME receives no cash advance.</p>
                        <p>2. The SME cedes their right to receive client payment to ProcFin until R{procfinRecovery > 0 ? procfinRecovery.toLocaleString('en-ZA', { maximumFractionDigits: 0 }) : '[amount]'} is recovered.</p>
                        <p>3. Supplier receives 30% on execution, 40% on delivery, 30% on final sign-off.</p>
                        <p>4. ProcFin's {feePercent}% facilitation fee (R{procfinFee > 0 ? procfinFee.toLocaleString('en-ZA', { maximumFractionDigits: 0 }) : '—'}) is deducted from the client payment before the SME receives their profit.</p>
                    </div>

                    <button type="submit" disabled={generating}
                        className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl font-black text-base shadow-2xl shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                        {generating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Deploying Capital...
                            </>
                        ) : '⚡ Approve & Deploy Capital to Supplier'}
                    </button>
                </form>
            </div>
        </div>
    );
}
