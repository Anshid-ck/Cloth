// src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../redux/slices/ProductSlice';

import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { Heart, X } from 'lucide-react';
import toast from 'react-hot-toast';
import QuickAddModal from './QuickAddModal';

const ProductCardNew = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const isWishlisted = wishlistItems.some((item) => item.id === product.id);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleAddToCart = (e) => {
    e?.stopPropagation();
    setQuickAddOpen(true);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  const displayPrice = product.discount_price || product.base_price;

  return (
    <div className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {/* Image Container */}
      <div
        className="relative aspect-square overflow-hidden group"
        style={{ backgroundColor: product.background_color || '#ffffff' }}
      >
        <img
          src={product.primary_image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
          className="absolute top-2 right-2 md:top-3 md:right-3 bg-gray-100 hover:bg-white rounded-full p-2.5 shadow-md transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Heart
            size={18}
            className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          />
        </button>

        {/* Discount Badge */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            {product.discount_percentage}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Brand */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {product.brand}
        </p>

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 h-9">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-gray-900">
            ₹{Math.round(displayPrice)}
          </span>
          {product.discount_price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{Math.round(product.base_price)}
            </span>
          )}
        </div>

        {/* Description (optional small text) */}
        <p className="text-xs text-gray-600 mb-3 capitalize">
          {product.category_name || 'Men\'s Collection'}
        </p>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.total_stock === 0}
          className="w-full bg-black text-white font-bold py-2.5 rounded-full transition-colors duration-200"
        >
          Add to cart
        </button>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        product={product}
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </div>
  );
};

export default function Shop() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState('-created_at');

  const { items: products, loading } = useSelector((state) => state.products);
  const { searchQuery } = useSelector((state) => state.filters);

  useEffect(() => {
    const params = {
      ordering: sortBy,
    };

    const category = searchParams.get('category');
    if (category) {
      params.category__slug = category;
    }

    dispatch(fetchProducts(params));
  }, [dispatch, sortBy, searchParams]);

  const categories = [
    { label: 'All Products', value: null },
    { label: 'Hoodies', value: 'hoodies' },
    { label: 'T-Shirts', value: 'tshirts' },
    { label: 'Pants', value: 'pants' },
    { label: 'Shoes', value: 'shoes' },
    { label: 'Accessories', value: 'accessories' },
  ];

  const productsToShow = products && products.length > 0 ? products : demoProducts;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-8 md:py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Shop Collection
            </h1>
            <p className="text-gray-600">
              Discover our premium collection of men's fashion
            </p>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => {
                    setSelectedCategory(cat.label);
                    if (cat.value) {
                      navigate(`/shop?category=${cat.value}`);
                    } else {
                      navigate('/shop');
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.label
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="-created_at">Newest</option>
              <option value="base_price">Price: Low to High</option>
              <option value="-base_price">Price: High to Low</option>
              <option value="-rating">Best Rated</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mb-4"></div>
                <p className="text-gray-600 font-medium">Loading products...</p>
              </div>
            </div>
          ) : productsToShow.length > 0 ? (
            <>
              {/* Results Count */}
              <p className="text-sm text-gray-600 mb-6">
                Showing <span className="font-bold text-gray-900">{productsToShow.length}</span> products
              </p>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {productsToShow.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.slug}`)}
                    className="cursor-pointer"
                  >
                    <ProductCardNew product={product} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-600 text-lg mb-4">No products found</p>
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
              >
                View All Products
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}