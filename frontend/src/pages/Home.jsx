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

/*
 * ============================================================
 * HOME PAGE CACHE
 * ============================================================
 *
 * Home data is cached in memory for 5 minutes.
 *
 * First visit:
 *     API requests → save data to cache
 *
 * Product → Home:
 *     use cached data → no API requests
 *
 * After 5 minutes:
 *     cache expires → fetch fresh data
 *
 * Note:
 * Refreshing the browser clears this in-memory cache.
 */

const homeCache = {
  data: null,
  timestamp: 0,
};

const HOME_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const FALLBACK_HERO_IMAGE = "https://res.cloudinary.com/dayy6ryhw/image/upload/f_auto,q_auto,w_1200/v1782112062/banners/sebkuujw6vmrpsslftup.png";

const optimizeCloudinaryImage = (url, width = 800) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;

  // Normalize Cloudinary transformations so they are added only once.
  // Example:
  // /image/upload/f_auto,q_auto,w_1200/v123/... -> /image/upload/f_auto,q_auto,w_1200/v123/...
  const versionMatch = url.match(/\/image\/upload\/(?:.*?\/)?(v\d+\/)/);

  if (versionMatch) {
    return url.replace(
      /\/image\/upload\/(?:.*?\/)?(v\d+\/)/,
      `/image/upload/f_auto,q_auto,w_${width}/$1`
    );
  }

  // Fallback for Cloudinary URLs without an explicit version.
  return url.replace(
    '/image/upload/',
    `/image/upload/f_auto,q_auto,w_${width}/`
  );
};

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

  // Progressive section loading:
  // Only fetch below-the-fold section data when the user gets close to it.
  const [sectionReady, setSectionReady] = useState({
    categories: false,
    collection: false,
    banner: false,
    dark: false,
  });

  const sectionObserverRef = useRef(null);
  const sectionLoadingRef = useRef(null);

  /*
   * ============================================================
   * LOAD HOME DATA
   * ============================================================
   */
  useEffect(() => {
    const now = Date.now();

    if (homeCache.data && now - homeCache.timestamp < HOME_CACHE_TIME) {
      const data = homeCache.data;

      setBanners(data.banners || []);
      setCategoryBanners(data.categoryBanners || []);
      setProducts(data.products || []);
      setBottomStyles(data.bottomStyles || []);
      setMensHoodiesGrid(data.mensHoodiesGrid || []);
      setJacketsGrid(data.jacketsGrid || []);
      setPromotionalBanners(data.promotionalBanners || []);
      setTshirtGrid(data.tshirtGrid || []);
      setShoesGrid(data.shoesGrid || []);
      setShoesCard(data.shoesCard || []);

      setSectionReady({
        categories: Boolean(data.categoryBanners),
        collection: Boolean(data.products || data.mensHoodiesGrid || data.tshirtGrid || data.shoesGrid),
        banner: Boolean(data.promotionalBanners),
        dark: Boolean(data.jacketsGrid || data.bottomStyles || data.mensHoodiesGrid || data.tshirtGrid || data.shoesCard),
      });

      setLoading(false);
      console.log("Home: using cached data");
      return;
    }

    // Show the hero immediately. Render/API does not block first paint.
    setBanners([{
      id: "fallback-hero",
      title: "REFLECT FASHION",
      description:
        "Discover a fashion experience that enhances your unique personality and empowers you to stand out effortlessly.",
      image: FALLBACK_HERO_IMAGE,
      link: "/shop",
    }]);

    setLoading(false);
    console.log("Home: showing fallback hero immediately");

    // Fetch real banner data in the background.
    fetchHeroData();
  }, []);

  /*
   * Preload the hero immediately, using the fallback until the API returns.
   */
  useEffect(() => {
    const heroUrl = heroSlides?.[0]?.image || FALLBACK_HERO_IMAGE;
    if (!heroUrl) return;

    const optimizedHeroUrl = heroUrl.includes("res.cloudinary.com")
      ? optimizeCloudinaryImage(heroUrl, 1200)
      : heroUrl;

    const existing = document.head.querySelector(
      'link[data-home-hero-preload="true"]'
    );

    if (existing?.href === optimizedHeroUrl) return;

    existing?.remove();

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = optimizedHeroUrl;
    link.setAttribute("fetchpriority", "high");
    link.setAttribute("data-home-hero-preload", "true");
    document.head.appendChild(link);

    return () => link.remove();
  }, [banners]);

  /*
   * ============================================================
   * FETCH HOME DATA
   * ============================================================
   */
  const normalizeResults = (response) =>
    Array.isArray(response?.data)
      ? response.data
      : response?.data?.results || [];

  /*
   * Fetch only the hero/banner data immediately.
   * Other Home sections are loaded by the IntersectionObserver below.
   */
  const fetchHeroData = async () => {
    try {
      console.log('Home: fetching hero data');

      const response = await API.get('/api/products/banners/');
      const bannerData = normalizeResults(response);

      setBanners(bannerData);

      // Keep the hero available in cache immediately.
      homeCache.data = {
        ...(homeCache.data || {}),
        banners: bannerData,
      };
      homeCache.timestamp = Date.now();

      console.log('Home: hero data loaded');
    } catch (error) {
      console.error('Home hero loading error:', error);
      setBanners([]);
      toast.error('Failed to load home banner');
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load one Home section at a time when it approaches the viewport.
   * This prevents all below-the-fold APIs from competing with the hero.
   */
  const loadSection = async (section) => {
    // Avoid duplicate requests. Keep the section marked as not-ready
    // until its request finishes so the next sentinel is not released early.
    if (sectionReady[section]) return;
    if (sectionLoadingRef.current === section) return;

    sectionLoadingRef.current = section;

    try {
      if (section === 'categories') {
        console.log('Home: loading categories section');

        const response = await API.get('/api/products/category-cards/');
        const data = normalizeResults(response);

        setCategoryBanners(data);

        homeCache.data = {
          ...(homeCache.data || {}),
          categoryBanners: data,
        };

        setSectionReady((prev) => ({ ...prev, categories: true }));
        return;
      }

      if (section === 'collection') {
        console.log('Home: loading collection section');

        const [
          productsRes,
          hoodiesRes,
          tshirtRes,
          shoesGridRes,
        ] = await Promise.all([
          API.get('/api/products/products/?is_featured=true').catch(() => ({ data: [] })),
          API.get('/api/products/mens-hoodie-grid/').catch(() => ({ data: [] })),
          API.get('/api/products/tshirt-grid/').catch(() => ({ data: [] })),
          API.get('/api/products/shoes-grid/').catch(() => ({ data: [] })),
        ]);

        const productsData = normalizeResults(productsRes);
        const hoodiesData = normalizeResults(hoodiesRes);
        const tshirtData = normalizeResults(tshirtRes);
        const shoesGridData = normalizeResults(shoesGridRes);

        setProducts(productsData);
        setMensHoodiesGrid(hoodiesData);
        setTshirtGrid(tshirtData);
        setShoesGrid(shoesGridData);

        homeCache.data = {
          ...(homeCache.data || {}),
          products: productsData,
          mensHoodiesGrid: hoodiesData,
          tshirtGrid: tshirtData,
          shoesGrid: shoesGridData,
        };

        setSectionReady((prev) => ({ ...prev, collection: true }));
        return;
      }

      if (section === 'banner') {
        console.log('Home: loading promotional banner section');

        const promoRes = await API.get('/api/products/promotional-banners/')
          .catch(() => ({ data: [] }));

        const promoData = normalizeResults(promoRes);

        setPromotionalBanners(promoData);

        homeCache.data = {
          ...(homeCache.data || {}),
          promotionalBanners: promoData,
        };

        setSectionReady((prev) => ({ ...prev, banner: true }));
        return;
      }

      if (section === 'dark') {
        console.log('Home: loading dark collection section');

        const [jacketsRes, bottomRes, hoodiesRes, tshirtRes, shoesCardRes] =
          await Promise.all([
            API.get('/api/products/jackets-grid/').catch(() => ({ data: [] })),
            API.get('/api/products/bottom-styles/').catch(() => ({ data: [] })),
            API.get('/api/products/mens-hoodie-grid/').catch(() => ({ data: [] })),
            API.get('/api/products/tshirt-grid/').catch(() => ({ data: [] })),
            API.get('/api/products/shoes-card/').catch(() => ({ data: [] })),
          ]);

        const jacketsData = normalizeResults(jacketsRes);
        const bottomData = normalizeResults(bottomRes);
        const hoodiesData = normalizeResults(hoodiesRes);
        const tshirtData = normalizeResults(tshirtRes);
        const shoesCardData = normalizeResults(shoesCardRes);

        setJacketsGrid((prev) => (prev.length ? prev : jacketsData));
        setBottomStyles((prev) => (prev.length ? prev : bottomData));
        setMensHoodiesGrid((prev) => (prev.length ? prev : hoodiesData));
        setTshirtGrid((prev) => (prev.length ? prev : tshirtData));
        setShoesCard(shoesCardData);

        homeCache.data = {
          ...(homeCache.data || {}),
          jacketsGrid: jacketsData,
          bottomStyles: bottomData,
          mensHoodiesGrid: hoodiesData,
          tshirtGrid: tshirtData,
          shoesCard: shoesCardData,
        };

        setSectionReady((prev) => ({ ...prev, dark: true }));
      }
    } catch (error) {
      console.error(`Home ${section} section loading error:`, error);

      // Allow a failed section to retry if the user revisits it.
      setSectionReady((prev) => ({
        ...prev,
        [section]: false,
      }));
    } finally {
      if (sectionLoadingRef.current === section) {
        sectionLoadingRef.current = null;
      }
    }
  };


  /*
   * Observe section sentinels. rootMargin means we start fetching
   * roughly 250px before the section reaches the viewport.
   */
  useEffect(() => {
    const elements = document.querySelectorAll('[data-home-section]');

    if (!elements.length) return;

    sectionObserverRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const section = entry.target.dataset.homeSection;

          if (section) {
            loadSection(section);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '250px 0px',
        threshold: 0.01,
      }
    );

    elements.forEach((element) => observer.observe(element));

    sectionObserverRef.current = observer;

    return () => observer.disconnect();
  }, [banners, loading, sectionReady.categories, sectionReady.collection, sectionReady.banner, sectionReady.dark]);

  /*
   * ============================================================
   * HOME DATA
   * ============================================================
   */

  const heroSlides = banners;
  const categoryBlocks = categoryBanners;
  const productsToShow = products?.slice(0, 8) || [];

  /*
   * Build collection tabs from available data
   */
  const collectionTabs = [
    {
      label: 'Hoodie',
      items: mensHoodiesGrid,
      categoryPath: '/shop?category=hoodies',
    },
    {
      label: 'Shoes',
      items: shoesGrid,
      categoryPath: '/shop?category=shoes',
    },
    {
      label: 'T-Shirts',
      items: tshirtGrid,
      categoryPath: '/shop?category=tshirts',
    },
    {
      label: 'Out Wear',
      items: jacketsGrid,
      categoryPath: '/shop?category=jackets',
    },
    {
      label: 'Bottom Wears',
      items: bottomStyles,
      categoryPath: '/shop?category=bottomwear',
    },
  ].filter((t) => t.items.length > 0);

  const activeItems =
    collectionTabs[activeTab]?.items?.slice(0, 4) ||
    mensHoodiesGrid.slice(0, 4);

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="rfl-home">

      {/* ========== HERO SECTION ========== */}
      <section className="rfl-hero">
        <div className="rfl-hero-inner">

          {/* Left: Big editorial text */}
          <div className="rfl-hero-left">

            <h1 className="rfl-hero-title">
              {heroSlides[0]?.title
                ?.split(' ')
                .slice(0, 1)
                .join(' ') || 'REFLECT'}
              <br />

              <span className="rfl-hero-title-em">
                {heroSlides[0]?.title
                  ?.split(' ')
                  .slice(1)
                  .join(' ') || 'FASHION'}
              </span>
            </h1>

            <p className="rfl-hero-desc">
              {heroSlides[0]?.description ||
                'Discover a fashion experience that not only enhances your unique personality but amplifies it. At Pogiee, our strength is to develop you — redefine, customize your individuality and empower you to stand out effortlessly in any setting.'}
            </p>

            <div className="rfl-hero-btns">

              <button
                className="rfl-btn-primary"
                onClick={() => navigate('/shop')}
              >
                <ShoppingBag size={16} />
                Buy Product
              </button>

              <button
                className="rfl-btn-outline"
                onClick={() => navigate('/shop')}
              >
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

                {heroSlides.map((slide, slideIndex) => (
                  <SwiperSlide
                    key={`${slide.id || slide.title || 'hero'}-${slideIndex}`}
                  >
                    <img
                      src={optimizeCloudinaryImage(slide.image, 1200)}
                      loading={slideIndex === 0 ? 'eager' : 'lazy'}
                      fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
                      decoding="async"
                      width="1200"
                      height="900"
                      alt={slide.title}
                      className="rfl-hero-img"
                    />
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

          {Array(8)
            .fill(null)
            .map((_, i) => (
              <span
                key={i}
                className="rfl-marquee-item"
              >
                FASHION{' '}
                <span className="rfl-marquee-star">
                  ✦
                </span>{' '}
                POGIEE FASHION{' '}
                <span className="rfl-marquee-star">
                  ✦
                </span>
              </span>
            ))}

        </div>
      </div>

      {/* ========== CATEGORY BANNER GRID ========== */}
      <div data-home-section="categories" className="rfl-home-section-sentinel" aria-hidden="true" />
      {categoryBlocks.length > 0 && sectionReady.categories && (
        <section className="rfl-section rfl-cat-section">

          <div className="rfl-container">

            <div className="rfl-cat-grid">

              {/* Left two portrait cards */}
              <div className="rfl-cat-left">

                {categoryBlocks
                  .slice(0, 2)
                  .map((item, i) => (
                    <div
                      key={`cat-left-${item.id || 'item'}-${i}`}
                      className="rfl-cat-card"
                      onClick={() =>
                        navigate(item.link || '/shop')
                      }
                    >

                      <img
                        src={optimizeCloudinaryImage(item.image, 700)}
                        alt={item.title || 'Category'}
                        className="rfl-cat-img"
                        loading="lazy"
                        decoding="async"
                      />

                      <div className="rfl-cat-overlay">
                        <button className="rfl-cat-btn">
                          Explore Now
                        </button>
                      </div>

                    </div>
                  ))}

              </div>

              {/* Right stacked cards with text */}
              <div className="rfl-cat-right">

                {categoryBlocks
                  .slice(2, 4)
                  .map((item, i) => (
                    <div
                      key={`cat-right-${item.id || 'item'}-${i}`}
                      className="rfl-cat-right-card"
                      onClick={() =>
                        navigate(item.link || '/shop')
                      }
                    >

                      <div className="rfl-cat-right-text">

                        <p className="rfl-cat-sub">
                          {i === 0
                            ? 'Men Collection'
                            : 'Men Collection'}
                        </p>

                        <h3 className="rfl-cat-title">
                          {item.title}
                        </h3>

                        <button className="rfl-cat-check">
                          Check Now{' '}
                          <ArrowRight size={14} />
                        </button>

                      </div>

                      <img
                        src={optimizeCloudinaryImage(item.image, 700)}
                        alt={item.title || 'Category'}
                        className="rfl-cat-right-img"
                        loading="lazy"
                        decoding="async"
                      />

                    </div>
                  ))}

              </div>

            </div>
          </div>
        </section>
      )}

      {/* ========== OUR COLLECTION SECTION ========== */}
      {sectionReady.categories && (
        <div
          data-home-section="collection"
          className="rfl-home-section-sentinel"
          aria-hidden="true"
        />
      )}
      {sectionReady.collection && (
        <section className="rfl-section rfl-coll-section">

          <div className="rfl-container">

            <div className="rfl-coll-header">

              <div>
                <h2 className="rfl-coll-title">
                  OUR COLLECTION
                </h2>
              </div>

              <p className="rfl-coll-desc">
                Step into the world of Pogiee, where each
                collection outshines the next. From minimalist
                essentials to bold statement pieces, our curated
                collections fuse elegance with comfort and flair.
              </p>

            </div>

            {/* Tabs */}
            {collectionTabs.length > 0 && (
              <div className="rfl-tabs">

                {collectionTabs.map((tab, i) => (
                  <button
                    key={tab.label}
                    className={`rfl-tab ${activeTab === i
                      ? 'rfl-tab-active'
                      : ''
                      }`}
                    onClick={() => setActiveTab(i)}
                  >
                    {tab.label}
                  </button>
                ))}

              </div>
            )}

            {/* Product grid */}
            <div className="rfl-prod-grid">

              {(activeItems.length > 0
                ? activeItems
                : productsToShow.slice(0, 4)
              ).map((item, i) => {

                const activeCategoryPath =
                  collectionTabs[activeTab]?.categoryPath ||
                  '/shop';

                return (
                  <div
                    key={`product-${item.id || 'item'}-${i}`}
                    className="rfl-prod-card"
                    onClick={() =>
                      navigate(
                        item.slug
                          ? `/product/${item.slug}`
                          : activeCategoryPath
                      )
                    }
                  >

                    <div className="rfl-prod-img-wrap">

                      <img
                        src={optimizeCloudinaryImage(item.image, 600)}
                        alt={item.title || item.name || 'Fashion product'}
                        className="rfl-prod-img"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Hover overlay buttons */}
                      <div className="rfl-prod-hover">

                        <button
                          className="rfl-prod-buy"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(activeCategoryPath);
                          }}
                        >
                          Buy Now
                        </button>

                      </div>

                    </div>

                    <div className="rfl-prod-info">

                      <span className="rfl-prod-name">
                        {item.title ||
                          item.name ||
                          'Fashion Item'}
                      </span>

                      {item.price && (
                        <span className="rfl-prod-price">
                          ${item.price}
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        </section>
      )}

      {/* ========== CLOTH & FOOTWEAR BANNER ========== */}
      {sectionReady.collection && (
        <div
          data-home-section="banner"
          className="rfl-home-section-sentinel"
          aria-hidden="true"
        />
      )}
      {sectionReady.banner && (
        shoesGrid.length > 0 ? (
          <section className="rfl-banner-section">

            <div className="rfl-banner-inner">

              {/* Left: image */}
              <div className="rfl-banner-img-wrap">

                {(
                  promotionalBanners[0]?.image ||
                  shoesGrid[0]?.image
                ) ? (
                  <img
                    src={optimizeCloudinaryImage(
                      promotionalBanners[0]?.image || shoesGrid[0]?.image,
                      1000
                    )}
                    alt="Collection"
                    className="rfl-banner-img"
                  />
                ) : (
                  <div className="rfl-banner-img-placeholder" />
                )}

              </div>

              {/* Right: text */}
              <div className="rfl-banner-text">

                <h2 className="rfl-banner-title">
                  CLOTH AND FOOTWEAR
                  <br />
                  COLLECTION
                </h2>

                <p className="rfl-banner-sub">
                  {promotionalBanners[0]?.subtitle ||
                    'Pogiee offers far more than just clothing and footwear — we provide a lifestyle. At Pogiee, every design is a blend of passion and craftsmanship.'}
                </p>

                <button
                  className="rfl-btn-primary"
                  onClick={() => navigate('/shop')}
                >
                  Explore All
                  <ArrowRight size={16} />
                </button>

              </div>

            </div>

          </section>
        ) : null
      )}

      {/* ========== DARK BOTTOM CLOTHING SECTION ========== */}
      {sectionReady.banner && (
        <div
          data-home-section="dark"
          className="rfl-home-section-sentinel"
          aria-hidden="true"
        />
      )}
      {sectionReady.dark && (
        <section className="rfl-dark-section">

          <div className="rfl-dark-inner">

            {/* Left: image pair */}
            <div className="rfl-dark-img-col">

              {(
                jacketsGrid.slice(0, 1).length > 0 ||
                bottomStyles.slice(0, 1).length > 0
              ) ? (

                <div className="rfl-dark-imgs">

                  {(jacketsGrid[0] ||
                    bottomStyles[0]) && (
                      <img
                        src={optimizeCloudinaryImage(
                          (jacketsGrid[0] || bottomStyles[0]).image,
                          800
                        )}
                        alt="Clothing collection"
                        className="rfl-dark-img rfl-dark-img-back"
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                  {(jacketsGrid[1] ||
                    bottomStyles[1]) && (
                      <img
                        src={optimizeCloudinaryImage(
                          (jacketsGrid[1] || bottomStyles[1]).image,
                          800
                        )}
                        alt="Clothing collection"
                        className="rfl-dark-img rfl-dark-img-front"
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                </div>

              ) : (
                <div className="rfl-dark-img-placeholder" />
              )}

            </div>

            {/* Right: text */}
            <div className="rfl-dark-text-col">

              <h2 className="rfl-dark-title">
                CLOTHING
                <br />
                COLLECTION
              </h2>

              <p className="rfl-dark-desc">
                Our clothing collection at Reflect is a
                statement of style, versatility, and
                craftsmanship. Reflect is meticulously designed
                to complement your unique persona, from
                everyday essentials to extraordinary statement
                pieces.
              </p>

              <button
                className="rfl-btn-white"
                onClick={() => navigate('/shop')}
              >
                Shop Collection
                <ArrowRight size={16} />
              </button>

            </div>

          </div>

          {/* Bottom grid of remaining items */}
          {(
            mensHoodiesGrid.length > 0 ||
            tshirtGrid.length > 0 ||
            shoesCard.length > 0
          ) && (

              <div className="rfl-dark-grid-wrap">

                <div className="rfl-container">

                  <div className="rfl-dark-grid">

                    {[
                      ...mensHoodiesGrid
                        .slice(0, 4)
                        .map((item) => ({
                          ...item,
                          _category:
                            '/shop?category=hoodies',
                        })),

                      ...tshirtGrid
                        .slice(0, 4)
                        .map((item) => ({
                          ...item,
                          _category:
                            '/shop?category=tshirts',
                        })),

                      ...shoesCard
                        .slice(0, 4)
                        .map((item) => ({
                          ...item,
                          _category:
                            '/shop?category=shoes',
                        })),
                    ]
                      .slice(0, 4)
                      .map((item, i) => (

                        <div
                          key={`${item._category}-${item.id || i}`}
                          className="rfl-dark-card"
                          onClick={() =>
                            navigate(
                              item.slug
                                ? `/product/${item.slug}`
                                : item._category
                            )
                          }
                        >

                          <img
                            src={optimizeCloudinaryImage(item.image, 600)}
                            alt={item.title || 'Fashion product'}
                            className="rfl-dark-card-img"
                            loading="lazy"
                            decoding="async"
                          />

                          <div className="rfl-dark-card-info">

                            <span className="rfl-dark-card-name">
                              {item.title}
                            </span>

                            {item.price && (
                              <span className="rfl-dark-card-price">
                                {item.price}
                              </span>
                            )}

                          </div>

                        </div>

                      ))}

                  </div>

                </div>

              </div>
            )}

        </section>
      )}

      {/* ========== GST DISCOUNT BANNER ========== */}
      <section className="rfl-gst-bar">

        <div className="rfl-container rfl-gst-inner">

          <div className="rfl-gst-badge">
            ₹100 OFF
          </div>

          <p className="rfl-gst-text">
            On orders above ₹1000 •{' '}
            <span>Auto applied at checkout</span>
          </p>

          <button
            onClick={() => navigate('/shop')}
            className="rfl-gst-btn"
          >
            Shop Now →
          </button>

        </div>

      </section>

    </div>
  );
}