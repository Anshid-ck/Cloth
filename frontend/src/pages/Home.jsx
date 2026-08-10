// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ArrowRight, ShoppingBag, Plus } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [categoryBanners, setCategoryBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [bottomStyles, setBottomStyles] = useState([]);
  const [mensHoodiesGrid, setMensHoodiesGrid] = useState([]);
  const [jacketsGrid, setJacketsGrid] = useState([]);
  const [promotionalBanners, setPromotionalBanners] = useState([]);
  const [tshirtGrid, setTshirtGrid] = useState([]);
  const [shoesGrid, setShoesGrid] = useState([]);
  const [shoesCard, setShoesCard] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannersRes, productsRes, categoryBannerRes, bottomRes, hoodiesGridRes, jacketsGridRes, promoBannersRes, tshirtGridRes, shoesGridRes, shoesCardRes] = await Promise.all([
        API.get('/api/products/banners/').catch(() => ({ data: [] })),
        API.get('/api/products/products/?is_featured=true').catch(() => ({ data: { results: [] } })),
        API.get('/api/products/category-cards/').catch(() => ({ data: [] })),
        API.get('/api/products/bottom-styles/').catch(() => ({ data: [] })),
        API.get('/api/products/mens-hoodie-grid/').catch(() => ({ data: [] })),
        API.get('/api/products/jackets-grid/').catch(() => ({ data: [] })),
        API.get('/api/products/promotional-banners/').catch(() => ({ data: [] })),
        API.get('/api/products/tshirt-grid/').catch(() => ({ data: [] })),
        API.get('/api/products/shoes-grid/').catch(() => ({ data: [] })),
        API.get('/api/products/shoes-card/').catch(() => ({ data: [] })),
      ]);

      const bannerData = bannersRes.data;
      if (Array.isArray(bannerData)) setBanners(bannerData);
      else if (bannerData?.results) setBanners(bannerData.results);
      else setBanners([]);

      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.results || []);

      const categoryData = categoryBannerRes.data;
      setCategoryBanners(Array.isArray(categoryData) ? categoryData : categoryData?.results || []);

      const bottomData = bottomRes.data;
      setBottomStyles(Array.isArray(bottomData) ? bottomData : bottomData?.results || []);

      setMensHoodiesGrid(Array.isArray(hoodiesGridRes.data) ? hoodiesGridRes.data : hoodiesGridRes.data?.results || []);
      setJacketsGrid(Array.isArray(jacketsGridRes.data) ? jacketsGridRes.data : jacketsGridRes.data?.results || []);
      setPromotionalBanners(Array.isArray(promoBannersRes.data) ? promoBannersRes.data : promoBannersRes.data?.results || []);
      setTshirtGrid(Array.isArray(tshirtGridRes.data) ? tshirtGridRes.data : tshirtGridRes.data?.results || []);
      setShoesGrid(Array.isArray(shoesGridRes.data) ? shoesGridRes.data : shoesGridRes.data?.results || []);
      setShoesCard(Array.isArray(shoesCardRes.data) ? shoesCardRes.data : shoesCardRes.data?.results || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  const heroSlides = banners;
  const categoryBlocks = categoryBanners;
  const productsToShow = products?.slice(0, 8) || [];

  // Build collection tabs from available data
  const collectionTabs = [
    { label: 'Hoodie', items: mensHoodiesGrid, categoryPath: '/shop?category=hoodies' },
    { label: 'Shoes', items: shoesGrid, categoryPath: '/shop?category=shoes' },
    { label: 'T-Shirts', items: tshirtGrid, categoryPath: '/shop?category=tshirts' },
    { label: 'Out Wear', items: jacketsGrid, categoryPath: '/shop?category=jackets' },
    { label: 'Bottom Wears', items: bottomStyles, categoryPath: '/shop?category=bottomwear' },
  ].filter(t => t.items.length > 0);

  const activeItems = collectionTabs[activeTab]?.items?.slice(0, 4) || mensHoodiesGrid.slice(0, 4);

  return (
    <div className="rfl-home">

      {/* ========== HERO SECTION ========== */}
      <section className="rfl-hero">
        <div className="rfl-hero-inner">
          {/* Left: Big editorial text */}
          <div className="rfl-hero-left">
            <h1 className="rfl-hero-title">
              {heroSlides[0]?.title?.split(' ').slice(0, 1).join(' ') || 'REFLECT'}
              <br />
              <span className="rfl-hero-title-em">{heroSlides[0]?.title?.split(' ').slice(1).join(' ') || 'FASHION'}</span>
            </h1>
            <p className="rfl-hero-desc">
              {heroSlides[0]?.description || 'Discover a fashion experience that not only enhances your unique personality but amplifies it. At Pogiee, our strength is to develop you — redefine, customize your individuality and empower you to stand out effortlessly in any setting.'}
            </p>
            <div className="rfl-hero-btns">
              <button className="rfl-btn-primary" onClick={() => navigate('/shop')}>
                <ShoppingBag size={16} /> Buy Product
              </button>
              <button className="rfl-btn-outline" onClick={() => navigate('/shop')}>
                Explore Product
              </button>
            </div>
          </div>

          {/* Right: Hero image */}
          <div className="rfl-hero-right">
            {heroSlides.length > 0 ? (
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 5000 }}
                pagination={{ clickable: true }}
                loop={heroSlides.length > 1}
                className="rfl-hero-swiper"
              >
                {heroSlides.map((slide) => (
                  <SwiperSlide key={slide.id || slide.title}>
                    <img src={slide.image} alt={slide.title} className="rfl-hero-img" />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="rfl-hero-placeholder">
                <span>Fashion Collection</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========== MARQUEE TICKER ========== */}
      <div className="rfl-marquee-wrap">
        <div className="rfl-marquee-track">
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="rfl-marquee-item">
              FASHION <span className="rfl-marquee-star">✦</span> POGIEE FASHION <span className="rfl-marquee-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ========== CATEGORY BANNER GRID ========== */}
      {categoryBlocks.length > 0 && (
        <section className="rfl-section rfl-cat-section">
          <div className="rfl-container">
            <div className="rfl-cat-grid">
              {/* Left two portrait cards */}
              <div className="rfl-cat-left">
                {categoryBlocks.slice(0, 2).map((item, i) => (
                  <div
                    key={item.id || i}
                    className="rfl-cat-card"
                    onClick={() => navigate(item.link || '/shop')}
                  >
                    <img src={item.image} alt={item.title} className="rfl-cat-img" />
                    <div className="rfl-cat-overlay">
                      <button className="rfl-cat-btn">Explore Now</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right stacked cards with text */}
              <div className="rfl-cat-right">
                {categoryBlocks.slice(2, 4).map((item, i) => (
                  <div
                    key={item.id || i}
                    className="rfl-cat-right-card"
                    onClick={() => navigate(item.link || '/shop')}
                  >
                    <div className="rfl-cat-right-text">
                      <p className="rfl-cat-sub">{i === 0 ? 'Men Collection' : 'Men Collection'}</p>
                      <h3 className="rfl-cat-title">{item.title}</h3>
                      <button className="rfl-cat-check">Check Now <ArrowRight size={14} /></button>
                    </div>
                    <img src={item.image} alt={item.title} className="rfl-cat-right-img" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========== OUR COLLECTION SECTION ========== */}
      <section className="rfl-section rfl-coll-section">
        <div className="rfl-container">
          <div className="rfl-coll-header">
            <div>
              <h2 className="rfl-coll-title">OUR COLLECTION</h2>
            </div>
            <p className="rfl-coll-desc">
              Step into the world of Pogiee, where each collection outshines the next.
              From minimalist essentials to bold statement pieces, our curated collections fuse elegance with comfort and flair.
            </p>
          </div>

          {/* Tabs */}
          {collectionTabs.length > 0 && (
            <div className="rfl-tabs">
              {collectionTabs.map((tab, i) => (
                <button
                  key={tab.label}
                  className={`rfl-tab ${activeTab === i ? 'rfl-tab-active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          <div className="rfl-prod-grid">
            {(activeItems.length > 0 ? activeItems : productsToShow.slice(0, 4)).map((item, i) => {
              const activeCategoryPath = collectionTabs[activeTab]?.categoryPath || '/shop';
              return (
                <div
                  key={item.id || i}
                  className="rfl-prod-card"
                  onClick={() => navigate(item.slug ? `/product/${item.slug}` : activeCategoryPath)}
                >
                  <div className="rfl-prod-img-wrap">
                    <img
                      src={item.image}
                      alt={item.title || item.name}
                      className="rfl-prod-img"
                    />
                    {/* Hover overlay buttons */}
                    <div className="rfl-prod-hover">
                      <button className="rfl-prod-buy" onClick={(e) => { e.stopPropagation(); navigate(activeCategoryPath); }}>
                        Buy Now
                      </button>
                    </div>
                  </div>
                  <div className="rfl-prod-info">
                    <span className="rfl-prod-name">{item.title || item.name || 'Fashion Item'}</span>
                    {item.price && <span className="rfl-prod-price">${item.price}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== CLOTH & FOOTWEAR BANNER ========== */}
      {promotionalBanners.length > 0 || shoesGrid.length > 0 ? (
        <section className="rfl-banner-section">
          <div className="rfl-banner-inner">
            {/* Left: image */}
            <div className="rfl-banner-img-wrap">
              {(promotionalBanners[0]?.image || shoesGrid[0]?.image) ? (
                <img
                  src={promotionalBanners[0]?.image || shoesGrid[0]?.image}
                  alt="Collection"
                  className="rfl-banner-img"
                />
              ) : (
                <div className="rfl-banner-img-placeholder" />
              )}
            </div>
            {/* Right: text */}
            <div className="rfl-banner-text">
              <h2 className="rfl-banner-title">CLOTH AND FOOTWEAR<br />COLLECTION</h2>
              <p className="rfl-banner-sub">
                {promotionalBanners[0]?.subtitle || 'Pogiee offers far more than just clothing and footwear — we provide a lifestyle. At Pogiee, every design is a blend of passion and craftsmanship.'}
              </p>
              <button className="rfl-btn-primary" onClick={() => navigate('/shop')}>
                Explore All <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* ========== DARK BOTTOM CLOTHING SECTION ========== */}
      <section className="rfl-dark-section">
        <div className="rfl-dark-inner">
          {/* Left: image pair */}
          <div className="rfl-dark-img-col">
            {(jacketsGrid.slice(0, 1).length > 0 || bottomStyles.slice(0, 1).length > 0) ? (
              <div className="rfl-dark-imgs">
                {(jacketsGrid[0] || bottomStyles[0]) && (
                  <img
                    src={(jacketsGrid[0] || bottomStyles[0]).image}
                    alt="Collection"
                    className="rfl-dark-img rfl-dark-img-back"
                  />
                )}
                {(jacketsGrid[1] || bottomStyles[1]) && (
                  <img
                    src={(jacketsGrid[1] || bottomStyles[1]).image}
                    alt="Collection"
                    className="rfl-dark-img rfl-dark-img-front"
                  />
                )}
              </div>
            ) : (
              <div className="rfl-dark-img-placeholder" />
            )}
          </div>

          {/* Right: text */}
          <div className="rfl-dark-text-col">
            <h2 className="rfl-dark-title">CLOTHING<br />COLLECTION</h2>
            <p className="rfl-dark-desc">
              Our clothing collection at Reflect is a statement of style, versatility, and craftsmanship. Reflect is meticulously designed to complement your unique persona, from everyday essentials to extraordinary statement pieces.
            </p>
            <button className="rfl-btn-white" onClick={() => navigate('/shop')}>
              Shop Collection <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Bottom grid of remaining items */}
        {(mensHoodiesGrid.length > 0 || tshirtGrid.length > 0 || shoesCard.length > 0) && (
          <div className="rfl-dark-grid-wrap">
            <div className="rfl-container">
              <div className="rfl-dark-grid">
                {[
                  ...mensHoodiesGrid.slice(0, 4).map(item => ({ ...item, _category: '/shop?category=hoodies' })),
                  ...tshirtGrid.slice(0, 4).map(item => ({ ...item, _category: '/shop?category=tshirts' })),
                  ...shoesCard.slice(0, 4).map(item => ({ ...item, _category: '/shop?category=shoes' })),
                ].slice(0, 4).map((item, i) => (
                  <div
                    key={item.id || i}
                    className="rfl-dark-card"
                    onClick={() => navigate(item.slug ? `/product/${item.slug}` : item._category)}
                  >
                    <img src={item.image} alt={item.title} className="rfl-dark-card-img" />
                    <div className="rfl-dark-card-info">
                      <span className="rfl-dark-card-name">{item.title}</span>
                      {item.price && <span className="rfl-dark-card-price">{item.price}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========== GST DISCOUNT BANNER ========== */}
      <section className="rfl-gst-bar">
        <div className="rfl-container rfl-gst-inner">
          <div className="rfl-gst-badge">₹100 OFF</div>
          <p className="rfl-gst-text">
            On orders above ₹1000 • <span>Auto applied at checkout</span>
          </p>
          <button onClick={() => navigate('/shop')} className="rfl-gst-btn">
            Shop Now →
          </button>
        </div>
      </section>
    </div>
  );
}