import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from './Toast';
import { CATEGORIES } from '../constants/categories';

const PROVINCES = [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
    "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

export default function ProfileEdit({ user, onBack, onSaved }) {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const toast = useToast();
    const [form, setForm] = useState({
        csdNumber: user.csdNumber || '',
        name: user.name || '',
        registrationNumber: user.registrationNumber || '',
        phone: user.phone || '',
        province: user.province || '',
        address: user.address || '',
        preferredCategories: Array.isArray(user.preferredCategories)
            ? user.preferredCategories
            : (Array.isArray(user.industry) ? user.industry : (user.industry ? [user.industry] : [])),
        newPin: '',
        confirmPin: '',
    });
    const [isVerifying, setIsVerifying] = useState(false);

    const toggleCategory = (cat) => {
        setForm(prev => {
            const cats = [...prev.preferredCategories];
            if (cats.includes(cat)) {
                return { ...prev, preferredCategories: cats.filter(c => c !== cat) };
            } else if (cats.length < 5) {
                return { ...prev, preferredCategories: [...cats, cat] };
            }
            return prev;
        });
    };

    const handleVerifyCsd = async () => {
        if (!form.csdNumber) return;
        setIsVerifying(true);
        try {
            const res = await fetch(`https://us-central1-lambolimos.cloudfunctions.net/verifyCsd?csdNumber=${form.csdNumber}`);
            const result = await res.json();
            if (result.success && result.data) {
                setForm(prev => ({
                    ...prev,
                    name: result.data.companyName || prev.name,
                    registrationNumber: result.data.registrationNumber || prev.registrationNumber,
                    preferredCategories: result.data.preferredCategories || prev.preferredCategories,
                    address: result.data.address || prev.address,
                    province: result.data.province || prev.province,
                }));
                toast.success("CSD verified and profile autofilled!");
            } else {
                toast.error(result.error || "Could not verify CSD number.");
            }
        } catch (err) {
            toast.error("Network error while verifying CSD.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (form.preferredCategories.length === 0) {
            toast.warning('Please select at least one matching category.');
            return;
        }

        // Passcode PIN validation
        const pinTrimmed = form.newPin.trim();
        if (pinTrimmed) {
            if (!/^\d{5}$/.test(pinTrimmed)) {
                toast.warning('Your passcode must be exactly 5 digits.');
                return;
            }
            if (pinTrimmed !== form.confirmPin.trim()) {
                toast.warning('Confirm passcode does not match.');
                return;
            }
        }

        setLoading(true);
        try {
            const updates = {
                csdNumber: form.csdNumber,
                name: form.name,
                registrationNumber: form.registrationNumber,
                phone: form.phone,
                province: form.province,
                address: form.address,
                industry: form.preferredCategories,
                preferredCategories: form.preferredCategories,
                profileCompleted: true,
            };

            if (pinTrimmed) {
                updates.pinHash = btoa(pinTrimmed);
            }

            await setDoc(doc(db, 'users', user.uid || user.id), updates, { merge: true });

            setSaved(true);
            setTimeout(() => {
                onSaved && onSaved({ 
                    ...user, 
                    ...form, 
                    industry: form.preferredCategories, 
                    profileCompleted: true,
                    ...(pinTrimmed ? { pinHash: btoa(pinTrimmed) } : {}) 
                });
            }, 1200);
        } catch (err) {
            console.error('Profile save error:', err);
            toast.error('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (saved) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-center px-6">
                <div className="text-center max-w-xs animate-fade-in-up">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Profile Updated!</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Your matching criteria have been saved.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] py-10 px-6 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                    <span>&larr;</span> Back to Dashboard
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Edit Your Profile</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">A complete profile improves your score for {user.type === 'SME' ? 'funding & suppliers' : user.type === 'SUPPLIER' ? 'SME buyers' : 'SME deals'}.</p>
                </div>

                {/* Completion Progress */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-8 flex items-center gap-4">
                    {(() => {
                        const fields = [form.name, form.registrationNumber, form.province, form.address, form.preferredCategories.length > 0];
                        const filled = fields.filter(Boolean).length;
                        const pct = Math.round((filled / fields.length) * 100);
                        return (
                            <>
                                <div className="relative w-14 h-14 flex-shrink-0">
                                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="4" />
                                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth="4"
                                            strokeDasharray={`${2 * Math.PI * 20}`}
                                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                                            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900 dark:text-white">{pct}%</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Profile Completeness</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{filled} of {fields.length} fields completed · {pct < 100 ? 'Complete your profile to improve matching' : 'Profile fully complete!'}</p>
                                </div>
                            </>
                        );
                    })()}
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Section 1: Identity */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm">🏢</span>
                            Business Identity
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    CSD Registration Number (Optional)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.csdNumber}
                                        onChange={e => setForm({ ...form, csdNumber: e.target.value })}
                                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
                                        placeholder="e.g. MAAA0000000"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyCsd}
                                        disabled={!form.csdNumber || isVerifying}
                                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
                                    >
                                        {isVerifying ? 'Verifying...' : 'Verify & Autofill'}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    {user.type === 'SUPPLIER' ? 'Registered Supplier Name' : 'Company / Display Name'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. Acme Logistics (Pty) Ltd"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Registration Number (CIPC)</label>
                                    <input
                                        type="text"
                                        value={form.registrationNumber}
                                        onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="YYYY/NNNNNN/NN"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="+27 82 123 4567"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Location */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-sm">📍</span>
                            Location
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Province</label>
                                <select
                                    value={form.province}
                                    onChange={e => setForm({ ...form, province: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">Select Province</option>
                                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Physical Business Address</label>
                                <textarea
                                    rows="3"
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Street, City, Postal Code"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Matching Categories */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-sm">🏷️</span>
                                Matching Categories
                            </h3>
                            <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg ${form.preferredCategories.length >= 5 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                {form.preferredCategories.length}/5 Selected
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Select up to 5 categories. Your eligibility score for {user.type === 'SME' ? 'funding and suppliers' : user.type === 'SUPPLIER' ? 'SME buyers' : 'SME deals'} is based on these.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {CATEGORIES.map(cat => {
                                const selected = form.preferredCategories.includes(cat);
                                const maxed = form.preferredCategories.length >= 5 && !selected;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => !maxed && toggleCategory(cat)}
                                        className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border ${selected
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : maxed
                                                ? 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600'
                                            }`}
                                    >
                                        {selected && <span className="mr-1">✓</span>}{cat}
                                    </button>
                                );
                            })}
                        </div>

                        {form.preferredCategories.length > 0 && (
                            <div className="mt-5 flex flex-wrap gap-2">
                                {form.preferredCategories.map(cat => (
                                    <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800">
                                        {cat}
                                        <button type="button" onClick={() => toggleCategory(cat)} className="ml-1 hover:text-red-500 transition-colors">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 4: Security Settings */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-sm">🔒</span>
                            Security Settings (Passcode / PIN)
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Update your 5-digit passcode. This passcode will be used for fast logins in the future instead of SMS OTP. Leave blank if you don't want to change it.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New 5-digit Passcode</label>
                                <input
                                    type="password"
                                    maxLength={5}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    value={form.newPin}
                                    onChange={e => setForm({ ...form, newPin: e.target.value.replace(/\D/g, '') })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-[0.3em] text-center text-lg"
                                    placeholder="•••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirm Passcode</label>
                                <input
                                    type="password"
                                    maxLength={5}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    value={form.confirmPin}
                                    onChange={e => setForm({ ...form, confirmPin: e.target.value.replace(/\D/g, '') })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-[0.3em] text-center text-lg"
                                    placeholder="•••••"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info note about Vault */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-blue-500 text-xl flex-shrink-0">ℹ️</span>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Compliance documents (CSD registration, SARS Tax Clearance, B-BBEE Certificate) should be uploaded via your <strong>Document Vault</strong>.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gray-900 dark:bg-blue-600 hover:opacity-90 text-white rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : '✓ Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}
