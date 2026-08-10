// frontend/src/pages/ProductDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { Heart, Share2, Star, Truck, RotateCcw, Check, ChevronDown, ChevronUp } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';
import ProductReviews from '../components/ProductReviews';
import RelatedProductsSlider from '../components/RelatedProductsSlider';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);  // Color variant
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(true);
  const [showShipping, setShowShipping] = useState(false);

  // Zoom state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef(null);

  const isWishlisted = wishlistItems.some((item) => item.id === product?.id);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  // Set default variant and size when product loads
  useEffect(() => {
    if (product) {
      const { preselectedVariantId, preselectedSize } = location.state || {};

      // Set color variant
      if (product.color_variants && product.color_variants.length > 0) {
        // Try to match the preselected variant from navigation state
        let chosenVariant = preselectedVariantId
          ? product.color_variants.find(v => v.id === preselectedVariantId)
          : null;

        // Fallback to default variant
        if (!chosenVariant) {
          chosenVariant = product.color_variants.find(v => v.is_default) || product.color_variants[0];
        }
        setSelectedVariant(chosenVariant);

        // Set size — prefer preselected, then first available
        if (chosenVariant.size_stocks && chosenVariant.size_stocks.length > 0) {
          if (preselectedSize && chosenVariant.size_stocks.some(s => s.size === preselectedSize)) {
            setSelectedSize(preselectedSize);
          } else {
            const availableSize = chosenVariant.size_stocks.find(s => s.quantity > 0);
            setSelectedSize(availableSize?.size || chosenVariant.size_stocks[0].size);
          }
        }
      }
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/products/products/${slug}/`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  // Handle color selection - switch variant and reset image index
  const handleColorSelect = (variant) => {
    setSelectedVariant(variant);
    setSelectedImageIndex(0);

    // Reset size to first available in new variant
    if (variant.size_stocks && variant.size_stocks.length > 0) {
      const availableSize = variant.size_stocks.find(s => s.quantity > 0);
      setSelectedSize(availableSize?.size || variant.size_stocks[0].size);
    }
  };

  // Get current images based on selected variant
  const getCurrentImages = () => {
    if (selectedVariant && selectedVariant.variant_images && selectedVariant.variant_images.length > 0) {
      return selectedVariant.variant_images;
    }
    // Fallback to product images if no variant images
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    return [{ image: 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image', alt_text: 'No image' }];
  };

  // Get stock for selected size
  const getSelectedSizeStock = () => {
    if (!selectedVariant || !selectedSize) return 0;
    const sizeStock = selectedVariant.size_stocks?.find(s => s.size === selectedSize);
    return sizeStock?.quantity || 0;
  };

  // Calculate price with variant adjustment
  const getDisplayPrice = () => {
    const basePrice = product?.discount_price || product?.base_price || 0;
    const adjustment = selectedVariant?.price_adjustment || 0;
    return parseFloat(basePrice) + parseFloat(adjustment);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items');
      navigate('/login');
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

    dispatch(addToCart({
      product_id: product.id,
      variant_id: selectedVariant.id,
      quantity,
      size: selectedSize,
      color: selectedVariant.color_name,
      color_hex: selectedVariant.color_hex,
      unit_price: getDisplayPrice(),
    }));
    toast.success('Added to cart!');
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login');
      navigate('/login');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist(product.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const currentImages = getCurrentImages();
  const hasColorVariants = product.color_variants && product.color_variants.length > 0;

  return (
    <div className="min-h-screen bg-white pt-28 md:pt-32 pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Image Gallery - Left */}
          <div className="lg:col-span-5">
            <div className="flex flex-col w-full max-w-[520px] mx-auto">
              {/* Main Image with Zoom */}
              <div
                ref={imageContainerRef}
                className="w-full rounded-[20px] overflow-hidden mb-4 aspect-[4/5] relative cursor-zoom-in border border-gray-100"
                style={{
                  backgroundColor: product.background_color || '#ffffff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                }}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={(e) => {
                  if (!imageContainerRef.current) return;
                  const rect = imageContainerRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomPosition({ x, y });
                }}
              >
                {/* Normal Image */}
                <img
                  src={currentImages[selectedImageIndex]?.image}
                  alt={currentImages[selectedImageIndex]?.alt_text || product.name}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${isZooming ? 'opacity-0' : 'opacity-100'}`}
                />

                {/* Zoomed Image - Hidden on mobile */}
                <div
                  className={`absolute inset-0 transition-opacity duration-200 hidden md:block ${isZooming ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  style={{
                    backgroundImage: `url(${currentImages[selectedImageIndex]?.image})`,
                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    backgroundSize: '200%',
                    backgroundRepeat: 'no-repeat'
                  }}
                />

                {/* Zoom indicator - Hidden on mobile */}
                {!isZooming && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full hidden md:flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                      <path d="M11 8v6" />
                      <path d="M8 11h6" />
                    </svg>
                    Hover to zoom
                  </div>
                )}
              </div>

              {/* Thumbnail Strip - 3 images filling width */}
              {currentImages.length > 1 && (
                <div className="grid grid-cols-3 gap-3 w-full">
                  {currentImages.slice(0, 3).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-full aspect-square rounded-[16px] overflow-hidden transition-all duration-200 border ${selectedImageIndex === idx
                        ? 'border-gray-400 ring-1 ring-gray-300'
                        : 'border-gray-100 hover:border-gray-300'
                        }`}
                      style={{
                        backgroundColor: product.background_color || '#ffffff',
                        boxShadow: selectedImageIndex === idx
                          ? '0 4px 12px rgba(0,0,0,0.1)'
                          : '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      <img
                        src={img.image}
                        alt={img.alt_text || `Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info - Center */}
          <div className="lg:col-span-4">
            {/* Brand */}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              {product.brand}
            </p>

            {/* Product Name */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating}/5
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl font-bold text-gray-900">
                ₹{Math.round(getDisplayPrice())}
              </span>
              {product.discount_price && (
                <>
                  <span className="text-2xl text-gray-400 line-through">
                    ₹{Math.round(product.base_price)}
                  </span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discount_percentage}%
                  </span>
                </>
              )}
            </div>

            {/* Color Selection */}
            {hasColorVariants && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Select Color: <span className="font-normal text-gray-600">{selectedVariant?.color_name}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.color_variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleColorSelect(variant)}
                      title={variant.color_name}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${selectedVariant?.id === variant.id
                        ? 'border-black ring-2 ring-offset-2 ring-black'
                        : 'border-gray-300 hover:border-gray-500'
                        }`}
                      style={{ backgroundColor: variant.color_hex }}
                    >
                      {selectedVariant?.id === variant.id && (
                        <Check size={16} className={
                          variant.color_hex.toLowerCase() === '#ffffff' ||
                            variant.color_hex.toLowerCase() === '#fff'
                            ? 'text-black'
                            : 'text-white'
                        } />
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
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {selectedVariant?.size_stocks?.map((sizeStock) => (
                  <button
                    key={sizeStock.size}
                    onClick={() => setSelectedSize(sizeStock.size)}
                    disabled={sizeStock.quantity === 0}
                    className={`py-3 rounded-full border-2 text-sm font-semibold transition-all relative ${selectedSize === sizeStock.size
                      ? 'bg-black text-white border-black'
                      : sizeStock.quantity === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        : 'border-gray-300 text-gray-700 hover:border-black'
                      }`}
                  >
                    {sizeStock.size}
                    {sizeStock.quantity > 0 && sizeStock.quantity <= 3 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {sizeStock.quantity}
                      </span>
                    )}
                  </button>
                )) || (
                    // Fallback if no variant selected
                    ['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 rounded-full border-2 text-sm font-semibold transition-all ${selectedSize === size
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 text-gray-700 hover:border-black'
                          }`}
                      >
                        {size}
                      </button>
                    ))
                  )}
              </div>
              {/* Stock indicator */}
              {selectedSize && selectedVariant && (
                <p className="mt-2 text-sm text-gray-600">
                  {getSelectedSizeStock() > 0 ? (
                    <span className="text-green-600">✓ {getSelectedSizeStock()} in stock</span>
                  ) : (
                    <span className="text-red-600">Out of stock</span>
                  )}
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={getSelectedSizeStock() === 0}
              className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg mb-4"
            >
              {getSelectedSizeStock() === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              className="w-full border-2 border-gray-300 py-4 rounded-full font-bold hover:border-black transition-colors flex items-center justify-center gap-2"
            >
              <Heart
                size={20}
                className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}
              />
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Description & Fit */}
            <div className="border-t mt-8 pt-6">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="w-full flex items-center justify-between py-3"
              >
                <span className="font-bold text-gray-900">Description & Fit</span>
                {showDescription ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {showDescription && (
                <div className="py-4 text-gray-700 text-sm space-y-4">
                  {/* Description as bullet points */}
                  {product.description && (
                    <div>
                      <ul className="space-y-2">
                        {product.description.split('\n').filter(p => p.trim()).map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-500 mt-0.5">•</span>
                            <span>{point.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {product.material && (
                    <p><strong>Material:</strong> {product.material}</p>
                  )}
                  {product.fabric && (
                    <p><strong>Fabric:</strong> {product.fabric}</p>
                  )}
                  {product.fit && (
                    <p><strong>Fit:</strong> {product.fit}</p>
                  )}
                  {product.sleeve && (
                    <p><strong>Sleeve:</strong> {product.sleeve}</p>
                  )}

                  {/* Care instructions as bullet points */}
                  {product.care_instructions && (
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Care Instructions:</p>
                      <ul className="space-y-1">
                        {product.care_instructions.split('\n').filter(p => p.trim()).map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{point.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shipping */}
            <div className="border-t pt-4">
              <button
                onClick={() => setShowShipping(!showShipping)}
                className="w-full flex items-center justify-between py-3"
              >
                <span className="font-bold text-gray-900">Shipping & Returns</span>
                {showShipping ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {showShipping && (
                <div className="py-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Truck size={20} className="text-gray-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold">Free Delivery</p>
                      <p>On orders above ₹999</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw size={20} className="text-gray-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold">Easy Returns</p>
                      <p>7 days return policy</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section - Right Sidebar */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-38">
              <ProductReviews productId={product.id} />
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <RelatedProductsSlider productSlug={slug} />
      </div>
    </div>
  );
}