import React, { useState, useEffect } from 'react';

const SLIDES = [
    {
        id: 1,
        icon: '🚀',
        title: 'Fast & Flexible Funding',
        description: 'Get up to R5M in Purchase Order Finance approved in 24 hours. No hidden fees.',
        color: 'from-blue-600/20 to-blue-900/40',
        iconBg: 'bg-blue-500/20 text-blue-400'
    },
    {
        id: 2,
        icon: '🚚',
        title: 'Verified Suppliers',
        description: 'Tap into our exclusive network of vetted, reliable suppliers ready to execute your orders.',
        color: 'from-emerald-600/20 to-emerald-900/40',
        iconBg: 'bg-emerald-500/20 text-emerald-400'
    },
    {
        id: 3,
        icon: '🔒',
        title: 'Secure Escrow',
        description: 'We handle the payments directly to your suppliers so you can focus entirely on delivery.',
        color: 'from-purple-600/20 to-purple-900/40',
        iconBg: 'bg-purple-500/20 text-purple-400'
    }
];

export default function Home({ onNavigate }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative min-h-[100dvh] w-full bg-[#1a1a2e] flex flex-col overflow-hidden">
            
            {/* Dynamic Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${SLIDES[currentSlide].color} transition-colors duration-1000 ease-in-out opacity-50`}></div>
            
            {/* Top Bar Logo */}
            <div className="absolute top-12 left-0 right-0 flex justify-center z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-xl">💸</span>
                    </div>
                    <span className="text-2xl font-extrabold text-white tracking-tight">ProcFin</span>
                </div>
            </div>

            {/* Carousel Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 z-10 mt-16">
                <div className="w-full max-w-sm relative h-80 flex items-center justify-center">
                    {SLIDES.map((slide, index) => (
                        <div 
                            key={slide.id}
                            className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-out ${
                                index === currentSlide 
                                    ? 'opacity-100 translate-x-0 scale-100' 
                                    : index < currentSlide 
                                        ? 'opacity-0 -translate-x-12 scale-95' 
                                        : 'opacity-0 translate-x-12 scale-95'
                            }`}
                        >
                            <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center text-6xl mb-10 shadow-2xl ${slide.iconBg}`}>
                                {slide.icon}
                            </div>
                            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                                {slide.title}
                            </h2>
                            <p className="text-gray-400 text-base leading-relaxed max-w-[280px]">
                                {slide.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Pagination Dots */}
                <div className="flex gap-3 mt-12">
                    {SLIDES.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2 rounded-full transition-all duration-500 ${
                                idx === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-gray-600'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Fixed Bottom Action Area */}
            <div className="w-full p-6 pb-12 z-20 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e] to-transparent">
                <div className="max-w-sm mx-auto flex flex-col gap-4">
                    <button 
                        onClick={() => onNavigate('auth', null)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-5 rounded-2xl shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98]"
                    >
                        Get Started
                    </button>
                    <button 
                        onClick={() => onNavigate('auth', null)}
                        className="w-full bg-transparent border-2 border-gray-700 hover:border-gray-500 text-white font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </div>
                <p className="text-center text-gray-500 text-xs mt-6 font-medium">
                    By continuing, you agree to our <a href="#" className="underline underline-offset-2">Terms</a> & <a href="#" className="underline underline-offset-2">Privacy</a>.
                </p>
            </div>
        </div>
    );
}
