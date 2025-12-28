'use strict'

const express = require('express')
const router = express.Router()
const productController = require('../../controllers/product.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')
const { optionalAuthenticate } = require('../../auth/optionalAuth')
const grantAccess = require('../../middlewares/rbac.middleware')

// ============================================
// PUBLIC ROUTES - CHỈ CẦN 3 ENDPOINTS CHÍNH
// ============================================

// 1. Search products (must be before /:identifier)
// GET /products/search?q=áo+thun&gender=male&category=shirts&minPrice=100000&onSale=true&inStock=true
router.get('/search', asyncHandler(productController.searchProducts))

// 2. Get all products with filters (with optional admin authentication)
// GET /products?page=1&limit=20&gender=male&category=shirts&minPrice=100000&maxPrice=500000&onSale=true&inStock=true&sort=price-asc
router.get('/', optionalAuthenticate, asyncHandler(productController.getProducts))

// 3. Get single product by ID or slug or SKU
// GET /products/507f1f77bcf86cd799439011 (by ID)
// GET /products/ao-thun-nam-basic (by slug)
// GET /products?sku=SHIRT-M-RED-001 (by SKU)
router.get('/:identifier', asyncHandler(productController.getProduct))

// Admin-specific products endpoint (shows ALL products including unpublished) - MUST be before router.use(authenticate)

// Additional helper endpoints (optional)
router.get(
    '/:id/variants/:sku/availability',
    asyncHandler(productController.checkVariantAvailability)
)
router.get(
    '/:id/sizes/:color',
    asyncHandler(productController.getAvailableSizes)
)

// ============================================
// ADMIN ROUTES - Protected
// ============================================
router.use(authenticate)

router.get('/admin/all', grantAccess('readAny', 'product'), asyncHandler(productController.getProductsForAdmin))

// Product CRUD operations (admin/shop only)
router.post('/', grantAccess('createAny', 'product'), asyncHandler(productController.createProduct))
router.patch('/:id', grantAccess('updateAny', 'product'), asyncHandler(productController.updateProduct))
router.delete('/:id', grantAccess('deleteAny', 'product'), asyncHandler(productController.deleteProduct))
router.patch('/:id/publish', grantAccess('updateAny', 'product'), asyncHandler(productController.publishProduct))
router.patch('/:id/unpublish', grantAccess('updateAny', 'product'), asyncHandler(productController.unpublishProduct))

// Inventory Management Routes (admin/shop only)
router.patch('/:id/stock', grantAccess('updateAny', 'inventory'), asyncHandler(productController.updateStock))
router.post('/inventory/bulk-update', grantAccess('updateAny', 'inventory'), asyncHandler(productController.bulkUpdateStock))
router.get('/inventory/overview', grantAccess('readAny', 'inventory'), asyncHandler(productController.getInventoryOverview))
router.get('/inventory/low-stock-alerts', grantAccess('readAny', 'inventory'), asyncHandler(productController.getLowStockAlerts))

module.exports = router
