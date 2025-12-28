/**
 * Service để merge data từ Backend MongoDB và Strapi display config
 * Backend = Source of truth cho data
 * Strapi = Control layer cho display logic
 */

import envConfig from '../config/env'

export const dataMergeService = {
    /**
     * Merge coupons từ backend với display config từ Strapi
     * @returns {Promise<Array>} Merged coupons for home page
     */
    async getHomeCoupons() {
        try {
            console.log('🔄 Loading home coupons (Backend + Strapi)...')
            
            // 1. Get display config từ Strapi
            const strapiResponse = await fetch(
                `${envConfig.API_STRAPI_URL}/home-coupons?filters[display_home][$eq]=true&filters[is_active][$eq]=true&sort=display_order:asc&populate=*`
            )
            
            if (!strapiResponse.ok) {
                console.warn('⚠️ Strapi home-coupons not available, using fallback')
                return this.getFallbackCoupons()
            }
            
            const strapiData = await strapiResponse.json()
            const displayConfigs = strapiData.data || []
            
            if (displayConfigs.length === 0) {
                console.log('ℹ️ No coupons configured for home display')
                return []
            }
            
            // 2. Get actual coupon data từ backend
            const couponIds = displayConfigs.map(item => item.attributes.coupon_id)
            const backendResponse = await fetch(`${envConfig.API_BASE_URL}/v1/api/coupon`)
            
            if (!backendResponse.ok) {
                throw new Error('Backend coupons API not available')
            }
            
            const backendData = await backendResponse.json()
            const allCoupons = backendData.metadata || []
            
            // 3. Merge data: Backend data + Strapi display config
            const mergedCoupons = []
            
            for (const strapiItem of displayConfigs) {
                const strapiAttrs = strapiItem.attributes
                const backendCoupon = allCoupons.find(
                    coupon => coupon._id === strapiAttrs.coupon_id
                )
                
                if (!backendCoupon) {
                    console.warn(`⚠️ Backend coupon not found for ID: ${strapiAttrs.coupon_id}`)
                    continue
                }
                
                // Check if coupon is still valid
                if (!this.isCouponValid(backendCoupon)) {
                    console.log(`⏰ Coupon ${backendCoupon.code} expired, skipping`)
                    continue
                }
                
                const mergedCoupon = {
                    // Backend data (primary)
                    ...backendCoupon,
                    
                    // Strapi display enhancements
                    display_title: strapiAttrs.custom_title || backendCoupon.code,
                    display_description: strapiAttrs.custom_description || backendCoupon.description,
                    display_order: strapiAttrs.display_order || 1,
                    promotion_banner: strapiAttrs.promotion_banner?.data?.attributes?.url 
                        ? `${envConfig.API_STRAPI_URL.replace(/\/api$/, '')}${strapiAttrs.promotion_banner.data.attributes.url}`
                        : null,
                    
                    // Meta info
                    _strapi_managed: true,
                    _display_config: strapiAttrs
                }
                
                mergedCoupons.push(mergedCoupon)
            }
            
            console.log(`✅ Loaded ${mergedCoupons.length} home coupons`)
            return mergedCoupons.sort((a, b) => a.display_order - b.display_order)
            
        } catch (error) {
            console.error('❌ Error merging home coupons:', error)
            return this.getFallbackCoupons()
        }
    },

    /**
     * Merge categories từ backend với featured config từ Strapi
     * @returns {Promise<Array>} Featured categories for home page
     */
    async getHomeCategories() {
        try {
            
            // 1. Get featured config từ Strapi
            const strapiResponse = await fetch(
                `${envConfig.API_STRAPI_URL}/home-categories?filters[display_home][$eq]=true&filters[is_active][$eq]=true&sort=display_order:asc&populate=*`
            )
            
            if (!strapiResponse.ok) {
                console.warn('⚠️ Strapi home-categories not available, using fallback')
                return this.getFallbackCategories()
            }
            
            const strapiData = await strapiResponse.json()
            const displayConfigs = strapiData.data || []
            
            if (displayConfigs.length === 0) {
                return this.getFallbackCategories()
            }
            
            // 2. Get actual category data từ backend
            const categoryIds = displayConfigs.map(item => item.attributes.category_id)
            const backendResponse = await fetch(`${envConfig.API_BASE_URL}/v1/api/category`)
            
            if (!backendResponse.ok) {
                throw new Error('Backend categories API not available')
            }
            
            const backendData = await backendResponse.json()
            const allCategories = backendData.metadata || []
            
            // 3. Merge data
            const mergedCategories = []
            
            for (const strapiItem of displayConfigs) {
                const strapiAttrs = strapiItem.attributes
                const backendCategory = allCategories.find(
                    cat => cat._id === strapiAttrs.category_id
                )
                
                if (!backendCategory) {
                    console.warn(`⚠️ Backend category not found for ID: ${strapiAttrs.category_id}`)
                    continue
                }
                
                const mergedCategory = {
                    // Backend data (primary)
                    ...backendCategory,
                    
                    // Strapi display enhancements
                    display_order: strapiAttrs.display_order || 1,
                    hero_image: strapiAttrs.hero_image?.data?.attributes?.url 
                        ? `${envConfig.API_STRAPI_URL.replace(/\/api$/, '')}${strapiAttrs.hero_image.data.attributes.url}`
                        : null,
                    description_override: strapiAttrs.description_override,
                    button_text: strapiAttrs.button_text || 'Xem thêm',
                    is_featured: strapiAttrs.is_featured || false,
                    
                    // Meta info
                    _strapi_managed: true,
                    _display_config: strapiAttrs
                }
                
                mergedCategories.push(mergedCategory)
            }
            
            return mergedCategories.sort((a, b) => a.display_order - b.display_order)
            
        } catch (error) {
            console.error('❌ Error merging home categories:', error)
            return this.getFallbackCategories()
        }
    },

    /**
     * Merge products với featured/section config từ Strapi
     * @param {string} section - 'featured', 'sale', 'new'
     * @returns {Promise<Array>} Products for specific home section
     */
    async getHomeSectionProducts(section = 'featured') {
        try {
            
            // 1. Get section config từ Strapi
            const strapiResponse = await fetch(
                `${envConfig.API_STRAPI_URL}/home-products?filters[section][$eq]=${section}&filters[display_home][$eq]=true&filters[is_active][$eq]=true&sort=display_order:asc`
            )
            
            if (!strapiResponse.ok) {
                console.warn(`⚠️ Strapi home-products (${section}) not available`)
                return []
            }
            
            const strapiData = await strapiResponse.json()
            const displayConfigs = strapiData.data || []
            
            if (displayConfigs.length === 0) {
                return []
            }
            
            // 2. Get actual product data từ backend
            const productIds = displayConfigs.map(item => item.attributes.product_id)
            const backendResponse = await fetch(`${envConfig.API_BASE_URL}/v1/api/product/ids`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ product_ids: productIds })
            })
            
            if (!backendResponse.ok) {
                throw new Error('Backend products API not available')
            }
            
            const backendData = await backendResponse.json()
            const allProducts = backendData.metadata || []
            
            // 3. Merge data
            const mergedProducts = displayConfigs.map(strapiItem => {
                const strapiAttrs = strapiItem.attributes
                const backendProduct = allProducts.find(
                    prod => prod._id === strapiAttrs.product_id
                )
                
                if (!backendProduct) {
                    console.warn(`⚠️ Backend product not found: ${strapiAttrs.product_id}`)
                    return null
                }
                
                return {
                    // Backend data (primary)
                    ...backendProduct,
                    
                    // Strapi display enhancements
                    display_order: strapiAttrs.display_order || 1,
                    badge_text: strapiAttrs.badge_text,
                    section: strapiAttrs.section,
                    
                    // Meta info
                    _strapi_managed: true,
                    _section: section
                }
            }).filter(Boolean)
            
            return mergedProducts.sort((a, b) => a.display_order - b.display_order)
            
        } catch (error) {
            console.error(`❌ Error loading ${section} products:`, error)
            return []
        }
    },

    /**
     * Helper: Check if coupon is valid
     */
    isCouponValid(coupon) {
        const now = new Date()
        const startDate = coupon.start_date ? new Date(coupon.start_date) : null
        const endDate = coupon.end_date ? new Date(coupon.end_date) : null
        
        if (startDate && now < startDate) return false
        if (endDate && now > endDate) return false
        if (coupon.is_active === false) return false
        
        return true
    },

    /**
     * Fallback coupons khi Strapi unavailable
     */
    getFallbackCoupons() {
        return [
            {
                code: 'WELCOME10',
                display_title: '🎉 Chào mừng thành viên mới',
                discount_percent: 10,
                description: 'Giảm 10% cho đơn hàng đầu tiên',
                _strapi_managed: false
            }
        ]
    },

    /**
     * Fallback categories khi Strapi unavailable
     */
    async getFallbackCategories() {
        try {
            const response = await fetch(`${envConfig.API_BASE_URL}/v1/api/category`, {
                headers: { }
            })
            const data = await response.json()
            return (data.metadata || []).slice(0, 6).map(cat => ({
                ...cat,
                _strapi_managed: false
            }))
        } catch (error) {
            return []
        }
    }
}