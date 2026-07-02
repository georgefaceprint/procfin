import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CATEGORIES } from '../constants/categories';
import { useToast } from './Toast';

export default function RfqForm({ user, rfqCount, onBack }) {
    const tier = user.subscription?.tier || 'free';
    const isLimitReached = tier === 'free' && rfqCount >= 2;
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        specs: '',
        location: '',
        file: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLimitReached) {
            toast.error('Free tier limit reached (2 active RFQs). Please upgrade to Pro for unlimited requests.');
            return;
        }
        setLoading(true);

        try {
            let fileUrl = null;
            if (formData.file) {
                const storageRef = ref(storage, `rfq_docs/${user.id}_${Date.now()}_${formData.file.name}`);
                const snapshot = await uploadBytes(storageRef, formData.file);
                fileUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, "rfqs"), {
                smeId: user.id,
                smeName: user.name,
                smeTier: user.subscription?.tier || 'free',
                title: formData.title,
                category: formData.category,
                specs: formData.specs,
                location: formData.location,
                docUrl: fileUrl,
                status: 'Requested',
                quotes: [],
                createdAt: new Date().toISOString()
            });

            toast.success('Quotation request securely broadcasted to verified suppliers!');
            onBack();
        } catch (error) {
            console.error("Error submitting RFQ:", error);
            toast.error('Failed to broadcast RFQ. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-10 animate-fade-in">
            <button onClick={onBack} className="mb-8 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">&larr; Back</button>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Request a Quotation</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Broadcast your requirements to verified suppliers in our network.</p>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What do you need?</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 50 Dell Laptops, or 20 Tons Cement"
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Supplier Category</label>
                        <select
                            required
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Select Category...</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Detailed Specifications</label>
                        <textarea
                            required
                            rows="4"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Mention specific grades, delivery timelines, etc."
                            onChange={e => setFormData({ ...formData, specs: e.target.value })}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Delivery Location</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="City/Province"
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Reference Document (Optional)</label>
                        <input
                            type="file"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || isLimitReached}
                        className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isLimitReached ? 'bg-indigo-600 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'}`}
                    >
                        {loading ? 'Broadcasting...' : isLimitReached ? '💎 Upgrade to Pro' : 'Broadcast Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}
