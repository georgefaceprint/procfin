import React, { useState } from 'react';

const ONBOARDING_STEPS = [
    { title: "Business Identity", subtitle: "Basic registration details to identify your entity." },
    { title: "Industry Focus", subtitle: "Select your sector and matching categories." },
    { title: "Location Details", subtitle: "Verification of your physical operating presence in South Africa." },
    { title: "KYC & Compliance", subtitle: "Initial document setup to enable platform transactions." }
];

const PROVINCES = [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
    "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const INDUSTRIES = [
    "Construction & Infrastructure",
    "Manufacturing",
    "Agriculture",
    "Retail & Wholesale",
    "Professional Services",
    "Logistics & Transport"
];

export default function Onboarding({ user, onComplete }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        regNumber: '',
        phone: '',
        industry: '',
        preferredCategories: [],
        province: '',
        address: '',
        termsAccepted: false
    });

    const totalSteps = ONBOARDING_STEPS.length;
    const progress = Math.round((step / totalSteps) * 100);

    const handleNext = (e) => {
        e.preventDefault();
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            onComplete(formData);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategoryToggle = (cat) => {
        setFormData(prev => {
            const cats = [...prev.preferredCategories];
            if (cats.includes(cat)) {
                return { ...prev, preferredCategories: cats.filter(c => c !== cat) };
            } else if (cats.length < 5) {
                return { ...prev, preferredCategories: [...cats, cat] };
            }
            return prev;
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a2e] flex flex-col items-center pt-20 px-6 transition-colors duration-300">
            <div className="max-w-xl w-full">
                {/* Progress Bar */}
                <div className="mb-10 animate-fade-in">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Step {step} of {totalSteps}</span>
                            <h4 className="text-gray-900 dark:text-white font-bold">{ONBOARDING_STEPS[step - 1].title}</h4>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-sm shadow-blue-500/20"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none animate-fade-in-up">
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">{ONBOARDING_STEPS[step - 1].subtitle}</p>

                    <form onSubmit={handleNext} className="space-y-6">
                        {step === 1 && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        {user.type === 'SUPPLIER' ? 'Registered Supplier Name' : 'Company Name'}
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="e.g. Acme Logistics (Pty) Ltd"
                                        required
                                    />
                                </div>
                                {user.type === 'SUPPLIER' ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="+27 82 123 4567"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Registration Number (CIPC)</label>
                                        <input
                                            type="text"
                                            name="regNumber"
                                            value={formData.regNumber}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="YYYY/NNNNNN/NN"
                                            required
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Primary Industry</label>
                                    <select
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        required
                                    >
                                        <option value="">Select Industry</option>
                                        {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {user.type === 'SUPPLIER' ? 'Supply Category / Mandate' : 'Funding Category Needs'}
                                    </label>
                                    <p className="text-[10px] text-gray-500 mb-3 uppercase font-bold tracking-wider">Select up to 5 categories</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["IT Hardware", "Construction Materials", "Logistics", "Textiles", "Office Supplies", "Fuel", "Industrial Tools", "Consultancy"].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => handleCategoryToggle(cat)}
                                                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.preferredCategories.includes(cat)
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Province</label>
                                    <select
                                        name="province"
                                        value={formData.province}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        required
                                    >
                                        <option value="">Select Province</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Physical Business Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                        placeholder="Street, City, Postal Code"
                                        required
                                    ></textarea>
                                </div>
                            </>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 dark:bg-blue-900/10 border border-dashed border-gray-200 dark:border-blue-800/50 rounded-2xl p-6 text-center">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl">🛡️</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Document Setup Ready</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        Your identity and registration documents (CSD, Tax Clearance) will be managed in your <strong>Secure Vault</strong> after completing this step.
                                    </p>
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="termsAccepted"
                                        checked={formData.termsAccepted}
                                        onChange={handleChange}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        I confirm that all provided details are legally accurate and represent {formData.companyName || 'the business'}.
                                    </span>
                                </label>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-700/50 mt-10">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    &larr; Back
                                </button>
                            ) : <div></div>}
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                {step === totalSteps ? 'Complete Onboarding' : 'Continue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
