// src/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Package, ShoppingCart, CreditCard, AlertTriangle,
  TrendingUp, Menu, X, LogOut, ExternalLink, Search,
  LayoutDashboard, Archive, ClipboardList, FileText, Headphones,
  Settings, Link2, Image, Grid, Layers, Star, Shirt,
  ChevronDown, ChevronRight, Zap, Home, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import { adminAPI } from '../api/admin';
import toast from 'react-hot-toast';

// Import child components
import ProductsPage from './Products';
import OrdersPage from './Orders';
import UsersPage from './Users';
import PaymentsPage from './Payments';
import AnalyticsPage from './Analystics';
import HeroSlidesPage from './HeroSlides';
import MensHoodiesGridPage from './MensHoodiesGrid';
import CategoryCardsPage from './CategoryCards';
import BottomStylesPage from './BottomStyles';
import JacketsGridPage from './JacketsGrid';
import PromotionalBannersPage from './PromotionalBanners';
import TshirtGridPage from './TshirtGrid';
import ShoesGridPage from './ShoesGrid';
import ShoesCardPage from './ShoesCard';
import RelatedProductsPage from './RelatedProducts';

// Dark-mode pie colors
const INVENTORY_COLORS = ['#6366f1', '#1e293b'];

// ---- Sidebar section structure ----
const NAV_STRUCTURE = [
  {
    groupId: 'store',
    groupLabel: 'Store',
    icon: LayoutDashboard,
    items: [
      { id: 'overview',  label: 'Dashboard',       icon: LayoutDashboard },
      { id: 'products',  label: 'Products',         icon: Archive },
      { id: 'orders',    label: 'Orders',           icon: ClipboardList },
      { id: 'users',     label: 'Users',            icon: Users },
      { id: 'payments',  label: 'Payments',         icon: CreditCard },
      { id: 'analytics', label: 'Analytics',        icon: TrendingUp },
      { id: 'related-products', label: 'Related Products', icon: Link2 },
    ],
  },
  {
    groupId: 'home-hero',
    groupLabel: '(1) Hero Section',
    icon: Zap,
    items: [
      { id: 'hero-slides', label: 'Hero Slides',  icon: Image, hint: 'Full-width banner images' },
    ],
  },
  {
    groupId: 'home-category',
    groupLabel: '(2) Category Grid',
    icon: Grid,
    items: [
      { id: 'category-cards', label: 'Category Cards', icon: Grid, hint: 'Left portrait + right info cards' },
    ],
  },
  {
    groupId: 'home-collection',
    groupLabel: '(3) Our Collection',
    icon: Layers,
    items: [
      { id: 'mens-hoodies-grid',  label: 'Hoodies Tab',      icon: Shirt,   hint: 'Hoodie tab products' },
      { id: 'tshirt-grid',        label: 'T-Shirts Tab',     icon: Shirt,   hint: 'T-Shirts tab products' },
      { id: 'jackets-grid',       label: 'Out Wear Tab',     icon: Shirt,   hint: 'Jackets / outer wear' },
      { id: 'bottom-styles',      label: 'Bottom Wears Tab', icon: Layers,  hint: 'Bottom wears & bottoms' },
      { id: 'shoes-grid',         label: 'Shoes Tab',        icon: Package, hint: 'Shoes in collection grid' },
    ],
  },
  {
    groupId: 'home-banner',
    groupLabel: '(4) Cloth & Footwear Banner',
    icon: Star,
    items: [
      { id: 'promotional-banners', label: 'Promo Banners', icon: FileText, hint: 'Half-image, half-text banner' },
    ],
  },
  {
    groupId: 'home-dark',
    groupLabel: '(5) Dark Section',
    icon: Package,
    items: [
      { id: 'shoes-card', label: 'Shoes Cards', icon: Package, hint: 'Dark-bg product grid cards' },
    ],
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedGroups, setExpandedGroups] = useState({
    store: true,
    'home-hero': true,
    'home-category': true,
    'home-collection': true,
    'home-banner': true,
    'home-dark': true,
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchDashboardStats();
  }, [isAuthenticated, user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [statsRes] = await Promise.all([adminAPI.getDashboardStats()]);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0f172a' }}>
        <p style={{ color:'#475569' }}>Redirecting...</p>
      </div>
    );
  }

  const inventoryData = stats ? [
    { name: 'Out of Stock', value: stats.sold_percentage || 0 },
    { name: 'Available',    value: stats.available_percentage || 100 },
  ] : [{ name: 'Available', value: 100 }];

  const topCategoriesData = stats?.top_categories || [];
  const monthlyRevenueData = stats?.monthly_revenue || [];
  const weekGrowth = stats?.week_growth || 0;

  const allItems = NAV_STRUCTURE.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.id === activeTab);

  // Stat card definitions with dark-mode accent colours
  const STAT_CARDS = [
    {
      label: 'Total Products',
      value: stats?.total_products ?? 0,
      icon: Package,
      bg: 'rgba(99,102,241,0.15)',
      color: '#818cf8',
    },
    {
      label: 'Paid Orders',
      value: stats?.paid_orders ?? 0,
      icon: ShoppingCart,
      bg: 'rgba(16,185,129,0.15)',
      color: '#34d399',
    },
    {
      label: 'Total Stock',
      value: stats?.total_stock ?? 0,
      icon: Archive,
      bg: 'rgba(245,158,11,0.15)',
      color: '#fbbf24',
    },
    {
      label: 'Out of Stock',
      value: stats?.out_of_stock ?? 0,
      icon: AlertTriangle,
      bg: 'rgba(239,68,68,0.12)',
      color: '#f87171',
    },
  ];

  return (
    <div className="adm-shell">

      {/* ====== SIDEBAR ====== */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'adm-sidebar-open' : 'adm-sidebar-collapsed'}`}>

        {/* Toggle */}
        <button className="adm-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={13} /> : <Menu size={13} />}
        </button>

        {/* Brand */}
        <div className="adm-brand">
          <div className="adm-brand-dot" />
          {sidebarOpen && <span className="adm-brand-name">POGIEE Admin</span>}
        </div>

        {/* Profile */}
        <div className="adm-profile">
          <img
            src={user?.profile_image || 'https://placehold.co/40x40/1e293b/818cf8?text=A'}
            alt="Admin"
            className={`adm-avatar ${sidebarOpen ? 'adm-avatar-lg' : 'adm-avatar-sm'}`}
          />
          {sidebarOpen && (
            <div className="adm-profile-info">
              <p className="adm-profile-name">{user?.first_name || 'Admin'}</p>
              <p className="adm-profile-email">{user?.email || 'admin@pogiee.com'}</p>
              <span className="adm-badge-online">&#x25CF; Online</span>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav className="adm-nav">
          {NAV_STRUCTURE.map(group => (
            <div key={group.groupId} className="adm-nav-group">
              <button
                className="adm-nav-group-header"
                onClick={() => sidebarOpen && toggleGroup(group.groupId)}
              >
                {sidebarOpen ? (
                  <>
                    <span className="adm-group-label">{group.groupLabel}</span>
                    <span className="adm-group-chevron">
                      {expandedGroups[group.groupId] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                  </>
                ) : (
                  <group.icon size={15} className="adm-group-icon-only" />
                )}
              </button>

              {(sidebarOpen ? expandedGroups[group.groupId] : true) && (
                <div className="adm-nav-items">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`adm-nav-item ${isActive ? 'adm-nav-item-active' : ''} ${!sidebarOpen ? 'adm-nav-item-icon-only' : ''}`}
                        title={!sidebarOpen ? item.label : item.hint || ''}
                      >
                        <Icon size={15} className="adm-nav-item-icon" />
                        {sidebarOpen && (
                          <div className="adm-nav-item-text">
                            <span className="adm-nav-item-label">{item.label}</span>
                            {item.hint && <span className="adm-nav-item-hint">{item.hint}</span>}
                          </div>
                        )}
                        {isActive && <span className="adm-nav-item-dot" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="adm-sidebar-footer">
          <button
            onClick={() => navigate('/')}
            className={`adm-footer-btn ${!sidebarOpen ? 'adm-nav-item-icon-only' : ''}`}
            title="View Site"
          >
            <ExternalLink size={15} />
            {sidebarOpen && <span>View Site</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`adm-footer-btn adm-footer-btn-danger ${!sidebarOpen ? 'adm-nav-item-icon-only' : ''}`}
            title="Logout"
          >
            <LogOut size={15} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ====== MAIN ====== */}
      <div className="adm-main">

        {/* Top bar */}
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <h1 className="adm-topbar-title">
              {activeItem?.label || 'Dashboard'}
            </h1>
            {activeItem?.hint && (
              <span className="adm-topbar-hint">{activeItem.hint}</span>
            )}
          </div>
          <div className="adm-topbar-right">
            <div className="adm-search-wrap">
              <Search size={15} className="adm-search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="adm-search-input"
              />
            </div>
            <img
              src={user?.profile_image || 'https://placehold.co/36x36/1e293b/818cf8?text=A'}
              alt="User"
              className="adm-topbar-avatar"
            />
          </div>
        </header>

        {/* Home page section hint */}
        {activeTab !== 'overview' && activeItem && NAV_STRUCTURE.some(g => g.groupId.startsWith('home-') && g.items.some(i => i.id === activeTab)) && (
          <div className="adm-section-hint-bar">
            <Home size={13} />
            <span>
              This content powers the <strong>{NAV_STRUCTURE.find(g => g.items.some(i => i.id === activeTab))?.groupLabel}</strong> section on your home page
            </span>
            <button className="adm-preview-link" onClick={() => window.open('/', '_blank')}>
              Preview page <ExternalLink size={11} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="adm-content">

          {/* ---- OVERVIEW ---- */}
          {activeTab === 'overview' && (
            <div className="adm-overview">

              {/* Quick-nav */}
              <div className="adm-quick-nav">
                <p className="adm-quick-nav-title">Home Page Sections – Quick Edit</p>
                <div className="adm-quick-nav-grid">
                  {[
                    { id: 'hero-slides',         label: '(1) Hero Slides'         },
                    { id: 'category-cards',       label: '(2) Category Grid'       },
                    { id: 'mens-hoodies-grid',    label: '(3) Hoodies Tab'         },
                    { id: 'tshirt-grid',          label: '(4) T-Shirts Tab'        },
                    { id: 'jackets-grid',         label: '(5) Out Wear Tab'        },
                    { id: 'bottom-styles',        label: '(6) Bottom Wears Tab'    },
                    { id: 'shoes-grid',           label: '(7) Shoes Tab'           },
                    { id: 'promotional-banners',  label: '(8) Promo Banner'        },
                    { id: 'shoes-card',           label: '(9) Dark Section Cards'  },
                  ].map(q => (
                    <button
                      key={q.id}
                      onClick={() => setActiveTab(q.id)}
                      className="adm-quick-card"
                    >
                      <span className="adm-quick-label">{q.label}</span>
                      <ChevronRight size={13} />
                    </button>
                  ))}
                </div>
              </div>

              <h2 className="adm-section-title">Store Overview</h2>

              {loading ? (
                <div className="adm-loading">
                  <div className="adm-spinner" />
                  <p>Loading stats...</p>
                </div>
              ) : stats ? (
                <>
                  {/* Stat cards */}
                  <div className="adm-stat-grid">
                    {STAT_CARDS.map(s => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="adm-stat-card">
                          <div className="adm-stat-icon" style={{ background: s.bg, color: s.color }}>
                            <Icon size={22} />
                          </div>
                          <div>
                            <p className="adm-stat-value">{s.value.toLocaleString()}</p>
                            <p className="adm-stat-label">{s.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Week growth badge */}
                  {weekGrowth !== 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: weekGrowth >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: weekGrowth >= 0 ? '#34d399' : '#f87171',
                        border: `1px solid ${weekGrowth >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}>
                        {weekGrowth >= 0
                          ? <ArrowUpRight size={14} />
                          : <ArrowDownRight size={14} />}
                        {Math.abs(weekGrowth).toFixed(1)}% week-over-week revenue
                      </div>
                      <span style={{ fontSize: 12, color: '#475569' }}>
                        ₹{Math.round(stats.this_week_revenue || 0).toLocaleString()} this week vs ₹{Math.round(stats.last_week_revenue || 0).toLocaleString()} last week
                      </span>
                    </div>
                  )}

                  {/* Analytics row */}
                  <div className="adm-analytics-row">
                    {/* Users */}
                    <div className="adm-card">
                      <p className="adm-card-title">Total Customers</p>
                      <div className="adm-users-block">
                        <div className="adm-users-icon"><Users size={26} /></div>
                        <p className="adm-users-count">
                          {stats.total_users >= 1000 ? `${(stats.total_users / 1000).toFixed(1)}K` : stats.total_users || 0}
                        </p>
                      </div>
                    </div>

                    {/* Inventory pie */}
                    <div className="adm-card">
                      <p className="adm-card-title">Inventory Status</p>
                      <div className="adm-pie-row">
                        <ResponsiveContainer width={130} height={130}>
                          <PieChart>
                            <Pie
                              data={inventoryData}
                              cx="50%" cy="50%"
                              innerRadius={36} outerRadius={55}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {inventoryData.map((_, index) => (
                                <Cell key={index} fill={INVENTORY_COLORS[index % INVENTORY_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#e2e8f0' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="adm-pie-legend">
                          <div className="adm-legend-item">
                            <span className="adm-legend-dot" style={{ background: '#6366f1' }} />Out of Stock
                          </div>
                          <div className="adm-legend-item">
                            <span className="adm-legend-dot" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)' }} />In Stock
                          </div>
                          <p className="adm-pie-pct">{stats.sold_percentage || 0}% / {stats.available_percentage || 100}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Top categories */}
                    <div className="adm-card adm-card-scroll">
                      <p className="adm-card-title">Top Categories</p>
                      {topCategoriesData.length > 0 ? topCategoriesData.map((cat, idx) => (
                        <div key={idx} className="adm-cat-row">
                          <span className="adm-cat-name">{cat.name}</span>
                          <div className="adm-cat-bar-wrap">
                            <div
                              className="adm-cat-bar"
                              style={{ width: `${Math.min((cat.product_count / Math.max(...topCategoriesData.map(c => c.product_count), 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="adm-cat-count">{cat.product_count}</span>
                        </div>
                      )) : <p className="adm-empty">No data yet</p>}
                    </div>
                  </div>

                  {/* Revenue chart */}
                  <div className="adm-card adm-card-full">
                    <div className="adm-card-header">
                      <p className="adm-card-title">Monthly Revenue</p>
                      <span className="adm-card-sub">Last 6 months - paid orders only</span>
                    </div>
                    {monthlyRevenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={monthlyRevenueData}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="month"
                            axisLine={false} tickLine={false}
                            tick={{ fill: '#475569', fontSize: 12 }}
                          />
                          <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fill: '#475569', fontSize: 12 }}
                            tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                          />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                            formatter={(v, n) => [n === 'revenue' ? `₹${v.toLocaleString()}` : v, n === 'revenue' ? 'Revenue' : 'Orders']}
                          />
                          <Area
                            type="monotone" dataKey="revenue"
                            stroke="#6366f1" strokeWidth={2}
                            fillOpacity={1} fill="url(#revGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="adm-empty-chart">
                        <TrendingUp size={40} className="adm-empty-icon" />
                        <p style={{ color: '#334155' }}>No revenue data yet</p>
                        <p className="adm-empty-sub">Data appears once paid orders are placed</p>
                      </div>
                    )}
                    <div className="adm-revenue-summary">
                      <div className="adm-rev-pill adm-rev-pill-dark">
                        Total: ₹{(stats.total_revenue || 0).toLocaleString()}
                      </div>
                      <div className="adm-rev-pill adm-rev-pill-light">
                        Avg Order: ₹{Math.round(stats.avg_order_value || 0).toLocaleString()}
                      </div>
                      <div className="adm-rev-pill adm-rev-pill-light">
                        Pending: {stats.pending_orders || 0}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="adm-empty">No stats available</div>
              )}
            </div>
          )}

          {/* ---- HOME PAGE SECTION MANAGERS ---- */}
          {activeTab === 'hero-slides'          && <HeroSlidesPage />}
          {activeTab === 'category-cards'       && <CategoryCardsPage />}
          {activeTab === 'mens-hoodies-grid'    && <MensHoodiesGridPage />}
          {activeTab === 'bottom-styles'        && <BottomStylesPage />}
          {activeTab === 'jackets-grid'         && <JacketsGridPage />}
          {activeTab === 'promotional-banners'  && <PromotionalBannersPage />}
          {activeTab === 'tshirt-grid'          && <TshirtGridPage />}
          {activeTab === 'shoes-grid'           && <ShoesGridPage />}
          {activeTab === 'shoes-card'           && <ShoesCardPage />}

          {/* ---- STORE SECTION MANAGERS ---- */}
          {activeTab === 'related-products'     && <RelatedProductsPage />}
          {activeTab === 'products'             && <ProductsPage />}
          {activeTab === 'orders'               && <OrdersPage />}
          {activeTab === 'users'                && <UsersPage />}
          {activeTab === 'payments'             && <PaymentsPage />}
          {activeTab === 'analytics'            && <AnalyticsPage />}

          {activeTab === 'support' && (
            <div className="adm-coming-soon">
              <Headphones size={48} />
              <h3>Support</h3>
              <p>Coming soon</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="adm-coming-soon">
              <Settings size={48} />
              <h3>Settings</h3>
              <p>Coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
