import React from 'react';
import { Hammer, ArrowLeft, Construction } from 'lucide-react';

export default function ComingSoon({ viewName, onBack }) {
    // Format the viewName nicely, e.g. "supplier-milestones" -> "Supplier Milestones"
    const title = viewName 
        ? viewName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
        : 'This Feature';

    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6 relative">
                <Construction className="w-10 h-10 text-cyan-400" />
                <div className="absolute top-0 right-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
                    <Hammer className="w-3 h-3 text-white" />
                </div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
                {title} is <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Coming Soon</span>
            </h2>
            
            <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                Our engineering team is currently hammering away at this module. Check back in a few days to see it live!
            </p>
            
            <button 
                onClick={onBack}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 border border-gray-700"
            >
                <ArrowLeft className="w-5 h-5" />
                Return to Dashboard
            </button>
        </div>
    );
}
