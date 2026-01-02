import axios from 'axios'
import envConfig from '../config/env'

// Tạo axios client cho CMS
const CMS_URL = envConfig.API_STRAPI_URL.replace(/\/api$/, '');
const cmsClient = axios.create({
    baseURL: `${CMS_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * Service để lấy thông tin cấu hình website từ Strapi
 */
export const settingService = {
    /**
     * Lấy thông tin setting của website (shop name, contact info, social links)
     * @returns {Promise<Object>} Website setting data
     */
    async getWebsiteSetting() {
        const response = await cmsClient.get('/setting')
        return response.data.data
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