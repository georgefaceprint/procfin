import React, { useState } from 'react';
import { Calculator, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DealAnalyzer({ onBack }) {
    const [poValue, setPoValue] = useState('');
    const [supplierQuote, setSupplierQuote] = useState('');
    const [estimatedDays, setEstimatedDays] = useState(30);

    const poValueNum = Number(poValue) || 0;
    const supplierQuoteNum = Number(supplierQuote) || 0;

    // ProcFin Platform Fee: 2.5% of Supplier Quote
    const platformFee = supplierQuoteNum * 0.025;

    // ProcFin Escrow/Interest Fee: ~2.5% per month (30 days) of Supplier Quote
    const interestFee = supplierQuoteNum * 0.025 * (estimatedDays / 30);

    const totalCosts = supplierQuoteNum + platformFee + interestFee;
    const netProfit = poValueNum - totalCosts;
    const profitMargin = poValueNum > 0 ? (netProfit / poValueNum) * 100 : 0;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    const isProfitable = netProfit > 0;

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 animate-fade-in">
            <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                ← Back to Dashboard
            </button>

            <div className="mb-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Calculator className="text-cyan-400" size={32} />
                    Deal Profit Analyzer
                </h2>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-2xl">
                    Input your government or corporate Purchase Order value and your supplier's quote. We will instantly calculate your net profit margin after factoring in ProcFin platform fees and escrow interest.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs Column */}
                <div className="space-y-6">
                    <div className="bg-[#121318] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 text-6xl">📝</div>
                        <h3 className="text-lg font-black text-white mb-6">Deal Parameters</h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">End-Buyer PO Value (ZAR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R</span>
                                    <input 
                                        type="number" 
                                        value={poValue}
                                        onChange={e => setPoValue(e.target.value)}
                                        placeholder="e.g. 500000"
                                        className="w-full bg-gray-900/60 border border-gray-800 rounded-2xl pl-10 pr-4 py-3.5 text-white font-mono font-bold focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Supplier Quote (ZAR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R</span>
                                    <input 
                                        type="number" 
                                        value={supplierQuote}
                                        onChange={e => setSupplierQuote(e.target.value)}
                                        placeholder="e.g. 300000"
                                        className="w-full bg-gray-900/60 border border-gray-800 rounded-2xl pl-10 pr-4 py-3.5 text-white font-mono font-bold focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Estimated Payout Term</span>
                                    <span className="text-cyan-400">{estimatedDays} Days</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="15" 
                                    max="90" 
                                    step="15"
                                    value={estimatedDays}
                                    onChange={e => setEstimatedDays(Number(e.target.value))}
                                    className="w-full accent-cyan-500"
                                />
                                <div className="flex justify-between text-[10px] text-gray-600 font-bold mt-1">
                                    <span>15 Days</span>
                                    <span>90 Days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 text-xs text-gray-400 leading-relaxed">
                        <strong className="text-cyan-400 font-black uppercase tracking-widest">💡 How it works:</strong>
                        <br />ProcFin charges a flat <span className="text-white font-bold">2.5% Platform Fee</span> on the supplier quote. Additionally, we charge an interest rate of <span className="text-white font-bold">~2.5% per 30 days</span> while the funds are locked in escrow waiting for your buyer to pay.
                    </div>
                </div>

                {/* Results Column */}
                <div className="space-y-6">
                    <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-500 ${isProfitable || poValueNum === 0 ? 'bg-[#121318] border-emerald-500/30' : 'bg-[#1a1315] border-red-500/30'}`}>
                        <div className="absolute top-0 right-0 p-6 opacity-5 text-6xl">📊</div>
                        <h3 className="text-lg font-black text-white mb-6">Financial Breakdown</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800/60">
                                <span className="text-gray-400 font-medium text-sm">Gross Revenue (PO)</span>
                                <span className="text-white font-mono font-bold text-lg">R {poValueNum.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Supplier Cost</span>
                                <span className="text-red-400 font-mono">-R {supplierQuoteNum.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">ProcFin Platform Fee (2.5%)</span>
                                <span className="text-red-400 font-mono">-R {platformFee.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm pb-4 border-b border-gray-800/60">
                                <span className="text-gray-500">Escrow Interest ({estimatedDays} days)</span>
                                <span className="text-red-400 font-mono">-R {interestFee.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-end pt-2">
                                <span className="text-white font-black text-lg">Net Profit</span>
                                <div className="text-right">
                                    <div className={`text-4xl font-black font-mono tracking-tighter ${isProfitable ? 'text-emerald-400' : 'text-red-500'}`}>
                                        {isProfitable ? '' : '-'}R {Math.abs(netProfit).toLocaleString()}
                                    </div>
                                    <div className="text-sm font-bold mt-1 text-gray-500">
                                        Margin: <span className={isProfitable ? 'text-emerald-400' : 'text-red-500'}>{profitMargin.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actionable Banner */}
                        <div className="mt-8">
                            {poValueNum === 0 || supplierQuoteNum === 0 ? (
                                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center text-sm text-gray-500 font-medium">
                                    Enter deal parameters to analyze profitability.
                                </div>
                            ) : isProfitable ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex gap-4 items-start">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><TrendingUp size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-emerald-400">Highly Profitable Deal</h4>
                                        <p className="text-xs text-emerald-400/80 mt-1">This deal yields a strong {roi.toFixed(1)}% Return on Investment. We recommend securing funding.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-4 items-start">
                                    <div className="p-2 bg-red-500/20 rounded-xl text-red-500"><AlertTriangle size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-red-500">Unprofitable Deal</h4>
                                        <p className="text-xs text-red-500/80 mt-1">The supplier costs and funding fees exceed your buyer's PO value. Do not proceed.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
