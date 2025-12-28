'use strict'

const { SuccessResponse } = require('../core/success.response')
const CartService = require('../services/cart.service')

class CartController {
    // GET /cart - Lấy cart của user
    getCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get cart successfully',
            metadata: await CartService.getCart(req.userId),
        }).send(res)
    }

    // POST /cart/items - Thêm item vào cart
    addToCart = async (req, res, next) => {
        const { product_id, variant_sku, quantity } = req.body

        new SuccessResponse({
            message: 'Item added to cart successfully',
            metadata: await CartService.addToCart(req.userId, {
                product_id,
                variant_sku,
                quantity,
            }),
        }).send(res)
    }

    // PATCH /cart/items/:sku - Update quantity của item
    updateItemQuantity = async (req, res, next) => {
        const { sku } = req.params
        const { quantity } = req.body

        new SuccessResponse({
            message: 'Item quantity updated successfully',
            metadata: await CartService.updateItemQuantity(req.userId, {
                variant_sku: sku,
                quantity,
            }),
        }).send(res)
    }

    // DELETE /cart/items/:sku - Xóa item khỏi cart
    removeItem = async (req, res, next) => {
        const { sku } = req.params

        new SuccessResponse({
            message: 'Item removed from cart successfully',
            metadata: await CartService.removeItem(req.userId, sku),
        }).send(res)
    }

    // DELETE /cart - Clear toàn bộ cart
    clearCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cart cleared successfully',
            metadata: await CartService.clearCart(req.userId),
        }).send(res)
    }

    // POST /cart/coupon - Apply coupon vào cart
    applyCoupon = async (req, res, next) => {
        const { code } = req.body

        new SuccessResponse({
            message: 'Coupon applied successfully',
            metadata: await CartService.applyCouponToCart(req.userId, code),
        }).send(res)
    }

    // DELETE /cart/coupon - Remove coupon khỏi cart
    removeCoupon = async (req, res, next) => {
        new SuccessResponse({
            message: 'Coupon removed successfully',
            metadata: await CartService.removeCouponFromCart(req.userId),
        }).send(res)
    }

    // GET /cart/validate - Validate cart trước khi checkout
    validateCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cart validation completed',
            metadata: await CartService.validateCart(req.userId),
        }).send(res)
    }

    // POST /cart/sync-prices - Sync giá mới nhất từ products
    syncCartPrices = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cart prices synced successfully',
            metadata: await CartService.syncCartPrices(req.userId),
        }).send(res)
    }

    // GET /cart/count - Đếm số lượng items trong cart
    getCartItemCount = async (req, res, next) => {
        const CartRepository = require('../models/repositories/cart.repo')

        new SuccessResponse({
            message: 'Cart item count retrieved successfully',
            metadata: {
                count: await CartRepository.countItems(req.userId),
            },
        }).send(res)
    }
}

module.exports = new CartController()
