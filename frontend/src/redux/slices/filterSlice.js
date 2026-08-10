// src/redux/slices/filterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const filterSlice = createSlice({
  name: 'filters',
  initialState: {
    selectedSizes: [],
    selectedColors: [],
    priceRange: [0, 5000],
    selectedFabric: '',
    sortBy: '-created_at',
    searchQuery: '',
  },
  reducers: {
    addSize: (state, action) => {
      if (!state.selectedSizes.includes(action.payload)) {
        state.selectedSizes.push(action.payload);
      }
    },
    removeSize: (state, action) => {
      state.selectedSizes = state.selectedSizes.filter(
        (size) => size !== action.payload
      );
    },
    addColor: (state, action) => {
      if (!state.selectedColors.includes(action.payload)) {
        state.selectedColors.push(action.payload);
      }
    },
    removeColor: (state, action) => {
      state.selectedColors = state.selectedColors.filter(
        (color) => color !== action.payload
      );
    },
    setPriceRange: (state, action) => {
      state.priceRange = action.payload;
    },
    setFabric: (state, action) => {
      state.selectedFabric = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    resetFilters: (state) => {
      state.selectedSizes = [];
      state.selectedColors = [];
      state.priceRange = [0, 5000];
      state.selectedFabric = '';
      state.sortBy = '-created_at';
      state.searchQuery = '';
    },
  },
});

export const {
  addSize,
  removeSize,
  addColor,
  removeColor,
  setPriceRange,
  setFabric,
  setSortBy,
  setSearchQuery,
  resetFilters,
} = filterSlice.actions;

export default filterSlice.reducer;
