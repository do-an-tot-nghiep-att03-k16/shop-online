// Utility để integrate CMS data với existing frontend components
import cmsService from '../services/cmsService';

// Transform CMS home config thành format frontend expect
export const transformCMSHomeConfig = (cmsData) => {
  if (!cmsData) return null;

  return {
    // Hero section data
    heroTitle: cmsData.hero_title || cmsData.herro_title, // Handle typo in CMS
    heroSubtitle: cmsData.hero_subtitle,
    heroBanners: cmsData.hero_banners?.map(banner => ({
      id: banner.id,
      url: banner.url,
      alt: banner.alternativeText || banner.name
    })) || [],

    // Slider settings
    sliderConfig: {
      autoplay: cmsData.slider_autoplay !== false,
      duration: cmsData.slider_duration || 5000,
      showDots: cmsData.show_slider_dots !== false,
      showArrows: cmsData.show_slider_arrows !== false
    },

    // Section visibility
    sections: {
      hero: cmsData.show_hero_section !== false,
      categories: cmsData.show_categories_section !== false,
      coupons: cmsData.show_coupons_section !== false,
      onsale: cmsData.show_onsale_section !== false
    },

    // Featured data (từ CMS relations)
    featuredCategories: cmsData.categories?.map(cat => ({
      _id: cat.backend_id,
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      documentId: cat.documentId
    })) || [],

    featuredCoupons: cmsData.coupons?.map(coupon => ({
      _id: coupon.backend_id,
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value,
      max_discount: coupon.max_discount
    })) || []
  };
};

// Transform CMS settings thành format frontend expect
export const transformCMSSettings = (cmsSettings) => {
  if (!cmsSettings) return null;

  return {
    shop_name: cmsSettings.shop_name,
    facebook_url: cmsSettings.facebook_url,
    instagram_url: cmsSettings.istagram_url || cmsSettings.instagram_url, // Handle typo
    message_url: cmsSettings.message_url,
    hotline: cmsSettings.hotline,
    email: cmsSettings.email,
    address: cmsSettings.address
  };
};

// Transform CMS blogs thành format frontend expect
export const transformCMSBlogs = (cmsBlogs) => {
  if (!Array.isArray(cmsBlogs)) return [];

  return cmsBlogs.map(blog => ({
    _id: blog.documentId, // Use documentId as ID
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    description: blog.description,
    thumbnail: blog.thumbnail?.url ? {
      url: blog.thumbnail.url,
      alt: blog.thumbnail.alternativeText || blog.title
    } : null,
    category: blog.category ? {
      _id: blog.category.documentId,
      name: blog.category.name,
      slug: blog.category.slug
    } : null,
    content: blog.content,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    publishedAt: blog.publishedAt
  }));
};

// Get integrated home config (CMS + backend fallback)
export const getIntegratedHomeConfig = async () => {
  try {
    // console.log('🏠 Fetching integrated home configuration...');
    
    // Lấy data từ CMS
    const cmsHomeConfig = await cmsService.getHomeConfiguration();
    const cmsSettings = await cmsService.getSettings();

    // Transform data
    const transformedHome = transformCMSHomeConfig(cmsHomeConfig);
    const transformedSettings = transformCMSSettings(cmsSettings);

    // console.log('✅ CMS data loaded successfully');

    return {
      success: true,
      source: 'cms',
      homeConfig: transformedHome,
      settings: transformedSettings,
      raw: {
        cmsHomeConfig,
        cmsSettings
      }
    };

  } catch (error) {
    console.error('❌ Error loading CMS data:', error.message);
    
    // Return default config nếu CMS lỗi
    return {
      success: false,
      source: 'default',
      error: error.message,
      homeConfig: {
        heroTitle: 'Chào mừng đến với Aristia',
        heroSubtitle: 'Nơi phong cách gặp gỡ sự tinh tế. Khám phá bộ sưu tập thời trang cao cấp',
        heroBanners: [],
        sliderConfig: {
          autoplay: true,
          duration: 5000,
          showDots: true,
          showArrows: true
        },
        sections: {
          hero: true,
          categories: true,
          coupons: true,
          onsale: true
        },
        featuredCategories: [],
        featuredCoupons: []
      },
      settings: {
        shop_name: 'Aristia',
        facebook_url: '#',
        instagram_url: '#',
        message_url: '#',
        hotline: '1900-0000',
        email: 'info@aristia.com',
        address: 'Hà Nội, Việt Nam'
      }
    };
  }
};

export default {
  transformCMSHomeConfig,
  transformCMSSettings,
  transformCMSBlogs,
  getIntegratedHomeConfig
};