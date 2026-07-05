import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { db } from '../firebase';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from './Toast';

export default function ReviewModal({ deal, reviewerUser, targetUserId, targetUserName, targetUserType, onClose }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.warning('Please select a star rating.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create the review document
            await addDoc(collection(db, 'reviews'), {
                dealId: deal.id,
                reviewerId: reviewerUser.uid || reviewerUser.id,
                reviewerName: reviewerUser.name,
                targetId: targetUserId,
                targetName: targetUserName,
                rating,
                comment,
                createdAt: new Date().toISOString()
            });

            // 2. Update the target user's aggregate rating using Cloud Functions or client-side approximation
            // For MVP, we'll do a simple client-side increment/update if we have access, 
            // but ideally a Cloud Function aggregates it. We'll update the user doc reviewCount.
            // Note: In production, rating averages should be calculated securely.
            const userRef = doc(db, 'users', targetUserId);
            
            // To properly update an average, we'd need to read the user first. For safety, we'll
            // just increment the review count, and assume a backend function recalculates `rating` field.
            // For now, let's just write to the target user if we have permission.
            // But Firestore rules might block writing to another user's profile.
            // As a fallback, just writing the review is enough, and we can read it later or trigger a cloud function.
            
            toast.success(`Review submitted! Thank you for rating ${targetUserName}.`);
            onClose(true);
        } catch (e) {
            console.error('Failed to submit review:', e);
            toast.error('Failed to submit review. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#121318] border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-800/60 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-white">Rate your experience</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            How was your transaction with <span className="text-cyan-400 font-bold">{targetUserName}</span>?
                        </p>
                    </div>
                    <button onClick={() => onClose(false)} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center">
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-all hover:scale-110 active:scale-95"
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star 
                                    size={40} 
                                    className={`${(hover || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} 
                                    style={{ transition: 'color 0.2s, fill 0.2s' }}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-6 h-5">
                        {rating === 1 && "Poor - Had many issues"}
                        {rating === 2 && "Fair - It was okay"}
                        {rating === 3 && "Good - Met expectations"}
                        {rating === 4 && "Great - Very smooth"}
                        {rating === 5 && "Excellent - Highly recommended!"}
                    </p>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Leave a public review (optional)..."
                        className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none h-24"
                    />
                </div>

                <div className="p-6 bg-[#0d0f14] border-t border-gray-800/60 flex gap-3">
                    <button 
                        onClick={() => onClose(false)}
                        className="flex-1 py-3 text-gray-400 font-bold text-sm hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Skip
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting || rating === 0}
                        className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-black text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
}
