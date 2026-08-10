// src/admin/ColorVariantManager.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, X, Check, Sparkles } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';
import { extractColorsFromImage } from '../utils/colorExtractor';

// Predefined sizes
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ColorVariantManager({ productId, productName, onClose }) {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New variant form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVariant, setNewVariant] = useState({
        color_name: '',
        color_hex: '#000000',
        sku: '',
        price_adjustment: 0,
    });
    const [newImages, setNewImages] = useState([null, null, null]);
    const [newImagePreviews, setNewImagePreviews] = useState([null, null, null]);
    const [selectedSizes, setSelectedSizes] = useState({});

    // Upload state
    const [uploadingFor, setUploadingFor] = useState(null);

    useEffect(() => {
        fetchVariants();
    }, [productId]);

    // Auto-generate SKU when color name changes
    useEffect(() => {
        if (newVariant.color_name && showAddForm) {
            const colorSlug = newVariant.color_name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            const autoSku = `${productId}-${colorSlug}-${Date.now().toString(36).slice(-4)}`.toUpperCase();
            setNewVariant(prev => ({ ...prev, sku: autoSku }));
        }
    }, [newVariant.color_name, productId, showAddForm]);

    const fetchVariants = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/api/products/color-variants/?product=${productId}`);
            const data = response.data;
            if (Array.isArray(data)) {
                setVariants(data);
            } else if (data.results) {
                setVariants(data.results);
            } else {
                setVariants([]);
            }
        } catch (error) {
            toast.error('Failed to load variants');
            setVariants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNewImageSelect = async (index, file) => {
        const files = [...newImages];
        const previews = [...newImagePreviews];
        files[index] = file;
        previews[index] = URL.createObjectURL(file);
        setNewImages(files);
        setNewImagePreviews(previews);

        // Auto-extract color from first image
        if (index === 0) {
            try {
                const colors = await extractColorsFromImage(file, 5);
                if (colors.length > 0) {
                    setNewVariant(prev => ({
                        ...prev,
                        color_hex: colors[0].hex,
                        extracted_colors: colors
                    }));
                    toast.success('🎨 Color detected!');
                }
            } catch (error) {
                console.error('Color extraction error:', error);
            }
        }
    };

    const removeNewImage = (index) => {
        const files = [...newImages];
        const previews = [...newImagePreviews];
        if (previews[index]) URL.revokeObjectURL(previews[index]);
        files[index] = null;
        previews[index] = null;
        setNewImages(files);
        setNewImagePreviews(previews);
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => ({
            ...prev,
            [size]: prev[size] ? undefined : { quantity: 0 }
        }));
    };

    const updateSizeQuantity = (size, quantity) => {
        setSelectedSizes(prev => ({
            ...prev,
            [size]: { quantity: parseInt(quantity) || 0 }
        }));
    };

    const handleAddVariant = async () => {
        if (!newVariant.color_name) {
            toast.error('Color name is required');
            return;
        }
        if (!newVariant.sku) {
            toast.error('SKU is required');
            return;
        }

        const hasImages = newImages.some(img => img !== null);
        if (!hasImages) {
            toast.error('Please upload at least one image');
            return;
        }

        const activeSizes = Object.entries(selectedSizes).filter(([_, val]) => val);
        if (activeSizes.length === 0) {
            toast.error('Please select at least one size');
            return;
        }

        try {
            setSaving(true);

            // 1. Create color variant
            const variantRes = await API.post('/api/products/color-variants/', {
                product: productId,
                color_name: newVariant.color_name,
                color_hex: newVariant.color_hex || '#000000',
                sku: newVariant.sku,
                price_adjustment: newVariant.price_adjustment || 0,
                is_default: variants.length === 0,
            });

            const variantId = variantRes.data.id;

            // 2. Upload images
            for (let i = 0; i < newImages.length; i++) {
                if (newImages[i]) {
                    const formData = new FormData();
                    formData.append('variant', variantId);
                    formData.append('image', newImages[i]);
                    formData.append('is_primary', i === 0);
                    formData.append('order', i);
                    await API.post('/api/products/variant-images/', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                }
            }

            // 3. Create size stocks
            for (const [size, data] of activeSizes) {
                await API.post('/api/products/size-stocks/', {
                    variant: variantId,
                    size,
                    quantity: data.quantity,
                });
            }

            toast.success('Color variant added!');
            resetForm();
            fetchVariants();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.sku?.[0] || 'Failed to add variant';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setShowAddForm(false);
        setNewVariant({ color_name: '', color_hex: '#000000', sku: '', price_adjustment: 0 });
        newImagePreviews.forEach(p => p && URL.revokeObjectURL(p));
        setNewImages([null, null, null]);
        setNewImagePreviews([null, null, null]);
        setSelectedSizes({});
    };

    const handleDeleteVariant = async (variantId) => {
        if (!window.confirm('Delete this color variant and all its images?')) return;
        try {
            await API.delete(`/api/products/color-variants/${variantId}/`);
            toast.success('Variant deleted');
            fetchVariants();
        } catch (error) {
            toast.error('Failed to delete variant');
        }
    };

    const handleImageUpload = async (variantId, file, isPrimary = false, order = 0) => {
        const formData = new FormData();
        formData.append('variant', variantId);
        formData.append('image', file);
        formData.append('is_primary', isPrimary);
        formData.append('order', order);

        try {
            setUploadingFor(`${variantId}-${order}`);
            await API.post('/api/products/variant-images/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Image uploaded!');
            fetchVariants();
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploadingFor(null);
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await API.delete(`/api/products/variant-images/${imageId}/`);
            toast.success('Image deleted');
            fetchVariants();
        } catch (error) {
            toast.error('Failed to delete image');
        }
    };

    const handleStockUpdate = async (variantId, size, quantity) => {
        try {
            await API.post('/api/products/size-stocks/bulk_update/', {
                variant_id: variantId,
                stocks: [{ size, quantity: parseInt(quantity) || 0 }],
            });
        } catch (error) {
            toast.error('Failed to update stock');
        }
    };

    const handleSetDefault = async (variantId) => {
        try {
            for (const v of variants) {
                if (v.is_default && v.id !== variantId) {
                    await API.patch(`/api/products/color-variants/${v.id}/`, { is_default: false });
                }
            }
            await API.patch(`/api/products/color-variants/${variantId}/`, { is_default: true });
            toast.success('Default variant set');
            fetchVariants();
        } catch (error) {
            toast.error('Failed to update default');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Color Variants</h2>
                        <p className="text-sm text-gray-600">{productName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Add Variant Button */}
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus size={20} /> Add New Color Variant
                        </button>
                    )}

                    {/* Add Variant Form */}
                    {showAddForm && (
                        <div className="mb-6 p-6 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50">
                            <h3 className="font-bold text-lg mb-4">Add New Color Variant</h3>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Color Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Navy Blue"
                                        value={newVariant.color_name}
                                        onChange={(e) => setNewVariant({ ...newVariant, color_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Color {newVariant.extracted_colors ? <span className="text-green-600 text-xs">(Auto-detected!)</span> : '(optional)'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={newVariant.color_hex}
                                            onChange={(e) => setNewVariant({ ...newVariant, color_hex: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer border"
                                        />
                                        <input
                                            type="text"
                                            value={newVariant.color_hex}
                                            onChange={(e) => setNewVariant({ ...newVariant, color_hex: e.target.value })}
                                            className="flex-1 px-2 py-2 border rounded-lg text-sm"
                                            placeholder="#000000"
                                        />
                                    </div>
                                    {/* Extracted Color Palette */}
                                    {newVariant.extracted_colors && newVariant.extracted_colors.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                <Sparkles size={12} /> Pick from detected colors:
                                            </p>
                                            <div className="flex gap-1">
                                                {newVariant.extracted_colors.map((color, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setNewVariant({ ...newVariant, color_hex: color.hex })}
                                                        className={`w-7 h-7 rounded-full border-2 transition-all ${newVariant.color_hex === color.hex
                                                            ? 'border-black ring-2 ring-offset-1 ring-black/30'
                                                            : 'border-gray-300 hover:border-gray-500'
                                                            }`}
                                                        style={{ backgroundColor: color.hex }}
                                                        title={`${color.hex} (${color.percentage}%)`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">SKU *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., PROD-001-BLU"
                                        value={newVariant.sku}
                                        onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price +/-</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newVariant.price_adjustment}
                                        onChange={(e) => setNewVariant({ ...newVariant, price_adjustment: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Image Upload - 3 Slots */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Images (up to 3) *</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Primary', 'Secondary', 'Third'].map((label, index) => (
                                        <div key={index} className="relative">
                                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                                            {newImagePreviews[index] ? (
                                                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500">
                                                    <img src={newImagePreviews[index]} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeNewImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    {index === 0 && (
                                                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">Primary</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50">
                                                    <Upload size={24} className="text-gray-400 mb-1" />
                                                    <span className="text-xs text-gray-400">Upload</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => e.target.files[0] && handleNewImageSelect(index, e.target.files[0])}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Size Selection with Quantity */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Select Sizes & Quantities *</label>
                                <div className="grid grid-cols-5 gap-3">
                                    {SIZES.map((size) => (
                                        <div key={size} className="text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleSize(size)}
                                                className={`w-full py-2 rounded-lg border-2 font-semibold transition-all ${selectedSizes[size]
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                                                    }`}
                                            >
                                                {size}
                                                {selectedSizes[size] && <Check size={14} className="inline ml-1" />}
                                            </button>
                                            {selectedSizes[size] && (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Qty"
                                                    value={selectedSizes[size].quantity}
                                                    onChange={(e) => updateSizeQuantity(size, e.target.value)}
                                                    className="w-full mt-2 px-2 py-1 border rounded text-center text-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddVariant}
                                    disabled={saving}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300"
                                >
                                    {saving ? 'Adding...' : 'Add Color Variant'}
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-2 border rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing Variants List */}
                    {variants.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No color variants yet. Add your first color!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {variants.map((variant) => (
                                <div key={variant.id} className="border rounded-xl p-4 bg-gray-50">
                                    {/* Variant Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full border-2 border-gray-300"
                                                style={{ backgroundColor: variant.color_hex }}
                                            />
                                            <div>
                                                <h4 className="font-bold">{variant.color_name}</h4>
                                                <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                                            </div>
                                            {variant.is_default && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!variant.is_default && (
                                                <button
                                                    onClick={() => handleSetDefault(variant.id)}
                                                    className="px-3 py-1 text-sm border rounded-lg hover:bg-white"
                                                >
                                                    Set Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteVariant(variant.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Images - 3 Slots */}
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold mb-2">Images</p>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                            {[0, 1, 2].map((slot) => {
                                                const img = variant.variant_images?.find(i => i.order === slot) || variant.variant_images?.[slot];
                                                return img ? (
                                                    <div key={slot} className="relative group">
                                                        <img
                                                            src={img.image}
                                                            alt=""
                                                            className={`w-full aspect-square object-cover rounded-lg border-2 ${img.is_primary ? 'border-green-500' : 'border-gray-200'
                                                                }`}
                                                        />
                                                        <button
                                                            onClick={() => handleDeleteImage(img.id)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                        {img.is_primary && (
                                                            <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <label key={slot} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50">
                                                        {uploadingFor === `${variant.id}-${slot}` ? (
                                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                                                        ) : (
                                                            <>
                                                                <Upload size={20} className="text-gray-400" />
                                                                <span className="text-xs text-gray-400 mt-1">Add</span>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files[0]) {
                                                                    const isPrimary = !variant.variant_images || variant.variant_images.length === 0;
                                                                    handleImageUpload(variant.id, e.target.files[0], isPrimary, slot);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Size Stocks */}
                                    <div>
                                        <p className="text-sm font-semibold mb-2">Stock per Size</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {variant.size_stocks?.length > 0 ? (
                                                variant.size_stocks.map((stock) => (
                                                    <div key={stock.size} className="text-center">
                                                        <label className="text-xs font-medium text-gray-600">{stock.size}</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            defaultValue={stock.quantity}
                                                            onBlur={(e) => handleStockUpdate(variant.id, stock.size, e.target.value)}
                                                            className="w-full px-2 py-1 border rounded text-center text-sm"
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                SIZES.map((size) => (
                                                    <div key={size} className="text-center">
                                                        <label className="text-xs font-medium text-gray-600">{size}</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            defaultValue={0}
                                                            onBlur={(e) => handleStockUpdate(variant.id, size, e.target.value)}
                                                            className="w-full px-2 py-1 border rounded text-center text-sm"
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-100 px-6 py-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}