// src/pages/Cart.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { removeFromCart, updateCartItem } from '../redux/slices/cartSlice';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const subtotal = parseFloat(total) || 0;
  const shipping = subtotal >= 1000 ? 0 : 100;   // free shipping ≥ ₹1000 — matches backend
  const tax = 0; // Removed tax per user request
  const grandTotal = subtotal + shipping + tax;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      toast.error('Please login to view cart');
    }
  }, [isAuthenticated, navigate]);

  const handleRemove = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity < 1) {
      handleRemove(itemId);
      return;
    }
    dispatch(updateCartItem({ item_id: itemId, quantity }));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-28 md:pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm mt-8">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <ShoppingBag size={40} className="text-gray-300" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
            <p className="text-gray-500 mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Discover our latest collections.</p>
            <button
              onClick={() => navigate('/shop')}
              className="px-8 py-4 bg-[#111] text-white rounded-full font-bold text-lg hover:bg-[#333] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pt-28 md:pt-36 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Your Cart</h1>
          <p className="text-gray-500 mt-2 font-medium text-lg">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* ── Cart Items ── */}
          <div className="flex-1 space-y-6">
            {/* Free shipping progress banner */}
            {subtotal < 1000 && (
              <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-indigo-600">🚚</span> Add ₹{Math.round(1000 - subtotal)} more for FREE shipping!
                </p>
                <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((subtotal / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {subtotal >= 1000 && (
              <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <ShieldCheck className="text-green-600" size={20} />
                </div>
                <p className="text-sm font-bold text-green-800">You've unlocked FREE shipping!</p>
              </div>
            )}

            <div className="space-y-4">
              {items.map((item) => {
                const colorDetails = item.color_variant_details;
                const variantDetails = item.variant_details;
                const image =
                  colorDetails?.primary_image ||
                  item.product?.primary_image ||
                  '/placeholder.png';
                const unitPrice = Math.round(parseFloat(item.total_price) / item.quantity) || 0;
                const size = item.size || colorDetails?.size || variantDetails?.size;

                const handleProductClick = () => {
                  if (item.product?.slug) {
                    navigate(`/product/${item.product.slug}`, {
                      state: {
                        preselectedVariantId: item.variant_id,
                        preselectedSize: size
                      }
                    });
                  }
                };

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col sm:flex-row gap-4 sm:gap-6"
                  >
                    {/* Product Image */}
                    <div 
                      className="w-full sm:w-32 h-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer bg-gray-50 border border-gray-100"
                      onClick={handleProductClick}
                    >
                      <img
                        src={image}
                        alt={item.product?.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.product?.brand}</p>
                          <h3 
                            onClick={handleProductClick}
                            className="font-bold text-lg text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2"
                          >
                            {item.product?.name}
                          </h3>
                          
                          {/* Color & Size pills */}
                          <div className="flex flex-wrap gap-2 mt-2.5">
                            {colorDetails && (
                              <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-300 inline-block shadow-sm"
                                  style={{ backgroundColor: colorDetails.color_hex }}
                                />
                                {colorDetails.color_name}
                              </span>
                            )}
                            {variantDetails?.color && !colorDetails && (
                              <span className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                                {variantDetails.color}
                              </span>
                            )}
                            {size && (
                              <span className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                                Size: {size}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Desktop Unit Price & Total */}
                        <div className="hidden sm:flex flex-col items-end">
                          <p className="font-extrabold text-xl text-gray-900">
                            ₹{Math.round(parseFloat(item.total_price) || 0)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm font-medium text-gray-400 mt-1">₹{unitPrice} each</p>
                          )}
                        </div>
                      </div>

                      {/* Mobile Unit Price */}
                      <div className="sm:hidden mt-3">
                         <p className="font-extrabold text-xl text-gray-900">
                            ₹{Math.round(parseFloat(item.total_price) || 0)}
                         </p>
                      </div>

                      {/* Controls Footer */}
                      <div className="flex items-center justify-between mt-4 sm:mt-0 pt-4 sm:pt-4 border-t border-gray-50 sm:border-none">
                        <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-1">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.id)}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 font-medium text-sm transition-colors p-2"
                        >
                          <Trash2 size={18} />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 lg:sticky lg:top-32">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-600">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900">₹{Math.round(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span className="font-medium">Estimated Delivery</span>
                  <span className={`font-bold ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {shipping === 0 ? 'Free' : `₹${shipping}`}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full my-6"></div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-extrabold text-gray-900">
                  ₹{Math.round(grandTotal)}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-[#111] text-white py-4 rounded-full font-bold text-lg hover:bg-[#333] transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Checkout <ArrowRight size={20} />
                </button>

                <button
                  onClick={() => navigate('/shop')}
                  className="w-full bg-white border-2 border-gray-200 text-gray-800 py-4 rounded-full font-bold text-lg hover:border-gray-900 hover:text-gray-900 transition-all flex items-center justify-center"
                >
                  Continue Shopping
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex justify-center gap-6 border-t border-gray-50 pt-6">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ShieldCheck size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Secure Checkout</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}