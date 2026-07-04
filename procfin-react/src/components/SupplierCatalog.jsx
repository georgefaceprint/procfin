import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from './Toast';
import { Plus, Trash2, Edit, Package, Truck, Layers, DollarSign, Upload, Sparkles, X } from 'lucide-react';

export default function SupplierCatalog({ user, onUpdateUser, onNavigate }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Printing');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('Unit');
    const [minOrderQty, setMinOrderQty] = useState('1');
    const [leadTimeDays, setLeadTimeDays] = useState('3');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Tiered pricing
    const [tiers, setTiers] = useState([]); // [{ minQty: 100, price: 80 }]
    const [newTierQty, setNewTierQty] = useState('');
    const [newTierPrice, setNewTierPrice] = useState('');

    const toast = useToast();
    const supplierId = user.uid || user.id;

    const categories = [
        "Printing",
        "Textiles",
        "Office Supplies",
        "Logistics",
        "Fuel",
        "Construction Materials",
        "Industrial Tools",
        "IT Hardware",
        "Consultancy",
        "Manufacturing"
    ];

    // Grant catalog access if: catalogActive OR subscribed (verified) OR promoted (platinum featured)
    const hasCatalogAccess = user.catalogActive || user.subscribed || user.promoted;

    useEffect(() => {
        if (!supplierId || !hasCatalogAccess) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "catalog_items"), where("supplierId", "==", supplierId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(items);
            setLoading(false);
        }, (err) => {
            console.error("Error reading catalog items:", err);
            toast.error("Failed to load catalog items.");
            setLoading(false);
        });

        return unsubscribe;
    }, [supplierId, hasCatalogAccess]);

    const handleMockCheckout = async () => {
        setSubmitting(true);
        try {
            const userRef = doc(db, "users", supplierId);
            const updatePayload = {
                catalogActive: true,
                catalogSubscriptionStatus: 'active',
                catalogSubscriptionPrice: 1499,
                catalogRenewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
            await updateDoc(userRef, updatePayload);
            onUpdateUser(updatePayload);
            toast.success("ProcFin Sourcing Catalog unlocked successfully! Welcome to the premium network.");
        } catch (e) {
            console.error("Unlock failed:", e);
            toast.error("Unlock failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddTier = () => {
        if (!newTierQty || !newTierPrice) {
            toast.warning("Please enter both minimum quantity and tier price.");
            return;
        }
        if (Number(newTierPrice) >= Number(price)) {
            toast.warning("Tier discount price must be lower than the base price.");
            return;
        }
        const updated = [...tiers, { minQty: Number(newTierQty), price: Number(newTierPrice) }];
        updated.sort((a, b) => a.minQty - b.minQty);
        setTiers(updated);
        setNewTierQty('');
        setNewTierPrice('');
    };

    const handleRemoveTier = (idx) => {
        setTiers(tiers.filter((_, i) => i !== idx));
    };

    const openCreateForm = () => {
        setEditingProduct(null);
        setName('');
        setDescription('');
        setCategory(user.preferredCategories?.[0] || 'Printing');
        setPrice('');
        setUnit('Unit');
        setMinOrderQty('1');
        setLeadTimeDays('3');
        setTiers([]);
        setImageFile(null);
        setImagePreview('');
        setIsFormOpen(true);
    };

    const openEditForm = (prod) => {
        setEditingProduct(prod);
        setName(prod.name);
        setDescription(prod.description || '');
        setCategory(prod.category);
        setPrice(prod.price.toString());
        setUnit(prod.unit);
        setMinOrderQty(prod.minOrderQty?.toString() || '1');
        setLeadTimeDays(prod.leadTimeDays?.toString() || '3');
        setTiers(prod.volumeTiers || []);
        setImageFile(null);
        setImagePreview(prod.imageUrl || '');
        setIsFormOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        if (!name || !price || !minOrderQty || !leadTimeDays) {
            toast.warning("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const itemId = editingProduct ? editingProduct.id : `item_${Date.now()}`;
            let downloadUrl = imagePreview;

            if (imageFile) {
                const storageRef = ref(storage, `catalog/${supplierId}/${itemId}`);
                const uploadTask = uploadBytesResumable(storageRef, imageFile);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', 
                        (snap) => {
                            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                            setUploadProgress(pct);
                        },
                        (err) => reject(err),
                        async () => {
                            downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve();
                        }
                    );
                });
            }

            const productData = {
                id: itemId,
                supplierId,
                supplierName: user.name || "Verified Supplier",
                supplierRating: user.rating || 5.0,
                name,
                description,
                category,
                province: user.province || "Gauteng",
                price: Number(price),
                unit,
                minOrderQty: Number(minOrderQty),
                leadTimeDays: Number(leadTimeDays),
                volumeTiers: tiers,
                imageUrl: downloadUrl || '',
                inStock: true,
                updatedAt: new Date().toISOString()
            };

            if (!editingProduct) {
                productData.createdAt = new Date().toISOString();
            }

            await setDoc(doc(db, "catalog_items", itemId), productData, { merge: true });
            toast.success(editingProduct ? "Product updated successfully!" : "Product added to Sourcing Warehouse!");
            setIsFormOpen(false);
            setEditingProduct(null);
        } catch (err) {
            console.error("Save product failed:", err);
            toast.error("Failed to save product.");
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteProduct = async (prodId) => {
        if (!window.confirm("Are you sure you want to delete this product from the sourcing catalog?")) return;
        try {
            await deleteDoc(doc(db, "catalog_items", prodId));
            toast.success("Product removed from sourcing catalog.");
        } catch (e) {
            console.error("Delete failed:", e);
            toast.error("Failed to delete product.");
        }
    };

    // Paywall Render — only shown if none of the access flags are set
    if (!hasCatalogAccess) {
        return (
            <div className="bg-[#121318] border border-gray-800/80 rounded-3xl p-8 md:p-12 text-center shadow-xl max-w-2xl mx-auto my-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl">🏪</div>
                <div className="max-w-md mx-auto relative z-10">
                    <span className="px-3.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-full border border-cyan-500/20">Premium Module</span>
                    <h2 className="text-3xl font-black text-white mt-6 mb-4">Sourcing Warehouse Catalog</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                        Unlock the premium Sourcing Directory. List your products and wholesale pricing directly to SMEs looking to secure instant, pre-verified PO financing.
                    </p>

                    <div className="bg-[#1a1c23]/60 backdrop-blur border border-gray-700/50 rounded-2xl p-6 text-left shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-gray-300">Catalog Access Subscription</span>
                            <div className="text-2xl font-black text-cyan-400 font-mono">R1,499<span className="text-xs font-medium text-gray-500">/mo</span></div>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {[
                                "List up to 100+ inventory items and services",
                                "Configure volume discount tiers & lead times",
                                "Direct placement in side-by-side comparison grid",
                                "Receive fully funded PO purchase orders"
                            ].map(item => (
                                <li key={item} className="flex items-start gap-3 text-xs text-gray-400">
                                    <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={handleMockCheckout} 
                            disabled={submitting}
                            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Sparkles size={16} />
                            {submitting ? 'Activating Module...' : 'Unlock Sourcing Catalog'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>🏪</span> Catalog Inventory
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">List products and tiered pricing on the national directory.</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                    <Plus size={14} /> Add Product
                </button>
            </div>

            {user.plan !== 'Diamond Supplier' && user.plan !== 'Platinum Supplier' && user.plan !== 'Featured Partner (Monthly Platinum)' && (
                <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/20 border border-cyan-500/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 className="text-cyan-400 font-bold text-sm mb-1 flex items-center gap-2"><Sparkles size={16} /> Boost Your Visibility!</h4>
                        <p className="text-gray-300 text-xs leading-relaxed">Your products are currently listed below featured suppliers. Upgrade to <strong>Diamond</strong> or <strong>Platinum</strong> to lock your products at the top of the Sourcing Warehouse.</p>
                    </div>
                    <button onClick={() => onNavigate && onNavigate('subscription')} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all whitespace-nowrap">
                        View Upgrade Plans
                    </button>
                </div>
            )}

            {loading ? (
                <div className="py-12 text-center text-gray-400">Loading catalog items...</div>
            ) : products.length === 0 ? (
                <div className="bg-[#121318] border border-gray-800/80 rounded-2xl p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-600 mb-4 animate-bounce" />
                    <p className="text-gray-400 text-sm italic">Your sourcing catalog is empty. Click 'Add Product' above to build your inventory.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map(prod => (
                        <div key={prod.id} className="bg-[#121318] border border-gray-800/50 rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row">
                            {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} className="w-full md:w-36 h-36 object-cover bg-gray-900 border-r border-gray-800/50" />
                            ) : (
                                <div className="w-full md:w-36 h-36 bg-[#1a1c23] flex items-center justify-center text-gray-600 border-r border-gray-800/50">
                                    <Package size={36} />
                                </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-bold text-white text-base truncate max-w-[80%]">{prod.name}</h4>
                                        <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase rounded">
                                            {prod.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{prod.description || 'No description provided.'}</p>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                            <DollarSign size={12} className="text-cyan-500" />
                                            <span>Price: <strong className="text-white">R{prod.price} / {prod.unit}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                            <Package size={12} className="text-cyan-500" />
                                            <span>MOQ: <strong className="text-white">{prod.minOrderQty}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                            <Truck size={12} className="text-cyan-500" />
                                            <span>Lead Time: <strong className="text-white">{prod.leadTimeDays} Days</strong></span>
                                        </div>
                                        {prod.volumeTiers?.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                                                <Layers size={12} />
                                                <span>Has Bulk Tiers</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-800/40">
                                    <button 
                                        onClick={() => openEditForm(prod)}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-colors"
                                        title="Edit Product"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteProduct(prod.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors"
                                        title="Delete Product"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Product Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#121318] border border-gray-800/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                        <header className="p-6 border-b border-gray-800/60 flex justify-between items-center">
                            <h4 className="font-bold text-white text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </header>
                        
                        <form onSubmit={handleSubmitProduct} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={name} 
                                        onChange={e => setName(e.target.value)} 
                                        className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                        placeholder="e.g. Premium Matte Board Sheets"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Category *</label>
                                    <select 
                                        value={category} 
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    rows="2"
                                    className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="Enter details, size, dimensions, etc."
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price (ZAR) *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={price} 
                                        onChange={e => setPrice(e.target.value)} 
                                        className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
                                        placeholder="85"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Unit *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={unit} 
                                        onChange={e => setUnit(e.target.value)} 
                                        className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                        placeholder="e.g. Ream"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">MOQ *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={minOrderQty} 
                                        onChange={e => setMinOrderQty(e.target.value)} 
                                        className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Lead Time (Days) *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={leadTimeDays} 
                                        onChange={e => setLeadTimeDays(e.target.value)} 
                                        className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Volume Pricing Tiers */}
                            <div className="space-y-3 bg-[#1a1c23]/60 border border-gray-800/40 p-5 rounded-xl">
                                <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                    <Layers size={14} /> Tiered Volume Pricing (Discount Breaks)
                                </label>
                                <p className="text-[10px] text-gray-500 leading-normal">Offer discount prices to buyers buying in large bulks.</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-gray-500">Min Quantity</span>
                                        <input 
                                            type="number" 
                                            value={newTierQty} 
                                            onChange={e => setNewTierQty(e.target.value)}
                                            className="w-full bg-[#121318] border border-gray-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                                            placeholder="100"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-gray-500">Discounted Price (ZAR)</span>
                                        <input 
                                            type="number" 
                                            value={newTierPrice} 
                                            onChange={e => setNewTierPrice(e.target.value)}
                                            className="w-full bg-[#121318] border border-gray-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                                            placeholder="75"
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleAddTier}
                                        className="py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700/60 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Add Tier
                                    </button>
                                </div>

                                {tiers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-800/40">
                                        {tiers.map((t, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono rounded-lg">
                                                Buy {t.minQty}+: R{t.price}
                                                <button type="button" onClick={() => handleRemoveTier(idx)} className="text-red-400 hover:text-white transition-colors">
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Product Photo Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden flex items-center justify-center text-gray-500">
                                        {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <Package size={24} />}
                                    </div>
                                    <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold cursor-pointer border border-gray-700/60 transition-colors">
                                        <Upload size={14} /> Upload Image
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                </div>
                                {uploadProgress > 0 && (
                                    <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mt-2">
                                        <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Package size={16} />
                                {submitting ? 'Saving Product...' : (editingProduct ? 'Update Product' : 'Add Product to Catalog')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
