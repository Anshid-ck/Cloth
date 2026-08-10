import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, Clock, Truck, Package, Filter, Printer, Download, XCircle, Barcode, Trash2, Calendar, CreditCard, MapPin, Phone, Mail, ChevronRight, ShoppingBag } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('main');

  const STATUS_OPTIONS = [
    { value: 'pending',    label: 'Pending',    bg: 'bg-amber-50',     text: 'text-amber-700',     border: 'border-amber-200',     icon: Clock },
    { value: 'confirmed',  label: 'Confirmed',  bg: 'bg-blue-50',      text: 'text-blue-700',      border: 'border-blue-200',      icon: CheckCircle },
    { value: 'processing', label: 'Processing', bg: 'bg-purple-50',    text: 'text-purple-700',    border: 'border-purple-200',    icon: Package },
    { value: 'shipped',    label: 'Shipped',    bg: 'bg-indigo-50',    text: 'text-indigo-700',    border: 'border-indigo-200',    icon: Truck },
    { value: 'delivered',  label: 'Delivered',  bg: 'bg-emerald-50',   text: 'text-emerald-700',   border: 'border-emerald-200',   icon: CheckCircle },
    { value: 'cancelled',  label: 'Cancelled',  bg: 'bg-rose-50',      text: 'text-rose-700',      border: 'border-rose-200',      icon: XCircle },
  ];

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/orders/', {
        params: { page: currentPage, status: filterStatus },
      });
      setOrders(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      await API.patch(`/api/orders/${orderId}/update-status/`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
      setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to update order status';
      toast.error(msg);
      console.error(error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await API.post(`/api/orders/${orderId}/cancel/`);
      toast.success('Order cancelled successfully');
      fetchOrders();
      setSelectedOrder((prev) => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to cancel order';
      toast.error(msg);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to permanently delete this order?')) return;
    try {
      await API.delete(`/api/orders/${orderId}/`);
      toast.success('Order deleted successfully');
      setOrders(orders.filter(o => o.id !== orderId));
      if (selectedOrder?.id === orderId) setShowModal(false);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to delete order';
      toast.error(msg);
    }
  };

  const getPackingSlipUrl = (orderId, disposition = 'inline') => {
    const token = localStorage.getItem('access_token');
    const base = import.meta.env.VITE_API_URL || '';
    return `${base}/api/orders/${orderId}/packing-slip/?disposition=${disposition}&token=${token}`;
  };

  const handlePrintPackingSlip = (orderId) => {
    const url = getPackingSlipUrl(orderId, 'inline');
    API.get(`/api/orders/${orderId}/packing-slip/?disposition=inline`, {
      responseType: 'blob',
    }).then((res) => {
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (win) {
        win.addEventListener('load', () => {
          win.print();
        });
      }
    }).catch(() => toast.error('Failed to generate packing slip'));
  };

  const handleDownloadPackingSlip = (orderId, orderNumber) => {
    API.get(`/api/orders/${orderId}/packing-slip/?disposition=attachment`, {
      responseType: 'blob',
    }).then((res) => {
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packing-slip-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    }).catch(() => toast.error('Failed to download packing slip'));
  };

  const getStatusMeta = (statusValue) =>
    STATUS_OPTIONS.find((s) => s.value === statusValue) || { 
      label: statusValue, 
      bg: 'bg-gray-50', 
      text: 'text-gray-700', 
      border: 'border-gray-200', 
      icon: Package 
    };

  const filteredOrders = orders.filter(
    (o) => {
      const searchMatch = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.shipping_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const isPaidOrCod = o.payment_status === 'completed' || o.payment_method === 'cod';
      const tabMatch = activeTab === 'main' ? isPaidOrCod : !isPaidOrCod;

      return searchMatch && tabMatch;
    }
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Orders</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage and track all customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-6 py-3 flex items-center gap-4">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <ShoppingBag className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Relevant</p>
                <p className="text-2xl font-bold text-gray-900 leading-none">{filteredOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Controls */}
        <div className="bg-white border border-gray-200 rounded-3xl p-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Animated Tabs */}
          <div className="flex items-center p-1 bg-gray-100/80 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('main')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'main' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Main Orders
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'failed' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Failed / Unpaid
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto px-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm transition-all outline-none font-medium placeholder:text-gray-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm transition-all outline-none font-medium text-gray-700 cursor-pointer appearance-none pr-10"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders List (Cards Layout) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading premium orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <p className="text-xl font-bold text-gray-800">No orders found</p>
            <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const meta = getStatusMeta(order.status);
              const isPaid = order.payment_status === 'completed';
              
              return (
                <div 
                  key={order.id} 
                  className="group bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Column 1: Order Info */}
                  <div className="flex items-center gap-5 w-full md:w-1/4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 ${meta.bg} ${meta.text}`}>
                      <meta.icon size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 text-lg tracking-tight hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => handleViewDetails(order)}>
                        {order.order_number}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium">
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Customer & Items Preview */}
                  <div className="w-full md:w-2/5 flex flex-col gap-3 border-l border-gray-100 pl-6">
                    <div>
                      <p className="font-bold text-gray-800">{order.shipping_name}</p>
                      <p className="text-sm text-gray-500 truncate">{order.user_email}</p>
                    </div>
                    {/* Items Preview */}
                    <div className="flex flex-wrap items-center gap-2">
                      {order.items.slice(0, 2).map((item, idx) => {
                        const cd = item.color_variant_details;
                        const vd = item.variant_details;
                        const sku = item.item_sku || cd?.sku || vd?.sku || '—';
                        return (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 pr-3 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            {item.product_image ? (
                              <img src={item.product_image} alt="product" className="w-9 h-9 object-cover border-r border-gray-200" />
                            ) : (
                              <div className="w-9 h-9 bg-gray-100 flex items-center justify-center border-r border-gray-200"><Package size={14} className="text-gray-400"/></div>
                            )}
                            <div className="flex flex-col py-1">
                              <p className="text-[10px] font-bold text-gray-700 max-w-[80px] truncate leading-tight">{item.product_name}</p>
                              <p className="text-[9px] font-mono text-gray-500 mt-0.5">{sku}</p>
                            </div>
                          </div>
                        )
                      })}
                      {order.items.length > 2 && (
                        <div className="flex items-center justify-center bg-gray-100 rounded-lg px-3 h-9 text-xs font-bold text-gray-600 border border-gray-200 shadow-sm">
                          +{order.items.length - 2} items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Amount & Payment */}
                  <div className="w-full md:w-1/6 border-l border-gray-100 pl-6">
                    <p className="font-extrabold text-gray-900 text-lg">
                      ₹{Math.round(order.total).toLocaleString()}
                    </p>
                    <div className="mt-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.payment_method === 'cod' ? 'COD' : order.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Column 4: Status */}
                  <div className="w-full md:w-1/6 flex justify-start md:justify-center">
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full currentColor`} style={{ backgroundColor: 'currentColor' }}></span>
                      {meta.label}
                    </span>
                  </div>

                  {/* Column 5: Actions */}
                  <div className="w-full md:w-auto flex items-center justify-end gap-2 md:ml-auto">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                      title="View Details"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => handlePrintPackingSlip(order.id)}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                      title="Print Slip"
                    >
                      <Printer size={20} />
                    </button>
                    <button
                      onClick={() => handleDownloadPackingSlip(order.id, order.order_number)}
                      className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                      title="Download PDF"
                    >
                      <Download size={20} />
                    </button>
                    {activeTab === 'failed' && (
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
                        title="Delete Order"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-[#f8fafc] rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col transform transition-all">
            
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Package size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order Details</h2>
                  <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                    {selectedOrder.order_number}
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePrintPackingSlip(selectedOrder.id)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all"
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  onClick={() => handleDownloadPackingSlip(selectedOrder.id, selectedOrder.order_number)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                >
                  <Download size={16} /> PDF
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors ml-2"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              {/* Status Updater */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Order Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {STATUS_OPTIONS.map((s) => {
                    const isActive = selectedOrder.status === s.value;
                    const VALID_TRANSITIONS = {
                      'pending':    ['confirmed', 'cancelled'],
                      'confirmed':  ['processing', 'cancelled'],
                      'processing': ['shipped', 'cancelled'],
                      'shipped':    ['delivered'],
                      'delivered':  [],
                      'cancelled':  [],
                    };
                    const allowedNext = VALID_TRANSITIONS[selectedOrder.status] || [];
                    const isAllowed = allowedNext.includes(s.value);
                    const isDisabled = !isActive && !isAllowed || updatingStatus === selectedOrder.id;

                    return (
                      <button
                        key={s.value}
                        onClick={() => handleStatusUpdate(selectedOrder.id, s.value)}
                        disabled={isDisabled}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border-2 ${
                          isActive
                            ? `${s.bg} ${s.text} border-${s.border.split('-')[1]}-400 shadow-sm transform scale-[1.02]`
                            : isAllowed
                              ? 'bg-transparent border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 cursor-pointer'
                              : 'bg-gray-50 border-transparent text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <s.icon size={24} className={`mb-2 ${isActive || isAllowed ? '' : 'opacity-50'}`} strokeWidth={isActive ? 2 : 1.5} />
                        <span className={`text-xs font-bold ${isActive ? '' : 'font-medium'}`}>{s.label}</span>
                        {isActive && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 bg-current`}></span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Col: The Slip / Receipt */}
                <div className="xl:col-span-2 flex justify-center">
                  <div className="w-full max-w-2xl bg-white rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 overflow-hidden relative">
                    {/* Top edge jagged effect (CSS trick using radial gradients can be complex, so we use a clean top border) */}
                    <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    
                    <div className="p-8 sm:p-10">
                      {/* Slip Header */}
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">INVOICE</h1>
                          <p className="text-sm text-gray-500 mt-1 font-mono">#{selectedOrder.order_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">Date</p>
                          <p className="text-sm text-gray-600 font-mono">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="flex flex-col sm:flex-row justify-between gap-8 mb-8 pb-8 border-b-2 border-dashed border-gray-200">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                          <p className="text-sm font-bold text-gray-900">{selectedOrder.shipping_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{selectedOrder.shipping_email}</p>
                          <p className="text-sm text-gray-600">{selectedOrder.shipping_phone}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Shipped To</p>
                          <p className="text-sm font-medium text-gray-800 leading-snug">
                            {selectedOrder.shipping_address_line1}<br/>
                            {selectedOrder.shipping_address_line2 && <>{selectedOrder.shipping_address_line2}<br/></>}
                            {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_pincode}
                          </p>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="mb-8">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b-2 border-gray-900">
                              <th className="pb-3 text-xs font-bold text-gray-900 uppercase tracking-wider">Item Details</th>
                              <th className="pb-3 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Qty</th>
                              <th className="pb-3 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Price</th>
                              <th className="pb-3 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedOrder.items.map((item, idx) => {
                              const cd = item.color_variant_details;
                              const vd = item.variant_details;
                              const size = item.size || cd?.size || vd?.size;
                              const sku = item.item_sku || cd?.sku || vd?.sku || '—';
                              const colorName = cd?.color_name || vd?.color;

                              return (
                                <tr key={idx}>
                                  <td className="py-4">
                                    <div className="flex items-center gap-3">
                                      {item.product_image && (
                                        <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded bg-gray-100 border border-gray-200" />
                                      )}
                                      <div>
                                        <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                                        <p className="text-xs font-mono text-gray-500 mt-0.5">SKU: {sku}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {size && `Size: ${size}`} {colorName && ` | Color: ${colorName}`}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 text-sm font-semibold text-gray-700 text-right">{item.quantity}</td>
                                  <td className="py-4 text-sm font-semibold text-gray-700 text-right">₹{Math.round(item.price).toLocaleString()}</td>
                                  <td className="py-4 text-sm font-bold text-gray-900 text-right">₹{Math.round(item.total).toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals */}
                      <div className="flex justify-end">
                        <div className="w-full sm:w-1/2 space-y-3">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-semibold text-gray-900">₹{Math.round(selectedOrder.subtotal).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Shipping</span>
                            <span className="font-semibold text-gray-900">{selectedOrder.shipping_charge > 0 ? `₹${Math.round(selectedOrder.shipping_charge).toLocaleString()}` : 'Free'}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Tax</span>
                            <span className="font-semibold text-gray-900">₹{Math.round(selectedOrder.tax).toLocaleString()}</span>
                          </div>
                          {selectedOrder.discount > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600">
                              <span>Discount</span>
                              <span className="font-semibold">-₹{Math.round(selectedOrder.discount).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-t-2 border-gray-900 pt-3 mt-3">
                            <span className="text-sm font-bold text-gray-900 uppercase">Total Amount</span>
                            <span className="text-2xl font-black text-indigo-600">₹{Math.round(selectedOrder.total).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer barcode/payment info */}
                      <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                         <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                            <p className="text-sm font-bold text-gray-800">{(selectedOrder.payment_method || 'N/A').toUpperCase()}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 px-2 py-0.5 rounded ${
                              selectedOrder.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {selectedOrder.payment_status}
                            </p>
                         </div>
                         {selectedOrder.transaction_id && (
                           <p className="text-xs font-mono text-gray-400 mt-4">TXN: {selectedOrder.transaction_id}</p>
                         )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Col: Admin Controls */}
                <div className="xl:col-span-1 space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                     <button
                        onClick={() => handlePrintPackingSlip(selectedOrder.id)}
                        className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Printer size={18} /> Print Invoice
                      </button>
                      <button
                        onClick={() => handleDownloadPackingSlip(selectedOrder.id, selectedOrder.order_number)}
                        className="w-full py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Download size={18} /> Download PDF
                      </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 space-y-3">
                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4">Danger Zone</h3>
                    {!['cancelled', 'delivered', 'shipped'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="w-full py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <XCircle size={18} /> Cancel Order
                      </button>
                    )}
                    {activeTab === 'failed' && (
                      <button
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-200 hover:-translate-y-0.5"
                      >
                        <Trash2 size={18} /> Permanently Delete
                      </button>
                    )}
                    {['cancelled', 'delivered', 'shipped'].includes(selectedOrder.status) && activeTab !== 'failed' && (
                      <p className="text-xs text-rose-500 font-medium text-center">No destructive actions available for this order state.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}