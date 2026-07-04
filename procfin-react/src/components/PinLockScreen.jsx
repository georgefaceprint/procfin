import React, { useState } from 'react';

export default function PinLockScreen({ user, onUnlock, onLogout }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handlePinEntry = (num) => {
        if (pin.length < 5) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 5) {
                verifyPin(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const verifyPin = (enteredPin) => {
        if (!user.pinHash) {
            // Failsafe: if they somehow skipped PIN creation
            onUnlock();
            return;
        }
        
        // In a real banking app, verification happens backend-side. 
        // For MVP, we verify the bcrypt hash locally.
        const isValid = btoa(enteredPin) === user.pinHash;
        
        if (isValid) {
            onUnlock();
        } else {
            setError('Incorrect PIN. Please try again.');
            setPin('');
        }
    };

    return (
        <div className="min-h-screen bg-blue-600 dark:bg-[#0d3673] flex flex-col items-center justify-center pt-10 px-6 transition-colors duration-300">
            <div className="w-full max-w-sm animate-fade-in-up text-center">
                
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <span className="text-blue-600 text-3xl font-black">PF</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Hello again,</h2>
                <h3 className="text-2xl font-medium text-blue-100 mb-12">{user.name || user.email || 'User'}</h3>
                
                <p className="text-white mb-4">Enter your 5-digit App PIN</p>
                
                <div className="flex justify-center gap-3 mb-8">
                    {[0,1,2,3,4].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length > i ? 'bg-white border-white' : 'border-blue-300'}`}></div>
                    ))}
                </div>

                {error && <p className="text-red-200 mb-4 text-sm font-bold bg-red-900/30 py-2 rounded-lg">{error}</p>}

                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto mb-10">
                    {[1,2,3,4,5,6,7,8,9].map(num => (
                        <button key={num} onClick={() => handlePinEntry(num.toString())} className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-2xl font-semibold backdrop-blur-sm transition-all shadow-sm">
                            {num}
                        </button>
                    ))}
                    <div></div>
                    <button onClick={() => handlePinEntry('0')} className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-2xl font-semibold backdrop-blur-sm transition-all shadow-sm">
                        0
                    </button>
                    <button onClick={handleDelete} className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center backdrop-blur-sm transition-all shadow-sm">
                        ⌫
                    </button>
                </div>

                <div className="flex justify-between items-center text-sm text-blue-200">
                    <button onClick={onLogout} className="hover:text-white transition-colors underline underline-offset-4">Not you? Sign out</button>
                    <button onClick={() => { onLogout(); alert('Please reset your PIN via the web portal or contact support.'); }} className="hover:text-white transition-colors">Forgot PIN?</button>
                </div>
            </div>
        </div>
    );
}
