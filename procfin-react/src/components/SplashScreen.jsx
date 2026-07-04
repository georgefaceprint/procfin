import React from 'react';

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] bg-black animate-fade-out overflow-hidden" style={{ animationDelay: '3.5s', animationFillMode: 'forwards' }}>
            
            <style>{`
                @keyframes splashSlam {
                    0% { transform: scale(2.5); opacity: 0; filter: blur(30px); }
                    100% { transform: scale(1.2); opacity: 1; filter: blur(0px); }
                }
                @keyframes splashProgress {
                    0% { width: 0%; opacity: 0; filter: drop-shadow(0 0 10px rgba(255,255,255,0.8)); }
                    10% { opacity: 1; }
                    80% { width: 85%; }
                    100% { width: 100%; opacity: 0; filter: drop-shadow(0 0 20px rgba(255,255,255,1)); }
                }
                @keyframes sheen {
                    0% { transform: translateX(-200%) skewX(-30deg); }
                    100% { transform: translateX(300%) skewX(-30deg); }
                }
            `}</style>

            {/* Solid color extraction background */}
            <div 
                className="absolute inset-0 w-full h-full z-0"
                style={{
                    backgroundImage: 'url(/splash-logo.jpg)',
                    backgroundPosition: '0% 0%',
                    backgroundSize: '10000%',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* The Logo with Sick Slam Animation & Sheen Effect */}
            <div className="absolute inset-0 flex items-center justify-center z-10 overflow-hidden">
                <div style={{ animation: 'splashSlam 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} className="relative w-full max-w-sm">
                    <img 
                        src="/splash-logo.jpg" 
                        alt="ProcFin Launching..." 
                        className="w-full object-contain shadow-2xl" 
                    />
                    
                    {/* Sweeping Light Sheen over the logo */}
                    <div 
                        className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay"
                        style={{ animation: 'sheen 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite', width: '50%' }}
                    ></div>
                </div>
            </div>
            
            {/* Premium Futuristic Progress Bar */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden z-20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <div 
                    className="h-full bg-white rounded-full relative"
                    style={{ animation: 'splashProgress 3.5s cubic-bezier(0.8, 0, 0.2, 1) forwards' }}
                >
                    <div className="absolute inset-0 bg-white blur-[2px]"></div>
                </div>
            </div>
            
        </div>
    );
}
