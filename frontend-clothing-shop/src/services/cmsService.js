import axios from 'axios';
import envConfig from '../config/env';
const CMS_URL = envConfig.API_STRAPI_URL.replace(/\/api$/, '');

const cmsClient = axios.create({
  baseURL: `${CMS_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Default fallback data khi CMS lỗi
const DEFAULT_HOME_CONFIG = {
  site_title: 'Aristia - Thời trang cao cấp',
  hero_title: 'Chào mừng đến với Aristia',
  hero_subtitle: 'Nơi phong cách gặp gỡ sự tinh tế. Khám phá bộ sưu tập thời trang cao cấp',
  slider_autoplay: true,
  slider_duration: 5000,
  show_slider_dots: true,
  show_slider_arrows: true,
  show_coupons_section: true,
  show_categories_section: true,
  show_onsale_section: true,
  hero_banners: [],
  categories: [],
  coupons: []
};

const DEFAULT_SETTING = {
  shop_name: 'Aristia',
  facebook_url: '#',
  instagram_url: '#',
  message_url: '#',
  hotline: '1900-0000',
  email: 'info@aristia.com',
  address: 'Hà Nội, Việt Nam'
};

// Get Home Configuration
export const getHomeConfiguration = async () => {
  try {
    const response = await cmsClient.get('/home-configuration?populate=*');
    
    if (response.data?.data) {
      const config = response.data.data;
      return {
        ...DEFAULT_HOME_CONFIG,
        ...config,
        hero_banners: config.hero_banners || [],
        featured_categories: config.featured_categories || [],
        featured_coupons: config.featured_coupons || []
      };
    }
    
    return DEFAULT_HOME_CONFIG;
  } catch (error) {
    console.error('❌ Error fetching home configuration:', error.message);
    return DEFAULT_HOME_CONFIG;
  }
};

// Get Settings
export const getSettings = async () => {
  try {
    const response = await cmsClient.get('/setting');
    
    if (response.data?.data) {
      return {
        ...DEFAULT_SETTING,
        ...response.data.data
      };
    }
    
    return DEFAULT_SETTING;
  } catch (error) {
    console.error('❌ Error fetching settings:', error.message);
    return DEFAULT_SETTING;
  }
};

// Get Blogs with pagination
export const getBlogs = async (page = 1, pageSize = 10) => {
  try {
    const response = await cmsClient.get(`/blogs?populate[category]=*&populate[thumbnail]=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort[0]=createdAt:desc`);
    
    return {
      data: response.data?.data || [],
      meta: response.data?.meta || { pagination: { page: 1, pageCount: 1, total: 0 } }
    };
  } catch (error) {
    console.error('❌ Error fetching blogs:', error.message);
    return {
      data: [],
      meta: { pagination: { page: 1, pageCount: 1, total: 0 } }
    };
  }
};

// Get Blog by documentId
export const getBlogByDocumentId = async (documentId) => {
  try {
    const response = await cmsClient.get(`/blogs/${documentId}?populate[category]=*&populate[thumbnail]=*`);
    return response.data?.data || null;
  } catch (error) {
    console.error('❌ Error fetching blog:', error.message);
    return null;
  }
};

// Get Blog Categories
export const getBlogCategories = async () => {
  try {
    const response = await cmsClient.get('/blog-categories');
    return response.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching blog categories:', error.message);
    return [];
  }
};

// Get Product Categories (for home page)
export const getProductCategories = async () => {
  try {
    const response = await cmsClient.get('/categories');
    return response.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching product categories:', error.message);
    return [];
  }
};

// Get Coupons
export const getCoupons = async () => {
  try {
    const response = await cmsClient.get('/coupons');
    return response.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching coupons:', error.message);
    return [];
  }
};

export default {
  getHomeConfiguration,
  getSettings,
  getBlogs,
  getBlogByDocumentId,
  getBlogCategories,
  getProductCategories,
  getCoupons
};