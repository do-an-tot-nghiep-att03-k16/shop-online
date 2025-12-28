import { useQuery } from '@tanstack/react-query'
import { settingService } from '../services/settingService'

/**
 * Hook để lấy thông tin cấu hình website từ Strapi
 * @returns {Object} { setting, isLoading, error, refetch }
 */
export const useSetting = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        isError
    } = useQuery({
        queryKey: ['website-setting'],
        queryFn: () => settingService.getWebsiteSetting(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false
    })

    // Extract setting data
    const setting = data?.data || null
    const contactInfo = setting ? settingService.formatContactInfo(setting) : null
    const socialLinks = setting ? settingService.formatSocialLinks(setting) : []

    return {
        setting,
        contactInfo,
        socialLinks,
        isLoading,
        error: isError ? error : null,
        refetch,
        
        // Helper functions
        getShopName: () => setting?.shop_name || 'Aristia',
        getHotline: () => setting?.hotline || '0867334316',
        getEmail: () => setting?.email || 'contact@aristia.com',
        getFacebookUrl: () => setting?.facebook_url || '#',
        getInstagramUrl: () => setting?.instagram_url || '#',
        getMessengerUrl: () => setting?.message_url || '#'
    }
}