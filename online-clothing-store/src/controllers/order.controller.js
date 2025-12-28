'use strict'

const { CREATED, SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const OrderService = require('../services/order.service')
const CheckoutService = require('../services/checkout.service')
const { buildOrderResponse } = require('../utils/order.mapper')

class OrderController {
    // GET /order/review - Review order trước khi checkout
    reviewOrder = async (req, res, next) => {
        const userId = req.userId
        
        const reviewResult = await CheckoutService.reviewOrder(userId)
        
        // Nếu validation fail, throw error với message rõ ràng
        if (!reviewResult.valid) {
            const errorMessages = reviewResult.errors.map(err => {
                if (err.error === 'Insufficient stock') {
                    return `${err.product_name}: Yêu cầu ${err.requested}, chỉ còn ${err.available}`
                }
                return err.error
            })
            
            throw new BadRequestError(`Giỏ hàng có vấn đề: ${errorMessages.join('; ')}`)
        }

        new SuccessResponse({
            message: 'Order review completed',
            metadata: reviewResult,
        }).send(res)
    }

    // POST /order/checkout - Tạo order từ cart (hỗ trợ COD và QR payment)
    checkout = async (req, res, next) => {
        const userId = req.userId
        const { shipping_address, customer_note, payment_method = 'cod' } = req.body

        if (!shipping_address) {
            throw new BadRequestError('Shipping address is required')
        }

        // Validate payment method
        const validPaymentMethods = ['cod', 'sepay_qr']
        if (!validPaymentMethods.includes(payment_method)) {
            throw new BadRequestError('Invalid payment method')
        }

        const checkoutResult = await CheckoutService.checkout(userId, {
            shipping_address,
            customer_note,
            payment_method,
        })

        new CREATED({
            message: 'Order created successfully',
            metadata: {
                order: checkoutResult.order,
                message: checkoutResult.message
            },
        }).send(res)
    }

    // Lấy order theo ID
    getOrderById = async (req, res, next) => {
        const { orderId } = req.params
        const userId = req.userId
        const isAdmin = req.role === 'admin'

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        const order = await OrderService.getOrderById(orderId, userId, isAdmin)

        new SuccessResponse({
            message: 'Get order success!',
            metadata: buildOrderResponse(order),
        }).send(res)
    }

    // Lấy order theo order number
    getOrderByNumber = async (req, res, next) => {
        const { orderNumber } = req.params
        const userId = req.userId
        const isAdmin = req.role === 'admin'

        if (!orderNumber) {
            throw new BadRequestError('Order number is required')
        }

        const order = await OrderService.getOrderByNumber(orderNumber, userId, isAdmin)

        new SuccessResponse({
            message: 'Get order success!',
            metadata: buildOrderResponse(order),
        }).send(res)
    }

    // Lấy danh sách orders của user hiện tại
    getUserOrders = async (req, res, next) => {
        const userId = req.userId
        // console.log('🔍 DEBUG - userId from request:', userId)
        
        const {
            page = 1,
            limit = 10,
            status,
        } = req.query

        const result = await OrderService.getUserOrders(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
        })
        
        // console.log('🔍 DEBUG - Service result:', {
        //     ordersCount: result.orders?.length || 0,
        //     pagination: result.pagination
        // })

        // Use mapper to transform orders - duyệt qua products và gắn images
        if (result.orders) {
            result.orders = result.orders.map(order => buildOrderResponse(order))
        }

        new SuccessResponse({
            message: 'Get user orders success!',
            metadata: result,
        }).send(res)
    }

    // Lấy tất cả orders (Admin only)
    getAllOrders = async (req, res, next) => {
        const {
            page = 1,
            limit = 10,
            status,
            payment_status,
            sort = 'createdAt',
            order = 'desc',
        } = req.query

        const result = await OrderService.getAllOrders({
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            payment_status,
            sort,
            order,
        })

        // Transform orders for admin view
        const transformedResult = {
            ...result,
            orders: result.orders.map(order => buildOrderResponse(order))
        }

        new SuccessResponse({
            message: 'Get all orders success!',
            metadata: transformedResult,
        }).send(res)
    }

    // Update order status (Admin only)
    updateOrderStatus = async (req, res, next) => {
        const { orderId } = req.params
        const { status, note } = req.body
        const adminId = req.userId

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!status) {
            throw new BadRequestError('Status is required')
        }

        new SuccessResponse({
            message: 'Update order status success!',
            metadata: await OrderService.updateOrderStatus(orderId, status, note, adminId),
        }).send(res)
    }

    // Cancel order
    cancelOrder = async (req, res, next) => {
        const { orderId } = req.params
        const { reason } = req.body
        const userId = req.userId
        const isAdmin = req.role === 'admin'

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!reason) {
            throw new BadRequestError('Cancellation reason is required')
        }

        new SuccessResponse({
            message: 'Cancel order success!',
            metadata: await OrderService.cancelOrder(orderId, reason, userId, isAdmin),
        }).send(res)
    }

    // Bulk cancel orders
    bulkCancelOrders = async (req, res, next) => {
        const { orderIds, reason } = req.body
        const userId = req.userId
        const isAdmin = req.role === 'admin'

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new BadRequestError('Order IDs array is required')
        }

        if (!reason) {
            throw new BadRequestError('Cancellation reason is required')
        }

        new SuccessResponse({
            message: 'Bulk cancel orders success!',
            metadata: await OrderService.bulkCancelOrders(orderIds, reason, userId, isAdmin),
        }).send(res)
    }

    // Return order (User only)
    returnOrder = async (req, res, next) => {
        const { orderId } = req.params
        const { reason } = req.body
        const userId = req.userId

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!reason) {
            throw new BadRequestError('Return reason is required')
        }

        new SuccessResponse({
            message: 'Return order success!',
            metadata: await OrderService.returnOrder(orderId, reason, userId),
        }).send(res)
    }

    // Update tracking info (Admin only)
    updateTracking = async (req, res, next) => {
        const { orderId } = req.params
        const { tracking_number, shipping_provider } = req.body

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        new SuccessResponse({
            message: 'Update tracking info success!',
            metadata: await OrderService.updateTracking(orderId, {
                tracking_number,
                shipping_provider,
            }),
        }).send(res)
    }

    // Update payment status (Admin only)
    updatePaymentStatus = async (req, res, next) => {
        const { orderId } = req.params
        const { status, details = {} } = req.body
        
        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!status) {
            throw new BadRequestError('Payment status is required')
        }

        // Add confirmed_by if status is paid
        if (status === 'paid') {
            details.confirmed_by = req.userId
        }

        new SuccessResponse({
            message: 'Update payment status success!',
            metadata: await OrderService.updatePaymentStatus(orderId, status, details),
        }).send(res)
    }

    // Get order statistics
    getOrderStats = async (req, res, next) => {
        const { userId } = req.query
        const requestUserId = req.userId
        const isAdmin = req.role === 'admin'

        // User chỉ xem được stats của mình, admin xem được tất cả
        const targetUserId = isAdmin ? userId : requestUserId
        
        // console.log('🔍 STATS DEBUG - targetUserId:', targetUserId)
        // console.log('🔍 STATS DEBUG - isAdmin:', isAdmin)
        
        const stats = await OrderService.getOrderStats(targetUserId)
        // console.log('🔍 STATS DEBUG - Final stats:', JSON.stringify(stats, null, 2))

        new SuccessResponse({
            message: 'Get order statistics success!',
            metadata: stats,
        }).send(res)
    }

    // Get revenue by date range (Admin only)
    getRevenue = async (req, res, next) => {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            throw new BadRequestError('Start date and end date are required')
        }

        new SuccessResponse({
            message: 'Get revenue success!',
            metadata: await OrderService.getRevenue(startDate, endDate),
        }).send(res)
    }

    // Auto cancel pending orders (Cron job / Admin only)
    autoCancelPendingOrders = async (req, res, next) => {
        const { hoursAgo = 24 } = req.query

        new SuccessResponse({
            message: 'Auto cancel pending orders success!',
            metadata: await OrderService.autoCancelPendingOrders(parseInt(hoursAgo)),
        }).send(res)
    }
}

module.exports = new OrderController()