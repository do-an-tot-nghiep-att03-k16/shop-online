import { strapiClient } from '../config/strapiClient'
import envConfig from '../config/env'
import { extractData } from '../utils/apiUtils'

/**
 * Service để lấy thông tin cấu hình website từ Strapi
 */
export const settingService = {
    /**
     * Lấy thông tin setting của website (shop name, contact info, social links)
     * @returns {Promise<Object>} Website setting data
     */
    async getWebsiteSetting() {
        try {
            // console.log('🔄 Fetching website setting from Strapi...')
            
            const response = await fetch(`${envConfig.API_STRAPI_URL}/setting`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            // console.log('✅ Website setting loaded:', data.data)

            return {
                success: true,
                data: data.data,
                message: 'Website setting loaded successfully'
            }

        } catch (error) {
            console.error('❌ Error fetching website setting:', error)
            
            // Fallback data nếu API bị lỗi
            return {
                success: false,
                error: error.message,
                data: {
                    shop_name: 'Aristia',
                    facebook_url: '#',
                    message_url: '#', 
                    instagram_url: '#',
                    hotline: '0867334316',
                    email: 'contact@aristia.com'
                },
                message: 'Using fallback setting data'
            }
        }
    },

    /**
     * Format thông tin contact cho hiển thị
     * @param {Object} setting - Setting data từ API
     * @returns {Object} Formatted contact info
     */
    formatContactInfo(setting) {
        if (!setting) return null

        return {
            shopName: setting.shop_name || 'Aristia',
            hotline: setting.hotline || '',
            email: setting.email || '',
            socialLinks: {
                facebook: setting.facebook_url || '#',
                messenger: setting.message_url || '#', 
                instagram: setting.instagram_url || '#'
            },
            // Formatted cho display
            displayHotline: setting.hotline ? `📞 ${setting.hotline}` : '',
            displayEmail: setting.email ? `✉️ ${setting.email}` : '',
            displayAddress: setting.address || 'TP. Hồ Chí Minh, Việt Nam'
        }
    },

    /**
     * Format social links cho footer/header
     * @param {Object} setting - Setting data
     * @returns {Array} Array of social link objects
     */
    formatSocialLinks(setting) {
        if (!setting) return []

        const links = []
        
        if (setting.facebook_url && setting.facebook_url !== '#') {
            links.push({
                name: 'Facebook',
                icon: 'FacebookOutlined',
                url: setting.facebook_url,
                color: '#1877f2'
            })
        }

        if (setting.instagram_url && setting.instagram_url !== '#') {
            links.push({
                name: 'Instagram', 
                icon: 'InstagramOutlined',
                url: setting.instagram_url,
                color: '#E4405F'
            })
        }

        if (setting.message_url && setting.message_url !== '#') {
            links.push({
                name: 'Messenger',
                icon: 'MessageOutlined', 
                url: setting.message_url,
                color: '#00B2FF'
            })
        }

        return links
    }
}