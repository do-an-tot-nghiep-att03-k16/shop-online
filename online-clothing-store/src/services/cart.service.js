'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')
const CartRepository = require('../models/repositories/cart.repo')
const ProductRepository = require('../models/repositories/product.repo')
const CouponService = require('./coupon.service')
const { buildCartResponse } = require('../utils/cart.mapper')

class CartService {
    // Lấy cart của user
    static async getCart(userId) {
        const cart = await CartRepository.findOrCreateByUserId(userId)

        // Populate để lấy thông tin đầy đủ
        await cart.populate([
            {
                path: 'items.product_id',
                select: 'name slug base_price discount_percent variants',
            },
            {
                path: 'applied_coupon.coupon_id',
                select: 'code description discount_type discount_value',
            },
        ])

        return buildCartResponse(cart)
    }

    // Thêm item vào cart
    static async addToCart(userId, { product_id, variant_sku, quantity }) {
        // 1. Validate product và variant
        const product = await ProductRepository.findById(product_id)
        if (!product) {
            throw new NotFoundError('Product not found')
        }

        const variant = product.variants.find((v) => v.sku === variant_sku)
        if (!variant) {
            throw new NotFoundError('Variant not found')
        }

        // 2. Check stock
        if (variant.stock_quantity < quantity) {
            throw new BadRequestError(
                `Only ${variant.stock_quantity} items available`
            )
        }

        // 3. Tìm hoặc tạo cart
        const cart = await CartRepository.findOrCreateByUserId(userId)

        // 4. Tính giá sale_price một cách explicit
        const salePrice = product.discount_percent > 0 
            ? Math.round(product.base_price * (1 - product.discount_percent / 100))
            : product.base_price

        // 5. Thêm item
        cart.addItem({
            product_id,
            variant_sku,
            quantity,
            price: salePrice, // ✅ Tính explicit thay vì dùng virtual
            product_name: product.name,
            product_slug: product.slug,
            product_image:
                variant.images?.[0] ||
                product.color_images?.find((c) => c.color === variant.color)
                    ?.images?.[0] ||
                product.color_images?.[0]?.images?.[0] ||
                '',
            variant_color: variant.color,
            variant_size: variant.size,
        })

        // 5. Nếu có coupon, validate lại
        if (cart.applied_coupon) {
            await this._revalidateCoupon(cart, userId)
        }

        await cart.save()

        return buildCartResponse(cart)
    }

    // Update quantity
    static async updateItemQuantity(userId, { variant_sku, quantity }) {
        const cart = await CartRepository.findByUserId(userId)
        if (!cart) {
            throw new NotFoundError('Cart not found')
        }

        // Tìm item
        const item = cart.items.find((i) => i.variant_sku === variant_sku)
        if (!item) {
            throw new NotFoundError('Item not found in cart')
        }

        // Validate stock
        const product = await ProductRepository.findById(item.product_id)
        if (!product) {
            throw new NotFoundError('Product not found')
        }

        const variant = product.variants.find((v) => v.sku === variant_sku)
        if (!variant) {
            throw new NotFoundError('Variant not found')
        }

        if (quantity > 0 && variant.stock_quantity < quantity) {
            throw new BadRequestError(
                `Only ${variant.stock_quantity} items available`
            )
        }

        // Update quantity
        cart.updateItemQuantity(variant_sku, quantity)

        // Re-validate coupon nếu có
        if (cart.applied_coupon) {
            await this._revalidateCoupon(cart, userId)
        }

        await cart.save()

        return buildCartResponse(cart)
    }

    // Remove item
    static async removeItem(userId, variant_sku) {
        const cart = await CartRepository.findByUserId(userId)
        if (!cart) {
            throw new NotFoundError('Cart not found')
        }

        cart.removeItem(variant_sku)

        // Re-validate coupon nếu có
        if (cart.applied_coupon && cart.items.length > 0) {
            await this._revalidateCoupon(cart, userId)
        }

        await cart.save()

        return buildCartResponse(cart)
    }

    // Clear cart
    static async clearCart(userId) {
        const cart = await CartRepository.findByUserId(userId)
        if (!cart) {
            throw new NotFoundError('Cart not found')
        }

        cart.clearCart()
        await cart.save()

        return buildCartResponse(cart)
    }

    // Apply coupon vào cart
    static async applyCouponToCart(userId, code) {
        const cart = await CartRepository.findByUserId(userId)
        if (!cart) {
            throw new NotFoundError('Cart not found')
        }

        if (cart.items.length === 0) {
            throw new BadRequestError('Cart is empty')
        }

        // Get products with category data for coupon validation
        const productIds = cart.items.map((item) => item.product_id.toString())
        const products = await ProductRepository.findByIds(productIds, { 
            select: 'category_id' 
        })
        const categoryIds = products
            .map(product => product.category_id?.toString())
            .filter(Boolean) // Remove null/undefined values
        
        // Validate coupon
        const couponResult = await CouponService.validateCoupon({
            code,
            userId,
            orderValue: cart.subtotal,
            categoryIds,
            productIds,
        })

        // Apply coupon
        cart.applyCoupon({
            coupon_id: couponResult.coupon_id,
            code: couponResult.code,
            discount: couponResult.discount,
        })

        await cart.save()

        return {
            cart: buildCartResponse(cart),
            coupon_info: {
                code: couponResult.code,
                discount: couponResult.discount,
                message: couponResult.message,
            },
        }
    }

    // Remove coupon
    static async removeCouponFromCart(userId) {
        const cart = await CartRepository.findByUserId(userId)
        if (!cart) {
            throw new NotFoundError('Cart not found')
        }

        cart.removeCoupon()
        await cart.save()

        return buildCartResponse(cart)
    }

    // Validate cart trước khi checkout
    static async validateCart(userId) {
        const cart = await CartRepository.findByUserId(userId)
        if (!cart || cart.items.length === 0) {
            throw new BadRequestError('Cart is empty')
        }

        const errors = []

        // Check stock và price cho từng item
        for (const item of cart.items) {
            const product = await ProductRepository.findById(item.product_id)
            if (!product) {
                errors.push({
                    sku: item.variant_sku,
                    error: 'Product not found',
                })
                continue
            }

            const variant = product.variants.find(
                (v) => v.sku === item.variant_sku
            )
            if (!variant) {
                errors.push({
                    sku: item.variant_sku,
                    error: 'Variant not found',
                })
                continue
            }

            // Check stock
            if (variant.stock_quantity < item.quantity) {
                errors.push({
                    sku: item.variant_sku,
                    product_name: item.product_name,
                    requested: item.quantity,
                    available: variant.stock_quantity,
                    error: 'Insufficient stock',
                })
            }

            // Check giá có thay đổi không (tính explicit)
            const currentSalePrice = product.discount_percent > 0 
                ? Math.round(product.base_price * (1 - product.discount_percent / 100))
                : product.base_price
                
            if (currentSalePrice !== item.price) {
                errors.push({
                    sku: item.variant_sku,
                    product_name: item.product_name,
                    old_price: item.price,
                    new_price: currentSalePrice,
                    error: 'Price changed',
                })
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            cart: buildCartResponse(cart),
        }
    }

    // Sync prices (update giá mới nhất từ products)
    static async syncCartPrices(userId) {
        const cart = await CartRepository.findByUserId(userId)
        if (!cart) {
            throw new NotFoundError('Cart not found')
        }

        let hasChanges = false

        // Update giá cho từng item
        for (const item of cart.items) {
            const product = await ProductRepository.findById(item.product_id)
            if (product) {
                const currentSalePrice = product.discount_percent > 0 
                    ? Math.round(product.base_price * (1 - product.discount_percent / 100))
                    : product.base_price
                    
                if (currentSalePrice !== item.price) {
                    item.price = currentSalePrice
                    hasChanges = true
                }
            }
        }

        if (hasChanges) {
            cart.calculateTotals()

            // Re-validate coupon nếu có
            if (cart.applied_coupon) {
                await this._revalidateCoupon(cart, userId)
            }

            await cart.save()
        }

        return buildCartResponse(cart)
    }

    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Re-validate coupon và tự động remove nếu không hợp lệ
     * @private
     */
    static async _revalidateCoupon(cart, userId) {
        try {
            // Get category data for coupon validation
            const productIds = cart.items.map((item) => item.product_id.toString())
            const products = await ProductRepository.findByIds(productIds, { 
                select: 'category_id' 
            })
            const categoryIds = products
                .map(product => product.category_id?.toString())
                .filter(Boolean)
                
            const couponResult = await CouponService.validateCoupon({
                code: cart.applied_coupon.code,
                userId,
                orderValue: cart.subtotal,
                categoryIds,
                productIds,
            })

            cart.applyCoupon({
                coupon_id: couponResult.coupon_id,
                code: couponResult.code,
                discount: couponResult.discount,
            })
        } catch (error) {
            // Coupon không còn hợp lệ → remove
            cart.removeCoupon()
        }
    }
}

module.exports = CartService
