// src/components/CartDrawer.jsx
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { X, ShoppingCart } from "lucide-react";

export function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { items, total } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-96 bg-white shadow-xl z-50 transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6 text-center">
            <ShoppingCart size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 font-semibold">Your cart is empty</p>
            <button
              onClick={() => {
                onClose();
                navigate('/shop');
              }}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {items.map((item) => {
              const cd = item.color_variant_details;
              const vd = item.variant_details;
              const image = cd?.primary_image || item.product?.primary_image || '/placeholder.png';
              const colorName = cd?.color_name || vd?.color;
              const colorHex  = cd?.color_hex;
              const size      = item.size || cd?.size || vd?.size;

              const handleProductClick = () => {
                if (item.product?.slug) {
                  onClose();
                  navigate(`/product/${item.product.slug}`, {
                    state: {
                      preselectedVariantId: item.variant_id,
                      preselectedSize: size
                    }
                  });
                }
              };

              return (
                <div key={item.id} className="flex gap-4 pb-4 border-b">
                  <img
                    src={image}
                    alt={item.product?.name}
                    onClick={handleProductClick}
                    className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                  />
                  <div className="flex-1">
                    <p 
                      onClick={handleProductClick}
                      className="font-semibold text-gray-800 cursor-pointer hover:text-indigo-600 transition-colors"
                    >
                      {item.product?.name}
                    </p>

                    {/* Color + Size pills */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {colorName && (
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-700 font-medium">
                          {colorHex && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block"
                              style={{ backgroundColor: colorHex }}
                            />
                          )}
                          {colorName}
                        </span>
                      )}
                      {size && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-700 font-medium">
                          Size: {size}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                    <p className="text-indigo-600 font-bold mt-1">
                      ₹{Math.round(parseFloat(item.total_price) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="sticky bottom-0 bg-white pt-4 border-t space-y-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-indigo-600">₹{Math.round(total).toLocaleString()}</span>
              </div>
              <button
                onClick={() => {
                  navigate('/cart');
                  onClose();
                }}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                View Cart
              </button>
              <button
                onClick={() => {
                  navigate('/checkout');
                  onClose();
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}