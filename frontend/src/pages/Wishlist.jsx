// src/pages/Wishlist.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, removeFromWishlist } from "../redux/slices/wishlistSlice";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";

export default function Wishlist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28 md:pt-36 bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 md:pt-36 bg-gray-50">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4076/4076503.png"
          className="w-40 mb-6 opacity-80"
          alt="empty"
        />
        <h2 className="text-2xl font-bold text-gray-800">Your Wishlist Is Empty</h2>
        <p className="text-gray-600 mt-2 max-w-md text-center">
          Looks like you haven't added anything yet. Tap the 🤍 on products to save them!
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-36 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          My Wishlist ❤️{" "}
          <span className="text-base font-normal text-gray-500">({items.length} items)</span>
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {items.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden"
            >
              {/* IMAGE */}
              <div className="relative overflow-hidden">
                <img
                  src={product.primary_image}
                  alt={product.name}
                  className="w-full h-48 sm:h-56 md:h-72 object-cover group-hover:scale-110 transition duration-500 cursor-pointer"
                  onClick={() => navigate(`/product/${product.slug}`)}
                />

                {/* REMOVE BUTTON */}
                <button
                  onClick={() => dispatch(removeFromWishlist(product.id))}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow hover:bg-red-500 hover:text-white transition"
                  title="Remove from wishlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* DETAILS */}
              <div className="p-3 md:p-4">
                <h3 className="text-sm md:text-lg font-semibold text-gray-900 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-gray-700 font-semibold mt-1 text-sm md:text-base">
                  ₹{product.base_price}
                </p>

                <button
                  onClick={() => navigate(`/product/${product.slug}`)}
                  className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingBag size={16} /> View Product
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}