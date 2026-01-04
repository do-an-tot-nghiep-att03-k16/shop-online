const axios = require('axios');
require('dotenv').config();

// Config từ .env
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

// Strapi client (local connection trong cùng container/network)
const strapiClient = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Backend client (sử dụng public API endpoints)
const backendClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Sync Categories từ backend
async function syncCategories() {
  try {
    console.log('\n🗂️  Bắt đầu sync Categories...');
    
    // 1. Lấy categories từ backend
    const response = await backendClient.get('/v1/api/category/active');
    const backendCategories = response.data.metadata?.categories || response.data.data || response.data;

    if (!Array.isArray(backendCategories)) {
      throw new Error('Backend không trả về array categories');
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const category of backendCategories) {
      try {
        // 2. Kiểm tra đã tồn tại chưa
        const existingResponse = await strapiClient.get(`/categories?filters[backend_id][$eq]=${category._id}`);
        const existing = existingResponse.data.data;

        const categoryData = {
          data: {
            name: category.name || 'Unnamed Category',
            slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || `category-${category._id}`,
            backend_id: category._id,
            publishedAt: new Date().toISOString()
          }
        };

        if (existing && existing.length > 0) {
          // Update
          await strapiClient.put(`/categories/${existing[0].id}`, categoryData);
          updated++;
          console.log(`✅ Updated: ${categoryData.data.name}`);
        } else {
          // Create new
          await strapiClient.post('/categories', categoryData);
          created++;
          console.log(`✨ Created: ${categoryData.data.name}`);
        }

      } catch (error) {
        console.error(`❌ Lỗi với category ${category.name}:`, error.response?.data?.error?.message || error.message);
        errors++;
      }
    }

    console.log(`\n📊 Categories sync hoàn thành:`);
    console.log(`   ✨ Tạo mới: ${created}`);
    console.log(`   ✅ Cập nhật: ${updated}`);
    console.log(`   ❌ Lỗi: ${errors}`);
    console.log(`   📋 Tổng: ${backendCategories.length}`);

  } catch (error) {
    console.error('❌ Lỗi khi sync categories:', error.response?.data || error.message);
    throw error;
  }
}

// Sync Coupons từ backend
async function syncCoupons() {
  try {
    console.log('\n🎟️  Bắt đầu sync Coupons...');
    
    // 1. Lấy coupons từ backend
    const response = await backendClient.get('/v1/api/coupon/active');
    const backendCoupons = response.data.metadata?.coupons || response.data.data || response.data;

    if (!Array.isArray(backendCoupons)) {
      throw new Error('Backend không trả về array coupons');
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const coupon of backendCoupons) {
      try {
        // 2. Kiểm tra đã tồn tại chưa
        const existingResponse = await strapiClient.get(`/coupons?filters[backend_id][$eq]=${coupon._id}`);
        const existing = existingResponse.data.data;

        const couponData = {
          data: {
            name: coupon.description || coupon.code || 'Unnamed Coupon',
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type || 'percentage',
            discount_value: coupon.discount_value || 0,
            min_order_value: coupon.min_order_value || 0,
            max_discount: coupon.max_discount || null,
            apply_type: coupon.apply_type || 'all',
            backend_id: coupon._id,
            publishedAt: new Date().toISOString()
          }
        };

        if (existing && existing.length > 0) {
          // Update
          await strapiClient.put(`/coupons/${existing[0].id}`, couponData);
          updated++;
          console.log(`✅ Updated: ${couponData.data.code}`);
        } else {
          // Create new
          await strapiClient.post('/coupons', couponData);
          created++;
          console.log(`✨ Created: ${couponData.data.code}`);
        }

      } catch (error) {
        console.error(`❌ Lỗi với coupon ${coupon.code}:`, error.response?.data?.error?.message || error.message);
        errors++;
      }
    }

    console.log(`\n📊 Coupons sync hoàn thành:`);
    console.log(`   ✨ Tạo mới: ${created}`);
    console.log(`   ✅ Cập nhật: ${updated}`);
    console.log(`   ❌ Lỗi: ${errors}`);
    console.log(`   📋 Tổng: ${backendCoupons.length}`);

  } catch (error) {
    console.error('❌ Lỗi khi sync coupons:', error.response?.data || error.message);
    throw error;
  }
}

// Sync tất cả
async function syncAll() {
  try {
    console.log('🚀 Bắt đầu sync tất cả dữ liệu từ backend...');
    console.log(`📡 Backend: ${BACKEND_URL}`);
    console.log(`🏠 Strapi: ${STRAPI_URL}`);
    
    await syncCategories();
    await syncCoupons();
    
    console.log('\n🎉 Hoàn thành sync tất cả dữ liệu!');
    
  } catch (error) {
    console.error('\n💥 Sync thất bại:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'categories':
      await syncCategories();
      break;
    case 'coupons':
      await syncCoupons();
      break;
    case 'all':
    default:
      await syncAll();
      break;
  }
}

// Chạy nếu file được gọi trực tiếp
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncCategories,
  syncCoupons,
  syncAll
};