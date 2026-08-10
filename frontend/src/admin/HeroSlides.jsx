// src/admin/HeroSlides.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, GripVertical, X } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function HeroSlides() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        link: '/shop',
        order: 0,
        is_active: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/products/banners/');
            // Handle both paginated response (with results) and direct array
            const data = response.data;
            if (Array.isArray(data)) {
                setSlides(data);
            } else if (data && Array.isArray(data.results)) {
                setSlides(data.results);
            } else {
                setSlides([]);
            }
        } catch (error) {
            console.error('Error fetching slides:', error);
            toast.error('Failed to load hero slides');
            setSlides([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (slide = null) => {
        if (slide) {
            setEditingSlide(slide);
            setFormData({
                title: slide.title || '',
                subtitle: slide.subtitle || '',
                description: slide.description || '',
                link: slide.link || '/shop',
                order: slide.order || 0,
                is_active: slide.is_active !== false
            });
            setImagePreview(slide.image || '');
        } else {
            setEditingSlide(null);
            setFormData({
                title: '',
                subtitle: '',
                description: '',
                link: '/shop',
                order: slides.length,
                is_active: true
            });
            setImagePreview('');
        }
        setImageFile(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSlide(null);
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            link: '/shop',
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
            form.append('description', formData.description);
            form.append('link', formData.link);
            form.append('order', formData.order);
            form.append('is_active', formData.is_active);

            if (imageFile) {
                form.append('image', imageFile);
            } else if (imagePreview && !imageFile) {
                form.append('image', imagePreview);
            }

            if (editingSlide) {
                await API.patch(`/api/products/banners/${editingSlide.id}/`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Slide updated successfully!');
            } else {
                await API.post('/api/products/banners/', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Slide created successfully!');
            }

            handleCloseModal();
            fetchSlides();
        } catch (error) {
            console.error('Error saving slide:', error);
            toast.error(error.response?.data?.error || 'Failed to save slide');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;

        try {
            await API.delete(`/api/products/banners/${id}/`);
            toast.success('Slide deleted successfully!');
            fetchSlides();
        } catch (error) {
            console.error('Error deleting slide:', error);
            toast.error('Failed to delete slide');
        }
    };

    const handleToggleActive = async (slide) => {
        try {
            await API.patch(`/api/products/banners/${slide.id}/`, {
                is_active: !slide.is_active
            });
            toast.success(slide.is_active ? 'Slide hidden' : 'Slide now visible');
            fetchSlides();
        } catch (error) {
            console.error('Error toggling slide:', error);
            toast.error('Failed to update slide');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading hero slides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Hero Slides</h2>
                    <p className="text-gray-600 mt-1">Manage homepage hero slider images and content</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                    <Plus size={20} />
                    Add New Slide
                </button>
            </div>

            {/* Slides Grid */}
            {slides.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <Image size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Hero Slides</h3>
                    <p className="text-gray-500 mb-4">Add your first hero slide to display on the homepage</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Add First Slide
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${slide.is_active ? 'border-green-500' : 'border-gray-300'
                                }`}
                        >
                            <div className="flex">
                                {/* Image Preview */}
                                <div className="w-64 h-40 flex-shrink-0 bg-gray-100">
                                    {slide.image ? (
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
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
                                                    Order: {slide.order}
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${slide.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {slide.is_active ? 'Active' : 'Hidden'}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800">{slide.title}</h3>
                                            {slide.subtitle && (
                                                <p className="text-gray-600 text-sm mt-1">{slide.subtitle}</p>
                                            )}
                                            {slide.description && (
                                                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{slide.description}</p>
                                            )}
                                            {slide.link && (
                                                <p className="text-indigo-600 text-xs mt-2">Link: {slide.link}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(slide)}
                                                title={slide.is_active ? 'Hide slide' : 'Show slide'}
                                                className={`p-2 rounded-lg transition ${slide.is_active
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {slide.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(slide)}
                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                                title="Edit slide"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slide.id)}
                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                                title="Delete slide"
                                            >
                                                <Trash2 size={18} />
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
                                {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
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
                                    Slide Image *
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
                                            <p className="text-xs text-gray-400 mt-1">Recommended: 1600x500px</p>
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
                                    placeholder="e.g., New Season Collection"
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
                                    placeholder="e.g., Winter Collection 2025"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Short description for the slide..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Button Link
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="/shop or /shop?category=hoodies"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
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
                                    {editingSlide ? 'Update Slide' : 'Create Slide'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}