// src/admin/Analystics.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, ShoppingCart,
  DollarSign, Package, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Compact number formatter
const fmtCurrency = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const fmtShort    = (v) => {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v}`;
};

export default function Analytics() {
  const [period, setPeriod] = useState('monthly'); // daily | weekly | monthly
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, salesRes] = await Promise.all([
        API.get('/api/admin-panel/dashboard-stats/'),
        API.get('/api/admin-panel/sales-report/', { params: { period } }),
      ]);
      setStats(statsRes.data);
      setSalesData(salesRes.data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Real data from backend
  const topProducts   = stats?.top_products   || [];
  const categoryData  = stats?.category_sales || [];

  // Metrics derived from real stats
  const totalRevenue  = stats?.total_revenue   || 0;
  const todayRevenue  = stats?.today_revenue   || 0;
  const paidOrders    = stats?.paid_orders     || 0;
  const todayOrders   = stats?.today_orders    || 0;
  const avgOrderValue = stats?.avg_order_value || 0;
  const weekGrowth    = stats?.week_growth     || 0;

  const cardMetrics = [
    {
      title: 'Total Revenue',
      value: fmtCurrency(totalRevenue),
      change: weekGrowth >= 0
        ? `+${weekGrowth.toFixed(1)}% this week`
        : `${weekGrowth.toFixed(1)}% this week`,
      isPositive: weekGrowth >= 0,
      icon: DollarSign,
      color: 'green',
      bg: 'from-green-50 to-green-100',
      border: 'border-green-300',
    },
    {
      title: 'Paid Orders',
      value: paidOrders,
      change: `+${todayOrders} today`,
      isPositive: todayOrders > 0,
      icon: ShoppingCart,
      color: 'blue',
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-300',
    },
    {
      title: 'Avg Order Value',
      value: fmtCurrency(avgOrderValue),
      change: 'Per paid order',
      isPositive: true,
      icon: TrendingUp,
      color: 'purple',
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-300',
    },
    {
      title: "Today's Revenue",
      value: fmtCurrency(todayRevenue),
      change: `${todayOrders} orders today`,
      isPositive: todayRevenue > 0,
      icon: Calendar,
      color: 'orange',
      bg: 'from-orange-50 to-orange-100',
      border: 'border-orange-300',
    },
  ];

  const colorMap = {
    green: 'text-green-600', blue: 'text-blue-600',
    purple: 'text-purple-600', orange: 'text-orange-600',
  };

  // Period label for chart titles
  const periodLabel = { daily: 'Today', weekly: 'Last 7 Days', monthly: 'Last 30 Days' }[period];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gray-800">Analytics &amp; Reports</h1>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 font-medium">Loading analytics…</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Metric Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardMetrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${m.bg} border ${m.border} rounded-xl p-6 shadow-sm hover:shadow-md transition`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-600 font-semibold text-sm">{m.title}</p>
                    <Icon className={`${colorMap[m.color]} opacity-30`} size={22} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{m.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {m.isPositive
                      ? <ArrowUpRight size={14} className="text-green-500" />
                      : <ArrowDownRight size={14} className="text-red-500" />}
                    <p className={`text-xs font-medium ${m.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {m.change}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Charts Row 1: Sales Trend + Category Pie ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Sales Trend Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Sales Trend</h3>
              <p className="text-xs text-gray-400 mb-4">{periodLabel} — paid orders only</p>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={fmtShort}
                    />
                    <Tooltip
                      formatter={(v) => [fmtCurrency(v), 'Revenue']}
                      labelFormatter={(l) => `Date: ${l}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 gap-2">
                  <TrendingUp size={36} className="opacity-30" />
                  <p className="text-sm">No paid orders in this period</p>
                </div>
              )}
            </div>

            {/* Category Sales Pie */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Category Sales</h3>
              <p className="text-xs text-gray-400 mb-4">Revenue share — paid orders</p>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%" cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                        labelLine={false}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n, props) => [
                        fmtCurrency(props.payload.revenue),
                        props.payload.name
                      ]} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="mt-2 space-y-1">
                    {categoryData.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-gray-700 truncate max-w-[90px]">{c.name}</span>
                        </div>
                        <span className="text-gray-500 font-medium">{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Package size={36} className="opacity-30" />
                  <p className="text-sm">No category data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Charts Row 2: Daily Orders Bar + Revenue by Category ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Daily Orders Bar Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Orders by Date</h3>
              <p className="text-xs text-gray-400 mb-4">{periodLabel} — paid orders only</p>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false} tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                    />
                    <Bar dataKey="count" fill="#10B981" name="Orders" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 gap-2">
                  <ShoppingCart size={36} className="opacity-30" />
                  <p className="text-sm">No orders in this period</p>
                </div>
              )}
            </div>

            {/* Revenue by Category Horizontal Bar */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Revenue by Category</h3>
              <p className="text-xs text-gray-400 mb-4">Paid orders — all time</p>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      axisLine={false} tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={fmtShort}
                    />
                    <YAxis
                      dataKey="name" type="category" width={90}
                      axisLine={false} tickLine={false}
                      tick={{ fill: '#374151', fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(v) => [fmtCurrency(v), 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Package size={36} className="opacity-30" />
                  <p className="text-sm">No category revenue data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Top Products Table ────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Top Selling Products
              <span className="ml-2 text-xs font-normal text-gray-400">by units sold — paid orders only</span>
            </h3>
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Units Sold</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Revenue</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topProducts.map((product, idx) => (
                      <tr key={product.id || idx} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-bold text-indigo-600">#{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{product.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{product.units_sold}</td>
                        <td className="px-4 py-3 font-bold text-green-600">{fmtCurrency(product.revenue)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {product.units_sold > 0
                            ? fmtCurrency(product.revenue / product.units_sold)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center text-gray-400 gap-2">
                <Package size={40} className="opacity-30" />
                <p className="text-sm">No sales data yet — complete some orders first</p>
              </div>
            )}
          </div>

          {/* ── Summary Stats ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <p className="text-blue-700 text-sm font-semibold">Avg Daily Revenue</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {fmtCurrency(totalRevenue / 30)}
              </p>
              <p className="text-xs text-blue-600 mt-1">Based on 30-day window</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <p className="text-green-700 text-sm font-semibold">Avg Orders / Day</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {paidOrders > 0 ? Math.round(paidOrders / 30) : 0}
              </p>
              <p className="text-xs text-green-600 mt-1">Paid orders ÷ 30 days</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <p className="text-purple-700 text-sm font-semibold">Categories Selling</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{categoryData.length}</p>
              <p className="text-xs text-purple-600 mt-1">With paid orders</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <p className="text-orange-700 text-sm font-semibold">Best Category</p>
              <p className="text-xl font-bold text-orange-900 mt-2 truncate">
                {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
              </p>
              <p className="text-xs text-orange-600 mt-1">By revenue</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}