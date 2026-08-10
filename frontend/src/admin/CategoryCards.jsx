// src/admin/CategoryCards.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, X, Palette } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function CategoryCards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        link: '/shop',
        order: 0,
        is_active: true,
        background_color: '#f5ebe0'
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/products/category-cards/');
            const data = response.data;
            if (Array.isArray(data)) {
                setCards(data);
            } else if (data && Array.isArray(data.results)) {
                setCards(data.results);
            } else {
                setCards([]);
            }
        } catch (error) {
            console.error('Error fetching category cards:', error);
            toast.error('Failed to load category cards');
            setCards([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (card = null) => {
        if (card) {
            setEditingCard(card);
            setFormData({
                title: card.title || '',
                subtitle: card.subtitle || '',
                link: card.link || '/shop',
                order: card.order || 0,
                is_active: card.is_active !== false,
                background_color: card.background_color || '#f5ebe0'
            });
            setImagePreview(card.image || '');
        } else {
            setEditingCard(null);
            setFormData({
                title: '',
                subtitle: '',
                link: '/shop',
                order: cards.length,
                is_active: true,
                background_color: '#f5ebe0'
            });
            setImagePreview('');
        }
        setImageFile(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCard(null);
        setFormData({
            title: '',
            subtitle: '',
            link: '/shop',
            order: 0,
            is_active: true,
            background_color: '#f5ebe0'
        });
        setImageFile(null);
        setImagePreview('');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title) {
            toast.error('Title is required');
            return;
        }

        if (!imageFile && !imagePreview) {
            toast.error('Please upload an image');
            return;
        }

        setSubmitting(true);

        try {
            const form = new FormData();
            form.append('title', formData.title);
            form.append('subtitle', formData.subtitle);
            form.append('link', formData.link);
            form.append('order', formData.order);
            form.append('is_active', formData.is_active);
            form.append('background_color', formData.background_color);

            if (imageFile) {
                form.append('image', imageFile);
            } else if (imagePreview && !imageFile) {
                form.append('image', imagePreview);
            }

            if (editingCard) {
                await API.patch(`/api/products/category-cards/${editingCard.id}/`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Category card updated successfully!');
            } else {
                await API.post('/api/products/category-cards/', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Category card created successfully!');
            }

            handleCloseModal();
            fetchCards();
        } catch (error) {
            console.error('Error saving category card:', error);
            toast.error(error.response?.data?.error || 'Failed to save category card');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category card?')) return;

        try {
            await API.delete(`/api/products/category-cards/${id}/`);
            toast.success('Category card deleted successfully!');
            fetchCards();
        } catch (error) {
            console.error('Error deleting category card:', error);
            toast.error('Failed to delete category card');
        }
    };

    const handleToggleActive = async (card) => {
        try {
            await API.patch(`/api/products/category-cards/${card.id}/`, {
                is_active: !card.is_active
            });
            toast.success(card.is_active ? 'Card hidden' : 'Card now visible');
            fetchCards();
        } catch (error) {
            console.error('Error toggling card:', error);
            toast.error('Failed to update card');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading category cards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
                    <p className="text-gray-600 mt-1">Manage homepage category cards section</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                    <Plus size={20} />
                    Add Category Card
                </button>
            </div>

            {/* Cards Grid */}
            {cards.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <Image size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Category Cards</h3>
                    <p className="text-gray-500 mb-4">Add your first category card to display on the homepage</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Add First Card
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className={`bg-white rounded-xl shadow-md overflow-hidden border-t-4 ${card.is_active ? 'border-green-500' : 'border-gray-300'
                                }`}
                        >
                            {/* Image with background color preview */}
                            <div
                                className="h-40 bg-gray-100 relative"
                                style={{ backgroundColor: card.background_color || '#1a1a1a' }}
                            >
                                {card.image ? (
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Image size={32} />
                                    </div>
                                )}
                                {/* Status Badge */}
                                <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${card.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {card.is_active ? 'Active' : 'Hidden'}
                                </span>
                                {/* Color Badge */}
                                <div
                                    className="absolute bottom-2 left-2 w-6 h-6 rounded-full border-2 border-white shadow"
                                    style={{ backgroundColor: card.background_color || '#1a1a1a' }}
                                    title={`Background: ${card.background_color || '#1a1a1a'}`}
                                />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                        Order: {card.order}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-1">{card.title}</h3>
                                {card.subtitle && (
                                    <p className="text-gray-500 text-sm mb-2">{card.subtitle}</p>
                                )}
                                {card.link && (
                                    <p className="text-indigo-600 text-xs truncate">{card.link}</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => handleToggleActive(card)}
                                        title={card.is_active ? 'Hide card' : 'Show card'}
                                        className={`p-2 rounded-lg transition flex-1 ${card.is_active
                                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {card.is_active ? <Eye size={18} className="mx-auto" /> : <EyeOff size={18} className="mx-auto" />}
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(card)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex-1"
                                        title="Edit card"
                                    >
                                        <Edit2 size={18} className="mx-auto" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex-1"
                                        title="Delete card"
                                    >
                                        <Trash2 size={18} className="mx-auto" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingCard ? 'Edit Category Card' : 'Add New Category Card'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Card Image *
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-40 mx-auto rounded-lg object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <Image size={40} className="mx-auto text-gray-400 mb-2" />
                                            <p className="text-gray-600">Click to upload image</p>
                                            <p className="text-xs text-gray-400 mt-1">Recommended: 400x300px</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Background Color Palette */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Palette size={16} className="inline mr-1" />
                                    Background Color
                                </label>
                                <div className="grid grid-cols-8 gap-2 p-3 bg-gray-50 rounded-lg">
                                    {[
                                        '#eef4ed', '#fefae0', '#d9d9d9', '#caf0f8',
                                        '#edf2fb', '#e2eafc', '#edede9', '#d6ccc2',
                                        '#f5ebe0', '#e3d5ca', '#d5bdaf', '#e5e5e5',
                                        '#f2e9e4', '#f5f5f0', '#f8edeb', '#ece4db',
                                        '#ffd7ba', '#e9ecef', '#f8f9fa', '#dee2e6',
                                        '#ced4da', '#adb5bd', '#ffedd8', '#f3d5b5',
                                        '#e7bc91', '#d4a276', '#1a1a1a', '#ffffff'
                                    ].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, background_color: color })}
                                            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${formData.background_color === color
                                                ? 'border-indigo-500 ring-2 ring-indigo-300 scale-110'
                                                : 'border-gray-200 hover:border-gray-400'
                                                }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                {/* Current color preview */}
                                <div className="flex items-center gap-3 mt-3">
                                    <div
                                        className="w-10 h-10 rounded-lg border-2 border-gray-300"
                                        style={{ backgroundColor: formData.background_color }}
                                    />
                                    <input
                                        type="text"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                                        placeholder="#1a1a1a"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Hoodies"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="e.g., Cozy & Stylish"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Link URL (Category)
                                </label>
                                <select
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    <option value="">-- Select Category --</option>
                                    <option value="/shop">All Products</option>
                                    <option value="/shop?category=hoodies">Hoodies</option>
                                    <option value="/shop?category=tshirts">T-Shirts</option>
                                    <option value="/shop?category=shirts">Shirts</option>
                                    <option value="/shop?category=pants">Pants</option>
                                    <option value="/shop?category=bottomwear">Bottomwear</option>
                                    <option value="/shop?category=shoes">Shoes</option>
                                    <option value="/shop?category=accessories">Accessories</option>
                                    <option value="/shop?category=jackets">Jackets</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Select the category this card links to</p>
                            </div>

                            {/* Order & Active */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.is_active ? 'active' : 'hidden'}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="active">Active (Visible)</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    {editingCard ? 'Update Card' : 'Create Card'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}