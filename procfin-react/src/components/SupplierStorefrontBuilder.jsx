import React, { useState } from 'react';
import { Store, Image as ImageIcon, Settings, Save, MapPin, Globe, Phone } from 'lucide-react';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from './Toast';

export default function SupplierStorefrontBuilder({ user, onUpdateUser }) {
    const toast = useToast();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [storeData, setStoreData] = useState({
        storeDescription: user.storefront?.description || '',
        bannerUrl: user.storefront?.bannerUrl || '',
        website: user.storefront?.website || '',
        phone: user.storefront?.phone || '',
        address: user.storefront?.address || ''
    });

    const isPremium = user.subscribed || user.promoted;

    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        const ext = file.name.split('.').pop();
        const filename = `banner_${user.uid || user.id}_${Date.now()}.${ext}`;
        const storageRef = ref(storage, `storefronts/${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(Math.round(progress));
            }, 
            (error) => {
                console.error("Banner upload error:", error);
                toast.error("Failed to upload image. Please try again.");
                setUploading(false);
            }, 
            async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                setStoreData(prev => ({ ...prev, bannerUrl: downloadUrl }));
                setUploading(false);
                toast.success("Banner image uploaded successfully!");
            }
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid || user.id), {
                storefront: storeData
            });
            if (onUpdateUser) {
                onUpdateUser({ storefront: storeData });
            }
            toast.success("Storefront updated successfully!");
        } catch (e) {
            toast.error("Failed to update storefront.");
        } finally {
            setSaving(false);
        }
    };

    if (!isPremium) {
        return (
            <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-12 shadow-sm text-center">
                <Store className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Premium Storefronts</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Stand out to SMEs with a custom branded storefront, featured products, and your Trust badges. Available exclusively to Premium suppliers.
                </p>
                <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all">
                    Upgrade to Premium
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#121318] border border-gray-800/80 rounded-3xl overflow-hidden shadow-sm">
            {/* Banner Preview */}
            <div className="h-48 bg-gray-900 relative">
                {storeData.bannerUrl ? (
                    <img src={storeData.bannerUrl} alt="Store Banner" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 flex-col gap-2">
                        <ImageIcon size={32} />
                        <span className="text-xs uppercase tracking-widest font-bold">No Banner Image</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121318] to-transparent"></div>
                <div className="absolute bottom-6 left-8 flex items-end gap-4">
                    <div className="w-20 h-20 bg-gray-800 rounded-2xl border-4 border-[#121318] flex items-center justify-center text-3xl shadow-xl">
                        🏪
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{user.name}</h2>
                        <div className="flex gap-2 mt-1">
                            {user.rating && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-md font-bold flex items-center gap-1">⭐ {user.rating}</span>}
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-md font-bold">✓ Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18} className="text-cyan-500"/> Storefront Settings</h3>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-white text-black font-bold text-sm rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        {saving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Banner Image</label>
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#1a1c23] border border-gray-700 rounded-xl p-4">
                            <div className="flex-1 w-full">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleBannerUpload}
                                    disabled={uploading}
                                    className="block w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-gray-800 file:text-white hover:file:bg-gray-750 cursor-pointer disabled:opacity-50"
                                />
                                {uploading && (
                                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3 overflow-hidden">
                                        <div 
                                            className="bg-cyan-500 h-1.5 transition-all duration-300" 
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            {storeData.bannerUrl && (
                                <button 
                                    type="button"
                                    onClick={() => setStoreData({ ...storeData, bannerUrl: '' })}
                                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all"
                                >
                                    Remove Banner
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">About Your Business</label>
                        <textarea 
                            value={storeData.storeDescription}
                            onChange={e => setStoreData({...storeData, storeDescription: e.target.value})}
                            placeholder="Tell SMEs why they should choose you..."
                            className="w-full bg-[#1a1c23] border border-gray-700 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500 transition-colors h-32 resize-none"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Website</label>
                            <div className="flex bg-[#1a1c23] border border-gray-700 rounded-xl overflow-hidden focus-within:border-cyan-500">
                                <span className="px-3 py-3 text-gray-500"><Globe size={16}/></span>
                                <input type="text" value={storeData.website} onChange={e => setStoreData({...storeData, website: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Phone</label>
                            <div className="flex bg-[#1a1c23] border border-gray-700 rounded-xl overflow-hidden focus-within:border-cyan-500">
                                <span className="px-3 py-3 text-gray-500"><Phone size={16}/></span>
                                <input type="text" value={storeData.phone} onChange={e => setStoreData({...storeData, phone: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Address</label>
                            <div className="flex bg-[#1a1c23] border border-gray-700 rounded-xl overflow-hidden focus-within:border-cyan-500">
                                <span className="px-3 py-3 text-gray-500"><MapPin size={16}/></span>
                                <input type="text" value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
