import React, { useState } from 'react';
import { auth, db, functions } from '../firebase';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const TEST_ACCOUNTS = {
    '+27792360090': '0792360090@procfin.test',
    '+27737915658': '0737915658@procfin.test'
};

export default function Auth({ initialIntent = null, onBack, onLogin }) {
    const roleIntent = typeof initialIntent === 'object' && initialIntent !== null ? initialIntent.role : initialIntent;
    const [intent, setIntent] = useState(roleIntent);

    // Auth flow steps:
    // 'select_method' → 'phone_entry' → 'pin_entry' (returning) OR 'otp_entry' (new) → 'pin_setup' (new only)
    const [authStep, setAuthStep] = useState('select_method');
    const [isResetMode, setIsResetMode] = useState(false); // true when doing "Forgot PIN" OTP reset

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debugStatus, setDebugStatus] = useState('');

    // ─── Helper: format phone ─────────────────────────────────────────────────
    const formatPhone = (raw) => {
        let f = raw.trim();
        if (f.startsWith('0')) f = '+27' + f.substring(1);
        else if (!f.startsWith('+')) f = '+27' + f;
        return f;
    };

    // ─── Sync user to Firestore after Firebase Auth ───────────────────────────
    const syncUserToFirestore = async (user, userType) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const userData = {
                uid: user.uid,
                id: user.uid,
                email: user.email || '',
                phone: user.phoneNumber || phone,
                name: user.displayName || '',
                type: userType,
                role: userType,
                verified: false,
                onboardingComplete: false,
                createdAt: serverTimestamp(),
                subscription: { tier: 'free', status: 'active', updatedAt: serverTimestamp() }
            };

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
            if ((data.type === 'SME' || data.type === 'SUPPLIER') && !data.subscription) {
                const sub = { tier: 'free', status: 'active', updatedAt: serverTimestamp() };
                await updateDoc(userRef, { subscription: sub });
                return { uid: user.uid, email: user.email, ...data, subscription: sub };
            }
            return { uid: user.uid, email: user.email, ...data };
        }
    };

    // ─── Google Sign-In ───────────────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const userProfile = await syncUserToFirestore(result.user, intent);
            if (!userProfile.pinHash) {
                setAuthStep('pin_setup');
            } else {
                onLogin(userProfile);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 1: Phone entry → check if user exists → route to PIN or OTP ────
    const handlePhoneContinue = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formatted = formatPhone(phone);

        try {
            // Test accounts bypass the REAL SMS backend but still need to check if they exist
            if (TEST_ACCOUNTS[formatted]) {
                const checkPhoneFn = httpsCallable(functions, 'checkPhone');
                const result = await checkPhoneFn({ phoneNumber: formatted });
                
                if (result.data.exists) {
                    setAuthStep('pin_entry');
                } else {
                    setAuthStep('otp_entry');
                }
                setLoading(false);
                return;
            }

            const checkPhoneFn = httpsCallable(functions, 'checkPhone');
            const result = await checkPhoneFn({ phoneNumber: formatted });

            if (result.data.exists) {
                // Returning user → go straight to PIN entry
                setAuthStep('pin_entry');
            } else {
                // New user → send REAL OTP
                const requestOtpFn = httpsCallable(functions, 'requestOtp');
                await requestOtpFn({ phoneNumber: formatted });
                setAuthStep('otp_entry');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to continue. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Returning user: verify PIN ───────────────────────────────────────────
    const handleVerifyPin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formatted = formatPhone(phone);

        try {
            if (TEST_ACCOUNTS[formatted]) {
                // Test account pin verify simulation
                const testEmail = TEST_ACCOUNTS[formatted];
                const testPass = 'test47183';
                const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPass);
                
                const userRef = doc(db, 'users', userCredential.user.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.exists() ? { uid: userCredential.user.uid, id: userCredential.user.uid, ...userSnap.data() } : { uid: userCredential.user.uid, id: userCredential.user.uid };
                
                // Verify the PIN hash matches for the test account
                if (userData.pinHash && userData.pinHash !== btoa(pin)) {
                    throw new Error('Incorrect passcode.');
                }
                
                onLogin(userData);
                return;
            }

            const verifyPinFn = httpsCallable(functions, 'verifyPin');
            const result = await verifyPinFn({ phoneNumber: formatted, pin });

            const userCredential = await signInWithCustomToken(auth, result.data.token);
            const userRef = doc(db, 'users', userCredential.user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? { uid: userCredential.user.uid, id: userCredential.user.uid, ...userSnap.data() } : { uid: userCredential.user.uid, id: userCredential.user.uid };
            onLogin(userData);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Incorrect passcode. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Forgot PIN → send OTP ────────────────────────────────────────────────
    const handleForgotPin = async () => {
        setLoading(true);
        setError(null);
        const formatted = formatPhone(phone);
        try {
            const requestOtpFn = httpsCallable(functions, 'requestOtp');
            await requestOtpFn({ phoneNumber: formatted });
            setIsResetMode(true);
            setOtp('');
            setAuthStep('otp_entry');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to send reset code.');
        } finally {
            setLoading(false);
        }
    };

    // ─── New user (or reset): verify OTP ─────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formatted = formatPhone(phone);

        try {
            // Test account shortcut
            if (TEST_ACCOUNTS[formatted]) {
                const testEmail = TEST_ACCOUNTS[formatted];
                const testPass = 'test47183';
                let currentUser;
                try {
                    const cred = await signInWithEmailAndPassword(auth, testEmail, testPass);
                    currentUser = cred.user;
                } catch {
                    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPass);
                    currentUser = cred.user;
                    await setDoc(doc(db, 'users', currentUser.uid), {
                        phone: formatted, type: intent || 'SME', role: intent || 'SME',
                        name: 'Demo Account', createdAt: Date.now(), onboardingComplete: false, pinHash: btoa('12345'),
                        subscription: { tier: 'free', status: 'active' }
                    });
                }
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                const uData = userDoc.exists() ? userDoc.data() : {};
                const uType = uData.type || intent || 'SME';
                onLogin({ uid: currentUser.uid, id: currentUser.uid, email: testEmail, ...uData, type: uType, role: uType });
                return;
            }

            const verifyOtpFn = httpsCallable(functions, 'verifyOtp');
            const result = await verifyOtpFn({ phoneNumber: formatted, code: otp });

            const userCredential = await signInWithCustomToken(auth, result.data.token);
            const userProfile = await syncUserToFirestore(userCredential.user, intent);

            // After OTP: always go to PIN setup (new user or reset)
            setPin('');
            setConfirmPin('');
            setAuthStep('pin_setup');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Invalid OTP code.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Set / Reset PIN ──────────────────────────────────────────────────────
    const handlePinSetup = async (e) => {
        e.preventDefault();
        if (pin.length !== 5) { setError('PIN must be exactly 5 digits.'); return; }
        if (pin !== confirmPin) { setError('Passcodes do not match.'); return; }

        setLoading(true);
        setError(null);
        try {
            const pinHash = btoa(pin);
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { pinHash, pinWrongAttempts: 0, pinLockedUntil: null });
            const userSnap = await getDoc(userRef);
            onLogin({ uid: auth.currentUser.uid, id: auth.currentUser.uid, ...userSnap.data() });
        } catch (err) {
            console.error(err);
            setError('Failed to set passcode. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Email Auth ───────────────────────────────────────────────────────────
    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        if (isRegistering && password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        try {
            let userCredential;
            if (isRegistering) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            const userProfile = await syncUserToFirestore(userCredential.user, intent);
            if (!userProfile.pinHash) {
                setAuthStep('pin_setup');
            } else {
                onLogin(userProfile);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    // ─── ROLE SELECTION ───────────────────────────────────────────────────────
    if (!intent) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex flex-col items-center pt-24 px-6 transition-colors duration-300">
                <div className="max-w-3xl w-full text-center animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">Welcome to ProcFin</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg max-w-xl mx-auto">Please select how you want to use the platform to continue.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <div onClick={() => setIntent('SME')} className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🏢</div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Business (SME)</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Apply for funding & tenders, and connect with suppliers.</p>
                        </div>
                        <div onClick={() => setIntent('FUNDER')} className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform text-purple-600">💎</div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Funder Portal</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Access the portal to deploy capital and review active SME contracts.</p>
                        </div>
                        <div onClick={() => setIntent('SUPPLIER')} className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🚚</div>
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

    const greetingName = (typeof initialIntent === 'object' && initialIntent?.leadData?.name) ? initialIntent.leadData.name.split(' ')[0] : null;

    const stepTitles = {
        select_method: 'Sign In / Join',
        phone_entry: 'Enter Mobile',
        pin_entry: 'Welcome Back',
        otp_entry: isResetMode ? 'Reset Passcode' : 'Verify Number',
        pin_setup: isResetMode ? 'Set New Passcode' : 'Secure Your Account',
        email_auth: isRegistering ? 'Create Account' : 'Sign In',
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex flex-col items-center pt-24 px-6 transition-colors duration-300">
            <div className="w-full max-w-md text-center animate-fade-in-up">

                {authStep === 'select_method' && (
                    <div className="text-left mb-8">
                        <button onClick={() => setIntent(null)} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                            <span>&larr;</span> Change Role
                        </button>
                    </div>
                )}

                {greetingName && authStep === 'select_method' ? (
                    <>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome, {greetingName}!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Let's secure your funding account.</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stepTitles[authStep]}</h2>
                        <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-blue-100 dark:border-blue-800 mb-6">
                            Accessing as: {intent}
                        </div>
                    </>
                )}

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none transition-all">
                    {error && <div className="mb-6 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">{error}</div>}

                    {/* ── METHOD SELECTION ── */}
                    {authStep === 'select_method' && (
                        <>
                            <button onClick={() => { setAuthStep('phone_entry'); setError(null); }} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white py-4 px-4 rounded-2xl font-bold transition-all shadow-lg mb-4 disabled:opacity-50 text-lg">
                                📱 Continue with Mobile
                            </button>
                            <button onClick={() => { setAuthStep('email_auth'); setIsRegistering(false); setError(null); }} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-4 px-4 rounded-2xl font-bold transition-all shadow-md mb-4 disabled:opacity-50 text-lg">
                                ✉️ Continue with Email
                            </button>
                            <div className="relative flex py-3 items-center">
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3.5 px-4 rounded-xl font-medium transition-all disabled:opacity-50">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded-full p-1">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                {loading ? 'Authorizing...' : 'Continue with Google'}
                            </button>
                        </>
                    )}

                    {/* ── EMAIL AUTH ── */}
                    {authStep === 'email_auth' && (
                        <form onSubmit={handleEmailAuth} className="text-left space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    required placeholder="name@company.com" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    required placeholder="••••••••" />
                            </div>
                            {isRegistering && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        required placeholder="••••••••" />
                                </div>
                            )}
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 mt-6">
                                {loading ? (isRegistering ? 'Creating Account...' : 'Signing In...') : (isRegistering ? 'Sign Up' : 'Sign In')}
                            </button>
                            <div className="text-center pt-2">
                                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(null); }} className="text-sm text-blue-600 hover:underline transition-colors">
                                    {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                </button>
                            </div>
                            <button type="button" onClick={() => setAuthStep('select_method')} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white py-2 transition-colors">Cancel</button>
                        </form>
                    )}

                    {/* ── PHONE ENTRY ── */}
                    {authStep === 'phone_entry' && (
                        <form onSubmit={handlePhoneContinue} className="text-left">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">WhatsApp / Mobile Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-4 text-xl tracking-wider text-gray-900 dark:text-white placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none mb-6"
                                required placeholder="082 123 4567" autoFocus
                            />
                            <button type="submit" disabled={loading || phone.length < 9} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                                {loading ? 'Checking...' : 'Continue →'}
                            </button>
                            <button type="button" onClick={() => setAuthStep('select_method')} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white py-2 transition-colors">Cancel</button>
                        </form>
                    )}

                    {/* ── PIN ENTRY (returning users) ── */}
                    {authStep === 'pin_entry' && (
                        <form onSubmit={handleVerifyPin} className="text-left">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 text-center">Enter your 5-digit passcode for</p>
                            <p className="text-center font-bold text-gray-900 dark:text-white mb-6">{phone}</p>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength="5"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-5 text-center text-4xl tracking-[0.6em] font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none mb-6"
                                required placeholder="•••••" autoFocus
                            />
                            <button type="submit" disabled={loading || pin.length !== 5} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                                {loading ? 'Verifying...' : 'Login →'}
                            </button>
                            <button
                                type="button"
                                onClick={handleForgotPin}
                                disabled={loading}
                                className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline py-2 transition-colors font-semibold"
                            >
                                Forgot Passcode? Send Reset Code
                            </button>
                            <button type="button" onClick={() => { setAuthStep('phone_entry'); setPin(''); setError(null); }} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white py-2 transition-colors">
                                ← Change Number
                            </button>
                        </form>
                    )}

                    {/* ── OTP ENTRY (new user or reset) ── */}
                    {authStep === 'otp_entry' && (
                        <form onSubmit={handleVerifyOtp} className="text-left">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 text-center">
                                {isResetMode ? 'Enter the reset code sent to' : 'We sent a 6-digit code to'}
                            </p>
                            <p className="text-center font-bold text-gray-900 dark:text-white mb-6">{phone}</p>
                            <input
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-4 text-center text-3xl tracking-[0.5em] font-mono text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none mb-6"
                                required placeholder="••••••" autoFocus
                            />
                            <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button type="button" onClick={() => { setAuthStep('phone_entry'); setOtp(''); setIsResetMode(false); setError(null); }} className="w-full mt-4 text-sm text-blue-600 hover:underline py-2 transition-colors text-center">
                                ← Change number or resend
                            </button>
                        </form>
                    )}

                    {/* ── PIN SETUP (new user or reset) ── */}
                    {authStep === 'pin_setup' && (
                        <form onSubmit={handlePinSetup} className="text-left">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                                {isResetMode
                                    ? 'Set your new 5-digit passcode. You\'ll use this to log in every time.'
                                    : 'Create a 5-digit passcode. You\'ll use this to log in instantly next time.'}
                            </p>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">New Passcode</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength="5"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-4 text-center text-3xl tracking-[0.5em] font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none mb-4"
                                required placeholder="•••••" autoFocus
                            />
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Confirm Passcode</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength="5"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-4 text-center text-3xl tracking-[0.5em] font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none mb-6"
                                required placeholder="•••••"
                            />
                            <button type="submit" disabled={loading || pin.length !== 5 || confirmPin.length !== 5} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                                {loading ? 'Saving...' : isResetMode ? 'Set New Passcode' : 'Secure My Account'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
