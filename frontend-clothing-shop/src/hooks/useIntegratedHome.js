import { useState, useEffect } from 'react';
import { getIntegratedHomeConfig } from '../utils/cmsIntegration';

/**
 * Hook tích hợp để lấy home config từ CMS với fallback
 * Dùng hook này thay cho useHomeConfig cũ
 */
export const useIntegratedHome = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('loading'); // 'cms', 'default', 'loading'

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getIntegratedHomeConfig();
      
      setHomeData(result);
      setSource(result.source);
      
      if (!result.success) {
        setError(result.error);
      }

    } catch (err) {
      setError(err.message);
      setSource('error');
      console.error('❌ useIntegratedHome error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Helper methods để dễ access data
  const getHeroConfig = () => homeData?.homeConfig;
  const getSettings = () => homeData?.settings;
  const getFeaturedCategories = () => homeData?.homeConfig?.featuredCategories || [];
  const getFeaturedCoupons = () => homeData?.homeConfig?.featuredCoupons || [];
  const getSliderConfig = () => homeData?.homeConfig?.sliderConfig;
  const getSections = () => homeData?.homeConfig?.sections;

  return {
    // Main data
    homeData,
    loading,
    error,
    source,

    // Helper getters
    heroConfig: getHeroConfig(),
    settings: getSettings(),
    featuredCategories: getFeaturedCategories(),
    featuredCoupons: getFeaturedCoupons(),
    sliderConfig: getSliderConfig(),
    sections: getSections(),

    // Actions
    refetch: fetchHomeData,

    // Status helpers
    isCMSConnected: source === 'cms',
    isUsingFallback: source === 'default',
    isError: source === 'error'
  };
};

export default useIntegratedHome;