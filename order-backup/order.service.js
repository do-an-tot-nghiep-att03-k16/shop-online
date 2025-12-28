'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')
const OrderRepository = require('../models/repositories/order.repo')
const ProductRepository = require('../models/repositories/product.repo')

class OrderService {
    // Lấy order theo ID
    static async getOrderById(orderId, userId, isAdmin = false) {
        const order = await OrderRepository.findById(orderId, {
            populate: [
                { path: 'user_id', select: 'name email phone' },
                { path: 'items.product_id', select: 'name slug' },
                {
                    path: 'applied_coupon.coupon_id',
                    select: 'code description',
                },
            ],
        })

        if (!order) {
            throw new NotFoundError('Order not found')
        }

        // Check quyền: user chỉ xem được order của mình
        if (!isAdmin && order.user_id._id.toString() !== userId) {
            throw new BadRequestError('Access denied')
        }

        return order
    }

    // Lấy order theo order number
    static async getOrderByNumber(orderNumber, userId, isAdmin = false) {
        const order = await OrderRepository.findByOrderNumber(orderNumber, {
            populate: [
                { path: 'user_id', select: 'name email phone' },
                { path: 'items.product_id', select: 'name slug' },
            ],
        })

        if (!order) {
            throw new NotFoundError('Order not found')
        }

        if (!isAdmin && order.user_id._id.toString() !== userId) {
            throw new BadRequestError('Access denied')
        }

        return order
    }

    // Lấy danh sách orders của user
    static async getUserOrders(userId, { page = 1, limit = 10, status }) {
        const skip = (page - 1) * limit
        const filter = status ? { status } : {}

        const [orders, total] = await Promise.all([
            OrderRepository.findByUserId(userId, {
                skip,
                limit,
                populate: [{ path: 'items.product_id', select: 'name slug' }],
            }),
            OrderRepository.countByUserId(userId, filter),
        ])

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    // Lấy tất cả orders (Admin)
    static async getAllOrders({
        page = 1,
        limit = 10,
        status,
        payment_status,
        sort = 'createdAt',
        order = 'desc',
    }) {
        const skip = (page - 1) * limit
        const filter = {}

        if (status) filter.status = status
        if (payment_status) filter.payment_status = payment_status

        const sortObj = {}
        sortObj[sort] = order === 'desc' ? -1 : 1

        const [orders, total] = await Promise.all([
            OrderRepository.findAll({
                filter,
                skip,
                limit,
                sort: sortObj,
                populate: [
                    { path: 'user_id', select: 'name email' },
                    { path: 'items.product_id', select: 'name' },
                ],
            }),
            OrderRepository.count(filter),
        ])

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    // Update order status (Admin)
    static async updateOrderStatus(orderId, status, note, adminId) {
        const order = await OrderRepository.findById(orderId)
        if (!order) {
            throw new NotFoundError('Order not found')
        }

        // Validate status transition
        const validTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['processing', 'cancelled'],
            processing: ['shipping', 'cancelled'],
            shipping: ['delivered', 'cancelled'],
            delivered: ['returned'],
        }

        const allowedStatuses = validTransitions[order.status] || []
        if (!allowedStatuses.includes(status)) {
            throw new BadRequestError(
                `Cannot change status from ${order.status} to ${status}`
            )
        }

        // Update delivered_at nếu status = delivered
        const updateData = {}
        if (status === 'delivered') {
            updateData.delivered_at = new Date()
        }

        const updatedOrder = await OrderRepository.updateStatus(
            orderId,
            status,
            note,
            adminId
        )

        if (updateData.delivered_at) {
            await OrderRepository.updateById(orderId, updateData)
        }

        return updatedOrder
    }

    // Cancel order
    static async cancelOrder(orderId, reason, userId, isAdmin = false) {
        const order = await OrderRepository.findById(orderId)
        if (!order) {
            throw new NotFoundError('Order not found')
        }

        // Check quyền
        if (!isAdmin && order.user_id.toString() !== userId) {
            throw new BadRequestError('Access denied')
        }

        // Check có thể cancel không
        if (!order.can_cancel) {
            throw new BadRequestError('Order cannot be cancelled at this stage')
        }

        // Cancel order
        const cancelledOrder = await OrderRepository.cancelOrder(
            orderId,
            reason,
            userId
        )

        // Hoàn stock
        for (const item of order.items) {
            await ProductRepository.updateStock(
                item.product_id,
                item.variant_sku,
                item.quantity
            )
        }

        // TODO: Hoàn tiền nếu đã thanh toán

        return cancelledOrder
    }

    // Update tracking info (Admin)
    static async updateTracking(
        orderId,
        { tracking_number, shipping_provider }
    ) {
        const order = await OrderRepository.findById(orderId)
        if (!order) {
            throw new NotFoundError('Order not found')
        }

        return await OrderRepository.updateById(orderId, {
            tracking_number,
            shipping_provider,
        })
    }

    // Update payment status (Admin/System)
    static async updatePaymentStatus(orderId, status, details = {}) {
        const order = await OrderRepository.findById(orderId)
        if (!order) {
            throw new NotFoundError('Order not found')
        }

        return await OrderRepository.updatePaymentStatus(
            orderId,
            status,
            details
        )
    }

    // Get order statistics
    static async getOrderStats(userId = null) {
        const stats = await OrderRepository.getOrderStats(userId)

        const summary = {
            total_orders: 0,
            total_revenue: 0,
            by_status: {},
        }

        stats.forEach((stat) => {
            summary.total_orders += stat.count
            summary.total_revenue += stat.total_amount
            summary.by_status[stat._id] = {
                count: stat.count,
                revenue: stat.total_amount,
            }
        })

        return summary
    }

    // Get revenue by date range (Admin)
    static async getRevenue(startDate, endDate) {
        const revenue = await OrderRepository.getRevenueByDateRange(
            new Date(startDate),
            new Date(endDate)
        )

        return revenue.map((item) => ({
            date: `${item._id.year}-${item._id.month}-${item._id.day}`,
            revenue: item.revenue,
            order_count: item.order_count,
        }))
    }

    // Return order
    static async returnOrder(orderId, reason, userId) {
        const order = await OrderRepository.findById(orderId)
        if (!order) {
            throw new NotFoundError('Order not found')
        }

        // Check quyền
        if (order.user_id.toString() !== userId) {
            throw new BadRequestError('Access denied')
        }

        // Check có thể return không
        if (!order.can_return) {
            throw new BadRequestError('Order cannot be returned')
        }

        // Update order
        const returnedOrder = await OrderRepository.updateById(orderId, {
            status: 'returned',
            return_reason: reason,
            returned_at: new Date(),
        })

        // Hoàn stock
        for (const item of order.items) {
            await ProductRepository.updateStock(
                item.product_id,
                item.variant_sku,
                item.quantity
            )
        }

        return returnedOrder
    }

    // Auto-cancel pending orders (Cron job)
    static async autoCancelPendingOrders(hoursAgo = 24) {
        const pendingOrders = await OrderRepository.findPendingOrders(hoursAgo)

        const results = []
        for (const order of pendingOrders) {
            try {
                await this.cancelOrder(
                    order._id,
                    'Auto-cancelled due to no payment',
                    null,
                    true
                )
                results.push({
                    order_id: order._id,
                    order_number: order.order_number,
                    status: 'cancelled',
                })
            } catch (error) {
                results.push({
                    order_id: order._id,
                    order_number: order.order_number,
                    status: 'failed',
                    error: error.message,
                })
            }
        }

        return results
    }
}

module.exports = OrderService
