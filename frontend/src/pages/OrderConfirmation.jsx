// src/pages/OrderConfirmation.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Mail, Package, MapPin, CreditCard, Loader } from "lucide-react";
import { ordersAPI } from "../api/orders";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getOrder(orderId);
      setOrder(response.data);
    } catch (err) {
      console.error("Failed to load order details", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-20">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Success card ── */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle className="mx-auto text-green-500" size={80} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">Your order has been successfully placed.</p>
          <p className="mt-3 text-lg font-semibold text-gray-800">
            Order ID: <span className="text-indigo-600">{order?.order_number || `#${orderId}`}</span>
          </p>

          {/* Email notice */}
          <div className="mt-5 flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Mail size={18} className="text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              A confirmation email with your order details has been sent to{" "}
              <span className="font-semibold">
                {order?.shipping_email ?? "your email address"}
              </span>
              .
            </p>
          </div>
        </div>

        {/* ── Order details ── */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 flex justify-center">
            <Loader size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : order ? (
          <>
            {/* Items */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Package size={20} className="text-indigo-500" /> Order Items
              </h2>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.product_name}</p>
                      {(item.color_variant_details?.color_name || item.size) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[item.color_variant_details?.color_name, item.size && `Size ${item.size}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-800">₹{Math.round(item.total)}</p>
                  </div>
                ))}
              </div>

              {/* Price summary */}
              <div className="mt-4 border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>₹{Math.round(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.shipping_charge > 0 ? `₹${Math.round(order.shipping_charge)}` : "Free"}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>-₹{Math.round(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{Math.round(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery & Payment info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-indigo-500" /> Delivery Address
                </h2>
                <p className="font-semibold text-gray-800">{order.shipping_name}</p>
                <p className="text-sm text-gray-600 mt-1">{order.shipping_phone}</p>
                {order.shipping_address_line1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {order.shipping_address_line1}
                    {order.shipping_address_line2 && `, ${order.shipping_address_line2}`}
                    <br />
                    {order.shipping_city}, {order.shipping_state} – {order.shipping_pincode}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                  <CreditCard size={16} className="text-indigo-500" /> Payment
                </h2>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Method:</span>{" "}
                  {order.payment_method?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      order.payment_status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : null}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/orders"
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-center hover:bg-indigo-700 transition"
          >
            View My Orders
          </Link>
          <Link
            to="/"
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold text-center hover:bg-gray-300 transition"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}