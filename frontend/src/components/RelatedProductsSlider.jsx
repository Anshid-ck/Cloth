// components/RelatedProductsSlider.jsx
// User-facing component - shows related products with add to cart / wishlist
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import API from '../api/api';
import toast from 'react-hot-toast';
import QuickAddModal from './QuickAddModal';

export default function RelatedProductsSlider({ productSlug }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items) || [];
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  useEffect(() => {
    if (productSlug) fetchRelated();
  }, [productSlug]);

  const fetchRelated = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/products/products/${productSlug}/related/`);
      const data = response.data;
      // Handle both array and {results:[]} formats
      const items = Array.isArray(data) ? data : data?.results || data?.related_products || [];
      setRelatedProducts(items);
    } catch (error) {
      // Silently fail — not critical
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    setQuickAddProduct(product);
  };

  const handleWishlist = (e, product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    const isWishlisted = wishlistItems.some((item) => item.id === product.id);
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  // Don't render if no related products
  if (loading || relatedProducts.length === 0) return null;

  return (
    <section className="mt-16 max-w-7xl mx-auto px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">You May Also Like</h2>
          <div className="w-16 h-1 bg-indigo-600 rounded mt-2"></div>
        </div>
        <button
          onClick={() => navigate('/shop')}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
        >
          View All <ChevronRight size={16} />
        </button>
      </div>

      {/* Swiper */}
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={16}
        slidesPerView={1.3}
        breakpoints={{
          480: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="pb-4"
      >
        {relatedProducts.map((item) => {
          // Handle both direct product and nested {related_product: {...}} format
          const product = item.related_product || item;
          if (!product?.id) return null;

          const isWishlisted = wishlistItems.some((w) => w.id === product.id);
          const displayPrice = product.discount_price || product.base_price;

          return (
            <SwiperSlide key={product.id}>
              <div
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col"
                onClick={() => navigate(`/product/${product.slug}`)}
              >
                {/* Image */}
                <div className="relative bg-gray-100 aspect-square overflow-hidden">
                  <img
                    src={product.primary_image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
                  />

                  {/* Wishlist button */}
                  <button
                    onClick={(e) => handleWishlist(e, product)}
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-all z-10"
                  >
                    <Heart
                      size={16}
                      className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                    />
                  </button>

                  {/* Discount badge */}
                  {product.discount_percentage > 0 && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {product.discount_percentage}% OFF
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {product.brand}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                  </div>

                  <div>
                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-bold text-gray-900">
                        ₹{Math.round(displayPrice)}
                      </span>
                      {product.discount_price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{Math.round(product.base_price)}
                        </span>
                      )}
                    </div>

                    {/* Add to cart */}
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={product.total_stock === 0}
                      className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold py-2.5 rounded-full transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart size={14} />
                      {product.total_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Quick Add Modal */}
      <QuickAddModal
        product={quickAddProduct}
        isOpen={!!quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
      />
    </section>
  );
}