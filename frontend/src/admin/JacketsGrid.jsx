// src/admin/JacketsGrid.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, X, Loader2, Palette } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

const POSITION_OPTIONS = [
    { value: 1, label: 'Large Left Card (Full Height)' },
    { value: 2, label: 'Top Middle Card' },
    { value: 3, label: 'Top Right Card' },
    { value: 4, label: 'Bottom Middle Card' },
    { value: 5, label: 'Bottom Right Card' },
];

const COLOR_PALETTE = [
    '#eef4ed', '#fefae0', '#d9d9d9', '#caf0f8',
    '#edf2fb', '#e2eafc', '#edede9', '#d6ccc2',
    '#f5ebe0', '#e3d5ca', '#d5bdaf', '#e5e5e5',
    '#f2e9e4', '#f5f5f0', '#f8edeb', '#ece4db',
    '#ffd7ba', '#e9ecef', '#f8f9fa', '#dee2e6',
    '#ced4da', '#adb5bd', '#ffedd8', '#f3d5b5',
    '#e7bc91', '#d4a276', '#1a1a1a', '#ffffff'
];

export default function JacketsGrid() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        link: '/shop?category=jackets',
        background_color: '#ffffff',
        position: 1,
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
            const response = await API.get('/api/products/jackets-grid/');
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data && Array.isArray(data.results)) {
                setItems(data.results);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error('Error fetching jackets grid:', error);
            toast.error('Failed to load jackets grid');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const getAvailablePositions = () => {
        const usedPositions = items.filter(i => !editingItem || i.id !== editingItem.id).map(i => i.position);
        return POSITION_OPTIONS.filter(opt => !usedPositions.includes(opt.value));
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title || '',
                subtitle: item.subtitle || '',
                link: item.link || '/shop?category=jackets',
                background_color: item.background_color || '#ffffff',
                position: item.position || 1,
                is_active: item.is_active !== false
            });
            setImagePreview(item.image || '');
        } else {
            setEditingItem(null);
            const available = getAvailablePositions();
            setFormData({
                title: '',
                subtitle: '',
                link: '/shop?category=jackets',
                background_color: '#ffffff',
                position: available.length > 0 ? available[0].value : 1,
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
            link: '/shop?category=jackets',
            background_color: '#ffffff',
            position: 1,
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
            form.append('position', formData.position);
            form.append('is_active', formData.is_active);

            if (imageFile) {
                form.append('image', imageFile);
            } else if (imagePreview && !imageFile) {
                form.append('image', imagePreview);
            }

            if (editingItem) {
                await API.patch(`/api/products/jackets-grid/${editingItem.id}/`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Jackets grid item updated!');
            } else {
                await API.post('/api/products/jackets-grid/', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Jackets grid item created!');
            }

            handleCloseModal();
            fetchItems();
        } catch (error) {
            console.error('Error saving jackets grid:', error);
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        setDeleting(id);
        try {
            await API.delete(`/api/products/jackets-grid/${id}/`);
            toast.success('Item deleted!');
            fetchItems();
        } catch (error) {
            toast.error('Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleActive = async (item) => {
        try {
            await API.patch(`/api/products/jackets-grid/${item.id}/`, { is_active: !item.is_active });
            toast.success(item.is_active ? 'Item hidden' : 'Item visible');
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
                    <p className="text-gray-600">Loading jackets grid...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Jackets Grid</h2>
                    <p className="text-gray-600 mt-1">Manage homepage jackets section (6 positions)</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    disabled={items.length >= 5}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={20} />
                    Add Item
                </button>
            </div>

            {/* Grid Preview */}
            <div className="bg-gray-800 rounded-2xl p-4">
                <div className="grid grid-cols-6 grid-rows-6 gap-3 h-96">
                    {[1, 2, 3, 4, 5].map((pos) => {
                        const item = items.find(i => i.position === pos);
                        const gridClasses = {
                            1: 'col-span-2 row-span-6',
                            2: 'col-span-2 row-span-3 col-start-3',
                            3: 'col-span-2 row-span-3 col-start-5',
                            4: 'col-span-2 row-span-3 col-start-3 row-start-4',
                            5: 'col-span-2 row-span-3 col-start-5 row-start-4',
                        };

                        return (
                            <div
                                key={pos}
                                className={`${gridClasses[pos]} rounded-xl overflow-hidden relative group cursor-pointer`}
                                style={{ backgroundColor: item?.background_color || '#4a5568' }}
                                onClick={() => item && handleOpenModal(item)}
                            >
                                {item ? (
                                    <>
                                        {item.image && (
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                                            <div>
                                                <p className="text-white font-bold text-sm">{item.title}</p>
                                                {item.subtitle && <p className="text-white/70 text-xs">{item.subtitle}</p>}
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleToggleActive(item); }}
                                                className={`p-1.5 rounded ${item.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                                            >
                                                {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="p-1.5 rounded bg-red-500 text-white"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <Image size={24} />
                                        <p className="text-xs mt-1">Position {pos}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingItem ? 'Edit Item' : 'Add New Item'}
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

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Position *</label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    {POSITION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Winter Jackets"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="e.g., Stay warm in style"
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
                                    placeholder="/shop?category=jackets"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Palette size={16} className="inline mr-1" /> Background Color
                                </label>
                                <div className="grid grid-cols-8 gap-2 p-3 bg-gray-50 rounded-lg">
                                    {COLOR_PALETTE.map((color) => (
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
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="w-10 h-10 rounded-lg border-2" style={{ backgroundColor: formData.background_color }} />
                                    <input
                                        type="text"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Status */}
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