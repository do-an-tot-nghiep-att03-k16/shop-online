import cmsService from './cmsService';
import api from './api';
import { productAPI } from './api';

/**
 * Service chuyên xử lý logic lấy data cho Home page
 * - Lấy config từ CMS  
 * - Dựa trên config để gọi backend API lấy products, coupons
 */
class HomeDataService {
  
  /**
   * Lấy tất cả dữ liệu cần thiết cho Home page
   */
  async getHomePageData() {
    try {

      // 1. Lấy Home Configuration từ CMS
      const homeConfig = await cmsService.getHomeConfiguration();
      const settings = await cmsService.getSettings();

      // 2. Khởi tạo result object
      const result = {
        config: homeConfig,
        settings: settings,
        sections: {
          hero: homeConfig.show_hero_section !== false,
          categories: homeConfig.show_categories_section !== false,
          coupons: homeConfig.show_coupons_section !== false,
          onsale: homeConfig.show_onsale_section !== false,
          newProducts: true // Always show new products
        },
        data: {
          heroBanners: homeConfig.hero_banners || [],
          categories: [],
          featuredCategories: [],
          coupons: [],
          featuredCoupons: [],
          newProducts: [],
          saleProducts: []
        }
      };

      // 3. Lấy products theo featured categories (nếu có)
      if (result.sections.categories && homeConfig.featured_categories?.length > 0) {
        result.data.featuredCategories = await this.getProductsByCategories(homeConfig.featured_categories);
      }

      // 4. Lấy chi tiết featured coupons (nếu có)  
      if (result.sections.coupons && homeConfig.featured_coupons?.length > 0) {
        // console.log('🎟️ Loading featured coupons...');
        // console.log('🎟️ CMS Coupons data:', homeConfig.featured_coupons);
        
        // Sử dụng trực tiếp data từ CMS thay vì gọi backend API
        result.data.featuredCoupons = homeConfig.featured_coupons.map(cmsCoupon => ({
          _id: cmsCoupon.id,
          code: cmsCoupon.code,
          name: cmsCoupon.name,
          description: cmsCoupon.description,
          discount_type: cmsCoupon.discount_type,
          discount_value: cmsCoupon.discount_value,
          min_order_value: cmsCoupon.min_order_value,
          max_discount: cmsCoupon.max_discount,
          source: 'cms_direct'
        }));
      }

      // 5. Không cần lấy new/sale products riêng - dùng existing hooks
      return result;

    } catch (error) {
      console.error('❌ Error loading home page data:', error);
      return this.getFallbackHomeData();
    }
  }

  /**
   * Lấy products theo danh sách categories từ CMS
   * @param {Array} cmsCategories - Danh sách categories từ CMS relations
   */
  async getProductsByCategories(cmsCategories) {
    const results = [];

    for (const cmsCategory of cmsCategories) {
      try {
        
        // Lấy products từ backend API bằng backend_id hoặc slug
        const products = await this.getProductsByCategory(cmsCategory.backend_id, cmsCategory.slug);
        
        if (products.length > 0) {
          results.push({
            category: {
              id: cmsCategory.id,
              backend_id: cmsCategory.backend_id,
              name: cmsCategory.name,
              slug: cmsCategory.slug
            },
            products: products.slice(0, 8) // Limit 8 products per category
          });
        }

      } catch (error) {
        console.error(`❌ Error loading products for category ${cmsCategory.name}:`, error);
      }
    }

    return results;
  }

  /**
   * KHÔNG DÙNG - Sẽ dùng CategorySection component hiện có với categoryId từ CMS
   */

  /**
   * Lấy chi tiết coupons từ backend API
   * @param {Array} cmsCoupons - Danh sách coupons từ CMS relations
   */
  async getCouponDetails(cmsCoupons) {
    const results = [];

    for (const cmsCoupon of cmsCoupons) {
      try {
        // Lấy chi tiết coupon từ backend API
        const couponDetail = await this.getCouponDetail(cmsCoupon.backend_id, cmsCoupon.code);
        
        if (couponDetail) {
          results.push({
            ...couponDetail,
            cms_id: cmsCoupon.id,
            cms_name: cmsCoupon.name
          });
        }

      } catch (error) {
        console.error(`❌ Error loading coupon ${cmsCoupon.code}:`, error);
        
        // Fallback: dùng data từ CMS nếu backend lỗi
        results.push({
          _id: cmsCoupon.backend_id,
          code: cmsCoupon.code,
          name: cmsCoupon.name,
          description: cmsCoupon.description,
          discount_type: cmsCoupon.discount_type,
          discount_value: cmsCoupon.discount_value,
          min_order_value: cmsCoupon.min_order_value,
          max_discount: cmsCoupon.max_discount,
          source: 'cms_fallback'
        });
      }
    }

    return results;
  }

  /**
   * Lấy products theo category từ backend API (backend filter đã được fix)
   * @param {string} backendId - Backend category ID
   * @param {string} slug - Category slug (fallback)
   */
  async getProductsByCategory(backendId, slug) {
    try {
      if (!backendId && !slug) {
        console.warn('No backend_id or slug provided for category');
        return [];
      }

      // Sử dụng backend_id làm primary, slug làm fallback
      const categoryIdentifier = backendId || slug;
      
      const response = await productAPI.getByCategory(categoryIdentifier, {
        limit: 12, // Lấy tối đa 12 products
        page: 1
      });

      // Extract products từ response
      const responseData = response?.data?.metadata || response?.data || response;
      const products = responseData?.products || [];
      
      return products.slice(0, 8); // Giới hạn 8 products cho Home
      
    } catch (error) {
      console.error(`❌ Error fetching products for category ${backendId || slug}:`, error);
      return [];
    }
  }

  /**
   * Lấy chi tiết 1 coupon từ backend API
   * @param {string} backendId - Backend coupon ID
   * @param {string} code - Coupon code
   */
  async getCouponDetail(backendId, code) {
    try {
      const response = await api.get(`/v1/api/coupon/${backendId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`❌ Error fetching coupon detail ${code}:`, error);
      return null;
    }
  }


  /**
   * Fallback data khi CMS hoặc backend lỗi
   */
  getFallbackHomeData() {
    return {
      config: {
        hero_title: 'Chào mừng đến với Aristia',
        hero_subtitle: 'Nơi phong cách gặp gỡ sự tinh tế',
        show_hero_section: true,
        show_categories_section: true,
        show_coupons_section: true,
        show_onsale_section: true,
        slider_autoplay: true,
        slider_duration: 5000
      },
      settings: {
        shop_name: 'Aristia',
        hotline: '1900-0000',
        email: 'info@aristia.com'
      },
      sections: {
        hero: true,
        categories: true,
        coupons: true,
        onsale: true,
        newProducts: true
      },
      data: {
        heroBanners: [],
        featuredCategories: [],
        featuredCoupons: [],
        newProducts: [],
        saleProducts: []
      }
    };
  }
}

// Export singleton instance
const homeDataService = new HomeDataService();
export default homeDataService;