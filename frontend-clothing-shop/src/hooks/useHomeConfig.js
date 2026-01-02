import { useQuery } from '@tanstack/react-query'
import { homeService } from '../services/homeService'

/**
 * Hook để lấy cấu hình trang Home từ Strapi CMS
 * @returns {Object} { homeConfig, heroSection, productSections, isLoading, error }
 */
export const useHomeConfig = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        isError
    } = useQuery({
        queryKey: ['home-page-config'],
        queryFn: () => homeService.getHomePageConfig(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false
    })

    // Extract and format data (service đã trả về data trực tiếp)
    const homeConfig = data || null
    const heroSection = homeConfig ? homeService.formatHeroSection(homeConfig) : null
    const productSections = homeConfig ? homeService.formatProductSections(homeConfig) : homeService.formatProductSections(null)

    return {
        homeConfig,
        heroSection,
        productSections,
        isLoading,
        error: isError ? error : null,
        refetch,
        
        // Helper functions
        getFeaturedCoupons: () => homeConfig?.featured_coupons || [],
        getFeaturedCategories: () => homeConfig?.featured_categories || [],
        getFeaturedProducts: () => homeConfig?.featured_products || [],
        
        // Section visibility helpers
        shouldShowNewProducts: () => productSections?.newProducts?.enabled || false,
        shouldShowSaleProducts: () => productSections?.saleProducts?.enabled || false, 
        shouldShowFeaturedProducts: () => productSections?.featuredProducts?.enabled || false,
        
        // Limits
        getNewProductsLimit: () => productSections?.newProducts?.limit || 8,
        getSaleProductsLimit: () => productSections?.saleProducts?.limit || 6
    }
}

/**
 * Hook để lấy featured coupons từ home config
 * @returns {Object} { coupons, isLoading, error }
 */
export const useFeaturedCoupons = () => {
    const { homeConfig, isLoading, error } = useHomeConfig()
    
    return {
        coupons: homeConfig?.featured_coupons || [],
        isLoading,
        error
    }
}

/**
 * Hook để lấy featured categories từ home config  
 * @returns {Object} { categories, isLoading, error }
 */
export const useFeaturedCategories = () => {
    const { homeConfig, isLoading, error } = useHomeConfig()
    
    return {
        categories: homeConfig?.featured_categories || [],
        isLoading,
        error
    }
}