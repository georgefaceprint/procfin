import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CATEGORIES } from '../constants/categories';
import { PROCURING_ENTITIES } from '../constants/buyers';
import { useToast } from './Toast';

export default function FundingRequest({ user, params, onBack }) {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState({
        // Contract details
        contractValue:    params?.contractValue || '',
        clientName:       params?.clientName || '',
        clientType:       params?.clientType || 'Government Department',
        contractPaymentDue: '',
        tenderRefNumber:  '',
        // What SME needs funded
        category:         params?.category || '',
        supplierQuoteAmount: params?.amount || '',
        description:      params?.description || '',
        // Cession
        cessionAgreed:    false,
        // Boost
        isFastTrack:      false,
        // Documents
        tenderAwardFile:  null,
        supplierQuoteFile: null,
        // Term
        fundingTerm:      '30',
    });

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null);

    const set = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
        if (key === 'clientName') {
            if (!val.trim()) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            const filtered = PROCURING_ENTITIES.filter(name =>
                name.toLowerCase().includes(val.toLowerCase())
            ).slice(0, 10);
            setSuggestions(filtered);
            setShowSuggestions(true);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const quoteAmt = parseFloat(formData.supplierQuoteAmount) || 0;
    const contractVal = parseFloat(formData.contractValue) || 0;
    const grossProfit = contractVal - quoteAmt;
    
    const isEnterprise = user.plan === 'SME Enterprise';
    const isFastTrackEnabled = formData.isFastTrack || isEnterprise;
    
    // Funder takes percentage of the PROFIT (30% for 30 days, 35% for 60 days, 40% for 90 days)
    let feeRate = 0.30;
    if (formData.fundingTerm === '60') feeRate = 0.35;
    if (formData.fundingTerm === '90') feeRate = 0.40;
    
    const funderFee = grossProfit > 0 ? (grossProfit * feeRate) : 0;
    const escrowFee = quoteAmt * 0.025; // 2.5% escrow/admin fee on the funded amount
    const smeProfit = grossProfit - funderFee - escrowFee;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.cessionAgreed) {
            toast.warning('You must agree to the Cession of Receivables to proceed.');
            return;
        }
        setLoading(true);

        try {
            let tenderUrl = null;
            let quoteUrl = null;

            if (formData.tenderAwardFile) {
                const r = ref(storage, `deal_docs/${user.id}_tender_${Date.now()}_${formData.tenderAwardFile.name}`);
                const snap = await uploadBytes(r, formData.tenderAwardFile);
                tenderUrl = await getDownloadURL(snap.ref);
            }
            if (formData.supplierQuoteFile) {
                const r = ref(storage, `deal_docs/${user.id}_quote_${Date.now()}_${formData.supplierQuoteFile.name}`);
                const snap = await uploadBytes(r, formData.supplierQuoteFile);
                quoteUrl = await getDownloadURL(snap.ref);
            }

            await addDoc(collection(db, 'deals'), {
                // Who
                smeId:              user.id,
                smeName:            user.name,
                // Contract
                clientName:         formData.clientName,
                clientType:         formData.clientType,
                contractValue:      Number(formData.contractValue),
                contractPaymentDue: formData.contractPaymentDue,
                tenderRefNumber:    formData.tenderRefNumber,
                // Funding ask
                amount:             Number(formData.supplierQuoteAmount), // what ProcFin pays supplier
                category:           formData.category,
                description:        formData.description,
                // ProcFin economics (indicative)
                fundingTerm:        formData.fundingTerm,
                funderFeeIndicative: funderFee,
                escrowFeeIndicative: escrowFee,
                smePayoutIndicative:  smeProfit,
                // Documents
                tenderAwardUrl:     tenderUrl,
                supplierQuoteUrl:   quoteUrl,
                docUrl:             tenderUrl, // backwards compat
                // Cession
                cessionStatus:      'Agreed — Pending Formalisation',
                // State
                status:             'Pending Review',
                isFastTrack:        isFastTrackEnabled,
                createdAt:          new Date().toISOString(),
            });

            toast.success('Application submitted! ProcFin\'s credit team will review your deal.');
            onBack();
        } catch (error) {
            console.error('Error submitting:', error);
            toast.error('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10 animate-fade-in px-4">
            <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                ← Back to Dashboard
            </button>

            {/* Header */}
            <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2">ProcFin Capital</p>
                <h2 className="text-3xl font-black text-white">Apply for Tender Financing</h2>
                <p className="text-gray-500 mt-2 leading-relaxed text-sm">
                    ProcFin pays your supplier directly. When your client settles the contract, ProcFin recovers their capital and pays you your profit — you never handle the supplier payment.
                </p>
            </div>

            {/* How it works strip */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                    { icon: '📋', step: '1', label: 'Submit your tender award + supplier quote' },
                    { icon: '💰', step: '2', label: 'ProcFin pays the supplier from their warchest' },
                    { icon: '🏦', step: '3', label: 'Your client pays ProcFin. You receive your profit.' },
                ].map(({ icon, step, label }) => (
                    <div key={step} className="bg-[#121318] border border-gray-800/60 rounded-2xl p-4 text-center">
                        <div className="text-2xl mb-2">{icon}</div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Step {step}</p>
                        <p className="text-xs text-gray-400 leading-snug">{label}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Section 1: Contract Details */}
                <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7 space-y-5">
                    <h3 className="font-black text-white flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">1</span>
                        Your Contract / Tender
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div ref={containerRef} className="relative">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Client / Contract Issuer *</label>
                            <input
                                required
                                type="text"
                                placeholder="Search e.g. City of Joburg, Dept of Health, Sasol..."
                                value={formData.clientName}
                                onChange={e => set('clientName', e.target.value)}
                                onFocus={() => {
                                    if (formData.clientName.trim()) {
                                        const filtered = PROCURING_ENTITIES.filter(name =>
                                            name.toLowerCase().includes(formData.clientName.toLowerCase())
                                        ).slice(0, 10);
                                        setSuggestions(filtered);
                                        setShowSuggestions(true);
                                    }
                                }}
                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-50 w-full mt-1 bg-[#1a1c23] border border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-800">
                                    {suggestions.map(name => (
                                        <li key={name}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => {
                                                        let detectedType = 'Government Department';
                                                        const lower = name.toLowerCase();
                                                        if (lower.includes('municipality') || lower.includes('metro')) {
                                                            detectedType = 'Municipality';
                                                        } else if (lower.includes('soe') || lower.includes('eskom') || lower.includes('transnet') || lower.includes('prasa') || lower.includes('soc') || lower.includes('limited') || lower.includes('board') || lower.includes('corporation')) {
                                                            detectedType = 'SOE (Eskom, Transnet, Prasa...)';
                                                        } else if (lower.includes('university') || lower.includes('college') || lower.includes('tvet') || lower.includes('school')) {
                                                            detectedType = 'Educational Institution';
                                                        } else if (lower.includes('hospital') || lower.includes('clinic') || lower.includes('health')) {
                                                            detectedType = 'Healthcare (Hospital, Clinic...)';
                                                        }
                                                        return {
                                                            ...prev,
                                                            clientName: name,
                                                            clientType: detectedType
                                                        };
                                                    });
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs text-gray-300 hover:bg-cyan-500/10 hover:text-white transition-all font-bold"
                                            >
                                                🏢 {name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Client Type</label>
                            <select
                                value={formData.clientType}
                                onChange={e => set('clientType', e.target.value)}
                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                                <option>Government Department</option>
                                <option>Municipality</option>
                                <option>SOE (Eskom, Transnet, Prasa...)</option>
                                <option>Private Company (Retail, Mining, Banking...)</option>
                                <option>Healthcare (Hospital, Clinic...)</option>
                                <option>Construction & Property Developer</option>
                                <option>NGO / Non-profit</option>
                                <option>Educational Institution</option>
                                <option>Other Corporate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Contract Value (ZAR) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R</span>
                                <input
                                    required
                                    type="number"
                                    placeholder="e.g. 1000000"
                                    value={formData.contractValue}
                                    onChange={e => set('contractValue', e.target.value)}
                                    className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Expected Client Payment Date *</label>
                            <input
                                required
                                type="date"
                                value={formData.contractPaymentDue}
                                onChange={e => set('contractPaymentDue', e.target.value)}
                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tender / Contract Reference Number</label>
                            <input
                                type="text"
                                placeholder="e.g. COJ/2024/IT/0045"
                                value={formData.tenderRefNumber}
                                onChange={e => set('tenderRefNumber', e.target.value)}
                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Tender award doc */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tender Award Letter / Contract Document *</label>
                        <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all group">
                            <span className="text-2xl">📄</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                    {formData.tenderAwardFile ? formData.tenderAwardFile.name : 'Upload Tender Award Letter'}
                                </p>
                                <p className="text-xs text-gray-600">PDF, JPG, PNG — max 10MB</p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={e => set('tenderAwardFile', e.target.files[0])}
                            />
                        </label>
                    </div>
                </div>

                {/* Section 2: Supplier Quote */}
                <div className="bg-[#121318] border border-gray-800/60 rounded-3xl p-7 space-y-5">
                    <h3 className="font-black text-white flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">2</span>
                        Supplier Quote (What ProcFin Will Pay)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Supplier Quote Amount (ZAR) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R</span>
                                <input
                                    required
                                    type="number"
                                    placeholder="e.g. 700000"
                                    value={formData.supplierQuoteAmount}
                                    onChange={e => set('supplierQuoteAmount', e.target.value)}
                                    className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                                />
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1.5">ProcFin pays this directly to your supplier</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Procurement Category *</label>
                            <select
                                required
                                value={formData.category}
                                onChange={e => set('category', e.target.value)}
                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                                <option value="">Select Category...</option>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Funding Term *</label>
                            <select
                                required
                                value={formData.fundingTerm}
                                onChange={e => set('fundingTerm', e.target.value)}
                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                                <option value="30">30 Days (30% Fee)</option>
                                <option value="60">31-60 Days (35% Fee)</option>
                                <option value="90">61-90 Days (40% Fee)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">What will the supplier deliver? *</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="e.g. Supply and delivery of 500 units branded workwear to Ekurhuleni Municipality depot within 14 days."
                                value={formData.description}
                                onChange={e => set('description', e.target.value)}
                                className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Supplier quote doc */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Supplier Quote Document</label>
                        <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all group">
                            <span className="text-2xl">🧾</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                    {formData.supplierQuoteFile ? formData.supplierQuoteFile.name : 'Upload Supplier Quote (optional but recommended)'}
                                </p>
                                <p className="text-xs text-gray-600">PDF, JPG, PNG</p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={e => set('supplierQuoteFile', e.target.files[0])}
                            />
                        </label>
                    </div>
                </div>

                {/* Section 3: Live Deal Calculator */}
                {quoteAmt > 0 && contractVal > 0 && (
                    <div className="bg-gradient-to-br from-cyan-600/20 to-blue-700/10 border border-cyan-500/20 rounded-3xl p-7 space-y-4">
                        <h3 className="font-black text-white flex items-center gap-2 text-sm">
                            <span className="text-cyan-400">⚡</span> Your Indicative Deal Breakdown
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Your client pays (contract value)',  value: contractVal,   color: 'text-white',       note: 'Intercepted by ProcFin' },
                                { label: 'ProcFin pays supplier',              value: -quoteAmt,     color: 'text-red-400',     note: 'Paid directly from warchest' },
                                { label: 'Gross Profit',                       value: grossProfit,   color: 'text-gray-300',    note: 'Contract minus Supplier Cost' },
                                { label: `Funder Profit Share (${formData.fundingTerm} days)`, value: -funderFee, color: 'text-amber-400',   note: 'Calculated on gross profit' },
                                { label: 'Escrow & Admin Fee (2.5%)',          value: -escrowFee,    color: 'text-orange-400',  note: 'Calculated on funded amount' },
                                { label: 'Your final payout (net profit)',     value: smeProfit,     color: 'text-emerald-400', note: 'Paid to your account' },
                            ].map(({ label, value, color, note }) => (
                                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800/60 last:border-0">
                                    <div>
                                        <p className="text-sm text-gray-300">{label}</p>
                                        <p className="text-[10px] text-gray-600">{note}</p>
                                    </div>
                                    <span className={`font-black font-mono text-base ${color}`}>
                                        {value < 0 ? '-' : '+'}R{Math.abs(value).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {smeProfit < 0 && (
                            <p className="text-xs text-red-400 font-bold">⚠️ The supplier quote exceeds your contract value. Please check your numbers.</p>
                        )}
                    </div>
                )}

                {/* Section 4: Cession Agreement */}
                <div className="bg-[#121318] border border-amber-500/20 rounded-3xl p-7">
                    <h3 className="font-black text-white flex items-center gap-2 text-sm mb-4">
                        <span className="text-amber-400">🔐</span> Cession of Receivables Agreement
                    </h3>
                    <div className="bg-[#1a1c23]/80 rounded-2xl p-4 text-xs text-gray-500 leading-relaxed space-y-2 mb-5">
                        <p><strong className="text-gray-300">1.</strong> I authorise ProcFin to embed themselves as the designated recipient of all payments from <strong className="text-white">{formData.clientName || '[Client Name]'}</strong> relating to this contract.</p>
                        <p><strong className="text-gray-300">2.</strong> I understand ProcFin will pay the supplier directly and that I will receive no cash until ProcFin has recovered their capital and fees.</p>
                        <p><strong className="text-gray-300">3.</strong> My profit ({smeProfit > 0 ? `≈ R${smeProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` : 'as calculated'}) will be released to my nominated bank account upon contract settlement.</p>
                        <p><strong className="text-gray-300">4.</strong> I confirm the tender award referenced above is genuine and has been awarded to my business.</p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={formData.cessionAgreed}
                            onChange={e => set('cessionAgreed', e.target.checked)}
                            className="mt-1 accent-cyan-500 w-4 h-4 shrink-0"
                        />
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-snug">
                            I agree to the Cession of Receivables and understand the ProcFin cashless funding model.
                        </span>
                    </label>
                </div>
                
                {/* Fast Track Boost */}
                <div className={`border rounded-2xl p-6 flex gap-5 items-start cursor-pointer transition-all ${isFastTrackEnabled ? 'bg-indigo-500/10 border-indigo-500/40 shadow-inner shadow-indigo-500/10' : 'bg-[#121318] border-gray-800/60 hover:bg-[#16181f]'}`} onClick={() => !isEnterprise && set('isFastTrack', !formData.isFastTrack)}>
                    <div className="pt-1">
                        <input 
                            type="checkbox" 
                            checked={isFastTrackEnabled}
                            disabled={isEnterprise}
                            onChange={(e) => set('isFastTrack', e.target.checked)}
                            className="w-5 h-5 rounded border-indigo-500 text-indigo-600 focus:ring-indigo-500 bg-[#0b0c10]"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div>
                        <p className="font-bold text-white flex items-center gap-2">
                            🚀 Priority Funder Routing (24hr Fast Track)
                            {isEnterprise && <span className="bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black px-2 py-0.5 rounded ml-2">Included in Enterprise</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                            Bypass the standard queue. Your funding application is marked as "Urgent" on the Funder Dashboard, guaranteeing a term-sheet review within 24 hours.
                        </p>
                        {!isEnterprise && (
                            <p className="text-indigo-400 font-bold text-sm mt-3">+ R999 (One-off fee)</p>
                        )}
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading || !formData.cessionAgreed}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isFastTrackEnabled && !isEnterprise ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'}`}
                    >
                        {loading ? 'Submitting...' : (isFastTrackEnabled && !isEnterprise ? 'Pay R999 & Submit Fast-Track' : 'Submit Funding Application')}
                    </button>
                </div>

                <p className="text-center text-[10px] text-gray-600 uppercase font-bold tracking-tighter">
                    Reviewed by ProcFin Credit within 24 hours · Cashless · Cession-backed
                </p>
            </form>
        </div>
    );
}
