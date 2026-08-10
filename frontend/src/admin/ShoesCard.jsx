// src/admin/ShoesCard.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, X, Loader2, Palette, DollarSign } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

const COLOR_PALETTE = [
    '#ffffff', '#f5f5f5', '#e5e5e5', '#d9d9d9',
    '#eef4ed', '#fefae0', '#caf0f8', '#edf2fb',
    '#e2eafc', '#edede9', '#d6ccc2', '#f5ebe0',
    '#e3d5ca', '#d5bdaf', '#f2e9e4', '#f8edeb',
    '#1a1a1a', '#2d2d2d', '#000000', '#333333'
];

export default function ShoesCard() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        price: '',
        link: '/shop?category=shoes',
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
            const response = await API.get('/api/products/shoes-card/');
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data && Array.isArray(data.results)) {
                setItems(data.results);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error('Error fetching Shoes cards:', error);
            toast.error('Failed to load Shoes cards');
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
                price: item.price || '',
                link: item.link || '/shop?category=shoes',
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
                price: '',
                link: '/shop?category=shoes',
                background_color: '#ffffff',
                order: 0,
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
            price: '',
            link: '/shop?category=shoes',
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
        if (!imageFile && !imagePreview) {
            toast.error('Please upload an image');
            return;
        }

        setSubmitting(true);
        try {
            const form = new FormData();
            form.append('title', formData.title);
            form.append('subtitle', formData.subtitle);
            form.append('price', formData.price);
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
                await API.patch(`/api/products/shoes-card/${editingItem.id}/`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Shoes card updated!');
            } else {
                await API.post('/api/products/shoes-card/', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Shoes card created!');
            }

            handleCloseModal();
            fetchItems();
        } catch (error) {
            console.error('Error saving Shoes card:', error);
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this card?')) return;
        setDeleting(id);
        try {
            await API.delete(`/api/products/shoes-card/${id}/`);
            toast.success('Card deleted!');
            fetchItems();
        } catch (error) {
            toast.error('Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleActive = async (item) => {
        try {
            await API.patch(`/api/products/shoes-card/${item.id}/`, { is_active: !item.is_active });
            toast.success(item.is_active ? 'Card hidden' : 'Card visible');
            fetchItems();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading Shoes cards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Shoes Cards</h2>
                    <p className="text-gray-600 mt-1">Manage trending shoes cards displayed below the Shoes Grid</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                    <Plus size={20} />
                    Add Card
                </button>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.length === 0 ? (
                    <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center">
                        <Image size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No Shoes Cards</h3>
                        <p className="text-gray-500 mt-1">Add your first shoes card to display trending items.</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-lg transition group"
                        >
                            {/* Image */}
                            <div
                                className="h-48 relative"
                                style={{ backgroundColor: item.background_color || '#ffffff' }}
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Image size={40} />
                                    </div>
                                )}

                                {/* Price Badge */}
                                {item.price && (
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-900">
                                        {item.price}
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => handleToggleActive(item)}
                                        className={`p-1.5 rounded ${item.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                                    >
                                        {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="p-1.5 rounded bg-blue-500 text-white"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deleting === item.id}
                                        className="p-1.5 rounded bg-red-500 text-white disabled:opacity-50"
                                    >
                                        {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                                {item.subtitle && <p className="text-sm text-gray-500 mt-1">{item.subtitle}</p>}
                                <div className="mt-2 flex items-center gap-2">
                                    <div
                                        className="w-5 h-5 rounded border"
                                        style={{ backgroundColor: item.background_color }}
                                    />
                                    <span className="text-xs text-gray-500">{item.background_color}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingItem ? 'Edit Card' : 'Add New Card'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Image *</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(''); }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <Image size={40} className="mx-auto text-gray-400 mb-2" />
                                            <p className="text-gray-600">Click to upload</p>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Running Shoes"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="e.g., Lightweight & Comfortable"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <DollarSign size={16} className="inline mr-1" /> Price (Display)
                                </label>
                                <input
                                    type="text"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="e.g., ₹1,999"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Link</label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="/shop?category=shoes"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Palette size={16} className="inline mr-1" /> Background Color
                                </label>
                                <div className="grid grid-cols-10 gap-2 p-3 bg-gray-50 rounded-lg">
                                    {COLOR_PALETTE.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, background_color: color })}
                                            className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${formData.background_color === color
                                                ? 'border-indigo-500 ring-2 ring-indigo-300 scale-110'
                                                : 'border-gray-200 hover:border-gray-400'
                                                }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-8 h-8 rounded-lg border-2" style={{ backgroundColor: formData.background_color }} />
                                    <input
                                        type="text"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Order & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <select
                                        value={formData.is_active ? 'active' : 'hidden'}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 font-medium">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}