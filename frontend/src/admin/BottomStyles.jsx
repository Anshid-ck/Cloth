// src/admin/BottomStyles.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, X, Loader2 } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function BottomStyles() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        link: '/shop?category=pants',
        background_color: '#ffffff',
        order: 0,
        is_active: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/products/bottom-styles/');
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data && Array.isArray(data.results)) {
                setItems(data.results);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error('Error fetching bottom styles:', error);
            toast.error('Failed to load bottom styles');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title || '',
                subtitle: item.subtitle || '',
                link: item.link || '/shop?category=pants',
                background_color: item.background_color || '#ffffff',
                order: item.order || 0,
                is_active: item.is_active !== false
            });
            setImagePreview(item.image || '');
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                subtitle: '',
                link: '/shop?category=pants',
                background_color: '#ffffff',
                order: items.length,
                is_active: true
            });
            setImagePreview('');
        }
        setImageFile(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            title: '',
            subtitle: '',
            link: '/shop?category=pants',
            background_color: '#ffffff',
            order: 0,
            is_active: true
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
            form.append('background_color', formData.background_color);
            form.append('order', formData.order);
            form.append('is_active', formData.is_active);

            if (imageFile) {
                form.append('image', imageFile);
            } else if (imagePreview && !imageFile) {
                form.append('image', imagePreview);
            }

            if (editingItem) {
                await API.patch(`/api/products/bottom-styles/${editingItem.id}/`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Bottom style updated successfully!');
            } else {
                await API.post('/api/products/bottom-styles/', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Bottom style created successfully!');
            }

            handleCloseModal();
            fetchItems();
        } catch (error) {
            console.error('Error saving bottom style:', error);
            toast.error(error.response?.data?.error || 'Failed to save bottom style');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bottom style?')) return;

        setDeleting(id);
        try {
            await API.delete(`/api/products/bottom-styles/${id}/`);
            toast.success('Bottom style deleted successfully!');
            fetchItems();
        } catch (error) {
            console.error('Error deleting bottom style:', error);
            toast.error('Failed to delete bottom style');
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleActive = async (item) => {
        try {
            await API.patch(`/api/products/bottom-styles/${item.id}/`, {
                is_active: !item.is_active
            });
            toast.success(item.is_active ? 'Bottom style hidden' : 'Bottom style now visible');
            fetchItems();
        } catch (error) {
            console.error('Error toggling bottom style:', error);
            toast.error('Failed to update bottom style');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading bottom styles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Bottom Styles</h2>
                    <p className="text-gray-600 mt-1">Manage bottom wear style cards displayed on the homepage</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                    <Plus size={20} />
                    Add New Style
                </button>
            </div>

            {/* Items Grid */}
            {items.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <Image size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bottom Styles</h3>
                    <p className="text-gray-500 mb-4">Add your first bottom style to display on the homepage</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Add First Style
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${item.is_active ? 'border-green-500' : 'border-gray-300'
                                }`}
                        >
                            <div className="flex">
                                {/* Image Preview */}
                                <div className="w-48 h-32 flex-shrink-0 bg-gray-100">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Image size={32} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                    Order: {item.order}
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {item.is_active ? 'Active' : 'Hidden'}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                                            {item.subtitle && (
                                                <p className="text-gray-600 text-sm mt-1">{item.subtitle}</p>
                                            )}
                                            {item.link && (
                                                <p className="text-indigo-600 text-xs mt-2">Link: {item.link}</p>
                                            )}
                                            {item.background_color && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-500">BG:</span>
                                                    <div
                                                        className="w-5 h-5 rounded border border-gray-300"
                                                        style={{ backgroundColor: item.background_color }}
                                                    />
                                                    <span className="text-xs text-gray-500">{item.background_color}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(item)}
                                                title={item.is_active ? 'Hide style' : 'Show style'}
                                                className={`p-2 rounded-lg transition ${item.is_active
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {item.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                                title="Edit style"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deleting === item.id}
                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                                                title="Delete style"
                                            >
                                                {deleting === item.id ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingItem ? 'Edit Bottom Style' : 'Add New Bottom Style'}
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
                                    Style Image *
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-48 mx-auto rounded-lg object-cover"
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
                                            <p className="text-xs text-gray-400 mt-1">Recommended: 400x400px</p>
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

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Casual Pants"
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
                                    placeholder="e.g., Comfort meets style"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Link URL
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="/shop?category=pants"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                        placeholder="#ffffff"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
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
                                        <Loader2 size={16} className="animate-spin" />
                                    )}
                                    {editingItem ? 'Update Style' : 'Create Style'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}