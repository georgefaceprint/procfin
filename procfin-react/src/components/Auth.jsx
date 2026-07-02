import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function Auth({ initialIntent = null, onBack, onLogin }) {
    const roleIntent = typeof initialIntent === 'object' && initialIntent !== null ? initialIntent.role : initialIntent;
    const [intent, setIntent] = useState(roleIntent);
    const [method, setMethod] = useState('select');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resetSent, setResetSent] = useState(false);

    const syncUserToFirestore = async (user, userType) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const userData = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || '',
                type: userType,
                verified: false,
                onboardingComplete: false,
                createdAt: serverTimestamp()
            };

            // Initialize subscription for SMEs
            if (userType === 'SME') {
                userData.subscription = {
                    tier: 'free',
                    status: 'active',
                    updatedAt: serverTimestamp()
                };
            }

            // If initialIntent has lead data from the Wizard, save it!
            if (typeof initialIntent === 'object' && initialIntent !== null && initialIntent.leadData) {
                const lead = initialIntent.leadData;
                userData.companyName = lead.company || '';
                userData.name = lead.name || userData.name;
                userData.whatsapp = lead.whatsapp || '';
                userData.province = lead.province || '';
                userData.town = lead.town || '';
                userData.fundingRequested = initialIntent.amount || 0;
            }

            await setDoc(userRef, userData);
            return userData;
        } else {
            const data = userSnap.data();
            // Migrate existing SMEs without subscription object
            if (data.type === 'SME' && !data.subscription) {
                const sub = { tier: 'free', status: 'active', updatedAt: serverTimestamp() };
                await updateDoc(userRef, { subscription: sub });
                return { uid: user.uid, email: user.email, ...data, subscription: sub };
            }
            return { uid: user.uid, email: user.email, ...data };
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const userProfile = await syncUserToFirestore(result.user, intent);
            onLogin(userProfile);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const processEmailAuth = async (e, action) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let userCredential;
            if (action === 'register') {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userProfile = await syncUserToFirestore(userCredential.user, intent);
                onLogin(userProfile);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                const userRef = doc(db, "users", userCredential.user.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.exists() ? userSnap.data() : { type: intent };
                onLogin({ uid: userCredential.user.uid, email: userCredential.user.email, ...userData });
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        if (e) e.preventDefault();
        if (!email) { setError('Enter your email address above first.'); return; }
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!intent) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex flex-col items-center pt-24 px-6 transition-colors duration-300">
                <div className="max-w-3xl w-full text-center animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">Welcome to ProcFin</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg max-w-xl mx-auto">Please select how you want to use the platform to continue.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <div
                            onClick={() => setIntent('SME')}
                            className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                                🏢
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Business (SME)</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Apply for funding & tenders, and connect with suppliers.</p>
                        </div>

                        <div
                            onClick={() => setIntent('FUNDER')}
                            className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform text-purple-600">
                                💎
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Funder Portal</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Access the portal to deploy capital and review active SME contracts.</p>
                        </div>

                        <div
                            onClick={() => setIntent('SUPPLIER')}
                            className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                                🚚
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Supplier</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Join the verified database and quote directly on SME RFQs.</p>
                        </div>
                    </div>
                    <button onClick={onBack} className="mt-12 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4">
                        &larr; Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (method === 'email') {
        // ── Password Reset Success Screen ─────────────────────────────────────
        if (resetSent) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex flex-col items-center pt-24 px-6">
                    <div className="w-full max-w-md animate-fade-in-up text-center">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-4xl mx-auto mb-8">📨</div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Check Your Email</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            A password reset link has been sent to <strong className="text-gray-900 dark:text-white">{email}</strong>. Follow the link to set a new password.
                        </p>
                        <button
                            onClick={() => { setResetSent(false); setMethod('email'); setError(null); }}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex flex-col items-center pt-24 px-6 transition-colors duration-300">
                <div className="w-full max-w-md animate-fade-in-up">
                    <button onClick={() => setMethod('select')} className="mb-8 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                        <span>&larr;</span> Back to Options
                    </button>

                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Email Access</h2>
                        <div className="mt-2 inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-blue-100 dark:border-blue-800">
                            Accessing as: {intent}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none">
                        <form onSubmit={(e) => e.preventDefault()}>
                            {error && <div className="mb-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">{error}</div>}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    required
                                    placeholder="you@company.com"
                                />
                            </div>
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <button
                                        type="button"
                                        onClick={handlePasswordReset}
                                        disabled={loading || !email}
                                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline disabled:opacity-40 transition-opacity"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    required
                                    minLength="6"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" disabled={loading} onClick={(e) => processEmailAuth(e, 'login')} className="flex-1 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                                    {loading ? '...' : 'Log In'}
                                </button>
                                <button type="button" disabled={loading} onClick={(e) => processEmailAuth(e, 'register')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 py-3 rounded-lg font-medium transition-all disabled:opacity-50">
                                    {loading ? '...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex flex-col items-center pt-24 px-6 transition-colors duration-300">
            <div className="w-full max-w-md text-center animate-fade-in-up">
                <div className="text-left mb-8">
                    <button onClick={() => setIntent(null)} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                        <span>&larr;</span> Change Role
                    </button>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sign In / Join</h2>
                <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-blue-100 dark:border-blue-800 mb-6">
                    Accessing as: {intent}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Please choose an authentication method to log into your ProcFin account.</p>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none">
                    {error && <div className="mb-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">{error}</div>}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 mb-3 disabled:opacity-50"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded-full p-1">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {loading ? 'Authorizing...' : 'Continue with Google'}
                    </button>

                    <button
                        onClick={() => setMethod('email')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-200 py-3.5 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" ry="2" /><polyline points="3 7 12 13 21 7" /></svg>
                        Continue with Email
                    </button>

                    <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-xs mx-auto">
                        By continuing, you agree to our Terms and Privacy Policy. All major authentication providers supported.
                    </p>
                </div>
            </div>
        </div>
    );
}
