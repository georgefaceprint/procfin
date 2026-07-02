import React from 'react';

export default function Home({ onNavigate }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <nav className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 backdrop-blur-md sticky top-0 z-50">
                <div className="text-xl font-bold cursor-pointer flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <span>💸</span> ProcFin
                </div>
                <div className="hidden md:flex gap-6 text-sm font-medium">
                    <a href="#how" className="hover:text-blue-600 transition">How it Works</a>
                    <a href="#categories" className="hover:text-blue-600 transition">Funding Categories</a>
                    <a href="#suppliers" className="hover:text-blue-600 transition">Verified Suppliers</a>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => onNavigate('auth')} className="text-sm font-medium px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition border border-transparent dark:border-gray-700">Sign In</button>
                    <button onClick={() => onNavigate('auth')} className="text-sm font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-md shadow-blue-500/20">Get Started</button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-8 animate-fade-in-up">
                    <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border border-blue-200 dark:border-blue-800">
                        South Africa's #1 SME Platform
                    </span>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Empowering South African Businesses.
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                        Fast, transparent business and tender funding. Get funded directly by our platform funder or receive quotes from national database suppliers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={() => onNavigate('auth', 'SME')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 text-center"
                        >
                            Get Funded as SME
                        </button>
                        <button
                            onClick={() => onNavigate('auth', 'FUNDER')}
                            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-8 py-4 rounded-lg font-medium transition-all text-center"
                        >
                            Funder Access
                        </button>
                    </div>
                </div>
 
                <div className="flex-1 w-full max-w-md perspective-1000">
                    <div className="bg-white dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700 transform md:-rotate-y-12 md:rotate-x-6 hover:rotate-0 transition-transform duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full blur-2xl"></div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Active Request
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">R250,000 Tender Funding</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Category: Construction Equipment</p>
 
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-3 border border-gray-200 dark:border-gray-600">
                            <div className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full w-[85%] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                            </div>
                        </div>
                        <p className="text-right text-xs text-gray-500 font-medium">Awaiting Funder Review</p>
                    </div>
                </div>
            </main>

            {/* How it Works Section */}
            <section id="how" className="py-24 bg-white dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">How ProcFin Works</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">A seamless 3-step process to bridge the capital gap for South African businesses.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Digital Onboarding',
                                desc: 'Register your SME or Supplier entity. Upload CIPC docs, Tax Clearance, and BEE certificates to our encrypted Digital Vault for instant compliance scoring.',
                                icon: '📑'
                            },
                            {
                                step: '02',
                                title: 'RFQ Generation',
                                desc: 'Post your requirements for goods or services. Our smart system matches your RFQ with verified suppliers in the national database automatically.',
                                icon: '📡'
                            },
                            {
                                step: '03',
                                title: 'Quote Comparison',
                                desc: 'Receive and verify formal quotes from local suppliers. Compare pricing, delivery timelines, and supplier ratings within your dashboard.',
                                icon: '📊'
                            },
                            {
                                step: '04',
                                title: 'Capital Deployment',
                                desc: 'Once a quote is accepted, get matched with liquidity partners who provide the capital needed to fulfill the contract and pay the supplier.',
                                icon: '🏦'
                            }
                        ].map((item, i) => (
                            <div key={i} className="relative p-8 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:border-blue-500/30 transition-all group shadow-sm hover:shadow-xl">
                                <div className="text-6xl font-black text-blue-600/5 dark:text-blue-400/5 absolute top-4 right-6 group-hover:text-blue-600/10 transition-colors pointer-events-none">{item.step}</div>
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-3 tracking-tight">{item.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section id="categories" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Funding Categories</h2>
                            <p className="text-gray-500 dark:text-gray-400">We support a wide range of industries with specialized funding mandates.</p>
                        </div>
                        <button onClick={() => onNavigate('auth')} className="text-blue-600 font-bold hover:underline">View all categories &rarr;</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {['Construction', 'Information Tech', 'Agriculture', 'Logistics', 'Healthcare', 'Manufacturing', 'Mining', 'Retail'].map(cat => (
                            <div key={cat} className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-lg transition-all cursor-pointer group">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">📦</div>
                                <h5 className="font-bold text-gray-900 dark:text-white">{cat}</h5>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Suppliers Section */}
            <section id="suppliers" className="py-24 bg-blue-600 text-white rounded-[4rem] mx-6 mb-24 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="max-w-7xl mx-auto px-12 relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-4xl font-black leading-tight">Join the National <br />Supplier Database</h2>
                        <p className="text-white/80 leading-relaxed">
                            Verified suppliers get direct access to funded SME contracts, guaranteed milestone payouts via escrow, and national visibility.
                        </p>
                        <button onClick={() => onNavigate('auth', 'SUPPLIER')} className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold shadow-xl hover:bg-gray-100 transition-all active:scale-95">
                            Register as Supplier
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Verified Suppliers', value: '2,400+' },
                            { label: 'Total RFQs', value: '18k+' },
                            { label: 'Capital Secured', value: 'R450M+' },
                            { label: 'Growth rate', value: '24% MoM' }
                        ].map(stat => (
                            <div key={stat.label} className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <div className="text-2xl font-black mb-1">{stat.value}</div>
                                <div className="text-[10px] uppercase font-bold tracking-widest text-white/60">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-gray-50 dark:bg-gray-900/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Success Stories</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Hear from the businesses and suppliers growing with ProcFin.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                type: 'SME',
                                name: 'Thabo Mndau',
                                role: 'Director, BuildSA Construction',
                                text: 'ProcFin transformed our procurement process. We got funded for a R500,000 construction tender in under 48 hours. Absolute game changer.',
                                icon: '🏗️'
                            },
                            {
                                type: 'SME',
                                name: 'Sarah Langa',
                                role: 'Founder, TechNexus Solutions',
                                text: 'The digital vault made compliance easy. No more chasing paper for every new contract. We stay audit-ready 24/7.',
                                icon: '💻'
                            },
                            {
                                type: 'Supplier',
                                name: 'Sipho Nkosi',
                                role: 'CEO, Nkosi Equipment',
                                text: 'Since being verified, we’ve seen a 40% increase in contract wins. The guaranteed milestone payouts via escrow give us real peace of mind.',
                                icon: '⚒️'
                            },
                            {
                                type: 'SME',
                                name: 'David Khoza',
                                role: 'Operations, SwiftLogistics',
                                text: 'Being matched with verified suppliers saved us thousands on our last project. The transparent bidding process is exactly what SA businesses need.',
                                icon: '🚚'
                            },
                            {
                                type: 'SME',
                                name: 'Nomusa Zungu',
                                role: 'Owner, Zungu Manufacturing',
                                text: 'The Pro tier is worth every cent. Unlimited RFQs means we can scale our business faster than ever before. Highly recommended.',
                                icon: '⚙️'
                            },
                            {
                                type: 'Supplier',
                                name: 'Elena Venter',
                                role: 'Head of Sales, AgriWholesale',
                                text: 'ProcFin connects us with funded, serious businesses. It eliminates the risk of late payments and bad debt entirely.',
                                icon: '🌾'
                            }
                        ].map((t, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all relative group">
                                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${t.type === 'SME' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {t.type}
                                </div>
                                <div className="text-3xl mb-6">{t.icon}</div>
                                <p className="text-gray-600 dark:text-gray-300 italic mb-8 leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-black text-gray-400">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{t.name}</div>
                                        <div className="text-xs text-gray-500">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="text-center p-8 border-t border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} ProcFin.
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('auth', 'ADMIN'); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-4 font-medium transition-colors">
                        Admin Portal Access
                    </a>
                </p>
            </footer>
        </div>
    );
}

