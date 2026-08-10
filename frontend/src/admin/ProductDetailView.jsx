// src/admin/ProductDetailView.jsx
import React, { useState, useEffect } from 'react';
import { X, Package, Palette, Image as ImageIcon, Box, Tag, Edit2 } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function ProductDetailView({ product, onClose, onManageColors }) {
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProductDetails();
    }, [product.slug]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/api/products/products/${product.slug}/`);
            setProductData(response.data);
        } catch (error) {
            toast.error('Failed to load product details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!productData) return null;

    const colorVariants = productData.color_variants || [];
    const productImages = productData.images || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                    <div className="text-white">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Package size={24} />
                            {productData.name}
                        </h2>
                        <p className="text-indigo-200 text-sm">Product ID: {productData.id} | Slug: {productData.slug}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoCard label="Brand" value={productData.brand || '-'} />
                        <InfoCard label="Category" value={productData.category_name || '-'} />
                        <InfoCard label="Base Price" value={`₹${productData.base_price}`} highlight />
                        <InfoCard label="Discount Price" value={productData.discount_price ? `₹${productData.discount_price}` : '-'} highlight />
                        <InfoCard label="Total Stock" value={productData.total_stock} />
                        <InfoCard label="Rating" value={`${productData.rating} ⭐ (${productData.reviews_count} reviews)`} />
                        <InfoCard label="Fabric" value={productData.fabric || '-'} />
                        <InfoCard label="Fit" value={productData.fit || '-'} />
                    </div>

                    {/* Description */}
                    {productData.description && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-bold text-gray-700 mb-2">Description</h3>
                            <p className="text-gray-600 text-sm">{productData.description}</p>
                        </div>
                    )}

                    {/* Product Images (Old System) */}
                    {productImages.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <ImageIcon size={18} />
                                Product Images (Legacy)
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {productImages.map((img, idx) => (
                                    <div key={idx} className="relative">
                                        <img
                                            src={img.image}
                                            alt={img.alt_text || `Image ${idx + 1}`}
                                            className={`w-24 h-24 object-cover rounded-lg border-2 ${img.is_primary ? 'border-green-500' : 'border-gray-200'
                                                }`}
                                        />
                                        {img.is_primary && (
                                            <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color Variants Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <Palette size={18} />
                                Color Variants ({colorVariants.length})
                            </h3>
                            <button
                                onClick={() => {
                                    onClose();
                                    onManageColors(product);
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                            >
                                <Edit2 size={14} /> Manage Colors
                            </button>
                        </div>

                        {colorVariants.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Palette size={48} className="mx-auto mb-2 opacity-30" />
                                <p>No color variants added yet</p>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onManageColors(product);
                                    }}
                                    className="mt-2 text-indigo-600 underline"
                                >
                                    Add Color Variants
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {colorVariants.map((variant) => (
                                    <div key={variant.id} className="bg-white rounded-xl p-4 border shadow-sm">
                                        {/* Variant Header */}
                                        <div className="flex items-center gap-4 mb-3">
                                            <div
                                                className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-inner"
                                                style={{ backgroundColor: variant.color_hex }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-800">{variant.color_name}</h4>
                                                    {variant.is_default && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    SKU: {variant.sku} | Price: ₹{parseFloat(productData.base_price) + parseFloat(variant.price_adjustment || 0)}
                                                    {variant.price_adjustment !== 0 && (
                                                        <span className="ml-1 text-blue-600">
                                                            ({variant.price_adjustment > 0 ? '+' : ''}{variant.price_adjustment})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-700">
                                                    {variant.total_stock || variant.size_stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0} units
                                                </p>
                                                <p className="text-xs text-gray-500">Total Stock</p>
                                            </div>
                                        </div>

                                        {/* Variant Images */}
                                        {variant.variant_images && variant.variant_images.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Images</p>
                                                <div className="flex gap-2">
                                                    {variant.variant_images.map((img) => (
                                                        <img
                                                            key={img.id}
                                                            src={img.image}
                                                            alt=""
                                                            className={`w-16 h-16 object-cover rounded-lg border-2 ${img.is_primary ? 'border-green-500' : 'border-gray-200'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Size Stock Table */}
                                        {variant.size_stocks && variant.size_stocks.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Size & Stock</p>
                                                <div className="flex gap-2">
                                                    {variant.size_stocks.map((stock) => (
                                                        <div
                                                            key={stock.size}
                                                            className={`px-3 py-1 rounded-lg text-center text-sm ${stock.quantity > 0
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-gray-100 text-gray-400'
                                                                }`}
                                                        >
                                                            <div className="font-bold">{stock.size}</div>
                                                            <div className="text-xs">{stock.quantity}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-700 mb-2">Product Flags</h4>
                            <div className="flex flex-wrap gap-2">
                                {productData.is_featured && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">Featured</span>
                                )}
                                {productData.is_new_arrival && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">New Arrival</span>
                                )}
                                {productData.is_active ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Active</span>
                                ) : (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Inactive</span>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-700 mb-2">Attributes</h4>
                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                                <span>Sleeve: {productData.sleeve || '-'}</span>
                                <span>Season: {productData.season || '-'}</span>
                                <span>Material: {productData.material || '-'}</span>
                                <span>Care: {productData.care_instructions || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-100 px-6 py-4 border-t flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={() => {
                            onClose();
                            onManageColors(product);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        <Palette size={18} /> Manage Colors
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper component for info cards
function InfoCard({ label, value, highlight = false }) {
    return (
        <div className={`p-3 rounded-lg ${highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`font-semibold ${highlight ? 'text-indigo-700' : 'text-gray-800'}`}>{value}</p>
        </div>
    );
}