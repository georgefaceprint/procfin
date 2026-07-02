import React, { useState } from 'react';

export default function Home({ onNavigate }) {
    const [wizardStep, setWizardStep] = useState(1);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState(500000);
    const [supplierChoice, setSupplierChoice] = useState('');
    const [leadData, setLeadData] = useState({ name: '', company: '', email: '', whatsapp: '' });

    const handleCategorySelect = (cat) => {
        setCategory(cat);
        setTimeout(() => setWizardStep(2), 400);
    };

    const handleSupplierSelect = (choice) => {
        setSupplierChoice(choice);
        setTimeout(() => setWizardStep(4), 400);
    };

    const handleLeadSubmit = () => {
        if (!leadData.name || !leadData.company || !leadData.whatsapp) {
            alert('Please fill in your Name, Company, and WhatsApp Number to proceed.');
            return;
        }
        // In a real app, save lead data here.
        onNavigate('auth', 'SME');
    };

    const formatRands = (num) => 'R ' + parseInt(num).toLocaleString('en-ZA');
    const fee = amount * 0.20;
    const total = amount + fee;

    return (
        <div className="dark-theme" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'var(--font-body)' }}>
            
            {/* Dual Nav: Utility Bar */}
            <div className="utility-bar">
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('auth', 'SME'); }}>SMEs</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('auth', 'FUNDER'); }}>Funders</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('auth', 'SUPPLIER'); }}>Suppliers</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('auth', 'ADMIN'); }}>Admin Portal</a>
            </div>

            {/* Dual Nav: Main Navbar */}
            <nav className="navbar">
                <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1, gap: 0, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
                        <svg className="logo-icon" width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M40 15 C 20 20, 15 50, 40 85 C 60 70, 70 40, 50 15 Z" stroke="var(--primary)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                            <circle cx="65" cy="25" r="5" fill="var(--primary)"/>
                            <circle cx="80" cy="35" r="5" fill="var(--primary)"/>
                            <circle cx="75" cy="55" r="5" fill="var(--primary)"/>
                            <circle cx="60" cy="65" r="5" fill="var(--primary)"/>
                            <line x1="30" y1="50" x2="60" y2="28" stroke="var(--primary)" strokeWidth="3"/>
                            <line x1="25" y1="55" x2="75" y2="38" stroke="var(--primary)" strokeWidth="3"/>
                            <line x1="25" y1="65" x2="70" y2="55" stroke="var(--primary)" strokeWidth="3"/>
                            <line x1="35" y1="75" x2="55" y2="65" stroke="var(--primary)" strokeWidth="3"/>
                        </svg>
                        ProcFin
                    </div>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Purchase Order Financing</span>
                </div>
                <div className="nav-links">
                    <a href="#categories">Funding Solutions</a>
                    <a href="#wizard">How it Works</a>
                </div>
                <div className="auth-buttons">
                    <button className="btn btn-secondary" onClick={() => onNavigate('auth')}>Login</button>
                    <button className="btn btn-primary" onClick={() => onNavigate('auth', 'SME')}>Apply for Funding</button>
                </div>
            </nav>

            <main className="content-view" id="main-view" style={{ paddingBottom: '4rem' }}>
                
                {/* Hero Section */}
                <section className="hero hero-enter">
                    <div className="hero-content">
                        <span className="badge">Procurement Finance, Redefined</span>
                        <h1 className="gradient-text">Fund Your Next Big Tender.</h1>
                        <p>Secure tender funding, vetted suppliers, and automated milestone-based escrow—all in one premium platform designed for modern business.</p>
                        <div className="hero-actions">
                            <button className="btn btn-primary btn-large" onClick={() => onNavigate('auth', 'SME')}>Apply for Funding</button>
                            <button className="btn btn-outline btn-large" onClick={() => onNavigate('auth', 'FUNDER')}>Become a Funder</button>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="glass-card float-anim">
                            <div className="card-header">
                                <span className="status pulse">Escrow Active</span>
                            </div>
                            <h3>R2,500,000 Facility</h3>
                            <p className="subtext">Funder: Capital Partners Ltd</p>
                            <div className="progress-bar">
                                <div className="progress" style={{ width: '65%' }}></div>
                            </div>
                            <p className="status-text">Milestone 2: Supplier Payment Pending</p>
                        </div>
                    </div>
                </section>

                {/* Funding Categories Slider */}
                <section className="features-section" id="categories" style={{ marginTop: '6rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Funding Categories</h2>
                    <p className="subtext" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>ProcFin supports a wide array of purchase order financing categories. Swipe through to see where we deploy capital.</p>
                    
                    <div className="horizontal-slider">
                        {[
                            { name: 'Construction & Mining', icon: '🏗️', desc: 'Heavy equipment, raw materials, and specialized supplies.' },
                            { name: 'IT & Technology', icon: '💻', desc: 'Hardware rollouts, software licensing, and networks.' },
                            { name: 'Medical Supplies', icon: '🏥', desc: 'Pharmaceuticals, hospital equipment, and PPE.' },
                            { name: 'Logistics & Transport', icon: '🚚', desc: 'Fleet acquisition, fuel supply, and logistics.' },
                            { name: 'Energy & Utilities', icon: '⚡', desc: 'Solar installations, electrical components.' }
                        ].map((cat, i) => (
                            <div key={i} className="category-card" onClick={() => onNavigate('auth', 'SME')}>
                                <div className="category-icon">{cat.icon}</div>
                                <h3>{cat.name}</h3>
                                <p className="subtext">{cat.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Multi-Step Funding Wizard */}
                <section className="features-section" id="wizard" style={{ marginTop: '6rem', position: 'relative' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Calculate & Apply</h2>
                    <p className="subtext" style={{ maxWidth: '600px', margin: '0 auto 3rem auto' }}>Find out exactly what your Purchase Order financing will cost, and get pre-approved in under 60 seconds.</p>
                    
                    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', padding: '2rem' }}>
                        
                        {/* Progress Bar */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }} className="subtext">
                                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Step {wizardStep} of 4</span>
                            </div>
                            <div className="progress-bar" style={{ height: '6px', background: 'rgba(255,255,255,0.1)' }}>
                                <div className="progress" style={{ width: `${(wizardStep / 4) * 100}%`, background: 'var(--accent-cyan)', transition: 'width 0.3s ease' }}></div>
                            </div>
                        </div>

                        {/* Step 1: Category */}
                        <div className={`wizard-step ${wizardStep === 1 ? '' : 'hidden'}`}>
                            <h3 style={{ marginBottom: '1.5rem' }}>What industry is your Purchase Order in?</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                                {[
                                    { name: 'Construction & Mining', icon: '🏗️', label: 'Construction' },
                                    { name: 'IT & Tech', icon: '💻', label: 'IT & Tech' },
                                    { name: 'Medical Supplies', icon: '🏥', label: 'Medical' },
                                    { name: 'Logistics', icon: '🚚', label: 'Logistics' },
                                    { name: 'Other', icon: '⚡', label: 'Other' }
                                ].map(cat => (
                                    <div key={cat.name} className={`cat-card ${category === cat.name ? 'selected' : ''}`} onClick={() => handleCategorySelect(cat.name)}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                                        <div>{cat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Calculator */}
                        <div className={`wizard-step ${wizardStep === 2 ? '' : 'hidden'}`}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-cyan)' }}>Funding for {category}</h3>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '1rem', fontSize: '1.2rem' }}>
                                    <span>Purchase Order Value</span>
                                    <span style={{ color: 'white', fontSize: '1.5rem' }}>{formatRands(amount)}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="50000" 
                                    max="5000000" 
                                    step="10000" 
                                    value={amount} 
                                    className="custom-slider" 
                                    onChange={(e) => setAmount(parseInt(e.target.value))} 
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }} className="subtext">
                                    <span>R 50,000</span>
                                    <span>R 5,000,000</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div>
                                    <p className="subtext" style={{ marginBottom: '0.5rem' }}>ProcFin Escrow Fee (20% flat)</p>
                                    <h3 style={{ fontSize: '1.8rem', color: 'var(--text-muted)' }}>{formatRands(fee)}</h3>
                                </div>
                                <div>
                                    <p className="subtext" style={{ marginBottom: '0.5rem', fontWeight: 700, color: 'white' }}>Total Repayment (in 60 Days)</p>
                                    <h3 style={{ fontSize: '2.2rem', color: 'var(--accent-cyan)' }}>{formatRands(total)}</h3>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setWizardStep(1)}>Back</button>
                                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setWizardStep(3)}>Next</button>
                            </div>
                        </div>

                        {/* Step 3: Supplier Choice */}
                        <div className={`wizard-step ${wizardStep === 3 ? '' : 'hidden'}`}>
                            <h3 style={{ marginBottom: '0.5rem' }}>Procurement & Suppliers</h3>
                            <p className="subtext" style={{ marginBottom: '2rem' }}>ProcFin pays suppliers directly to guarantee delivery. Do you have a supplier ready?</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div className={`cat-card supplier-card ${supplierChoice === 'has_supplier' ? 'selected' : ''}`} onClick={() => handleSupplierSelect('has_supplier')} style={{ padding: '2rem 1rem' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                                    <div style={{ fontWeight: 700 }}>Yes, I have a supplier</div>
                                    <div className="subtext" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>We will vet and pay them directly on your behalf.</div>
                                </div>
                                <div className={`cat-card supplier-card ${supplierChoice === 'needs_supplier' ? 'selected' : ''}`} onClick={() => handleSupplierSelect('needs_supplier')} style={{ padding: '2rem 1rem' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤝</div>
                                    <div style={{ fontWeight: 700 }}>Match me with one</div>
                                    <div className="subtext" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Choose from our database of verified in-house suppliers.</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setWizardStep(2)}>Back</button>
                            </div>
                        </div>

                        {/* Step 4: Lead Capture */}
                        <div className={`wizard-step ${wizardStep === 4 ? '' : 'hidden'}`}>
                            <h3 style={{ marginBottom: '0.5rem' }}>Almost there!</h3>
                            <p className="subtext" style={{ marginBottom: '2rem' }}>Enter your WhatsApp number so our agents can reach out instantly with approval details.</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <input type="text" className="form-input" placeholder="Full Name" style={{ width: '100%', boxSizing: 'border-box' }} value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} />
                                <input type="text" className="form-input" placeholder="Company Name" style={{ width: '100%', boxSizing: 'border-box' }} value={leadData.company} onChange={e => setLeadData({...leadData, company: e.target.value})} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <input type="email" className="form-input" placeholder="Email Address" style={{ width: '100%', marginBottom: '1rem', boxSizing: 'border-box' }} value={leadData.email} onChange={e => setLeadData({...leadData, email: e.target.value})} />
                                
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#25D366', fontSize: '1.2rem' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                    </div>
                                    <input type="tel" className="form-input" placeholder="WhatsApp Number" style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '3.2rem', borderColor: 'rgba(37, 211, 102, 0.5)' }} value={leadData.whatsapp} onChange={e => setLeadData({...leadData, whatsapp: e.target.value})} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setWizardStep(3)}>Back</button>
                                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleLeadSubmit}>Submit Funding Request</button>
                            </div>
                        </div>

                    </div>
                </section>
                
                {/* Feature Showcase */}
                <section className="features-section" id="how-it-works" style={{ marginBottom: '4rem', marginTop: '6rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>A Seamless Ecosystem</h2>
                    <p className="subtext" style={{ maxWidth: '600px', margin: '0 auto' }}>ProcFin integrates every step of the procurement process to ensure maximum security for funders and seamless capital for SMEs.</p>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>Digital Vault</h3>
                            <p className="subtext">Upload your compliance documents once. Our secure digital vault ensures instant KYC and fast-tracks your funding applications.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🤝</div>
                            <h3>Smart Matchmaking</h3>
                            <p className="subtext">Get connected with vetted funders ready to deploy capital for your specific tender category and verified suppliers.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⚖️</div>
                            <h3>Secure Escrow</h3>
                            <p className="subtext">Capital is locked in escrow. ProcFin pays suppliers directly upon proof of delivery, completely neutralizing fund mismanagement.</p>
                        </div>
                    </div>
                </section>

            </main>

            <footer style={{ textAlign: 'center', padding: '3rem 2rem', borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800 }}>ProcFin</span>
                </div>
                <p className="subtext" style={{ marginBottom: '1rem' }}>Premium Procurement Finance for South Africa</p>
                <p className="subtext" style={{ fontSize: '0.85rem' }}>
                    &copy; 2026 ProcFin. All rights reserved. <br/>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('auth', 'ADMIN'); }} style={{ color: 'var(--accent-cyan)', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>Admin Portal Access</a>
                </p>
            </footer>

        </div>
    );
}
