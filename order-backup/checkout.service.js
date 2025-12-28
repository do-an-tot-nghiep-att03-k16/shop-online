'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')
const CartRepository = require('../models/repositories/cart.repo')
const OrderRepository = require('../models/repositories/order.repo')
const ProductRepository = require('../models/repositories/product.repo')
const CouponService = require('./coupon.service')
const { order } = require('../models/order.model')

class CheckoutService {
    // Review order trước khi checkout (kiểm tra lại cart)
    static async reviewOrder(userId) {
        // 1. Lấy cart
        const cart = await CartRepository.findByUserId(userId, {
            populate: [
                {
                    path: 'items.product_id',
                    select: 'name slug base_price discount_percent variants color_images',
                },
            ],
        })

        if (!cart || cart.items.length === 0) {
            throw new BadRequestError('Cart is empty')
        }

        // 2. Validate từng item
        const validationErrors = []
        const validItems = []

        for (const item of cart.items) {
            const product = item.product_id

            if (!product) {
                validationErrors.push({
                    sku: item.variant_sku,
                    error: 'Product not found',
                })
                continue
            }

            // Tìm variant
            const variant = product.variants.find(
                (v) => v.sku === item.variant_sku
            )

            if (!variant) {
                validationErrors.push({
                    sku: item.variant_sku,
                    error: 'Variant not found',
                })
                continue
            }

            // Check stock
            if (variant.stock_quantity < item.quantity) {
                validationErrors.push({
                    sku: item.variant_sku,
                    product_name: item.product_name,
                    requested: item.quantity,
                    available: variant.stock_quantity,
                    error: 'Insufficient stock',
                })
                continue
            }

            // Check giá có thay đổi
            const currentPrice = Math.round(
                product.base_price * (1 - (product.discount_percent || 0) / 100)
            )

            validItems.push({
                ...item.toObject(),
                current_price: currentPrice,
                price_changed: currentPrice !== item.price,
            })
        }

        // 3. Tính shipping fee (có thể tùy chỉnh logic)
        const shippingFee = this.calculateShippingFee(cart.subtotal)

        // 4. Re-validate coupon nếu có
        let couponDiscount = 0
        let couponInfo = null

        if (cart.applied_coupon) {
            try {
                const couponResult = await CouponService.validateCoupon({
                    code: cart.applied_coupon.code,
                    userId,
                    orderValue: cart.subtotal,
                    productIds: cart.items.map((item) =>
                        item.product_id._id.toString()
                    ),
                })

                couponDiscount = couponResult.discount
                couponInfo = {
                    coupon_id: couponResult.coupon_id,
                    code: couponResult.code,
                    discount: couponResult.discount,
                }
            } catch (error) {
                validationErrors.push({
                    error: 'Coupon no longer valid',
                    message: error.message,
                })
            }
        }

        // 5. Tính total
        const total = Math.max(cart.subtotal + shippingFee - couponDiscount, 0)

        return {
            valid: validationErrors.length === 0,
            errors: validationErrors,
            order_summary: {
                items: validItems,
                subtotal: cart.subtotal,
                shipping_fee: shippingFee,
                discount: couponDiscount,
                total,
                coupon: couponInfo,
            },
        }
    }

    // Checkout - tạo order từ cart (chỉ COD)
    static async checkout(userId, { shipping_address, customer_note }) {
        // 1. Review order một lần nữa
        const review = await this.reviewOrder(userId)

        if (!review.valid) {
            throw new BadRequestError('Cart validation failed', {
                errors: review.errors,
            })
        }

        // 2. Get cart
        const cart = await CartRepository.findByUserId(userId, {
            populate: 'items.product_id',
        })

        // 3. Generate order number
        const orderNumber = await order.generateOrderNumber()

        // 4. Prepare order items
        const orderItems = cart.items.map((item) => ({
            product_id: item.product_id._id,
            variant_sku: item.variant_sku,
            product_name: item.product_name,
            product_slug: item.product_slug,
            product_image: item.product_image,
            variant_color: item.variant_color,
            variant_size: item.variant_size,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
        }))

        // 5. Create order (COD only)
        const orderData = {
            order_number: orderNumber,
            user_id: userId,
            items: orderItems,
            shipping_address,
            payment_method: 'cod',
            payment_status: 'pending',
            subtotal: review.order_summary.subtotal,
            shipping_fee: review.order_summary.shipping_fee,
            discount: review.order_summary.discount,
            total: review.order_summary.total,
            applied_coupon: review.order_summary.coupon,
            customer_note,
            status: 'pending',
            status_history: [
                {
                    status: 'pending',
                    note: 'Order created - COD payment',
                    updated_by: userId,
                    updated_at: new Date(),
                },
            ],
        }

        const newOrder = await OrderRepository.create(orderData)

        // 6. Reduce stock cho các variants
        for (const item of cart.items) {
            await ProductRepository.updateStock(
                item.product_id._id,
                item.variant_sku,
                -item.quantity
            )
        }

        // 7. Mark coupon as used (nếu có)
        if (cart.applied_coupon) {
            await CouponService.markCouponAsUsed(
                cart.applied_coupon.coupon_id,
                userId,
                newOrder._id
            )
        }

        // 8. Mark cart as converted
        await CartRepository.markAsConverted(cart._id)

        return {
            order: newOrder,
            message:
                'Order created successfully. Please prepare cash for delivery.',
        }
    }

    // Calculate shipping fee (có thể custom logic)
    static calculateShippingFee(subtotal) {
        if (subtotal >= 500000) {
            return 0 // Free ship cho đơn >= 500k
        } else if (subtotal >= 300000) {
            return 20000 // Giảm shipping cho đơn >= 300k
        } else {
            return 30000 // Phí ship thường
        }
    }

    // Mark payment as completed (COD - Admin confirms payment received)
    static async confirmCODPayment(orderId, adminId) {
        const orderDoc = await OrderRepository.findById(orderId)
        if (!orderDoc) {
            throw new NotFoundError('Order not found')
        }

        if (orderDoc.payment_method !== 'cod') {
            throw new BadRequestError('This order is not COD')
        }

        if (orderDoc.payment_status === 'paid') {
            throw new BadRequestError('Payment already confirmed')
        }

        // Update payment status
        await OrderRepository.updatePaymentStatus(orderDoc._id, 'paid', {
            paid_at: new Date(),
            confirmed_by: adminId,
        })

        return orderDoc
    }

    // Calculate estimated delivery
    static calculateEstimatedDelivery(shippingAddress) {
        const now = new Date()
        const deliveryDays = 3 // Default 3 ngày

        // Logic tùy chỉnh theo địa chỉ
        if (
            shippingAddress.city === 'Hà Nội' ||
            shippingAddress.city === 'TP. Hồ Chí Minh'
        ) {
            now.setDate(now.getDate() + 2) // 2 ngày cho thành phố lớn
        } else {
            now.setDate(now.getDate() + deliveryDays)
        }

        return now
    }
}

module.exports = CheckoutService
