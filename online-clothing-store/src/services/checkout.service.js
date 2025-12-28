'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')
const CartRepository = require('../models/repositories/cart.repo')
const OrderRepository = require('../models/repositories/order.repo')
const ProductRepository = require('../models/repositories/product.repo')
const CouponRepository = require('../models/repositories/coupon.repo')
const CouponService = require('./coupon.service')
const AddressService = require('./address.service')
const { order } = require('../models/order.model')
const { buildOrderResponse } = require('../utils/order.mapper')

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
                // Xóa sản phẩm hết stock khỏi giỏ hàng
                // console.log(`Auto removing out-of-stock item: ${item.product_name} (${item.variant_sku})`)
                
                validationErrors.push({
                    sku: item.variant_sku,
                    product_name: item.product_name,
                    requested: item.quantity,
                    available: variant.stock_quantity,
                    error: 'Insufficient stock - Item removed from cart',
                })

                // Remove from cart immediately  
                try {
                    await CartRepository.update(cart._id, {
                        $pull: { items: { variant_sku: item.variant_sku } }
                    })
                } catch (error) {
                    console.error('Failed to remove item from cart:', error)
                }
                
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

        // Chỉ validate coupon nếu thực sự có coupon được apply
        if (cart.applied_coupon && cart.applied_coupon.code) {
            try {
                // Get category data for coupon validation
                const productIds = cart.items.map((item) => item.product_id._id.toString())
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

                couponDiscount = couponResult.discount
                couponInfo = {
                    coupon_id: couponResult.coupon_id,
                    code: couponResult.code,
                    discount: couponResult.discount,
                }
            } catch (error) {
                // Coupon lỗi thì bỏ qua, không block checkout
                // console.log('Coupon validation failed, proceeding without coupon:', error.message)
                // Không thêm vào validationErrors để không block checkout
            }
        }
        // Không có coupon = bình thường, không cần làm gì

        // 5. Tính total
        const total = Math.max(cart.subtotal + shippingFee - couponDiscount, 0)

        // console.log('🔍 REVIEW DEBUG - validationErrors:', validationErrors)
        // console.log('🔍 REVIEW DEBUG - validItems count:', validItems.length)
        // console.log('🔍 REVIEW DEBUG - cart items count:', cart.items.length)

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

    // Checkout - COMPLETE VERSION WITH PROPER LOGIC
    static async checkout(userId, { shipping_address, customer_note, payment_method = 'cod' }) {
        // 1. Review order (validation)
        const review = await this.reviewOrder(userId)
        if (!review.valid) {
            const errorMessages = review.errors.map(err => 
                `${err.product_name}: Yêu cầu ${err.requested}, chỉ còn ${err.available}`
            )
            throw new BadRequestError(`Giỏ hàng có vấn đề: ${errorMessages.join('; ')}`)
        }

        // 2. Get cart with populated products
        const cart = await CartRepository.findByUserId(userId, {
            populate: 'items.product_id'
        })
        if (!cart || cart.items.length === 0) {
            throw new BadRequestError('Cart is empty')
        }

        // 3. Resolve shipping address from address_id
        let resolvedShippingAddress
        if (shipping_address && shipping_address.address_id) {
            const addressData = await AddressService.getUserAddressById(userId, shipping_address.address_id)
            resolvedShippingAddress = addressData
        } else {
            throw new BadRequestError('Shipping address is required')
        }

        // 4. Generate order number
        const orderNumber = await order.generateOrderNumber()

        // 5. Prepare order data
        const orderData = {
            order_number: orderNumber,
            user_id: userId,
            items: cart.items.map(item => ({
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
            })),
            shipping_address: resolvedShippingAddress,
            payment_method: payment_method,
            payment_status: 'pending',
            subtotal: review.order_summary.subtotal,
            shipping_fee: review.order_summary.shipping_fee,
            discount: review.order_summary.discount,
            total: review.order_summary.total,
            applied_coupon: review.order_summary.coupon,
            customer_note,
            status: 'pending',
            status_history: [{
                status: 'pending',
                note: `Order created - ${payment_method.toUpperCase()} payment`,
                updated_by: userId,
                updated_at: new Date(),
            }],
        }

        // 6. Create order
        const newOrder = await OrderRepository.create(orderData)

        // 7. Update stock for all items
        for (const item of cart.items) {
            await ProductRepository.updateStock(
                item.product_id._id,
                item.variant_sku,
                -item.quantity
            )
        }

        // 8. Record coupon usage if applied
        if (cart.applied_coupon && cart.applied_coupon.coupon_id) {
            // Increment used_count in coupon
            await CouponRepository.incrementUsedCount(cart.applied_coupon.coupon_id)
            
            // Record usage history để track user nào đã sử dụng
            await CouponRepository.recordUsage({
                couponId: cart.applied_coupon.coupon_id,
                userId: userId,
                orderId: newOrder._id,
                discountAmount: review.order_summary.discount
            })
        }

        // 9. Clear cart
        await CartRepository.deleteById(cart._id)

        const successMessage = payment_method === 'cod' 
            ? 'Order created successfully. Please prepare cash for delivery.'
            : 'Order created successfully. Please complete payment to confirm your order.'

        return {
            order: newOrder,
            message: successMessage
        }
    }

    // Calculate shipping fee (có thể custom logic)
    // TEMPORARILY DISABLED: All shipping fees set to 0
    static calculateShippingFee(subtotal) {
        return 0 // Temporarily disabled all shipping fees
        
        // Original logic - DISABLED
        // if (subtotal >= 500000) {
        //     return 0 // Free ship cho đơn >= 500k
        // } else if (subtotal >= 300000) {
        //     return 20000 // Giảm shipping cho đơn >= 300k
        // } else {
        //     return 30000 // Phí ship thường
        // }
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
