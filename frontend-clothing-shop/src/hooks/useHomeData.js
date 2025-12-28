import { useState, useEffect } from 'react';
import homeDataService from '../services/homeDataService';

/**
 * Hook chính để lấy tất cả dữ liệu cho Home page
 * - Lấy config từ CMS
 * - Lấy products theo featured categories  
 * - Lấy featured coupons
 * - Lấy new products, sale products
 */
export const useHomeData = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await homeDataService.getHomePageData();
      setHomeData(data);

    } catch (err) {
      setError(err.message);
      console.error('❌ useHomeData error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Helper getters để dễ sử dụng trong components
  const config = homeData?.config || {};
  const settings = homeData?.settings || {};
  const sections = homeData?.sections || {};
  const data = homeData?.data || {};

  return {
    // Raw data
    homeData,
    loading,
    error,

    // Config từ CMS
    config,
    settings,
    sections,

    // Data arrays
    heroBanners: data.heroBanners || [],
    featuredCategories: data.featuredCategories || [], // [{category, products}]
    featuredCoupons: data.featuredCoupons || [],
    newProducts: data.newProducts || [],
    saleProducts: data.saleProducts || [],

    // Hero config
    heroConfig: {
      title: config.hero_title || config.herro_title, // Handle typo
      subtitle: config.hero_subtitle,
      banners: data.heroBanners || []
    },

    // Slider config
    sliderConfig: {
      autoplay: config.slider_autoplay !== false,
      duration: config.slider_duration || 5000,
      showDots: config.show_slider_dots !== false,
      showArrows: config.show_slider_arrows !== false
    },

    // Actions
    refetch: fetchHomeData,

    // Helpers
    hasData: homeData !== null,
    hasHeroBanners: data.heroBanners?.length > 0,
    hasFeaturedCategories: data.featuredCategories?.length > 0,
    hasFeaturedCoupons: data.featuredCoupons?.length > 0,
    hasNewProducts: data.newProducts?.length > 0,
    hasSaleProducts: data.saleProducts?.length > 0
  };
};

export default useHomeData;