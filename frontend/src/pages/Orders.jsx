// src/pages/Orders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Package, Eye, ChevronDown, ChevronUp,
  Truck, CheckCircle, Clock, XCircle, MapPin,
  RefreshCw, CreditCard,
} from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

// ─── Progress bar steps ────────────────────────────────────────────────────────

const STEPS = [
  { key: 'confirmed',  label: 'Confirmed',  icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped',    label: 'Shipped',    icon: Truck },
  { key: 'delivered',  label: 'Delivered',  icon: CheckCircle },
];

// Numeric rank so we can compare positions
const STATUS_RANK = {
  pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  refunded:   'bg-gray-100 text-gray-700',
};

function getStatusColor(status) {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}

function formatVariant(item) {
  const parts = [];
  if (item.color_variant_details?.color_name) parts.push(item.color_variant_details.color_name);
  else if (item.variant_details?.color)        parts.push(item.variant_details.color);
  if (item.size)                               parts.push(`Size ${item.size}`);
  else if (item.variant_details?.size)         parts.push(`Size ${item.variant_details.size}`);
  return parts.join(' · ');
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function OrderProgressBar({ status }) {
  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium mt-3">
        <XCircle size={16} />
        This order has been {status}.
      </div>
    );
  }

  const currentRank = STATUS_RANK[status] ?? 0;

  return (
    <div className="mt-4">
      <div className="flex items-start">
        {STEPS.map((step, idx) => {
          const stepRank = STATUS_RANK[step.key];
          const done   = currentRank >= stepRank;
          const active = currentRank === stepRank;
          const Icon   = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? active
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {done && !active ? <CheckCircle size={16} /> : <Icon size={14} />}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium text-center leading-tight max-w-[52px] ${
                    done ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mt-4 mx-1 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: currentRank > stepRank ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderModal({ order, onClose, onCancel, cancelling }) {
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm font-mono text-indigo-600 mt-0.5">{order.order_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Progress bar */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Delivery Progress</p>
            <OrderProgressBar status={order.status} />
          </div>

          {/* Tracking number */}
          {order.tracking_number && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700 font-medium">
              <Truck size={15} />
              Tracking Number:&nbsp;
              <span className="font-mono font-bold">{order.tracking_number}</span>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Items</h3>
            <div className="space-y-2">
              {order.items?.map((item, idx) => {
                const variant = formatVariant(item);
                return (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-14 h-14 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.product_name}</p>
                      {/* ✅ Visual color swatch + size pill */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(item.color_variant_details?.color_name || item.variant_details?.color) && (
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-600 font-medium">
                            {item.color_variant_details?.color_hex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block flex-shrink-0"
                                style={{ backgroundColor: item.color_variant_details.color_hex }}
                              />
                            )}
                            {item.color_variant_details?.color_name || item.variant_details?.color}
                          </span>
                        )}
                        {(item.size || item.variant_details?.size) && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-600 font-medium">
                            Size: {item.size || item.variant_details?.size}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">₹{Math.round(item.price)}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400">₹{Math.round(item.total)} total</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-800">₹{Math.round(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="font-semibold text-gray-800">
                {Number(order.shipping_charge) === 0
                  ? <span className="text-green-600 font-semibold">Free</span>
                  : `₹${Math.round(order.shipping_charge)}`}
              </span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-semibold">-₹{Math.round(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-indigo-600">₹{Math.round(order.total)}</span>
            </div>
          </div>

          {/* Delivery address */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-500" /> Delivery Address
            </h3>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-gray-700 text-sm leading-relaxed">
              <p className="font-semibold">{order.shipping_name}</p>
              <p>{order.shipping_address_line1}</p>
              {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
              <p>
                {order.shipping_city}, {order.shipping_state} – {order.shipping_pincode}
              </p>
              <p className="mt-2 text-gray-600">📞 {order.shipping_phone}</p>
            </div>
          </div>

          {/* Payment info */}
          <div className="flex items-center gap-4 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm">
            <CreditCard size={16} className="text-purple-500 flex-shrink-0" />
            <div className="flex gap-4 flex-wrap">
              <span className="text-gray-600">
                Method: <span className="font-semibold text-gray-800 capitalize">{order.payment_method?.replace('_', ' ') || '—'}</span>
              </span>
              <span className="text-gray-600">
                Payment: <span className={`font-semibold ${order.payment_status === 'completed' || order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : '—'}
                </span>
              </span>
            </div>
          </div>

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={() => onCancel(order.id)}
              disabled={cancelling === order.id}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelling === order.id
                ? <><RefreshCw size={15} className="animate-spin" /> Cancelling…</>
                : <><XCircle size={15} /> Cancel Order</>}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/orders/my-orders/');
      const orderList = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setOrders(orderList);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      // Fetch full detail so we get tracking_number, tax, etc.
      const response = await API.get(`/api/orders/${order.id}/`);
      setSelectedOrder(response.data);
    } catch {
      setSelectedOrder(order); // fallback to list-level data
    }
    setShowModal(true);
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(orderId);
      await API.post(`/api/orders/${orderId}/cancel/`);
      toast.success('Order cancelled successfully');
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to cancel order';
      toast.error(msg);
    } finally {
      setCancelling(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
          <p className="text-gray-600">Loading orders…</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-36 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {/* Empty state */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-6">No orders yet</p>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={() => handleViewDetails(order)}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setShowModal(false)}
            onCancel={handleCancel}
            cancelling={cancelling}
          />
        )}
      </div>
    </div>
  );
}

// ─── Order List Card ──────────────────────────────────────────────────────────

function OrderCard({ order, onView }) {
  const firstImage = order.items?.[0]?.product_image;
  const itemCount  = order.items?.length ?? 0;
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">

        {/* Product thumbnail */}
        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
          {firstImage ? (
            <img
              src={firstImage}
              alt={order.items[0].product_name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={24} />
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center w-full">
          <div>
            <p className="text-xs text-gray-500">Order ID</p>
            <p className="font-bold text-gray-900 text-sm font-mono">{order.order_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-semibold text-gray-900 text-sm">{date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-bold text-indigo-600 text-sm">₹{Math.round(order.total)}</p>
            <p className="text-xs text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
            <button
              onClick={onView}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="View details"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Inline progress bar on each card */}
      <div className="mt-1 px-1">
        <OrderProgressBar status={order.status} />
      </div>

      {/* Tracking pill */}
      {order.tracking_number && (
        <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <Truck size={12} /> {order.tracking_number}
        </div>
      )}
    </div>
  );
}