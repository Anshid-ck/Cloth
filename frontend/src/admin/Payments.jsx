// src/admin/Payments.jsx
import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, CheckCircle, Clock, X,
  CreditCard, DollarSign, TrendingUp, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGateway, setFilterGateway] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('payments');
  const [paymentStats, setPaymentStats] = useState([]);

  useEffect(() => {
    fetchPayments();
    fetchRefunds();
    fetchPaymentStats();
  }, [filterStatus, filterGateway]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/payments/', {
        params: {
          status: filterStatus,
          gateway: filterGateway,
        },
      });
      setPayments(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      toast.error('Failed to load payments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      const response = await API.get('/api/payments/refunds/');
      setRefunds(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Failed to load refunds:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await API.get('/api/admin-panel/dashboard-stats/');
      setStats(response.data);
      
      // Generate sample chart data
      const data = [
        { name: 'Stripe', value: 0, count: 0 },
        { name: 'Razorpay', value: 0, count: 0 },
        { name: 'COD', value: 0, count: 0 },
      ];
      setPaymentStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleApproveRefund = async (refundId) => {
    try {
      await API.patch(`/api/payments/refunds/${refundId}/`, { status: 'approved' });
      toast.success('Refund approved');
      fetchRefunds();
    } catch (error) {
      toast.error('Failed to approve refund');
      console.error(error);
    }
  };

  const handleRejectRefund = async (refundId) => {
    try {
      await API.patch(`/api/payments/refunds/${refundId}/`, { status: 'rejected' });
      toast.success('Refund rejected');
      fetchRefunds();
    } catch (error) {
      toast.error('Failed to reject refund');
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredPayments = payments.filter((payment) =>
    payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRefunds = refunds.filter((r) => r.status === 'requested');
  const approvedRefunds = refunds.filter((r) => r.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Payments & Refunds</h1>
        <div className="text-sm text-gray-600">
          Total Revenue: <span className="font-bold text-indigo-600">₹{Math.round(stats?.total_revenue || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-semibold">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  ₹{Math.round(stats.total_revenue).toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-green-500 opacity-20" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-semibold">Total Payments</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{payments.length}</p>
              </div>
              <CreditCard className="text-blue-500 opacity-20" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-semibold">Refund Requests</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{pendingRefunds.length}</p>
              </div>
              <RefreshCw className="text-purple-500 opacity-20" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-semibold">Today's Revenue</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  ₹{Math.round(stats.today_revenue).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="text-orange-500 opacity-20" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border-b flex">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 px-6 py-4 font-semibold transition ${
            activeTab === 'payments'
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex-1 px-6 py-4 font-semibold transition ${
            activeTab === 'refunds'
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Refunds ({refunds.length})
        </button>
      </div>

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by transaction ID or order..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filterGateway}
              onChange={(e) => setFilterGateway(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Gateways</option>
              <option value="stripe">Stripe</option>
              <option value="razorpay">Razorpay</option>
              <option value="cod">COD</option>
            </select>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No payments found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Gateway</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-indigo-600">
                            {payment.transaction_id.substring(0, 12)}...
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">{payment.order.order_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800">₹{Math.round(payment.amount).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                            {payment.gateway.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-indigo-600 hover:bg-indigo-100 p-2 rounded transition flex items-center gap-2"
                          >
                            <Eye size={18} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Refunds */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200">
                <h3 className="font-bold text-yellow-900 flex items-center gap-2">
                  <Clock size={20} /> Pending Refunds ({pendingRefunds.length})
                </h3>
              </div>
              <div className="space-y-2 p-4 max-h-[500px] overflow-y-auto">
                {pendingRefunds.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No pending refunds</p>
                ) : (
                  pendingRefunds.map((refund) => (
                    <div key={refund.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">₹{Math.round(refund.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{refund.reason}</p>
                        </div>
                        <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                          Requested
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{refund.description}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRefund(refund.id)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectRefund(refund.id)}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Approved Refunds */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-200">
                <h3 className="font-bold text-green-900 flex items-center gap-2">
                  <CheckCircle size={20} /> Approved Refunds ({approvedRefunds.length})
                </h3>
              </div>
              <div className="space-y-2 p-4 max-h-[500px] overflow-y-auto">
                {approvedRefunds.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No approved refunds</p>
                ) : (
                  approvedRefunds.map((refund) => (
                    <div key={refund.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">₹{Math.round(refund.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{refund.reason}</p>
                        </div>
                        <span className="text-xs font-semibold bg-green-200 text-green-800 px-2 py-1 rounded">
                          Approved
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Refund ID:</span> {refund.refund_id || 'Processing'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Payment Details</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-white hover:bg-indigo-500 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Transaction ID</p>
                  <p className="font-mono text-gray-800 mt-1">{selectedPayment.transaction_id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Order</p>
                  <p className="text-gray-800 mt-1">{selectedPayment.order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Amount</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">
                    ₹{Math.round(selectedPayment.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Gateway</p>
                  <p className="text-gray-800 mt-1">{selectedPayment.gateway.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Status</p>
                  <p
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border mt-1 ${getStatusColor(
                      selectedPayment.status
                    )}`}
                  >
                    {selectedPayment.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Date</p>
                  <p className="text-gray-800 mt-1">
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}