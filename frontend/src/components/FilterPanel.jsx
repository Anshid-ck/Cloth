// Cloth-Shop/frontend/src/components/FilterPanel.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, X } from 'lucide-react';
import {
  addSize,
  removeSize,
  addColor,
  removeColor,
  setPriceRange,
  setFabric,
  setSortBy,
  resetFilters,
} from '../redux/slices/filterSlice';

export default function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);
  const [expandedSections, setExpandedSections] = useState({
    size: true,
    color: true,
    price: true,
    fabric: true,
    sort: true,
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleSizeToggle = (size) => {
    if (filters.selectedSizes.includes(size)) {
      dispatch(removeSize(size));
    } else {
      dispatch(addSize(size));
    }
  };

  const handleColorToggle = (color) => {
    if (filters.selectedColors.includes(color)) {
      dispatch(removeColor(color));
    } else {
      dispatch(addColor(color));
    }
  };

  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#FBBF24' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Gray', hex: '#6B7280' },
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const fabricOptions = ['Cotton', 'Polyester', 'Fleece', 'Wool', 'Blend'];

  const sortOptions = [
    { value: '-created_at', label: 'Newest' },
    { value: 'base_price', label: 'Price: Low to High' },
    { value: '-base_price', label: 'Price: High to Low' },
    { value: '-rating', label: 'Best Rating' },
  ];

  const activeFiltersCount = filters.selectedSizes.length + 
    filters.selectedColors.length + 
    (filters.selectedFabric ? 1 : 0);

  return (
    <aside className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Filters</h2>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
            <button
              onClick={() => dispatch(resetFilters())}
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Sort By */}
      <div className="mb-6 pb-6 border-b">
        <button
          onClick={() => toggleSection('sort')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 hover:text-indigo-600 transition"
        >
          <span>Sort By</span>
          <ChevronDown
            size={20}
            className={`transition ${expandedSections.sort ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.sort && (
          <div className="mt-3 space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={filters.sortBy === option.value}
                  onChange={(e) => dispatch(setSortBy(e.target.value))}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span className="ml-3 text-sm text-gray-700 group-hover:text-indigo-600 transition">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Size Filter */}
      <div className="mb-6 pb-6 border-b">
        <button
          onClick={() => toggleSection('size')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 hover:text-indigo-600 transition"
        >
          <span>Size</span>
          <ChevronDown
            size={20}
            className={`transition ${expandedSections.size ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.size && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeToggle(size)}
                className={`py-2 px-3 rounded-lg border-2 font-medium text-sm transition ${
                  filters.selectedSizes.includes(size)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-700 hover:border-indigo-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Filter */}
      <div className="mb-6 pb-6 border-b">
        <button
          onClick={() => toggleSection('color')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 hover:text-indigo-600 transition"
        >
          <span>Color</span>
          <ChevronDown
            size={20}
            className={`transition ${expandedSections.color ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.color && (
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorToggle(color.name)}
                className={`w-8 h-8 rounded-full border-4 transition relative group ${
                  filters.selectedColors.includes(color.name)
                    ? 'ring-2 ring-offset-2 ring-indigo-600'
                    : 'border-gray-300 hover:border-indigo-600'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {filters.selectedColors.includes(color.name) && (
                  <X size={14} className="absolute inset-0 m-auto text-white font-bold" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 pb-6 border-b">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 hover:text-indigo-600 transition"
        >
          <span>Price Range</span>
          <ChevronDown
            size={20}
            className={`transition ${expandedSections.price ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.price && (
          <div className="mt-4 space-y-3">
            <input
              type="range"
              min="0"
              max="10000"
              value={filters.priceRange[1]}
              onChange={(e) =>
                dispatch(setPriceRange([0, parseInt(e.target.value)]))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">₹{filters.priceRange[0]}</span>
              <span className="font-semibold text-indigo-600">₹{filters.priceRange[1]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fabric Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('fabric')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 hover:text-indigo-600 transition"
        >
          <span>Fabric</span>
          <ChevronDown
            size={20}
            className={`transition ${expandedSections.fabric ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.fabric && (
          <select
            value={filters.selectedFabric}
            onChange={(e) => dispatch(setFabric(e.target.value))}
            className="w-full mt-3 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none transition text-sm"
          >
            <option value="">All Fabrics</option>
            {fabricOptions.map((fabric) => (
              <option key={fabric} value={fabric}>
                {fabric}
              </option>
            ))}
          </select>
        )}
      </div>
    </aside>
  );
}