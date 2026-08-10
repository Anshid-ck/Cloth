// src/pages/Addaddressform.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Search, Navigation, CheckCircle2, X, Loader2 } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

/**
 * AddAddressForm
 *
 * Saves this exact payload to Django POST /api/auth/addresses/:
 * {
 *   name, phone, house_name, street,
 *   city, state, postal_code, country,
 *   address_type, latitude, longitude
 * }
 *
 * Features:
 *  1. "Use My Location" button -> GPS -> map flies there
 *  2. Search bar (Nominatim, free) -> map flies to result
 *  3. Click map to move pin
 *  4. "Confirm Address" -> reverse geocode auto-fills all fields
 *  5. Submit -> POST to Django with the payload above
 *
 * Integration: replace AddAddressForm inside Checkout.jsx.
 * Add useMap to the react-leaflet import in Checkout.jsx.
 */

// Fix Leaflet default icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// --- Leaflet inner components ---

const FlyToTarget = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 15, { duration: 1.2 });
  }, [target, map]);
  return null;
};

const ClickToPin = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
};

// --- Nominatim helpers (no API key needed) ---

const NOM = 'https://nominatim.openstreetmap.org';

async function geocodeQuery(query) {
  const res  = await fetch(
    `${NOM}/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data.length) throw new Error('Not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function reverseGeocode(lat, lng) {
  const res  = await fetch(
    `${NOM}/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  const a    = data.address || {};
  return {
    house_name:  a.house_number
                   ? `${a.house_number}${a.road ? ', ' + a.road : ''}`
                   : a.neighbourhood || a.suburb || '',
    street:      a.road || a.pedestrian || a.footway || '',
    city:        a.city || a.town || a.village || a.county || '',
    state:       a.state || '',
    postal_code: a.postcode || '',
    country:     a.country || 'India',
    display:     data.display_name || '',
  };
}

// --- Main component ---

const AddAddressForm = ({ onAdd, onCancel, initialData }) => {

  const EMPTY = {
    name:         '',
    phone:        '',
    house_name:   '',
    street:       '',
    city:         '',
    state:        '',
    postal_code:  '',
    country:      'India',
    address_type: 'home',
    latitude:     null,
    longitude:    null,
  };

  const [formData,       setFormData]       = useState(initialData ? {
    name: initialData.name,
    phone: initialData.phone,
    house_name: initialData.address_line1,
    street: initialData.address_line2 || '',
    city: initialData.city,
    state: initialData.state,
    postal_code: initialData.pincode,
    country: 'India',
    address_type: initialData.address_type || 'home',
    latitude: initialData.latitude || null,
    longitude: initialData.longitude || null,
  } : EMPTY);
  const [displayAddress, setDisplayAddress] = useState('');
  const [showMap,        setShowMap]        = useState(false);
  const [pin,            setPin]            = useState(initialData?.latitude ? { lat: initialData.latitude, lng: initialData.longitude } : null);
  const [flyTarget,      setFlyTarget]      = useState(initialData?.latitude ? { lat: initialData.latitude, lng: initialData.longitude } : null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [gpsLoading,     setGpsLoading]     = useState(false);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [formLoading,    setFormLoading]    = useState(false);

  const field = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  // 1. GPS
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setPin(pos);
        setFlyTarget(pos);
        setGpsLoading(false);
      },
      () => {
        toast.error('Location access denied — please allow permission');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 2. Search
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const pos = await geocodeQuery(q);
      setPin(pos);
      setFlyTarget(pos);
    } catch {
      toast.error('Place not found — try a different search');
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // 3. Map click
  const handleMapPick = useCallback((latlng) => {
    setPin({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  // 4. Confirm -> reverse geocode -> fill form
  const handleConfirm = useCallback(async () => {
    if (!pin) { toast.error('Drop a pin on the map first'); return; }
    setConfirmLoading(true);
    try {
      const geo = await reverseGeocode(pin.lat, pin.lng);
      setFormData(p => ({
        ...p,
        latitude:    pin.lat,
        longitude:   pin.lng,
        house_name:  geo.house_name  || p.house_name,
        street:      geo.street      || p.street,
        city:        geo.city        || p.city,
        state:       geo.state       || p.state,
        postal_code: geo.postal_code || p.postal_code,
        country:     geo.country     || p.country,
      }));
      setDisplayAddress(geo.display);
      setShowMap(false);
      toast.success('Location confirmed!');
    } catch {
      setFormData(p => ({ ...p, latitude: pin.lat, longitude: pin.lng }));
      setShowMap(false);
    } finally {
      setConfirmLoading(false);
    }
  }, [pin]);

  // 5. Submit to Django
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please pick a delivery location on the map');
      return;
    }
    
    // Mobile number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.');
      return;
    }

    const payload = {
      name:          formData.name,
      phone:         formData.phone,
      address_line1: formData.house_name,
      address_line2: formData.street,
      city:          formData.city,
      state:         formData.state,
      pincode:       formData.postal_code,
      address_type:  formData.address_type,
      latitude:      formData.latitude,
      longitude:     formData.longitude,
    };
    setFormLoading(true);
    try {
      if (initialData && initialData.id) {
        const response = await API.put(`/api/auth/addresses/${initialData.id}/`, payload);
        toast.success('Address updated!');
        onAdd(response.data);
      } else {
        const response = await API.post('/api/auth/addresses/', payload);
        toast.success('Address saved!');
        onAdd(response.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save address');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmed = formData.latitude !== null;

  return (
    <>
      {/* MAP MODAL */}
      {showMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3">
          <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl"
               style={{ height: '88vh', maxHeight: 660 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <MapPin size={20} className="text-indigo-600" />
                Select Delivery Location
              </h3>
              <button type="button" onClick={() => setShowMap(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>

            {/* Search + GPS */}
            <div className="px-4 py-3 border-b bg-gray-50 flex gap-2 shrink-0">
              <button type="button" onClick={handleGPS} disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition disabled:opacity-60 whitespace-nowrap">
                {gpsLoading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
                <span className="hidden sm:inline">Use My Location</span>
                <span className="sm:hidden">GPS</span>
              </button>
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="Kochi, Calicut, Dubai Mall..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="button" onClick={handleSearch}
                disabled={searchLoading || !searchQuery.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5">
                {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Search
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative overflow-hidden">
              <MapContainer
                center={pin ? [pin.lat, pin.lng] : [10.8505, 76.2711]}
                zoom={pin ? 14 : 8}
                style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors" />
                <FlyToTarget target={flyTarget} />
                <ClickToPin  onPick={handleMapPick} />
                {pin && <Marker position={[pin.lat, pin.lng]} />}
              </MapContainer>
              {!pin && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-gray-600 text-xs px-4 py-2 rounded-full shadow pointer-events-none">
                  Search a place · tap GPS · or click the map
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                {pin
                  ? <p className="text-sm text-indigo-700 font-mono truncate">{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</p>
                  : <p className="text-sm text-gray-400">No pin dropped yet</p>}
              </div>
              <button type="button" onClick={() => setShowMap(false)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition">
                Cancel
              </button>
              <button type="button" onClick={handleConfirm} disabled={!pin || confirmLoading}
                className="px-5 py-2.5 bg-[#111] text-white text-sm font-semibold rounded-lg hover:bg-[#333] disabled:opacity-50 transition flex items-center gap-2">
                {confirmLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDRESS FORM */}
      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4">
        <h4 className="font-semibold text-gray-900">{initialData ? 'Edit Address' : 'Add New Address'}</h4>

        {/* Map picker trigger */}
        <button type="button" onClick={() => setShowMap(true)}
          className={`w-full py-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            confirmed
              ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
              : 'border-dashed border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
          }`}>
          {confirmed ? (
            <>
              <CheckCircle2 size={16} className="text-green-600" />
              {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
              <span className="ml-1 text-xs underline underline-offset-2 opacity-70">Change</span>
            </>
          ) : (
            <><MapPin size={16} /> Pick Location on Map</>
          )}
        </button>

        {displayAddress && (
          <p className="text-xs text-gray-500 px-1 leading-relaxed -mt-1">
            📍 {displayAddress}
          </p>
        )}

        {/* Name + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={formData.name} placeholder=""
              onChange={(e) => field('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" required value={formData.phone} placeholder=""
              onChange={(e) => field('phone', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
        </div>

        {/* House Name + Street */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">House / Building Name</label>
            <input type="text" required value={formData.house_name} placeholder=""
              onChange={(e) => field('house_name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street / Area</label>
            <input type="text" required value={formData.street} placeholder=""
              onChange={(e) => field('street', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
        </div>

        {/* City / State / Postal Code / Country */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'city',        label: 'City',        ph: '' },
            { key: 'state',       label: 'State',       ph: '' },
            { key: 'postal_code', label: 'Postal Code', ph: '' },
            { key: 'country',     label: 'Country',     ph: '' },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="text" required value={formData[key]} placeholder={ph}
                onChange={(e) => field(key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
          ))}
        </div>

        {/* Address type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
          <div className="flex gap-2">
            {['home', 'office', 'work'].map((type) => (
              <button key={type} type="button" onClick={() => field('address_type', type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${
                  formData.address_type === type
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button type="submit" disabled={formLoading || !confirmed}
            className="flex-1 py-3 bg-[#111] text-white rounded-lg text-sm font-semibold hover:bg-[#333] disabled:opacity-50 transition flex items-center justify-center gap-2">
            {formLoading
              ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
              : (initialData ? 'Update Address' : 'Save Address')}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddAddressForm;