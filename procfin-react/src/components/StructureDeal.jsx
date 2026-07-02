import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from './Toast';

const REPAYMENT_TERMS = [
    'Net 30 Days (Tender Payout)',
    'Net 60 Days',
    'Net 90 Days',
    '6 Months Amortized',
    '12 Months Amortized',
];

export default function StructureDeal({ user, dealId, onBack, onContractGenerated }) {
    const [deal, setDeal] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [contractDone, setContractDone] = useState(false);
    const [contractData, setContractData] = useState(null);
    const toast = useToast();

    const [terms, setTerms] = useState({
        principalLimit: '',
        supplierDisbursal: '',
        margin: '',
        interest: '12.5',
        fees: '4500',
        term: REPAYMENT_TERMS[0],
        supplierName: '',
    });

    useEffect(() => {
        if (!dealId) return;
        const load = async () => {
            try {
                const dealSnap = await getDoc(doc(db, 'deals', dealId));
                if (dealSnap.exists()) {
                    const d = { id: dealSnap.id, ...dealSnap.data() };
                    setDeal(d);
                    setTerms(prev => ({ 
                        ...prev, 
                        principalLimit: String(d.amount || ''),
                        supplierDisbursal: String(d.winningBidAmount || d.amount || ''),
                        margin: String(d.margin || 0),
                        supplierName: d.supplierName || ''
                    }));

                    // Fetch verified suppliers in the same category
                    const q = query(collection(db, 'users'),
                        where('type', '==', 'SUPPLIER'),
                        where('subscribed', '==', true)
                    );
                    const suppSnap = await getDocs(q);
                    setSuppliers(suppSnap.docs.map(s => ({ id: s.id, ...s.data() })));
                }
            } catch (e) {
                console.error('Error loading deal:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dealId]);

    const principalLimit = parseFloat(terms.principalLimit) || 0;
    const supplierDisbursal = parseFloat(terms.supplierDisbursal) || 0;
    const margin = parseFloat(terms.margin) || 0;
    const interest = parseFloat(terms.interest) || 0;
    const fees = parseFloat(terms.fees) || 0;
    const interestAmount = principalLimit * (interest / 100);
    const totalFacility = principalLimit + interestAmount + fees;
    const upfront30 = supplierDisbursal * 0.30;
    const mid40 = supplierDisbursal * 0.40;
    const final30 = supplierDisbursal * 0.30;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!terms.supplierName) { toast.warning('Please select a verified supplier.'); return; }
        setGenerating(true);

        const contractRef = {
            status: 'Capital Secured',
            funderId: user.uid || user.id,
            funderName: user.name,
            supplierName: terms.supplierName,
            supplierId: suppliers.find(s => s.name === terms.supplierName)?.id || null,
            dealTerms: {
                principalLimit: terms.principalLimit,
                supplierDisbursal: terms.supplierDisbursal,
                margin: terms.margin,
                interest: terms.interest,
                fees: terms.fees,
                total: totalFacility.toFixed(2),
                term: terms.term,
                interestAmount: interestAmount.toFixed(2),
            },
            structuredAt: new Date().toISOString(),
        };

        try {
            await setDoc(doc(db, 'deals', dealId), contractRef, { merge: true });

            // Notify the SME
            if (deal?.smeId) {
                const smeSnap = await getDoc(doc(db, 'users', deal.smeId));
                if (smeSnap.exists()) {
                    const smeData = smeSnap.data();
                    const notifRef = doc(db, 'user_notifications', deal.smeId);
                    const notifSnap = await getDoc(notifRef);
                    const existing = notifSnap.exists() ? (notifSnap.data().data || []) : [];
                    existing.unshift({
                        id: Date.now(),
                        text: `🎉 Deal APPROVED! ${user.name} has secured 100% cashless fulfillment for your ${deal.category} contract via ${terms.supplierName}.`,
                        read: false,
                        timestamp: Date.now()
                    });
                    await setDoc(notifRef, { data: existing }, { merge: true });
                }
            }

            setContractData({ ...contractRef, deal });
            setContractDone(true);
            onContractGenerated && onContractGenerated();
        } catch (err) {
            console.error('Contract generation failed:', err);
            toast.error('Failed to generate contract. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (contractDone && contractData) {
        const d = contractData.deal;
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Success Banner */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white text-center mb-8 shadow-xl shadow-emerald-500/20">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black mb-1">Smart Contract Generated!</h2>
                        <p className="text-white/80 text-sm">The SME has been notified. Capital is now secured in escrow.</p>
                    </div>

                    {/* Contract Document */}
                    <div className="bg-white dark:bg-gray-800 border-l-8 border-blue-600 rounded-2xl p-8 shadow-2xl mb-6">
                        <div className="text-center mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'serif' }}>
                                ProcFin Funding Facility Agreement
                            </h1>
                            <p className="text-gray-400 text-sm">Auto-generated on {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                                🔒 Binding Contract — Ref #{dealId?.substring(0, 8).toUpperCase()}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {[
                                { label: 'FUNDER (Lender)', value: user.name, sub: 'Verified Funding Entity' },
                                { label: 'SME (Borrower)', value: d.smeName, sub: d.category },
                                { label: 'SUPPLIER (Beneficiary)', value: contractData.supplierName, sub: 'Verified Supplier' },
                            ].map(({ label, value, sub }) => (
                                <div key={label} className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">{label}</p>
                                    <p className="font-black text-gray-900 dark:text-white">{value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="font-black text-gray-900 dark:text-white mb-4">Financial Terms</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Funding Limit (SME)', value: `R${Number(terms.principalLimit).toLocaleString()}` },
                                    { label: 'Supplier Cost', value: `R${Number(terms.supplierDisbursal).toLocaleString()}` },
                                    { label: 'Platform Margin', value: `R${Number(terms.margin).toLocaleString()}` },
                                    { label: 'SME Total Facility', value: `R${totalFacility.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, highlight: true },
                                ].map(({ label, value, highlight }) => (
                                    <div key={label}>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">{label}</p>
                                        <p className={`font-black ${highlight ? 'text-blue-600 dark:text-blue-400 text-xl' : 'text-gray-900 dark:text-white'}`}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Repayment Term</p>
                                <p className="font-bold text-gray-900 dark:text-white">{terms.term}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-black text-gray-900 dark:text-white mb-4">Cashless Escrow Payment Schedule</h3>
                            {[
                                { phase: '30% Upfront', amount: upfront30, trigger: 'Upon contract execution — paid to Supplier', color: 'blue', done: true },
                                { phase: '40% on Delivery', amount: mid40, trigger: 'Upon Supplier waybill upload', color: 'amber', done: false },
                                { phase: '30% Final', amount: final30, trigger: 'Upon SME delivery sign-off', color: 'emerald', done: false },
                            ].map(({ phase, amount, trigger, color, done }) => (
                                <div key={phase} className={`flex items-center gap-4 p-4 rounded-xl mb-2 border ${done ? `bg-${color}-50 dark:bg-${color}-900/20 border-${color}-100 dark:border-${color}-900/30` : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${done ? `bg-${color}-600 text-white` : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                        {done ? '✓' : '○'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{phase} — <span className="font-black text-gray-900 dark:text-white">R{amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{trigger}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 space-y-1 leading-relaxed">
                            <p><strong>1.</strong> 100% Cashless Fulfillment: SME receives no cash. All disbursements are made directly to the Supplier.</p>
                            <p><strong>2.</strong> The Platform retains the R{Number(terms.margin).toLocaleString()} margin between the funding limit and the supplier cost.</p>
                            <p><strong>3.</strong> The SME cedes tender invoice payments directly into the designated ProcFin joint-account until fully settled.</p>
                            <p><strong>4.</strong> This contract is legally binding upon digital acceptance by all three parties.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            🖨️ Print / Save PDF
                        </button>
                        <button
                            onClick={onBack}
                            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all"
                        >
                            Return to Pipeline →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6">
            <div className="max-w-3xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                    <span>&larr;</span> Back to Review
                </button>

                <div className="mb-8">
                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Deal Structuring</p>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">{deal?.smeName}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Draft the funding terms. This will generate a binding tripartite contract between you, the SME, and the selected Verified Supplier.
                    </p>
                </div>

                {/* Live Financial Calculator */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 mb-8 shadow-xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <p className="text-[10px] text-white/60 uppercase font-black tracking-widest mb-3 relative z-10">Live Deal Calculator</p>
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                        <div>
                            <p className="text-white/60 text-xs mb-1">Funding Limit (SME)</p>
                            <p className="text-2xl font-black font-mono">R{Number(terms.principalLimit || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs mb-1">Winning Bid (Supplier)</p>
                            <p className="text-2xl font-black font-mono">R{Number(terms.supplierDisbursal || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs mb-1">Platform Spread</p>
                            <p className="text-2xl font-black font-mono text-emerald-300">R{Number(terms.margin || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex gap-6 text-xs text-white/60 relative z-10">
                        <span>↑ 30% Upfront: R{upfront30.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
                        <span>↑ 40% on Delivery: R{mid40.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
                        <span>↑ 30% Final: R{final30.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm">📐</span>
                            Financial Terms
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Funding Limit (ZAR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R</span>
                                    <input type="number" required value={terms.principalLimit}
                                        onChange={e => {
                                            const pl = e.target.value;
                                            const sd = terms.supplierDisbursal;
                                            const m = Number(pl) - Number(sd);
                                            setTerms({ ...terms, principalLimit: pl, margin: m });
                                        }}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Interest Rate (% p.a.)</label>
                                <input type="number" step="0.1" min="0" max="50" required value={terms.interest}
                                    onChange={e => setTerms({ ...terms, interest: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Winning Bid / Supplier Cost (ZAR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R</span>
                                    <input type="number" required value={terms.supplierDisbursal}
                                        onChange={e => {
                                            const sd = e.target.value;
                                            const pl = terms.principalLimit;
                                            const m = Number(pl) - Number(sd);
                                            setTerms({ ...terms, supplierDisbursal: sd, margin: m });
                                        }}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Repayment Term</label>
                                <select required value={terms.term}
                                    onChange={e => setTerms({ ...terms, term: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                    {REPAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-sm">🚚</span>
                            Link Verified Supplier
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Select the verified supplier who will fulfill this tender. They'll receive the 30% upfront escrow payment immediately.
                        </p>
                        {suppliers.length > 0 ? (
                            <div className="space-y-2">
                                {suppliers.map(s => (
                                    <label key={s.id}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${terms.supplierName === s.name
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                                            : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700 hover:border-blue-300'
                                            }`}>
                                        <input type="radio" name="supplier" value={s.name}
                                            checked={terms.supplierName === s.name}
                                            onChange={() => setTerms({ ...terms, supplierName: s.name })}
                                            className="accent-blue-600" />
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{s.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{Array.isArray(s.industry) ? s.industry.join(', ') : s.industry} · {s.province}</p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900">Verified</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl">
                                <p className="text-gray-400 text-sm">No verified suppliers found in the platform yet.</p>
                                <p className="text-gray-400 text-xs mt-1">Suppliers must subscribe to appear here.</p>
                            </div>
                        )}
                    </div>

                    {/* T&C Preview */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-xs text-gray-500 dark:text-gray-400 space-y-1 leading-relaxed">
                        <p className="font-black text-gray-700 dark:text-gray-300 text-xs uppercase tracking-widest mb-2">Standard ProcFin Cashless T&C</p>
                        <p>1. SME receives no cash. All disbursements are made directly to the verified supplier.</p>
                        <p>2. Upon execution, 30% upfront of the Winning Bid is released to the Supplier.</p>
                        <p>3. 40% released upon verified waybill upload. 30% on final SME sign-off.</p>
                        <p>4. The SME cedes tender invoice payments into the ProcFin joint account until settled.</p>
                    </div>

                    <button type="submit" disabled={generating}
                        className="w-full py-5 bg-gray-900 dark:bg-blue-600 hover:opacity-90 text-white rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                        {generating ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                Generating Smart Contract...
                            </>
                        ) : '⚡ Generate Binding Smart Contract'}
                    </button>
                </form>
            </div>
        </div>
    );
}
