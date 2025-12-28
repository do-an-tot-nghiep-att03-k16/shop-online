'use strict'

const express = require('express')
const router = express.Router()
const productController = require('../../controllers/product.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')

// ============================================
// PUBLIC ROUTES - CHỈ CẦN 3 ENDPOINTS CHÍNH
// ============================================

// 1. Search products (must be before /:identifier)
// GET /products/search?q=áo+thun&gender=male&category=shirts&minPrice=100000&onSale=true&inStock=true
router.get('/search', asyncHandler(productController.searchProducts))

// 2. Get all products with filters
// GET /products?page=1&limit=20&gender=male&category=shirts&minPrice=100000&maxPrice=500000&onSale=true&inStock=true&sort=price-asc
router.get('/', asyncHandler(productController.getProducts))

// 3. Get single product by ID or slug or SKU
// GET /products/507f1f77bcf86cd799439011 (by ID)
// GET /products/ao-thun-nam-basic (by slug)
// GET /products?sku=SHIRT-M-RED-001 (by SKU)
router.get('/:identifier', asyncHandler(productController.getProduct))

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

router.post('/', asyncHandler(productController.createProduct))
router.patch('/:id', asyncHandler(productController.updateProduct))
router.delete('/:id', asyncHandler(productController.deleteProduct))
router.patch('/:id/publish', asyncHandler(productController.publishProduct))
router.patch('/:id/unpublish', asyncHandler(productController.unpublishProduct))
router.patch('/:id/stock', asyncHandler(productController.updateStock))

module.exports = router
