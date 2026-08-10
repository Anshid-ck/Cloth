// src/admin/PromotionalBanners.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, X, Loader2, Palette } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

const COLOR_PALETTE = [
    '#f8f8f8', '#ffffff', '#f5f5f5', '#eef4ed',
    '#fefae0', '#d9d9d9', '#caf0f8', '#edf2fb',
    '#e2eafc', '#edede9', '#d6ccc2', '#f5ebe0',
    '#e3d5ca', '#d5bdaf', '#e5e5e5', '#f2e9e4',
    '#1a1a1a', '#2d2d2d', '#000000'
];

export default function PromotionalBanners() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        discount_text: '',
        description: '',
        button_text: 'Shop Now',
        button_link: '/shop',
        background_color: '#f8f8f8',
        order: 0,
        is_active: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/products/promotional-banners/');
            const data = response.data;
            if (Array.isArray(data)) {
                setBanners(data);
            } else if (data && Array.isArray(data.results)) {
                setBanners(data.results);
            } else {
                setBanners([]);
            }
        } catch (error) {
            console.error('Error fetching promotional banners:', error);
            toast.error('Failed to load promotional banners');
            setBanners([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title || '',
                subtitle: banner.subtitle || '',
                discount_text: banner.discount_text || '',
                description: banner.description || '',
                button_text: banner.button_text || 'Shop Now',
                button_link: banner.button_link || '/shop',
                background_color: banner.background_color || '#f8f8f8',
                order: banner.order || 0,
                is_active: banner.is_active !== false
            });
            setImagePreview(banner.image || '');
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                subtitle: '',
                discount_text: '',
                description: '',
                button_text: 'Shop Now',
                button_link: '/shop',
                background_color: '#f8f8f8',
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
        setEditingBanner(null);
        setFormData({
            title: '',
            subtitle: '',
            discount_text: '',
            description: '',
            button_text: 'Shop Now',
            button_link: '/shop',
            background_color: '#f8f8f8',
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

        setSubmitting(true);
        try {
            const form = new FormData();
            form.append('title', formData.title);
            form.append('subtitle', formData.subtitle);
            form.append('discount_text', formData.discount_text);
            form.append('description', formData.description);
            form.append('button_text', formData.button_text);
            form.append('button_link', formData.button_link);
            form.append('background_color', formData.background_color);
            form.append('order', formData.order);
            form.append('is_active', formData.is_active);

            if (imageFile) {
                form.append('image', imageFile);
            } else if (imagePreview && !imageFile) {
                form.append('image', imagePreview);
            }

            if (editingBanner) {
                await API.patch(`/api/products/promotional-banners/${editingBanner.id}/`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Promotional banner updated!');
            } else {
                await API.post('/api/products/promotional-banners/', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Promotional banner created!');
            }

            handleCloseModal();
            fetchBanners();
        } catch (error) {
            console.error('Error saving promotional banner:', error);
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this promotional banner?')) return;
        setDeleting(id);
        try {
            await API.delete(`/api/products/promotional-banners/${id}/`);
            toast.success('Banner deleted!');
            fetchBanners();
        } catch (error) {
            toast.error('Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleActive = async (banner) => {
        try {
            await API.patch(`/api/products/promotional-banners/${banner.id}/`, { is_active: !banner.is_active });
            toast.success(banner.is_active ? 'Banner hidden' : 'Banner visible');
            fetchBanners();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading promotional banners...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Promotional Banners</h2>
                    <p className="text-gray-600 mt-1">Manage homepage promotional banners (below Jackets Grid)</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                    <Plus size={20} />
                    Add Banner
                </button>
            </div>

            {/* Banner List */}
            <div className="grid grid-cols-1 gap-4">
                {banners.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-12 text-center">
                        <Image size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No Promotional Banners</h3>
                        <p className="text-gray-500 mt-1">Add your first promotional banner to display on the homepage.</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div
                            key={banner.id}
                            className="bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-lg transition"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Image Preview */}
                                <div
                                    className="w-full md:w-64 h-40 flex-shrink-0"
                                    style={{ backgroundColor: banner.background_color || '#f8f8f8' }}
                                >
                                    {banner.image ? (
                                        <img
                                            src={banner.image}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Image size={40} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-4 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{banner.title}</h3>
                                        {banner.subtitle && <p className="text-gray-600 text-sm">{banner.subtitle}</p>}
                                        {banner.discount_text && (
                                            <span className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                                                {banner.discount_text}
                                            </span>
                                        )}
                                        <div className="mt-2 flex items-center gap-2">
                                            <div
                                                className="w-5 h-5 rounded border"
                                                style={{ backgroundColor: banner.background_color }}
                                            />
                                            <span className="text-xs text-gray-500">{banner.background_color}</span>
                                            <span className="text-xs text-gray-400">|</span>
                                            <span className="text-xs text-gray-500">Order: {banner.order}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(banner)}
                                            className={`p-2 rounded-lg transition ${banner.is_active
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            title={banner.is_active ? 'Hide' : 'Show'}
                                        >
                                            {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(banner)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner.id)}
                                            disabled={deleting === banner.id}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {deleting === banner.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                        </button>
                                    </div>
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
                                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-cover" />
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., BLACK FRIDAY SALE"
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
                                    placeholder="e.g., Best Prices of the Year"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Discount Text */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Text</label>
                                <input
                                    type="text"
                                    value={formData.discount_text}
                                    onChange={(e) => setFormData({ ...formData, discount_text: e.target.value })}
                                    placeholder="e.g., UP TO 70% OFF"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Additional description text..."
                                    rows={2}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Button Text & Link */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Button Text</label>
                                    <input
                                        type="text"
                                        value={formData.button_text}
                                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                        placeholder="Shop Now"
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Button Link</label>
                                    <input
                                        type="text"
                                        value={formData.button_link}
                                        onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                                        placeholder="/shop"
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
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
                                    {editingBanner ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}