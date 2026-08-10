// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import AddAddressForm from '../pages/Addaddressform';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

import {
    MapPin,
    Package,
    CreditCard,
    Check,
    ChevronRight,
    ChevronLeft,
    Plus,
    Truck,
    ShieldCheck,
    Lock,
    Banknote,
    AlertCircle,
    CheckCircle2,
    Home,
    Building2,
    Briefcase,
    Edit2,
    Trash2,
} from 'lucide-react';
import API from '../api/api';
import { ordersAPI } from '../api/orders';
import { paymentsAPI } from '../api/payments';
import { clearCart } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Step indicator component
const StepIndicator = ({ currentStep, steps }) => {
    return (
        <div className="flex items-center justify-between sm:justify-center mb-8 sm:mb-12 overflow-x-auto scrollbar-hide py-2 w-full px-2">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center flex-shrink-0 relative">
                        <div
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${index < currentStep
                                ? 'bg-green-500 text-white shadow-md'
                                : index === currentStep
                                    ? 'bg-[#111] text-white shadow-lg ring-4 ring-gray-100'
                                    : 'bg-white border-2 border-gray-200 text-gray-400'
                                }`}
                        >
                            {index < currentStep ? (
                                <Check size={24} />
                            ) : (
                                <step.icon size={22} className={index === currentStep ? 'text-white' : 'text-gray-400'} />
                            )}
                        </div>
                        <span
                            className={`mt-3 text-xs sm:text-sm font-bold uppercase tracking-wider absolute top-full whitespace-nowrap ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                                }`}
                        >
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="flex-1 w-12 sm:w-24 h-1 mx-2 sm:mx-4 rounded-full bg-gray-100 relative">
                           <div 
                             className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-500"
                             style={{ width: index < currentStep ? '100%' : '0%' }}
                           ></div>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// Address card component
const AddressCard = ({ address, selected, onSelect, onEdit, onDelete }) => {
    const getIcon = () => {
        switch (address.address_type) {
            case 'home':
                return <Home size={22} />;
            case 'office':
                return <Building2 size={22} />;
            case 'work':
                return <Briefcase size={22} />;
            default:
                return <MapPin size={22} />;
        }
    };

    return (
        <div
            onClick={() => onSelect(address)}
            className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative ${selected
                ? 'border-[#111] bg-gray-50 shadow-md transform scale-[1.01]'
                : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
        >
            <div className="absolute top-5 right-5 flex items-center gap-2">
                {onEdit && (
                    <button onClick={(e) => { e.stopPropagation(); onEdit(address); }} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="Edit Address">
                        <Edit2 size={14} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(address.id); }} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors" title="Delete Address">
                        <Trash2 size={14} />
                    </button>
                )}
                {selected && (
                    <div className="w-6 h-6 bg-[#111] rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                )}
            </div>
            <div className="flex items-start gap-4">
                <div
                    className={`p-3 rounded-2xl ${selected ? 'bg-gray-200 text-[#111]' : 'bg-gray-50 text-gray-400'
                        }`}
                >
                    {getIcon()}
                </div>
                <div className="flex-1 pr-8">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">{address.name}</h4>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                           {address.address_type}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-3 pt-3 border-t border-gray-100">📞 {address.phone}</p>
                </div>
            </div>
        </div>
    );
};


// Order Summary Component
const OrderSummary = ({ items, subtotal, shipping, discount, total, navigate }) => {
    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-[#fafafa]">
                <h3 className="text-2xl font-extrabold text-gray-900">
                    Order Summary
                </h3>
            </div>

            <div className="p-6 sm:p-8 max-h-[400px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex gap-4 cursor-pointer group"
                        onClick={() => item.product?.slug && navigate(`/product/${item.product.slug}`, {
                            state: {
                                preselectedSize: item.size || item.color_variant_details?.size || item.variant_details?.size,
                                preselectedVariantId: item.color_variant_details?.id || item.variant_id,
                            }
                        })}
                    >
                        <img
                            src={item.color_variant_details?.primary_image || item.product?.primary_image || '/placeholder.png'}
                            alt={item.product?.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl flex-shrink-0 bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="flex-1 min-w-0 py-1">
                            <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                {item.product?.name}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {(item.color_variant_details?.color_name || item.variant_details?.color) && (
                                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                        {item.color_variant_details?.color_hex && (
                                            <span
                                                className="w-3 h-3 rounded-full border border-gray-300 inline-block shadow-sm"
                                                style={{ backgroundColor: item.color_variant_details.color_hex }}
                                            />
                                        )}
                                        {item.color_variant_details?.color_name || item.variant_details?.color}
                                    </span>
                                )}
                                {(item.size || item.color_variant_details?.size || item.variant_details?.size) && (
                                    <span className="text-xs text-gray-500 font-medium">
                                        • Size: {item.size || item.color_variant_details?.size || item.variant_details?.size}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <p className="text-sm font-medium text-gray-500">Qty: {item.quantity}</p>
                                <p className="text-sm font-extrabold text-gray-900">
                                    ₹{Math.round(parseFloat(item.total_price) || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 sm:p-8 bg-white border-t border-gray-100">
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-medium">Subtotal</span>
                        <span className="font-bold text-gray-900">₹{Math.round(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                            <span className="font-medium">Discount</span>
                            <span className="font-bold">-₹{Math.round(discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-medium">Estimated Delivery</span>
                        <span className={`font-bold ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                           {shipping === 0 ? 'Free' : `₹${Math.round(shipping)}`}
                        </span>
                    </div>
                </div>
                
                <div className="h-px bg-gray-100 w-full mb-6" />
                
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-extrabold text-gray-900">₹{Math.round(total)}</span>
                </div>
            </div>

            {/* Trust badges */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-gray-500">
                    <div className="flex items-center gap-1.5" title="Secure Payment">
                        <ShieldCheck size={16} className="text-green-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Encrypted Data">
                        <Lock size={16} className="text-green-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Fast Delivery">
                        <Truck size={16} className="text-green-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">Fast</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Payment Form Component
const PaymentForm = ({ orderId, amount, onSuccess, paymentMethod }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (orderId && paymentMethod === 'card') {
            initializePayment();
        }
    }, [orderId, paymentMethod]);

    const initializePayment = async () => {
        try {
            setLoading(true);
            const response = await paymentsAPI.createPayment({
                order_id: orderId,
            });
            setClientSecret(response.data.client_secret);
            setPaymentIntentId(response.data.payment_intent_id);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to initialize payment');
            toast.error('Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError('');

        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement),
                    },
                }
            );

            if (stripeError) {
                setError(stripeError.message);
                toast.error(stripeError.message);
                setLoading(false);
                return;
            }

            if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
                await paymentsAPI.verifyStripe({ payment_intent_id: paymentIntentId });
                toast.success('Payment successful!');
                onSuccess();
            }
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#111',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: '500',
                '::placeholder': {
                    color: '#9ca3af',
                },
                iconColor: '#111',
            },
            invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
            },
        },
        hidePostalCode: true,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                    Card Details
                </label>
                <div className="p-4 rounded-xl border-2 border-gray-100 focus-within:border-[#111] transition-colors bg-gray-50">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Test card info - only in development */}
            {import.meta.env.DEV && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                        <AlertCircle size={16}/>
                        <strong>Test Mode:</strong> Use <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">4242 4242 4242 4242</code>
                    </p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || !elements || loading || !clientSecret}
                className="w-full py-4 bg-[#111] text-white rounded-full font-bold text-lg hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Lock size={20} />
                        Pay ₹{Math.round(amount)}
                    </>
                )}
            </button>
        </form>
    );
};

// Main Checkout Component
export default function Checkout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items, total } = useSelector((state) => state.cart);
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [currentStep, setCurrentStep] = useState(0);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [orderId, setOrderId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);

    // Calculate totals
    const subtotal = parseFloat(total) || 0;
    const shipping = subtotal >= 1000 ? 0 : 100;
    const discount = 0;
    const tax = 0; // Removed tax per user request
    const grandTotal = subtotal + shipping + tax;


    const steps = [
        { id: 'address', label: 'Address', icon: MapPin },
        { id: 'review', label: 'Review', icon: Package },
        { id: 'payment', label: 'Payment', icon: CreditCard },
    ];

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            toast.error('Please login to checkout');
            return;
        }
        if (items.length === 0 && !orderCreated) {
            navigate('/cart');
            toast.error('Your cart is empty');
            return;
        }
        fetchAddresses();
    }, [isAuthenticated, navigate, items.length, orderCreated]);

    const fetchAddresses = async () => {
        try {
            const response = await API.get('/api/auth/addresses/');
            const addressList = Array.isArray(response.data)
                ? response.data
                : (response.data?.results || []);
            setAddresses(addressList);
            const defaultAddr = addressList.find((a) => a.is_default);
            if (defaultAddr) setSelectedAddress(defaultAddr);
        } catch (error) {
            console.error('Failed to load addresses:', error);
            setAddresses([]);
            toast.error('Failed to load addresses');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await API.delete(`/api/auth/addresses/${id}/`);
            toast.success('Address deleted successfully');
            setAddresses(addresses.filter(a => a.id !== id));
            if (selectedAddress?.id === id) {
                setSelectedAddress(null);
            }
        } catch (error) {
            toast.error('Failed to delete address');
        }
    };

    const handleNextStep = async () => {
        if (currentStep === 0) {
            if (!selectedAddress) {
                toast.error('Please select a delivery address');
                return;
            }
            setCurrentStep(1);
            window.scrollTo(0, 0);
        } else if (currentStep === 1) {
            if (!orderCreated) {
                await createOrder();
            } else {
                setCurrentStep(2);
            }
            window.scrollTo(0, 0);
        }
    };

    const createOrder = async () => {
        setLoading(true);
        try {
            const response = await ordersAPI.createOrder({
                address_id: selectedAddress.id,
                payment_method: paymentMethod === 'card' ? 'credit_card' : paymentMethod,
            });
            setOrderId(response.data.order.id);
            setOrderCreated(true);
            setCurrentStep(2);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        dispatch(clearCart());
        navigate(`/order-confirmation/${orderId}`);
    };



    return (
        <div className="min-h-screen bg-[#fafafa] pt-28 md:pt-36 pb-20 pb-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10 mt-4 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
                    <p className="text-gray-500 mt-3 font-medium text-lg">Complete your order securely</p>
                </div>

                {/* Step Indicator */}
                <StepIndicator currentStep={currentStep} steps={steps} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mt-12 md:mt-20">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            {/* Step 1: Address Selection */}
                            {currentStep === 0 && (
                                <div className="p-6 sm:p-10">
                                    <h2 className="text-2xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <MapPin className="text-[#111]" size={20}/>
                                        </div>
                                        Select Delivery Address
                                    </h2>

                                    {!showAddAddress ? (
                                        <>
                                            <div className="space-y-4 mb-8">
                                                {addresses.length === 0 ? (
                                                    <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                        <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                                                        <p className="text-gray-500 font-medium">No saved addresses</p>
                                                    </div>
                                                ) : (
                                                    addresses.map((address) => (
                                                        <AddressCard
                                                            key={address.id}
                                                            address={address}
                                                            selected={selectedAddress?.id === address.id}
                                                            onSelect={setSelectedAddress}
                                                            onEdit={(addr) => {
                                                                setEditingAddress(addr);
                                                                setShowAddAddress(true);
                                                            }}
                                                            onDelete={handleDeleteAddress}
                                                        />
                                                    ))
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setShowAddAddress(true)}
                                                className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-2xl font-bold hover:border-[#111] hover:text-[#111] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={20} />
                                                Add New Address
                                            </button>
                                        </>
                                    ) : (
                                        <AddAddressForm
                                            initialData={editingAddress}
                                            onAdd={(savedAddr) => {
                                                if (editingAddress) {
                                                    setAddresses(addresses.map(a => a.id === savedAddr.id ? savedAddr : a));
                                                } else {
                                                    setAddresses([...addresses, savedAddr]);
                                                }
                                                setSelectedAddress(savedAddr);
                                                setShowAddAddress(false);
                                                setEditingAddress(null);
                                            }}
                                            onCancel={() => {
                                                setShowAddAddress(false);
                                                setEditingAddress(null);
                                            }}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Step 2: Review & Payment Method */}
                            {currentStep === 1 && (
                                <div className="p-6 sm:p-10">
                                    <h2 className="text-2xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Package className="text-[#111]" size={20}/>
                                        </div>
                                        Review Your Order
                                    </h2>

                                    {/* Delivery Address Summary */}
                                    <div className="bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100 relative group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                                                    Delivery Address
                                                    <CheckCircle2 size={16} className="text-green-500"/>
                                                </h4>
                                                <p className="text-sm font-medium text-gray-900 mt-2">{selectedAddress?.name}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {selectedAddress?.address_line1}, {selectedAddress?.city}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {selectedAddress?.state} - {selectedAddress?.pincode}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setCurrentStep(0)}
                                                className="px-4 py-2 bg-white border border-gray-200 text-sm font-bold text-[#111] rounded-full hover:border-[#111] transition-all"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-900 mb-6 text-xl">Payment Method</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div
                                            className={`p-6 rounded-3xl border-2 border-[#111] bg-gray-50 shadow-md transform scale-[1.02] relative`}
                                        >
                                            <div className="absolute top-4 right-4 w-6 h-6 bg-[#111] rounded-full flex items-center justify-center">
                                                <Check size={14} className="text-white" />
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
                                                <CreditCard size={24} className="text-[#111]" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">Card Payment</h4>
                                            <p className="text-xs text-gray-500 font-medium">Pay securely with Credit/Debit Card</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Payment */}
                            {currentStep === 2 && (
                                <div className="p-6 sm:p-10">
                                    <h2 className="text-2xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <CreditCard className="text-[#111]" size={20}/>
                                        </div>
                                        Complete Payment
                                    </h2>

                                    {/* Order Success Badge */}
                                    <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-100 rounded-2xl mb-8 shadow-sm">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                           <CheckCircle2 className="text-green-500" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-green-900">Order Created Successfully!</h4>
                                            <p className="text-sm font-medium text-green-700 mt-1">Order ID: #{orderId}</p>
                                        </div>
                                    </div>

                                        <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100">
                                            <Elements stripe={stripePromise}>
                                                <PaymentForm
                                                    orderId={orderId}
                                                    amount={grandTotal}
                                                    onSuccess={handlePaymentSuccess}
                                                    paymentMethod={paymentMethod}
                                                />
                                            </Elements>
                                        </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            {currentStep < 2 && (
                                <div className="p-6 sm:px-10 sm:py-8 bg-[#fafafa] border-t border-gray-100 flex gap-4">
                                    {currentStep > 0 && (
                                        <button
                                            onClick={() => setCurrentStep(currentStep - 1)}
                                            className="w-1/3 py-4 bg-white border border-gray-200 rounded-full font-bold text-gray-700 hover:border-[#111] hover:text-[#111] transition-all flex items-center justify-center gap-2"
                                        >
                                            <ChevronLeft size={20} />
                                            <span className="hidden sm:inline">Back</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNextStep}
                                        disabled={loading}
                                        className="flex-1 py-4 bg-[#111] text-white rounded-full font-bold text-lg hover:bg-[#333] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {currentStep === 1 ? 'Proceed to Payment' : 'Continue to Review'}
                                                <ChevronRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-32">
                            <OrderSummary
                                items={items}
                                subtotal={subtotal}
                                shipping={shipping}
                                discount={discount}
                                total={grandTotal}
                                navigate={navigate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}