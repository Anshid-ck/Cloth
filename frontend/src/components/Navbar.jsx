// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  Search, ShoppingCart, Heart, User, Menu, X, LogOut,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isAdmin } = useSelector((state) => state.auth);
  const { quantity: cartQuantity } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');



  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileOpen(false);
      setCategoriesOpen(false);
      setNewProductOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Stop propagation to prevent closing when clicking inside dropdown
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/shop?search=${searchTerm}`);
    setSearchTerm('');
  };


  const categoryLinks = [
    { label: 'T-Shirts', href: '/shop?category=tshirts' },
    { label: 'Hoodies', href: '/shop?category=hoodies' },
    { label: 'Pants', href: '/shop?category=bottomwear' },
    { label: 'Shoes', href: '/shop?category=shoes' },
    { label: 'Accessories', href: '/shop?category=accessories' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-sm">

      {/* Top Tier */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
            >
              <Menu size={24} />
            </button>

            {/* Center: Logo */}
            <Link to="/" className="flex items-center gap-2 md:absolute md:left-1/2 md:-translate-x-1/2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white font-black text-base">P</span>
                </div>
                <span className="font-black text-2xl tracking-tight text-gray-900">POGIEE</span>
              </div>
            </Link>

            {/* Center-Left: Login, About & FAQs (Desktop) */}
            <div className="hidden md:flex items-center gap-8 pl-5">
              <Link to="/about" className="text-gray-800 hover:text-black text-sm font-bold uppercase tracking-wide transition">
                About
              </Link>
            </div>

            {/* Right: Wishlist & Cart Icons */}
            <div className="flex items-center gap-1">
              {/* Wishlist Icon */}
              <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-900 transition">
                <Heart size={22} strokeWidth={2.5} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-900 transition">
                <ShoppingCart size={22} strokeWidth={2.5} />
                {cartQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartQuantity}
                  </span>
                )}
              </Link>

              {/* Profile Icon - Mobile */}
              <div className="relative md:hidden" onClick={handleDropdownClick}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-900 transition"
                >
                  <User size={22} strokeWidth={2.5} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg border w-56 z-50">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 border-b">
                          <p className="font-semibold">{isAdmin ? 'Admin' : (user?.first_name || 'User')}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                          My Profile
                        </Link>
                        <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">
                          My Orders
                        </Link>
                        <Link to="/wishlist" className="block px-4 py-2 hover:bg-gray-100">
                          Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            className="block px-4 py-2 hover:bg-gray-100 border-t"
                            onClick={() => setProfileOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t"
                        >
                          <LogOut size={16} className="inline mr-2" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="block px-4 py-2 text-black hover:bg-gray-100">
                          Login
                        </Link>
                        <Link to="/register" className="block px-4 py-2 hover:bg-gray-100">
                          Register
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tier - Hidden on mobile */}
      <div className="hidden md:block bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-14">

            {/* Categories Dropdown */}
            <div className="relative" onClick={handleDropdownClick}>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white hover:text-black rounded-md transition whitespace-nowrap uppercase tracking-wide"
              >
                Categories
                <ChevronDown size={16} />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded-lg border w-48 z-[100]">
                  {categoryLinks.map((cat) => (
                    <Link
                      key={cat.label}
                      to={cat.href}
                      onClick={() => setCategoriesOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* New Product Dropdown */}
            <div className="relative" onClick={handleDropdownClick}>
              <button
                onClick={() => setNewProductOpen(!newProductOpen)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white hover:text-black rounded-md transition whitespace-nowrap uppercase tracking-wide"
              >
                New Product
                <ChevronDown size={16} />
              </button>

              {newProductOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded-lg border w-48 z-[100]">
                  <Link
                    to="/shop?ordering=-created_at&is_new_arrival=true"
                    onClick={() => setNewProductOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  >
                    Latest Arrivals
                  </Link>
                  <Link
                    to="/shop?is_featured=true"
                    onClick={() => setNewProductOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
                  >
                    Featured Products
                  </Link>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white text-gray-900 px-4 py-2.5 pr-10 rounded-lg border-2 border-gray-300 focus:border-black outline-none text-sm font-medium placeholder:text-gray-500 transition"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black transition"
                >
                  <Search size={20} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Category Buttons */}
            <div className="hidden lg:flex items-center gap-2 ml-auto">
              <Link
                to="/shop?category=hoodies"
                className="px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white hover:text-black rounded-md transition whitespace-nowrap uppercase tracking-wide"
              >
                Hoodie
              </Link>
              <Link
                to="/shop?category=tshirts"
                className="px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white hover:text-black rounded-md transition whitespace-nowrap uppercase tracking-wide"
              >
                Tshirt
              </Link>
              <Link
                to="/shop?category=shoes"
                className="px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white hover:text-black rounded-md transition whitespace-nowrap uppercase tracking-wide"
              >
                Shoes
              </Link>
            </div>

            {/* Desktop Profile Icon */}
            <div className="hidden md:block relative" onClick={handleDropdownClick}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="p-2 hover:bg-white rounded-lg text-gray-900 transition"
              >
                <User size={22} strokeWidth={2.5} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg border w-56 z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 border-b">
                        <p className="font-semibold">{isAdmin ? 'Admin' : (user?.first_name || 'User')}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                        My Profile
                      </Link>
                      <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">
                        My Orders
                      </Link>
                      <Link to="/wishlist" className="block px-4 py-2 hover:bg-gray-100">
                        Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="block px-4 py-2 hover:bg-gray-100 border-t"
                          onClick={() => setProfileOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t"
                      >
                        <LogOut size={16} className="inline mr-2" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2 text-black hover:bg-gray-100">
                        Login
                      </Link>
                      <Link to="/register" className="block px-4 py-2 hover:bg-gray-100">
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-[85vw] max-w-[320px] bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-out">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white font-black text-sm">P</span>
                  </div>
                  <span className="font-black text-xl tracking-tight text-gray-900">POGIEE</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Mobile Search Bar */}
              <form onSubmit={(e) => { handleSearch(e); setOpen(false); }} className="mb-5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 text-gray-900 px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-black focus:bg-white outline-none text-sm font-medium placeholder:text-gray-500 transition"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black transition"
                  >
                    <Search size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </form>

              {/* Navigation Links */}
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Home
                </Link>
                <Link
                  to="/shop"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Shop
                </Link>
                <Link
                  to="/about"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  About
                </Link>
                <Link
                  to="/faqs"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  FAQs
                </Link>
              </div>

              {/* Categories */}
              <div className="mt-6">
                <h3 className="px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Categories
                </h3>
                <div className="space-y-1">
                  {categoryLinks.map((cat) => (
                    <Link
                      key={cat.label}
                      to={cat.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Gender Categories */}
              <div className="mt-6">
                <h3 className="px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Shop By
                </h3>
                <div className="space-y-1">
                  <Link
                    to="/shop?gender=men"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Men
                  </Link>
                  <Link
                    to="/shop?gender=women"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Women
                  </Link>
                  <Link
                    to="/shop?gender=children"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Children
                  </Link>
                  <Link
                    to="/shop?type=brands"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Brands
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}