import React, { useState } from 'react';
import { Landmark, ArrowLeft, Percent, Calendar, FileText, CheckCircle2, TrendingUp } from 'lucide-react';

export default function Calculator({ user, onBack, onNavigate }) {
    const [poAmount, setPoAmount] = useState(100000); // Default R100,000
    const [repaymentDays, setRepaymentDays] = useState(30); // 30, 60, 90
    const [supplierMargin, setSupplierMargin] = useState(70); // 70% cost of goods sold (Supplier Payout)

    // Calculate rates
    const platformFeeRate = 0.025; // 2.5% flat fee
    const funderProfitSplitRate = repaymentDays === 30 ? 0.30 : repaymentDays === 60 ? 0.35 : 0.40;

    // Calculations
    const supplierPayout = (poAmount * supplierMargin) / 100;
    const platformFee = poAmount * platformFeeRate;
    
    // Profit Split Logic
    const grossProfit = poAmount - supplierPayout;
    const funderInterest = grossProfit > 0 ? (grossProfit * funderProfitSplitRate) : 0;
    const totalFees = platformFee + funderInterest;
    
    // Remaining profit retained by SME
    const smeProfit = grossProfit - totalFees;
    const profitPercentage = ((smeProfit / poAmount) * 100).toFixed(1);

    const handleApply = () => {
        // Navigate to the funding-request view prefilled with calculated values
        onNavigate('funding-request', {
            poAmount: poAmount,
            supplierPayout: supplierPayout,
            repaymentDays: repaymentDays,
            supplierMargin: supplierMargin
        });
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 bg-[#121318] p-6 rounded-2xl border border-gray-800/50 shadow-md">
                <button onClick={onBack} className="p-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors">
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        PO Funding Cost Calculator <Landmark size={18} className="text-cyan-400 animate-pulse" />
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Calculate interest, margins, and retained profits for your PO Financing.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Column */}
                <div className="lg:col-span-7 bg-[#121318] border border-gray-800/50 p-6 md:p-8 rounded-3xl space-y-8 shadow-sm">
                    {/* PO Amount Input */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                <FileText size={14} className="text-cyan-500" /> Purchase Order Amount (ZAR)
                            </label>
                            <span className="font-mono text-xl font-black text-cyan-400">R {poAmount.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="20000"
                            max="1500000"
                            step="5000"
                            value={poAmount}
                            onChange={(e) => setPoAmount(Number(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>R20k</span>
                            <span>R500k</span>
                            <span>R1.0M</span>
                            <span>R1.5M</span>
                        </div>
                    </div>

                    {/* Repayment Days (Tabs) */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Calendar size={14} className="text-cyan-500" /> Repayment Term
                        </label>
                        <div className="grid grid-cols-3 gap-3 bg-[#1a1c23]/60 p-1.5 rounded-xl border border-gray-800">
                            {[30, 60, 90].map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    onClick={() => setRepaymentDays(days)}
                                    className={`py-3 rounded-lg font-bold text-xs transition-all ${
                                        repaymentDays === days
                                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {days} Days
                                    <span className="block text-[8px] font-normal opacity-60 mt-0.5">
                                        ({days === 30 ? 30 : days === 60 ? 35 : 40}% Profit Split)
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Supplier Payout Margin */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                <Percent size={14} className="text-cyan-500" /> Supplier Cost Payout
                            </label>
                            <span className="font-mono text-base font-bold text-gray-200">{supplierMargin}% (R {supplierPayout.toLocaleString()})</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="90"
                            step="1"
                            value={supplierMargin}
                            onChange={(e) => setSupplierMargin(Number(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>50% (Lower Cost)</span>
                            <span>70% (Avg)</span>
                            <span>90% (High Cost)</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal">
                            This is the percentage of the PO that needs to be paid directly to your supplier to manufacture/deliver the goods.
                        </p>
                    </div>
                </div>

                {/* Outputs Column */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-[#121318] border border-gray-800/50 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white mb-6 pb-3 border-b border-gray-800/40">Financial Breakdown</h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Total Invoice Value</span>
                                    <span className="font-mono text-white">R {poAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Direct Supplier Payout</span>
                                    <span className="font-mono text-white">R {supplierPayout.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Funder Interest ({repaymentDays} Days - {repaymentDays === 30 ? 30 : repaymentDays === 60 ? 35 : 40}%)</span>
                                    <span className="font-mono text-red-400">R {funderInterest.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Platform Escrow Fee (2.5%)</span>
                                    <span className="font-mono text-red-400">R {platformFee.toLocaleString()}</span>
                                </div>

                                <div className="pt-4 border-t border-gray-800 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Your Net Retained Profit</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">({profitPercentage}% profit margin)</p>
                                    </div>
                                    <div className="font-mono text-2xl font-black text-emerald-400 text-right">
                                        R {smeProfit.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {smeProfit < 0 ? (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-[11px] leading-relaxed mt-6">
                                ⚠ <strong>Negative Profit Margin:</strong> The direct supplier cost plus financing interest exceeds the value of the Purchase Order. We recommend negotiating a lower price with your supplier or a higher margin on your tender.
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-[11px] leading-relaxed mt-6">
                                ✓ <strong>Healthy Margin:</strong> You retain R{smeProfit.toLocaleString()} of the PO value as net cash profit upon corporate contract settlement.
                            </div>
                        )}

                        <button
                            onClick={handleApply}
                            disabled={smeProfit < 0}
                            className="w-full mt-6 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-bold shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <TrendingUp size={16} /> Apply for PO Financing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
