import { extractData } from '../utils/apiUtils'
import envConfig from '../config/env'

/**
 * Service để lấy cấu hình trang Home từ Strapi CMS
 */
export const homeService = {
    /**
     * Lấy cấu hình trang Home với populate relations
     * @returns {Promise<Object>} Home page configuration
     */
    async getHomePageConfig() {
        try {
            
            const response = await fetch(`${envConfig.API_STRAPI_URL}/home-configuration?populate=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            return {
                success: true,
                data: data.data,
                message: 'Home page config loaded successfully'
            }

        } catch (error) {
            
            // Fallback config nếu Strapi bị lỗi
            return {
                success: false,
                error: error.message,
                data: this.getFallbackConfig(),
                message: 'Using fallback home page config'
            }
        }
    },

    /**
     * Lấy featured coupons đã được config trong Strapi
     * @returns {Promise<Array>} Featured coupons
     */
    async getFeaturedCoupons() {
        try {
            const homeConfig = await this.getHomePageConfig()
            return homeConfig.data?.featured_coupons || []
        } catch (error) {
            console.error('❌ Error fetching featured coupons:', error)
            return []
        }
    },

    /**
     * Lấy featured categories đã được config trong Strapi  
     * @returns {Promise<Array>} Featured categories
     */
    async getFeaturedCategories() {
        try {
            const homeConfig = await this.getHomePageConfig()
            return homeConfig.data?.featured_categories || []
        } catch (error) {
            console.error('❌ Error fetching featured categories:', error)
            return []
        }
    },

    /**
     * Fallback config nếu Strapi không khả dụng
     * @returns {Object} Default home page config
     */
    getFallbackConfig() {
        return {
            hero_title: 'Chào mừng đến với Aristia',
            hero_subtitle: 'Khám phá bộ sưu tập thời trang cao cấp với thiết kế độc đáo và chất lượng vượt trội',
            hero_cta_text: 'Khám phá ngay',
            hero_cta_url: '/shop',
            show_new_products: true,
            new_products_limit: 8,
            show_sale_products: true,
            sale_products_limit: 6,
            show_featured_products: true,
            featured_coupons: [],
            featured_categories: [],
            featured_products: [],
            is_active: true
        }
    },

    /**
     * Format hero section data with banners
     * @param {Object} config - Home page config
     * @returns {Object} Formatted hero section
     */
    formatHeroSection(config) {
        if (!config) return null

        return {
            title: config.herro_title || config.hero_title || 'Chào mừng đến với Aristia',
            subtitle: config.hero_subtitle || 'Khám phá bộ sưu tập thời trang cao cấp',
            banners: this.formatHeroBanners(config.hero_banners),
            settings: {
                autoplay: config.slider_autoplay !== false,
                duration: config.slider_duration || 5000,
                showDots: config.show_slider_dots !== false,
                showArrows: config.show_slider_arrows !== false
            },
            ctaText: config.hero_cta_text || 'Khám phá ngay',
            ctaUrl: config.hero_cta_url || '/shop'
        }
    },

    /**
     * Format hero banners data
     * @param {Array} banners - Raw banner data from Strapi
     * @returns {Array} Formatted banners
     */
    formatHeroBanners(banners) {
        if (!banners || !Array.isArray(banners)) return []

        return banners.map(banner => ({
            id: banner.id || banner.documentId,
            name: banner.name,
            url: banner.url,
            alternativeText: banner.alternativeText || banner.caption || banner.name,
            caption: banner.caption,
            width: banner.width,
            height: banner.height,
            formats: banner.formats || {},
            // Add responsive image URLs
            urls: {
                original: banner.url,
                large: banner.formats?.large?.url || banner.url,
                medium: banner.formats?.medium?.url || banner.url,
                small: banner.formats?.small?.url || banner.url,
                thumbnail: banner.formats?.thumbnail?.url || banner.url
            }
        }))
    },

    /**
     * Format product sections visibility
     * @param {Object} config - Home page config
     * @returns {Object} Product sections config
     */
    formatProductSections(config) {
        if (!config) return this.getFallbackConfig()

        return {
            newProducts: {
                enabled: config.show_new_products !== false,
                limit: config.new_products_limit || 8
            },
            saleProducts: {
                enabled: config.show_sale_products !== false,
                limit: config.sale_products_limit || 6
            },
            featuredProducts: {
                enabled: config.show_featured_products !== false,
                products: config.featured_products || []
            }
        }
    },

    /**
     * Check if home page config is active
     * @param {Object} config - Home page config
     * @returns {boolean} Is active
     */
    isConfigActive(config) {
        return config?.is_active !== false
    }
}