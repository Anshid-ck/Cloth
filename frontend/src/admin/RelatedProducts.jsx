// src/admin/RelatedProducts.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, GripVertical, Link2, ArrowUpDown, X, Check, ArrowUp, ArrowDown } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function RelatedProducts() {
    const [products, setProducts] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addSearchTerm, setAddSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            fetchRelatedProducts(selectedProduct.id);
        }
    }, [selectedProduct]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/products/products/');
            const data = response.data.results || response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async (productId) => {
        try {
            const response = await API.get(`/api/products/related-products/?product=${productId}`);
            const data = response.data.results || response.data;
            setRelatedProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load related products:', error);
            setRelatedProducts([]);
        }
    };

    const addRelatedProduct = async (relatedId) => {
        if (!selectedProduct) return;

        try {
            setSaving(true);
            await API.post('/api/products/related-products/', {
                product: selectedProduct.id,
                related: relatedId,
                position: relatedProducts.length,
            });
            toast.success('Related product added');
            fetchRelatedProducts(selectedProduct.id);
            setShowAddModal(false);
            setAddSearchTerm('');
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to add related product';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const removeRelatedProduct = async (relationId) => {
        if (!window.confirm('Remove this related product?')) return;

        try {
            await API.delete(`/api/products/related-products/${relationId}/`);
            toast.success('Related product removed');
            fetchRelatedProducts(selectedProduct.id);
        } catch (error) {
            toast.error('Failed to remove');
        }
    };

    const updatePosition = async (relationId, newPosition) => {
        try {
            await API.patch(`/api/products/related-products/${relationId}/`, {
                position: newPosition,
            });
            fetchRelatedProducts(selectedProduct.id);
        } catch (error) {
            toast.error('Failed to update position');
        }
    };

    // Filter products for main list
    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter products for add modal (exclude already related and current product)
    const relatedIds = new Set(relatedProducts.map(r => r.related));
    const availableProducts = products.filter((p) =>
        p.id !== selectedProduct?.id &&
        !relatedIds.has(p.id) &&
        (p.name.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
            p.brand?.toLowerCase().includes(addSearchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Related Products</h1>
                    <p className="text-gray-600 mt-1">Manage product recommendations and "You may also like" sections</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Product Selection */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                        <h2 className="text-lg font-bold text-white">Select Product</h2>
                        <p className="text-indigo-100 text-sm">Choose a product to manage its related items</p>
                    </div>

                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading products...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No products found</div>
                        ) : (
                            <div className="divide-y">
                                {filteredProducts.slice(0, 50).map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition ${selectedProduct?.id === product.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                            }`}
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {product.primary_image ? (
                                                <img src={product.primary_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Link2 size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">{product.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{product.brand || 'No brand'}</p>
                                        </div>
                                        {selectedProduct?.id === product.id && (
                                            <Check size={20} className="text-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Related Products */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Related Products</h2>
                            <p className="text-purple-100 text-sm">
                                {selectedProduct ? `For: ${selectedProduct.name}` : 'Select a product first'}
                            </p>
                        </div>
                        {selectedProduct && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <Plus size={18} />
                                Add
                            </button>
                        )}
                    </div>

                    {!selectedProduct ? (
                        <div className="p-12 text-center">
                            <Link2 size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Select a product from the left to manage related items</p>
                        </div>
                    ) : relatedProducts.length === 0 ? (
                        <div className="p-12 text-center">
                            <ArrowUpDown size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-4">No related products yet</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Add First Product
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                            {relatedProducts.sort((a, b) => a.position - b.position).map((relation, index) => (
                                <div
                                    key={relation.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
                                >
                                    <div className="text-gray-400 cursor-grab">
                                        <GripVertical size={20} />
                                    </div>

                                    <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {index + 1}
                                    </span>

                                    <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                        {relation.related_product?.primary_image ? (
                                            <img
                                                src={relation.related_product.primary_image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Link2 size={16} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">
                                            {relation.related_product?.name || relation.related_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Position: {relation.position} • ID: {relation.related}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => updatePosition(relation.id, Math.max(0, relation.position - 1))}
                                            disabled={index === 0}
                                            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded disabled:opacity-50 flex items-center justify-center"
                                            title="Move Up"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => updatePosition(relation.id, relation.position + 1)}
                                            disabled={index === relatedProducts.length - 1}
                                            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded disabled:opacity-50 flex items-center justify-center"
                                            title="Move Down"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <button
                                            onClick={() => removeRelatedProduct(relation.id)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Add Related Product</h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setAddSearchTerm('');
                                }}
                                className="text-white/80 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for a product to add..."
                                    value={addSearchTerm}
                                    onChange={(e) => setAddSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {availableProducts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    {addSearchTerm ? 'No matching products found' : 'No products available to add'}
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {availableProducts.slice(0, 20).map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addRelatedProduct(product.id)}
                                            disabled={saving}
                                            className="w-full flex items-center gap-4 p-4 text-left hover:bg-indigo-50 transition disabled:opacity-50"
                                        >
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {product.primary_image ? (
                                                    <img src={product.primary_image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <Link2 size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 truncate">{product.name}</p>
                                                <p className="text-sm text-gray-500">{product.brand || 'No brand'} • ₹{product.base_price}</p>
                                            </div>
                                            <Plus size={20} className="text-indigo-600" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}