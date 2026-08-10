// src/components/QuickAddModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../redux/slices/cartSlice';
import { X, Check, ShoppingBag } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function QuickAddModal({ product, isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [fullProduct, setFullProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [visible, setVisible] = useState(false); // for animation

  // Fetch full product details when modal opens
  useEffect(() => {
    if (isOpen && product?.slug) {
      setLoading(true);
      setFullProduct(null);
      setSelectedVariant(null);
      setSelectedSize(null);

      API.get(`/api/products/products/${product.slug}/`)
        .then((res) => {
          const data = res.data;
          setFullProduct(data);

          // Set default variant
          if (data.color_variants && data.color_variants.length > 0) {
            const defaultVariant =
              data.color_variants.find((v) => v.is_default) || data.color_variants[0];
            setSelectedVariant(defaultVariant);

            // Set default size
            if (defaultVariant.size_stocks && defaultVariant.size_stocks.length > 0) {
              const availableSize = defaultVariant.size_stocks.find((s) => s.quantity > 0);
              setSelectedSize(availableSize?.size || defaultVariant.size_stocks[0].size);
            }
          }
        })
        .catch(() => {
          toast.error('Failed to load product details');
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, product?.slug]);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      // Small delay so the DOM renders first, then transition triggers
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleColorSelect = useCallback((variant) => {
    setSelectedVariant(variant);
    if (variant.size_stocks && variant.size_stocks.length > 0) {
      const availableSize = variant.size_stocks.find((s) => s.quantity > 0);
      setSelectedSize(availableSize?.size || variant.size_stocks[0].size);
    } else {
      setSelectedSize(null);
    }
  }, []);

  const getSelectedSizeStock = () => {
    if (!selectedVariant || !selectedSize) return 0;
    const sizeStock = selectedVariant.size_stocks?.find((s) => s.size === selectedSize);
    return sizeStock?.quantity || 0;
  };

  const getDisplayPrice = () => {
    if (!fullProduct) return 0;
    const basePrice = fullProduct.discount_price || fullProduct.base_price || 0;
    const adjustment = selectedVariant?.price_adjustment || 0;
    return parseFloat(basePrice) + parseFloat(adjustment);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items');
      navigate('/login');
      onClose();
      return;
    }

    if (!selectedVariant) {
      toast.error('Please select a color');
      return;
    }

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    const stock = getSelectedSizeStock();
    if (stock === 0) {
      toast.error('This size is out of stock');
      return;
    }

    setAdding(true);
    try {
      await dispatch(
        addToCart({
          product_id: fullProduct.id,
          variant_id: selectedVariant.id,
          quantity: 1,
          size: selectedSize,
          color: selectedVariant.color_name,
          color_hex: selectedVariant.color_hex,
          unit_price: getDisplayPrice(),
        })
      ).unwrap();
      onClose();
    } catch {
      // Error toast is already handled inside the thunk
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  const hasColorVariants =
    fullProduct?.color_variants && fullProduct.color_variants.length > 0;
  const primaryImage =
    selectedVariant?.variant_images?.[0]?.image ||
    fullProduct?.primary_image ||
    product?.primary_image;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          visible ? 'opacity-50' : 'opacity-0'
        }`}
      />

      {/* Modal Card */}
      <div
        className={`relative bg-white w-full sm:w-[460px] sm:max-h-[90vh] max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl transition-all duration-300 ease-out ${
          visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
        >
          <X size={18} className="text-gray-600" />
        </button>

        {loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm font-medium">Loading options...</p>
          </div>
        ) : fullProduct ? (
          <div className="p-5 sm:p-6">
            {/* Product Summary */}
            <div className="flex gap-4 mb-6">
              {/* Thumbnail */}
              <div
                className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100"
                style={{ backgroundColor: fullProduct.background_color || '#f9fafb' }}
              >
                <img
                  src={primaryImage}
                  alt={fullProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {fullProduct.brand}
                </p>
                <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-2">
                  {fullProduct.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-900">
                    ₹{Math.round(getDisplayPrice())}
                  </span>
                  {fullProduct.discount_price && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{Math.round(fullProduct.base_price)}
                      </span>
                      {fullProduct.discount_percentage > 0 && (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          -{fullProduct.discount_percentage}%
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Color Selection */}
            {hasColorVariants && fullProduct.color_variants.length > 1 && (
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Color:{' '}
                  <span className="font-normal text-gray-500">
                    {selectedVariant?.color_name}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {fullProduct.color_variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleColorSelect(variant)}
                      title={variant.color_name}
                      className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedVariant?.id === variant.id
                          ? 'border-black ring-2 ring-offset-2 ring-black scale-110'
                          : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                      }`}
                      style={{ backgroundColor: variant.color_hex }}
                    >
                      {selectedVariant?.id === variant.id && (
                        <Check
                          size={14}
                          className={
                            variant.color_hex?.toLowerCase() === '#ffffff' ||
                            variant.color_hex?.toLowerCase() === '#fff'
                              ? 'text-black'
                              : 'text-white'
                          }
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Select Size
              </label>
              <div className="grid grid-cols-5 gap-2">
                {selectedVariant?.size_stocks?.map((sizeStock) => (
                  <button
                    key={sizeStock.size}
                    onClick={() => setSelectedSize(sizeStock.size)}
                    disabled={sizeStock.quantity === 0}
                    className={`py-2.5 rounded-full border-2 text-sm font-semibold transition-all relative ${
                      selectedSize === sizeStock.size
                        ? 'bg-black text-white border-black'
                        : sizeStock.quantity === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        : 'border-gray-300 text-gray-700 hover:border-black'
                    }`}
                  >
                    {sizeStock.size}
                    {sizeStock.quantity > 0 && sizeStock.quantity <= 3 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {sizeStock.quantity}
                      </span>
                    )}
                  </button>
                )) || (
                  <p className="col-span-5 text-sm text-gray-400">No sizes available</p>
                )}
              </div>

              {/* Stock indicator */}
              {selectedSize && selectedVariant && (
                <p className="mt-2 text-xs text-gray-500">
                  {getSelectedSizeStock() > 0 ? (
                    <span className="text-green-600">
                      ✓ {getSelectedSizeStock()} in stock
                    </span>
                  ) : (
                    <span className="text-red-500">Out of stock</span>
                  )}
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={adding || getSelectedSizeStock() === 0}
              className="w-full bg-black text-white py-3.5 rounded-full font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : getSelectedSizeStock() === 0 ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingBag size={16} />
                  Add to Cart — ₹{Math.round(getDisplayPrice())}
                </>
              )}
            </button>

            {/* View Full Details Link */}
            <button
              onClick={() => {
                onClose();
                navigate(`/product/${fullProduct.slug}`);
              }}
              className="w-full mt-3 text-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors py-2"
            >
              View Full Details →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
