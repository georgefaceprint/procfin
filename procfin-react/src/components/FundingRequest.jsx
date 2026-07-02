import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CATEGORIES } from '../constants/categories';
import { useToast } from './Toast';

export default function FundingRequest({ user, params, onBack }) {
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [formData, setFormData] = useState({
        amount: params?.amount || '',
        category: params?.category || '',
        description: params?.description || '',
        file: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let fileUrl = null;
            if (formData.file) {
                const storageRef = ref(storage, `deal_docs/${user.id}_${Date.now()}_${formData.file.name}`);
                const snapshot = await uploadBytes(storageRef, formData.file);
                fileUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, "deals"), {
                smeId: user.id,
                smeName: user.name,
                amount: Number(formData.amount),
                category: formData.category,
                description: formData.description,
                docUrl: fileUrl,
                status: 'Pending Review',
                createdAt: new Date().toISOString()
            });

            toast.success('Funding request submitted! The platform funder has been notified.');
            onBack();
        } catch (error) {
            console.error("Error submitting funding request:", error);
            toast.error('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-10 animate-fade-in px-4">
            <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2">
                <span>&larr;</span> Back to Dashboard
            </button>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Apply for Tender Funding</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">Submit your request to the platform funder and secure the capital needed for your project.</p>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Funding Amount (ZAR)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R</span>
                            <input
                                type="number"
                                required
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                placeholder="e.g. 250000"
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Funding Category</label>
                        <select
                            required
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Select Category...</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {formData.category && (
                            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                Platform Funder is active for this category
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Purpose of Funding</label>
                        <textarea
                            required
                            rows="4"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Briefly describe the tender or business needs this funding will fulfill."
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Supporting Documents</label>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Upload POs, Invoices, or Bank Statements</p>
                        <input
                            type="file"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Submitting request...' : 'Submit Funding Request'}
                    </button>

                    <p className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                        Protected by ProcFin Escrow & Verification Systems
                    </p>
                </form>
            </div>
        </div>
    );
}
