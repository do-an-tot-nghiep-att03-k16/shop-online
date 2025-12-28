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
                {
                    path: 'items.product_id',
                    select: 'name slug product_images product_thumb isPublished is_active status',
                    // Admin thấy tất cả product info, user chỉ cần basic info
                },
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
                {
                    path: 'items.product_id',
                    select: 'name slug product_images product_thumb',
                },
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
        let filter = {}
        
        // Hỗ trợ multiple status: "pending,confirmed,shipping" hoặc single "pending"
        if (status) {
            if (status.includes(',')) {
                // Multiple statuses: "pending,confirmed,shipping"
                const statusArray = status.split(',').map(s => s.trim())
                filter.status = { $in: statusArray }
            } else {
                // Single status: "pending"
                filter.status = status
            }
        }

        const [orders, total] = await Promise.all([
            OrderRepository.findByUserId(userId, {
                skip,
                limit,
                filter, // Truyền filter vào repository
                populate: [
                    {
                        path: 'items.product_id',
                        select: 'name slug product_images product_thumb',
                    },
                ],
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

    // Lấy tất cả orders (Admin) - KHÔNG filter products để admin thấy tất cả
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

        // Hỗ trợ multiple status cho admin giống như getUserOrders
        if (status) {
            if (status.includes(',')) {
                // Multiple statuses: "pending,confirmed,processing,shipping"
                const statusArray = status.split(',').map(s => s.trim())
                filter.status = { $in: statusArray }
            } else {
                // Single status: "pending"
                filter.status = status
            }
        }
        
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
                    {
                        path: 'items.product_id',
                        select: 'name slug product_images product_thumb isPublished is_active status',
                        // KHÔNG dùng match để admin thấy tất cả products, kể cả unpublished/inactive
                    },
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

    // Cancel order - NO TRANSACTION
    static async cancelOrder(orderId, reason, userId, isAdmin = false) {
        const order = await OrderRepository.findById(orderId)
        if (!order) {
            throw new NotFoundError('Order not found')
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

        // Hoàn stock với session
        const stockRestorations = []
        for (const item of order.items) {
            const restoreResult = await ProductRepository.updateStock(
                item.product_id,
                item.variant_sku,
                item.quantity // Hoàn lại stock (số dương)
            )

            if (!restoreResult) {
                throw new BadRequestError(
                    `Failed to restore stock for product ${item.product_name}`
                )
            }

            stockRestorations.push({
                productId: item.product_id,
                sku: item.variant_sku,
                quantity: item.quantity,
            })
        }

        // TODO: Hoàn tiền nếu đã thanh toán (implement với session)

        return {
            order: cancelledOrder,
            stock_restorations: stockRestorations,
        }
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

    // Get order statistics - sửa logic để trả đúng dữ liệu
    static async getOrderStats(userId = null) {
        // Lấy thống kê theo status
        const stats = await OrderRepository.getOrderStats(userId)

        // Lấy thống kê paid orders riêng
        const paidStats = await OrderRepository.getPaidOrderStats(userId)

        let summary = {
            total_orders: 0,
            completed_orders: 0,
            pending_orders: 0,
            paid_orders: 0,
            total_spent: 0,
        }

        // Xử lý stats theo status
        stats.forEach((stat) => {
            const status = stat._id
            const count = stat.count || 0

            // Tổng đơn hàng
            summary.total_orders += count

            // Đã hoàn thành
            if (status === 'delivered') {
                summary.completed_orders += count
            }

            // Đang xử lý (tất cả status trừ delivered và cancelled) 
            if (
                [
                    'pending',
                    'confirmed',
                    'processing',
                    'shipping',
                ].includes(status)
            ) {
                summary.pending_orders += count
            }
        })

        // Xử lý paid orders
        if (paidStats && paidStats.length > 0) {
            summary.paid_orders = paidStats[0].count || 0
            summary.total_spent = paidStats[0].total_spent || 0
        }

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

    // Return order - NO TRANSACTION
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

        // Update order với session
        const returnedOrder = await OrderRepository.updateById(orderId, {
            status: 'returned',
            return_reason: reason,
            returned_at: new Date(),
        })

        // Hoàn stock với session
        const stockRestorations = []
        for (const item of order.items) {
            const restoreResult = await ProductRepository.updateStock(
                item.product_id,
                item.variant_sku,
                item.quantity // Hoàn lại stock
            )

            if (!restoreResult) {
                throw new BadRequestError(
                    `Failed to restore stock for returned product ${item.product_name}`
                )
            }

            stockRestorations.push({
                productId: item.product_id,
                sku: item.variant_sku,
                quantity: item.quantity,
            })
        }

        return {
            order: returnedOrder,
            stock_restorations: stockRestorations,
        }
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

    // Bulk cancel orders - hủy nhiều orders cùng lúc
    static async bulkCancelOrders(orderIds, reason, userId, isAdmin = false) {
        const success = []
        const failed = []

        for (const orderId of orderIds) {
            try {
                const cancelResult = await this.cancelOrder(
                    orderId,
                    reason,
                    userId
                )

                success.push({
                    order_id: orderId,
                    order_number: cancelResult.order.order_number,
                    status: cancelResult.order.status,
                    total: cancelResult.order.total,
                })
            } catch (error) {
                failed.push({
                    order_id: orderId,
                    error: error.message,
                })
            }
        }

        return {
            failed: failed,
            failed_to_cancel: failed.length,
            success: success,
            successfully_cancelled: success.length,
            total_requested: orderIds.length,
        }
    }
}

module.exports = OrderService
