// src/admin/MensHoodiesGrid.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, X } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

const POSITION_OPTIONS = [
    { value: 1, label: 'Main Banner (Large - Top)' },
    { value: 2, label: 'Card 2 (Bottom Left)' },
    { value: 3, label: 'Card 3 (Bottom Center-Left)' },
    { value: 4, label: 'Card 4 (Bottom Center-Right)' },
    { value: 5, label: 'Card 5 (Wide - Bottom Right)' },
];

export default function MensHoodiesGrid() {
    const [gridItems, setGridItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        link: '/shop?category=hoodies',
        position: 1,
        is_active: true,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchGridItems();
    }, []);

    const fetchGridItems = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/products/mens-hoodie-grid/');
            const data = Array.isArray(res.data) ? res.data : res.data.results || [];
            setGridItems(data);
        } catch (error) {
            console.error('Error fetching grid items:', error);
            toast.error('Failed to load grid items');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title || '',
                link: item.link || '',
                position: item.position || 1,
                is_active: item.is_active !== false,
            });
            setImagePreview(item.image || '');
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                link: '/shop?category=hoodies',
                position: getNextAvailablePosition(),
                is_active: true,
            });
            setImagePreview('');
        }
        setImageFile(null);
        setShowModal(true);
    };

    const getNextAvailablePosition = () => {
        const usedPositions = gridItems.map(item => item.position);
        for (let i = 1; i <= 5; i++) {
            if (!usedPositions.includes(i)) return i;
        }
        return 1;
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setImageFile(null);
        setImagePreview('');
        setFormData({
            title: '',
            link: '/shop?category=hoodies',
            position: 1,
            is_active: true,
        });
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
        setSaving(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('link', formData.link);
            data.append('position', formData.position);
            data.append('is_active', formData.is_active);
            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editingItem) {
                await API.patch(`/api/products/mens-hoodie-grid/${editingItem.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Grid item updated!');
            } else {
                await API.post('/api/products/mens-hoodie-grid/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Grid item created!');
            }

            handleCloseModal();
            fetchGridItems();
        } catch (error) {
            console.error('Error saving grid item:', error);
            const errMsg = error.response?.data?.error || 'Failed to save grid item';
            toast.error(errMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this grid item?')) return;

        try {
            await API.delete(`/api/products/mens-hoodie-grid/${id}/`);
            toast.success('Grid item deleted');
            fetchGridItems();
        } catch (error) {
            console.error('Error deleting grid item:', error);
            toast.error('Failed to delete item');
        }
    };

    const handleToggleActive = async (item) => {
        try {
            const data = new FormData();
            data.append('is_active', !item.is_active);
            await API.patch(`/api/products/mens-hoodie-grid/${item.id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(`Item ${!item.is_active ? 'activated' : 'deactivated'}`);
            fetchGridItems();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Men's Hoodies Grid</h1>
                    <p className="text-gray-500 mt-1">Manage the 5-position grid section on homepage</p>
                </div>
                {gridItems.length < 5 && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        <Plus size={18} />
                        Add Grid Item
                    </button>
                )}
            </div>

            {/* Grid Preview */}
            <div className="mb-8 p-6 bg-gray-100 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Grid Layout Preview</h3>
                <div className="grid grid-cols-5 grid-rows-5 gap-2 h-64">
                    {[1, 2, 3, 4, 5].map((pos) => {
                        const item = gridItems.find(g => g.position === pos);
                        const positionClasses = {
                            1: 'col-span-5 row-span-3',
                            2: 'row-span-2 row-start-4',
                            3: 'row-span-2 row-start-4',
                            4: 'row-span-2 row-start-4',
                            5: 'col-span-2 row-span-2 row-start-4',
                        };
                        return (
                            <div
                                key={pos}
                                className={`${positionClasses[pos]} rounded-lg overflow-hidden relative group cursor-pointer border-2 ${item ? 'border-green-500' : 'border-dashed border-gray-300'}`}
                                onClick={() => item ? handleOpenModal(item) : handleOpenModal()}
                            >
                                {item ? (
                                    <>
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                            <span className="text-white text-sm font-medium">{item.title}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <span className="text-gray-400 text-xs">Position {pos}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Grid Items Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Position</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Image</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Title</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Link</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : gridItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No grid items yet. Add items for positions 1-5.
                                </td>
                            </tr>
                        ) : (
                            gridItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">Position {item.position}</span>
                                        <p className="text-xs text-gray-500">{item.position_display}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} className="w-16 h-12 object-cover rounded" />
                                        ) : (
                                            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                <Image size={16} className="text-gray-400" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.title || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.link || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleActive(item)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                title={item.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {item.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold">
                                {editingItem ? 'Edit Grid Item' : 'Add Grid Item'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    required
                                >
                                    {POSITION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Premium Hoodies"
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="/shop?category=hoodies"
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                                <div className="border-2 border-dashed rounded-lg p-4">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                                            <Image size={32} className="text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">Click to upload image</span>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Active (visible on homepage)</label>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}