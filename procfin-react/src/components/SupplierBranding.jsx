import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Sparkles, Palette, FileText, Landmark, Check } from 'lucide-react';

export default function SupplierBranding({ user, onUpdateUser }) {
    const defaultBranding = {
        logoUrl: '',
        primaryColor: '#0ea5e9',
        billingTerms: 'Payment is due within 14 days of PO delivery.',
        bankDetails: {
            bankName: '',
            accountNumber: '',
            branchCode: '',
            accountHolder: ''
        }
    };

    const [branding, setBranding] = useState(user.branding || defaultBranding);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        const ext = file.name.split('.').pop();
        const filename = `logo_${user.uid || user.id}_${Date.now()}.${ext}`;
        const storageRef = ref(storage, `logos/${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(Math.round(progress));
            }, 
            (error) => {
                console.error("Logo upload error:", error);
                alert("Failed to upload logo image. Please try again.");
                setUploading(false);
            }, 
            async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                setBranding(prev => ({ ...prev, logoUrl: downloadUrl }));
                setUploading(false);
            }
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            const userRef = doc(db, 'users', user.uid || user.id);
            await updateDoc(userRef, { branding });
            if (onUpdateUser) {
                onUpdateUser({ ...user, branding });
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Error saving branding settings:", err);
            alert("Failed to save branding configurations. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleNestedChange = (field, value) => {
        setBranding(prev => ({
            ...prev,
            bankDetails: {
                ...prev.bankDetails,
                [field]: value
            }
        }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form Section */}
            <form onSubmit={handleSave} className="bg-[#121318] border border-gray-800 rounded-3xl p-6 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-cyan-400" size={20} />
                        Branding & Invoice Settings
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Customize how your quotes and invoices are presented to buyers. Add your company branding and payment credentials.
                    </p>
                </div>

                {/* Brand Customization */}
                <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-gray-800/80 pb-2">
                        <Palette size={14} className="text-cyan-400" /> Style Customization
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group flex flex-col justify-end">
                            <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5">Supplier Brand Logo</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                    className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer disabled:opacity-50"
                                />
                                {branding.logoUrl && (
                                    <button 
                                        type="button"
                                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                                        className="px-2.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black rounded-lg uppercase transition-all"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            {uploading && (
                                <div className="w-full bg-gray-800 rounded-full h-1 mt-2 overflow-hidden">
                                    <div 
                                        className="bg-cyan-500 h-1 transition-all duration-300" 
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5">Primary Brand Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={branding.primaryColor || '#0ea5e9'}
                                    onChange={e => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                                    className="w-10 h-10 border border-gray-800 bg-transparent rounded-lg cursor-pointer p-0.5"
                                />
                                <input
                                    type="text"
                                    placeholder="#0ea5e9"
                                    value={branding.primaryColor || ''}
                                    onChange={e => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                                    className="form-control text-xs flex-1 font-mono uppercase"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-gray-800/80 pb-2">
                        <Landmark size={14} className="text-cyan-400" /> Direct Deposit Bank Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5">Account Holder</label>
                            <input
                                type="text"
                                required
                                placeholder="FacePrint PTY Ltd"
                                value={branding.bankDetails?.accountHolder || ''}
                                onChange={e => handleNestedChange('accountHolder', e.target.value)}
                                className="form-control text-xs"
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5">Bank Name</label>
                            <input
                                type="text"
                                required
                                placeholder="First National Bank (FNB)"
                                value={branding.bankDetails?.bankName || ''}
                                onChange={e => handleNestedChange('bankName', e.target.value)}
                                className="form-control text-xs"
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5">Account Number</label>
                            <input
                                type="text"
                                required
                                placeholder="1234567890"
                                value={branding.bankDetails?.accountNumber || ''}
                                onChange={e => handleNestedChange('accountNumber', e.target.value)}
                                className="form-control text-xs font-mono"
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5">Branch Code</label>
                            <input
                                type="text"
                                required
                                placeholder="250655"
                                value={branding.bankDetails?.branchCode || ''}
                                onChange={e => handleNestedChange('branchCode', e.target.value)}
                                className="form-control text-xs font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Terms */}
                <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-gray-800/80 pb-2">
                        <FileText size={14} className="text-cyan-400" /> Terms & Special Conditions
                    </h4>
                    <div className="form-group">
                        <textarea
                            rows={3}
                            placeholder="Add payment policies, lead times, or return policies..."
                            value={branding.billingTerms || ''}
                            onChange={e => setBranding(prev => ({ ...prev, billingTerms: e.target.value }))}
                            className="form-control text-xs resize-none"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black text-xs font-black rounded-xl transition-all shadow-lg shadow-cyan-500/10 flex items-center gap-1.5"
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>

                    {saved && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                            <Check size={14} /> Settings Saved successfully!
                        </span>
                    )}
                </div>
            </form>

            {/* Live Invoice Preview */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Live Invoice Layout Preview</h4>
                <div className="bg-white text-gray-900 border border-gray-300 rounded-3xl p-8 shadow-xl max-w-lg mx-auto font-sans leading-normal overflow-hidden relative">
                    {/* Brand Highlight Top Border */}
                    <div style={{ backgroundColor: branding.primaryColor || '#0ea5e9', height: '8px', position: 'absolute', top: 0, left: 0, right: 0 }}></div>

                    {/* Preview Header */}
                    <div className="flex justify-between items-start border-b border-gray-200 pb-6 mt-2">
                        <div>
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="max-h-12 max-w-[140px] object-contain mb-3" />
                            ) : (
                                <div className="text-xl font-black tracking-tight mb-2" style={{ color: branding.primaryColor || '#0ea5e9' }}>
                                    {user.companyName || user.name || 'Your Company Name'}
                                </div>
                            )}
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">TAX INVOICE</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 font-bold">INVOICE #INV-8742</p>
                            <p className="text-[10px] text-gray-400 mt-1">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Billing Info */}
                    <div className="grid grid-cols-2 gap-4 py-6 border-b border-gray-100 text-xs">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide mb-1">Billed To</p>
                            <p className="font-bold">SME Procurement Buyer</p>
                            <p className="text-gray-500">Johannesburg, Gauteng</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide mb-1">From</p>
                            <p className="font-bold">{user.companyName || user.name || 'Your Company Name'}</p>
                            <p className="text-gray-500">{user.city || 'Johannesburg'}, {user.province || 'Gauteng'}</p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="py-6 border-b border-gray-100 text-xs">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-gray-400 font-bold">
                                    <th className="pb-2">Item Description</th>
                                    <th className="pb-2 text-right">Qty</th>
                                    <th className="pb-2 text-right">Price</th>
                                    <th className="pb-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50">
                                    <td className="py-2.5 font-medium">Standard Print & Signage Banner (Demo)</td>
                                    <td className="py-2.5 text-right text-gray-500">10</td>
                                    <td className="py-2.5 text-right text-gray-500">R1,200</td>
                                    <td className="py-2.5 text-right font-bold">R12,000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Total & Bank Details */}
                    <div className="grid grid-cols-5 gap-4 pt-6 text-xs">
                        <div className="col-span-3 space-y-3">
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wide mb-1">Direct Bank Transfer</p>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-[10px] leading-relaxed text-gray-600 font-mono">
                                    <p><strong>Bank:</strong> {branding.bankDetails?.bankName || '-----'}</p>
                                    <p><strong>Acc Holder:</strong> {branding.bankDetails?.accountHolder || '-----'}</p>
                                    <p><strong>Acc No:</strong> {branding.bankDetails?.accountNumber || '-----'}</p>
                                    <p><strong>Branch:</strong> {branding.bankDetails?.branchCode || '-----'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 text-right space-y-1 mt-auto">
                            <p className="text-gray-400 font-medium">Subtotal: R12,000</p>
                            <p className="text-[10px] text-gray-400">VAT (0%): R0</p>
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-base font-black" style={{ color: branding.primaryColor || '#0ea5e9' }}>
                                    Total: R12,000
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="mt-8 border-t border-gray-100 pt-4 text-[9px] text-gray-400 italic">
                        <p><strong>Terms:</strong> {branding.billingTerms || 'No terms specified.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
