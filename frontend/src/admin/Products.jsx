// src/admin/Products.jsx
import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Search, Eye, Image as ImageIcon, Palette, X, Wand2, Star } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';
import ColorVariantManager from './ColorVariantManager';
import ProductDetailView from './ProductDetailView';
import { getDominantColor } from '../utils/colorExtractor';

// Color name mapping from hex
const getColorNameFromHex = (hex) => {
  const colors = {
    // Reds
    '#ff0000': 'Red', '#dc143c': 'Crimson', '#b22222': 'Firebrick', '#8b0000': 'Dark Red',
    '#ff6347': 'Tomato', '#ff4500': 'Orange Red', '#cd5c5c': 'Indian Red',
    // Pinks
    '#ffc0cb': 'Pink', '#ff69b4': 'Hot Pink', '#ff1493': 'Deep Pink', '#db7093': 'Pale Violet Red',
    '#c71585': 'Medium Violet Red',
    // Oranges
    '#ffa500': 'Orange', '#ff8c00': 'Dark Orange', '#ff7f50': 'Coral', '#e9967a': 'Dark Salmon',
    // Yellows
    '#ffff00': 'Yellow', '#ffd700': 'Gold', '#f0e68c': 'Khaki', '#bdb76b': 'Dark Khaki',
    // Greens
    '#00ff00': 'Lime', '#008000': 'Green', '#006400': 'Dark Green', '#228b22': 'Forest Green',
    '#32cd32': 'Lime Green', '#90ee90': 'Light Green', '#98fb98': 'Pale Green',
    '#00fa9a': 'Medium Spring Green', '#2e8b57': 'Sea Green', '#3cb371': 'Medium Sea Green',
    '#808000': 'Olive', '#556b2f': 'Dark Olive Green', '#6b8e23': 'Olive Drab',
    // Blues
    '#0000ff': 'Blue', '#000080': 'Navy', '#00008b': 'Dark Blue', '#191970': 'Midnight Blue',
    '#4169e1': 'Royal Blue', '#1e90ff': 'Dodger Blue', '#00bfff': 'Deep Sky Blue',
    '#87ceeb': 'Sky Blue', '#add8e6': 'Light Blue', '#b0c4de': 'Light Steel Blue',
    '#4682b4': 'Steel Blue', '#5f9ea0': 'Cadet Blue', '#6495ed': 'Cornflower Blue',
    // Purples
    '#800080': 'Purple', '#8b008b': 'Dark Magenta', '#9400d3': 'Dark Violet',
    '#9932cc': 'Dark Orchid', '#ba55d3': 'Medium Orchid', '#da70d6': 'Orchid',
    '#ee82ee': 'Violet', '#dda0dd': 'Plum', '#e6e6fa': 'Lavender',
    '#663399': 'Rebecca Purple', '#8a2be2': 'Blue Violet', '#9370db': 'Medium Purple',
    '#7b68ee': 'Medium Slate Blue', '#6a5acd': 'Slate Blue', '#483d8b': 'Dark Slate Blue',
    '#4b0082': 'Indigo',
    // Browns
    '#a52a2a': 'Brown', '#8b4513': 'Saddle Brown', '#a0522d': 'Sienna', '#d2691e': 'Chocolate',
    '#cd853f': 'Peru', '#deb887': 'Burlywood', '#f5deb3': 'Wheat', '#d2b48c': 'Tan',
    '#bc8f8f': 'Rosy Brown',
    // Grays
    '#808080': 'Gray', '#a9a9a9': 'Dark Gray', '#c0c0c0': 'Silver', '#d3d3d3': 'Light Gray',
    '#696969': 'Dim Gray', '#778899': 'Light Slate Gray', '#708090': 'Slate Gray',
    '#2f4f4f': 'Dark Slate Gray',
    // Black & White
    '#000000': 'Black', '#ffffff': 'White', '#fffafa': 'Snow', '#f5f5f5': 'White Smoke',
    '#f0f0f0': 'Ghost White', '#dcdcdc': 'Gainsboro', '#fffaf0': 'Floral White',
    // Teals & Cyans
    '#00ffff': 'Cyan', '#008b8b': 'Dark Cyan', '#008080': 'Teal', '#20b2aa': 'Light Sea Green',
    '#40e0d0': 'Turquoise', '#48d1cc': 'Medium Turquoise', '#00ced1': 'Dark Turquoise',
    '#7fffd4': 'Aquamarine',
    // Maroons & Wine
    '#800000': 'Maroon', '#722f37': 'Wine', '#6d2c36': 'Burgundy',
  };

  const hexLower = hex.toLowerCase();

  // Check for exact match
  if (colors[hexLower]) return colors[hexLower];

  // Find closest color
  const hexToRgb = (h) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const colorDistance = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2)
    );
  };

  const targetRgb = hexToRgb(hexLower);
  let closestName = 'Custom';
  let minDistance = Infinity;

  for (const [colorHex, name] of Object.entries(colors)) {
    const distance = colorDistance(targetRgb, hexToRgb(colorHex));
    if (distance < minDistance) {
      minDistance = distance;
      closestName = name;
    }
  }

  return closestName;
};

// Category-specific field configurations
const CATEGORY_FIELDS = {
  pants: {
    label: 'Bottom Wear',
    fields: {
      pant_type: { label: 'Pant Type', options: ['Casual Pants', 'Formal Pants', 'Chinos', 'Cargo Pants', 'Baggy/Relaxed Pants', 'Slim Fit Pants', 'Jogger Pants', 'Denim/Jeans', 'Track Pants'] },
      fit: { label: 'Fit', options: ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Baggy Fit', 'Tapered Fit', 'Skinny Fit'] },
      waist_size: { label: 'Waist Size', options: ['28', '30', '32', '34', '36', '38'] },
      length: { label: 'Length', options: ['Short', 'Regular', 'Long'] },
      fabric: { label: 'Fabric', options: ['100% Cotton', 'Cotton Twill', 'Cotton Stretch', 'Linen', 'Polyester Blend', 'Denim', 'Terry/Fleece'] },
      pleats: { label: 'Pleats', options: ['Yes', 'No'] },
      stretch: { label: 'Stretch', options: ['Yes', 'No'] }
    }
  },
  tshirts: {
    label: 'T-Shirts',
    fields: {
      tshirt_type: { label: 'T-Shirt Type', options: ['Round Neck', 'V-Neck', 'Polo T-Shirt', 'Henley', 'Oversized T-Shirt', 'Graphic/Printed'] },
      fit: { label: 'Fit', options: ['Regular Fit', 'Slim Fit', 'Oversized Fit', 'Relaxed Fit'] },
      material: { label: 'Material', options: ['100% Cotton', 'Cotton Jersey', 'Cotton + Elastane', 'Polyester', 'Modal Blend', 'Terry Cotton'] },
      sleeve: { label: 'Sleeve', options: ['Half Sleeve', 'Full Sleeve', 'Sleeveless'] },
      use_case: { label: 'Use Case', options: ['Casual Wear', 'Streetwear', 'Sports/Gym', 'Lounge/Home'] }
    }
  },
  shirts: {
    label: 'Shirts',
    fields: {
      shirt_type: { label: 'Shirt Type', options: ['Formal Shirt', 'Casual Shirt', 'Printed Shirt', 'Checked Shirt', 'Solid Shirt', 'Denim Shirt', 'Linen Shirt'] },
      fit: { label: 'Fit', options: ['Slim Fit', 'Regular Fit', 'Relaxed Fit'] },
      fabric: { label: 'Fabric', options: ['Cotton', 'Linen', 'Cotton Blend', 'Denim', 'Satin/Poplin'] },
      sleeve: { label: 'Sleeve', options: ['Full Sleeve', 'Half Sleeve'] },
      collar: { label: 'Collar', options: ['Regular', 'Cutaway', 'Mandarin', 'Button-Down'] },
      occasion: { label: 'Occasion', options: ['Office', 'Casual', 'Party', 'Summer'] }
    }
  },
  hoodies: {
    label: 'Hoodies',
    fields: {
      hoodie_type: { label: 'Hoodie Type', options: ['Pullover Hoodie', 'Zip-Up Hoodie', 'Oversized Hoodie', 'Sleeveless Hoodie', 'Graphic Hoodie'] },
      fit: { label: 'Fit', options: ['Regular Fit', 'Relaxed Fit', 'Oversized Fit', 'Slim Fit'] },
      material: { label: 'Material', options: ['Cotton Fleece', 'Cotton Blend', 'French Terry', 'Polyester Blend', 'Brushed Fleece'] },
      gsm: { label: 'GSM (Thickness)', options: ['240-280 GSM (Light)', '300-320 GSM (Medium)', '350+ GSM (Heavy)'] },
      hood_type: { label: 'Hood Type', options: ['With Drawstring', 'Without Drawstring'] },
      pockets: { label: 'Pockets', options: ['Kangaroo Pocket', 'Side Pockets', 'None'] },
      lining: { label: 'Lining', options: ['Fleece', 'Terry', 'None'] }
    }
  },
  shoes: {
    label: 'Shoes',
    fields: {
      shoe_category: { label: 'Shoe Category', options: ['Casual Shoes', 'Formal Shoes', 'Sports Shoes', 'Sneakers', 'Sandals & Floaters', 'Slippers/Flip-Flops', 'Boots'] },
      shoe_type: { label: 'Shoe Type', options: ['Oxford', 'Derby', 'Loafers', 'Monk Strap', 'Low-Top Sneakers', 'High-Top Sneakers', 'Slip-On', 'Canvas', 'Running Shoes', 'Training Shoes', 'Chelsea Boots', 'Ankle Boots'] },
      upper_material: { label: 'Upper Material', options: ['Leather', 'Synthetic Leather', 'Mesh', 'Canvas', 'Knit'] },
      sole_material: { label: 'Sole Material', options: ['Rubber', 'EVA', 'PU', 'TPR'] },
      closure: { label: 'Closure', options: ['Lace-Up', 'Slip-On', 'Velcro', 'Buckle'] },
      occasion: { label: 'Occasion', options: ['Office', 'Casual', 'Sports', 'Travel', 'Party', 'Outdoor'] }
    }
  }
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Color variant manager state
  const [colorManagerProduct, setColorManagerProduct] = useState(null);
  // Product detail view state
  const [viewProduct, setViewProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    brand: '',
    category: '',
    base_price: '',
    discount_price: '',
    material: '',
    care_instructions: '',
    total_stock: '',
    is_featured: false,
    is_new_arrival: false,
    is_active: true,
    background_color: '#f5ebe0',
    category_attributes: {},
  });

  // Get selected category type for dynamic fields
  const getSelectedCategoryType = () => {
    const selectedCategory = categories.find(c => c.id === parseInt(formData.category));
    return selectedCategory?.category_type || null;
  };

  const [imageFiles, setImageFiles] = useState([]);  // New images to upload
  const [imagePreviews, setImagePreviews] = useState([]);  // For preview display
  const [existingImages, setExistingImages] = useState([]);  // Images already on server

  // Category-specific size options
  const SIZES_BY_CATEGORY = {
    pants: ['28', '30', '32', '34', '36', '38'],
    bottomwear: ['28', '30', '32', '34', '36', '38'],
    shoes: ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'],
    default: ['S', 'M', 'L', 'XL', 'XXL']
  };

  // Get sizes based on selected category
  const getSizesForCategory = () => {
    const categoryType = getSelectedCategoryType();
    return SIZES_BY_CATEGORY[categoryType] || SIZES_BY_CATEGORY.default;
  };

  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [selectedSizes, setSelectedSizes] = useState({});

  // Bullet point inputs for description and care instructions
  const [descriptionPoints, setDescriptionPoints] = useState(['']);
  const [carePoints, setCarePoints] = useState(['']);

  // Auto color detection state
  const [isDetectingColor, setIsDetectingColor] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, filterCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/products/products/', {
        params: {
          page: currentPage,
          category: filterCategory,
        },
      });
      setProducts(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get('/api/products/categories/');
      // Ensure categories is always an array
      const data = response.data;
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && Array.isArray(data.results)) {
        setCategories(data.results);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const generateUniqueSlug = (name) => {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const suffix = Date.now().toString(36); // e.g. "lzxw8k" — short & unique
    return `${base}-${suffix}`;
  };

  const handleSlugGenerate = () => {
    setFormData({ ...formData, slug: generateUniqueSlug(formData.name) });
  };

  const handleImageSelect = async (index, file) => {
    // If replacing an existing image, delete it from server first
    if (existingImages[index] && existingImages[index].id) {
      try {
        await API.delete(`/api/products/product-images/${existingImages[index].id}/`);
        console.log(`✅ Old image deleted from Cloudinary`);

        // Remove from existingImages state
        const newExisting = [...existingImages];
        newExisting[index] = null;
        setExistingImages(newExisting);
      } catch (error) {
        console.error('Failed to delete old image:', error);
        // Continue with upload even if delete fails
      }
    }

    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];

    newFiles[index] = file;
    newPreviews[index] = URL.createObjectURL(file);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);

    // Auto-detect color from first image (only if no color set yet)
    if (index === 0 && !colorName && !editingProduct) {
      setIsDetectingColor(true);
      try {
        const detectedHex = await getDominantColor(file);
        setColorHex(detectedHex);
        setColorName(getColorNameFromHex(detectedHex));
        toast.success('Color detected from image!');
      } catch (error) {
        console.error('Color detection failed:', error);
      } finally {
        setIsDetectingColor(false);
      }
    }
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];

    // Revoke the URL to free memory
    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index]);
    }

    newFiles[index] = null;
    newPreviews[index] = null;

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/products/products/${editingProduct.slug}/`  // Use slug for editing
        : '/api/products/products/';
      const method = editingProduct ? 'put' : 'post';

      // For updates, remove slug from data (it's in the URL already)
      // Join description and care points into newline-separated strings
      const descFiltered = descriptionPoints.filter(p => p.trim());
      const description = descFiltered.length > 0 ? descFiltered.join('\n') : 'No description provided';
      const careFiltered = carePoints.filter(p => p.trim());
      const care_instructions = careFiltered.length > 0 ? careFiltered.join('\n') : '';

      // Auto-generate a unique slug for new products if not provided
      let slug = formData.slug;
      if (!editingProduct && !slug) {
        const base = formData.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        slug = `${base}-${Date.now().toString(36)}`;
      }

      const submitData = editingProduct
        ? { ...formData, description, care_instructions, slug: undefined }  // Remove slug from update payload
        : { ...formData, description, care_instructions, slug };

      const response = await API[method](url, submitData);
      const productId = response.data.id;

      // Check if sizes are selected
      const activeSizes = Object.entries(selectedSizes).filter(([_, val]) => val);
      const hasSizes = activeSizes.length > 0;

      // For new products, create color variant with sizes (auto-assign "Default" color if none provided)
      if (!editingProduct && (colorName || hasSizes) && productId) {
        try {
          // Use provided color name or default to "Default"
          const variantColorName = colorName || 'Default';
          const variantColorHex = colorHex || '#000000';

          // Generate SKU
          const colorSlug = variantColorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const sku = `${productId}-${colorSlug}`.toUpperCase();

          // Create color variant
          const variantRes = await API.post('/api/products/color-variants/', {
            product: productId,
            color_name: variantColorName,
            color_hex: variantColorHex,
            sku: sku,
            price_adjustment: 0,
            is_default: true,
          });
          const variantId = variantRes.data.id;

          // Upload images to variant
          const validImages = imageFiles.filter(file => file !== null && file !== undefined);
          for (let i = 0; i < validImages.length; i++) {
            const imageFormData = new FormData();
            imageFormData.append('variant', variantId);
            imageFormData.append('image', validImages[i]);
            imageFormData.append('is_primary', i === 0);
            imageFormData.append('order', i);
            await API.post('/api/products/variant-images/', imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }

          // Create size stocks
          for (const [size, data] of activeSizes) {
            await API.post('/api/products/size-stocks/', {
              variant: variantId,
              size,
              quantity: data.quantity || 0,
            });
          }

          toast.success(`Product created with ${variantColorName} variant!`);
        } catch (variantError) {
          console.error('Variant creation error:', variantError);
          toast.error('Product created but variant setup failed');
        }
      } else {

        // Handle legacy image uploads for editing or when no color specified
        const validImages = imageFiles.filter(file => file !== null && file !== undefined);

        if (validImages.length > 0 && productId) {
          let successCount = 0;
          let failCount = 0;
          let orderIndex = 0;

          for (let i = 0; i < imageFiles.length; i++) {
            if (!imageFiles[i]) continue;

            const imageFormData = new FormData();
            imageFormData.append('image', imageFiles[i]);
            imageFormData.append('product', productId);
            imageFormData.append('alt_text', formData.name);
            imageFormData.append('is_primary', orderIndex === 0);
            imageFormData.append('order', orderIndex);

            try {
              await API.post('/api/products/product-images/', imageFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              successCount++;
              orderIndex++;
            } catch (imgError) {
              console.error('Image upload error:', imgError);
              failCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`${successCount} image(s) uploaded!`);
          }
          if (failCount > 0) {
            toast.error(`${failCount} image(s) failed to upload`);
          }
        } else {
          toast.success(editingProduct ? 'Product updated' : 'Product created');
        }
      }

      setShowModal(false);
      setEditingProduct(null);
      setImageFiles([]);
      setImagePreviews([]);
      setColorName('');
      setColorHex('#000000');
      setSelectedSizes({});
      resetForm();
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to save product';
      toast.error(errorMsg);
      console.error(error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      category: product.category,
      base_price: product.base_price,
      discount_price: product.discount_price || '',
      material: product.material,
      care_instructions: product.care_instructions,
      total_stock: product.total_stock,
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_active: product.is_active,
      background_color: product.background_color || '#f5ebe0',
      category_attributes: product.category_attributes || {},
    });

    // Load existing images from the product
    // First check legacy images, then check color variant images (new system)
    let productImages = [];

    if (product.images && product.images.length > 0) {
      // Legacy images
      productImages = product.images.slice(0, 3);
    } else if (product.color_variants && product.color_variants.length > 0) {
      // New system: get images from the default/first color variant
      const defaultVariant = product.color_variants.find(v => v.is_default) || product.color_variants[0];
      if (defaultVariant && defaultVariant.variant_images && defaultVariant.variant_images.length > 0) {
        productImages = defaultVariant.variant_images.slice(0, 3);
      }
    }

    setExistingImages(productImages);

    // Clear new image uploads
    setImageFiles([]);
    setImagePreviews([]);

    // Parse description and care instructions into points
    const descPoints = product.description ? product.description.split('\n').filter(p => p.trim()) : [''];
    const carePs = product.care_instructions ? product.care_instructions.split('\n').filter(p => p.trim()) : [''];
    setDescriptionPoints(descPoints.length > 0 ? descPoints : ['']);
    setCarePoints(carePs.length > 0 ? carePs : ['']);

    setShowModal(true);
  };

  // Delete existing image from server
  const deleteExistingImage = async (imageId, index) => {
    if (!window.confirm('Delete this image from the product?')) return;

    try {
      await API.delete(`/api/products/product-images/${imageId}/`);
      const newImages = [...existingImages];
      newImages.splice(index, 1);
      setExistingImages(newImages);
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
      console.error(error);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      // Use slug instead of id since backend uses lookup_field = 'slug'
      await API.delete(`/api/products/products/${product.slug}/`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      brand: '',
      category: '',
      base_price: '',
      discount_price: '',
      material: '',
      care_instructions: '',
      total_stock: '',
      is_featured: false,
      is_new_arrival: false,
      is_active: true,
      background_color: '#f5ebe0',
      category_attributes: {},
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setDescriptionPoints(['']);
    setCarePoints(['']);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Products Management</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Brand</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                          {product.primary_image && product.primary_image !== 'https://via.placeholder.com/400x400?text=No+Image' ? (
                            <img src={product.primary_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-gray-500" />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => setViewProduct(product)}
                            className="font-semibold text-gray-800 hover:text-indigo-600 hover:underline cursor-pointer text-left"
                          >
                            {product.name}
                          </button>
                          <p className="text-xs text-gray-600">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.brand || '-'}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">₹{product.base_price}</p>
                        {product.discount_price && (
                          <p className="text-sm text-green-600">₹{product.discount_price}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${product.total_stock > 10
                          ? 'bg-green-100 text-green-700'
                          : product.total_stock > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {product.total_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="fill-current text-yellow-500" />
                        <span className="font-semibold text-gray-800">{product.rating}</span>
                        <span className="text-gray-600">({product.reviews_count})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {product.is_featured && (
                          <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded">
                            Featured
                          </span>
                        )}
                        {product.is_new_arrival && (
                          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setViewProduct(product)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => setColorManagerProduct(product)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded transition"
                          title="Manage Colors"
                        >
                          <Palette size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-white hover:bg-indigo-500 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="auto-slug"
                    />
                    <button
                      type="button"
                      onClick={handleSlugGenerate}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="total_stock"
                    value={formData.total_stock}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g., Cotton, Polyester"
                  />
                </div>
              </div>

              {/* Description Points */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description Points
                </label>
                <div className="space-y-2">
                  {descriptionPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm w-4">•</span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const newPoints = [...descriptionPoints];
                          newPoints[index] = e.target.value;
                          setDescriptionPoints(newPoints);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder={`Description point ${index + 1}`}
                      />
                      {descriptionPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDescriptionPoints(descriptionPoints.filter((_, i) => i !== index));
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDescriptionPoints([...descriptionPoints, ''])}
                  className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus size={16} /> Add Point
                </button>
              </div>

              {/* Care Instructions Points */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Care Instructions
                </label>
                <div className="space-y-2">
                  {carePoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm w-4">•</span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const newPoints = [...carePoints];
                          newPoints[index] = e.target.value;
                          setCarePoints(newPoints);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder={`Care instruction ${index + 1}`}
                      />
                      {carePoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCarePoints(carePoints.filter((_, i) => i !== index));
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCarePoints([...carePoints, ''])}
                  className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus size={16} /> Add Point
                </button>
              </div>

              {/* Background Color Palette */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Palette size={16} className="inline mr-1" />
                  Card Background Color
                </label>
                <div className="grid grid-cols-7 gap-2 p-3 bg-gray-50 rounded-lg">
                  {[
                    '#eef4ed', '#fefae0', '#d9d9d9', '#caf0f8',
                    '#edf2fb', '#e2eafc', '#edede9', '#d6ccc2',
                    '#f5ebe0', '#e3d5ca', '#d5bdaf', '#e5e5e5',
                    '#f2e9e4', '#f5f5f0', '#f8edeb', '#ece4db',
                    '#ffd7ba', '#e9ecef', '#f8f9fa', '#dee2e6',
                    '#ced4da', '#adb5bd', '#ffedd8', '#f3d5b5',
                    '#e7bc91', '#d4a276', '#1a1a1a', '#ffffff'
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, background_color: color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${formData.background_color === color
                        ? 'border-indigo-500 ring-2 ring-indigo-300 scale-110'
                        : 'border-gray-200 hover:border-gray-400'
                        }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: formData.background_color }}
                  />
                  <input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#f5ebe0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Category-Specific Fields */}
              {getSelectedCategoryType() && CATEGORY_FIELDS[getSelectedCategoryType()] && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-700 mb-4">
                    📋 {CATEGORY_FIELDS[getSelectedCategoryType()].label} Attributes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(CATEGORY_FIELDS[getSelectedCategoryType()].fields).map(([fieldKey, fieldConfig]) => (
                      <div key={fieldKey}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {fieldConfig.label}
                        </label>
                        <select
                          value={formData.category_attributes[fieldKey] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            category_attributes: {
                              ...formData.category_attributes,
                              [fieldKey]: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select {fieldConfig.label}</option>
                          {fieldConfig.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Variant & Size Stock Section - Only show for new products */}
              {!editingProduct && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-700 mb-3">📦 Size-Based Stock (Creates Variant with Sizes)</h4>

                  {/* Auto-detect info banner */}
                  <div className="bg-white/60 border border-purple-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <Wand2 size={16} className="text-purple-600" />
                    <span className="text-xs text-gray-600">
                      Color is auto-detected from the first uploaded image. You can also enter it manually.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={colorName}
                          onChange={(e) => setColorName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Navy Blue, Black"
                        />
                        {/* Re-detect button */}
                        {imageFiles[0] && (
                          <button
                            type="button"
                            disabled={isDetectingColor}
                            onClick={async () => {
                              if (!imageFiles[0]) return;
                              setIsDetectingColor(true);
                              try {
                                const detectedHex = await getDominantColor(imageFiles[0]);
                                setColorHex(detectedHex);
                                setColorName(getColorNameFromHex(detectedHex));
                                toast.success('Color re-detected!');
                              } catch (error) {
                                toast.error('Failed to detect color');
                              } finally {
                                setIsDetectingColor(false);
                              }
                            }}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition flex items-center gap-1"
                            title="Re-detect color from image"
                          >
                            <Wand2 size={16} className={isDetectingColor ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>
                      {isDetectingColor && (
                        <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                          Detecting color...
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color Preview</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colorHex}
                          onChange={(e) => {
                            setColorHex(e.target.value);
                            // Also update the color name when manually changing color picker
                            setColorName(getColorNameFromHex(e.target.value));
                          }}
                          className="w-12 h-10 rounded cursor-pointer border"
                        />
                        <input
                          type="text"
                          value={colorHex}
                          onChange={(e) => setColorHex(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Size Selection - Always visible */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Sizes & Stock (click to select/deselect)
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {getSizesForCategory().map((size) => (
                        <div key={size} className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSizes(prev => ({
                                ...prev,
                                [size]: prev[size] ? undefined : { quantity: 0 }
                              }));
                            }}
                            className={`w-full py-2 rounded-lg border-2 font-bold transition-all ${selectedSizes[size]
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                              }`}
                          >
                            {size}
                          </button>
                          {selectedSizes[size] && (
                            <input
                              type="number"
                              min="0"
                              placeholder="Stock"
                              value={selectedSizes[size]?.quantity || ''}
                              onChange={(e) => {
                                setSelectedSizes(prev => ({
                                  ...prev,
                                  [size]: { quantity: parseInt(e.target.value) || 0 }
                                }));
                              }}
                              className="w-full mt-2 px-2 py-1 border rounded-lg text-center text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Show total stock calculated from sizes */}
                    {Object.keys(selectedSizes).filter(s => selectedSizes[s]).length > 0 && (
                      <p className="mt-3 text-sm text-gray-600">
                        <strong>Total Stock:</strong> {Object.values(selectedSizes).filter(v => v).reduce((sum, s) => sum + (s.quantity || 0), 0)} units
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Product Images {editingProduct && '(Optional - only upload if changing)'}
                </label>

                <div className="grid grid-cols-3 gap-4">
                  {/* Primary Image */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-xs font-bold text-gray-700 mb-2">Primary Image</p>
                    {imagePreviews[0] ? (
                      <div className="relative">
                        <img src={imagePreviews[0]} alt="Primary" className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(0)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold hover:bg-red-600"><X size={14} /></button>
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">New</span>
                      </div>
                    ) : existingImages[0] ? (
                      <div className="relative">
                        <img src={existingImages[0].image} alt="Primary" className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => deleteExistingImage(existingImages[0].id, 0)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold hover:bg-red-600"><X size={14} /></button>
                        <label className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-blue-600">
                          Replace
                          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleImageSelect(0, e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="h-28 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600">
                          <span className="text-3xl">+</span>
                          <span className="text-xs">Upload</span>
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleImageSelect(0, e.target.files[0])} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Secondary Image */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-xs font-bold text-gray-700 mb-2">Secondary Image</p>
                    {imagePreviews[1] ? (
                      <div className="relative">
                        <img src={imagePreviews[1]} alt="Secondary" className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(1)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold hover:bg-red-600"><X size={14} /></button>
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">New</span>
                      </div>
                    ) : existingImages[1] ? (
                      <div className="relative">
                        <img src={existingImages[1].image} alt="Secondary" className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => deleteExistingImage(existingImages[1].id, 1)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold hover:bg-red-600"><X size={14} /></button>
                        <label className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-blue-600">
                          Replace
                          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleImageSelect(1, e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="h-28 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600">
                          <span className="text-3xl">+</span>
                          <span className="text-xs">Upload</span>
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleImageSelect(1, e.target.files[0])} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Third Image */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-xs font-bold text-gray-700 mb-2">Third Image</p>
                    {imagePreviews[2] ? (
                      <div className="relative">
                        <img src={imagePreviews[2]} alt="Third" className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(2)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold hover:bg-red-600"><X size={14} /></button>
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">New</span>
                      </div>
                    ) : existingImages[2] ? (
                      <div className="relative">
                        <img src={existingImages[2].image} alt="Third" className="w-full h-28 object-cover rounded-lg" />
                        <button type="button" onClick={() => deleteExistingImage(existingImages[2].id, 2)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold hover:bg-red-600"><X size={14} /></button>
                        <label className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-blue-600">
                          Replace
                          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleImageSelect(2, e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="h-28 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600">
                          <span className="text-3xl">+</span>
                          <span className="text-xs">Upload</span>
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleImageSelect(2, e.target.files[0])} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Supported: JPG, PNG, WEBP, GIF. Max 10MB each.
                </p>
              </div>


              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_new_arrival"
                    checked={formData.is_new_arrival}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">New Arrival</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Variant Manager Modal */}
      {colorManagerProduct && (
        <ColorVariantManager
          productId={colorManagerProduct.id}
          productName={colorManagerProduct.name}
          onClose={() => setColorManagerProduct(null)}
        />
      )}

      {/* Product Detail View Modal */}
      {viewProduct && (
        <ProductDetailView
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onManageColors={(p) => {
            setViewProduct(null);
            setColorManagerProduct(p);
          }}
        />
      )}
    </div>
  );
}