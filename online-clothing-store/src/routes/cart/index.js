'use strict'

const express = require('express')
const router = express.Router()
const cartController = require('../../controllers/cart.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')

// Tất cả routes đều cần authentication
router.use(authenticate)

// GET /cart/count - Lấy số lượng items (nhanh, không cần populate)
router.get('/count', asyncHandler(cartController.getCartItemCount))

// GET /cart/validate - Validate cart trước khi checkout
router.get('/validate', asyncHandler(cartController.validateCart))

// GET /cart - Lấy cart đầy đủ
router.get('/', asyncHandler(cartController.getCart))

// POST /cart/items - Thêm item vào cart
router.post('/items', asyncHandler(cartController.addToCart))

// PATCH /cart/items/:sku - Update quantity
router.patch('/items/:sku', asyncHandler(cartController.updateItemQuantity))

// DELETE /cart/items/:sku - Xóa item
router.delete('/items/:sku', asyncHandler(cartController.removeItem))

// DELETE /cart - Clear cart
router.delete('/', asyncHandler(cartController.clearCart))

// POST /cart/coupon - Apply coupon
router.post('/coupon', asyncHandler(cartController.applyCoupon))

// DELETE /cart/coupon - Remove coupon
router.delete('/coupon', asyncHandler(cartController.removeCoupon))

// POST /cart/sync-prices - Sync giá
router.post('/sync-prices', asyncHandler(cartController.syncCartPrices))

module.exports = router
