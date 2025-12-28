'use strict'

const { order } = require('../order.model')

class OrderRepository {
    // Tạo order mới
    static async create(orderData) {
        return await order.create(orderData)
    }

    // Tạo order mới với session (for transactions)
    static async createWithSession(orderData, session) {
        return await order.create([orderData], { session })
    }

    // Tìm order theo ID
    static async findById(orderId, options = {}) {
        const query = order.findById(orderId)

        if (options.populate) {
            query.populate(options.populate)
        }

        return await query
    }

    // Tìm order theo ID với session (for transactions)
    static async findByIdWithSession(orderId, session, options = {}) {
        const query = order.findById(orderId).session(session)

        if (options.populate) {
            query.populate(options.populate)
        }

        return await query
    }

    // Tìm order theo order number
    static async findByOrderNumber(orderNumber, options = {}) {
        const query = order.findOne({ order_number: orderNumber })

        if (options.populate) {
            query.populate(options.populate)
        }

        return await query
    }

    // Lấy orders của user
    static async findByUserId(userId, options = {}) {
        const { skip = 0, limit = 10, filter = {}, populate = [], sort = { createdAt: -1 } } = options
        
        // Combine user filter with additional filters (including status filter)
        const queryFilter = { user_id: userId, ...filter }

        return await order
            .find(queryFilter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
    }

    // Đếm orders của user
    static async countByUserId(userId, filter = {}) {
        return await order.countDocuments({ user_id: userId, ...filter })
    }

    // Lấy tất cả orders (admin)
    static async findAll(options = {}) {
        const {
            filter = {},
            skip = 0,
            limit = 10,
            sort = { createdAt: -1 },
        } = options

        return await order
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(options.populate || [])
    }

    // Đếm tất cả orders
    static async count(filter = {}) {
        return await order.countDocuments(filter)
    }

    // Update order
    static async updateById(orderId, updateData) {
        return await order.findByIdAndUpdate(orderId, updateData, {
            new: true,
            runValidators: true,
        })
    }

    // Update order với session (for transactions)
    static async updateByIdWithSession(orderId, updateData, session) {
        return await order.findByIdAndUpdate(orderId, updateData, {
            new: true,
            runValidators: true,
            session
        })
    }

    // Update status
    static async updateStatus(orderId, status, note, userId) {
        const orderDoc = await order.findById(orderId)
        if (!orderDoc) return null

        orderDoc.addStatusHistory(status, note, userId)
        return await orderDoc.save()
    }

    // Cancel order
    static async cancelOrder(orderId, reason, userId) {
        const orderDoc = await order.findById(orderId)
        if (!orderDoc) return null

        orderDoc.cancelOrder(reason, userId)
        return await orderDoc.save({ validateBeforeSave: false }) // Skip validation for legacy data
    }

    // Cancel order với session (for transactions)
    static async cancelOrderWithSession(orderId, reason, userId, session) {
        const orderDoc = await order.findById(orderId).session(session)
        if (!orderDoc) return null

        orderDoc.cancelOrder(reason, userId)
        return await orderDoc.save({ session })
    }

    // Update payment status
    static async updatePaymentStatus(orderId, status, details) {
        const orderDoc = await order.findById(orderId)
        if (!orderDoc) return null

        orderDoc.updatePaymentStatus(status, details)
        return await orderDoc.save()
    }

    // Tìm orders theo status
    static async findByStatus(status, options = {}) {
        const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options

        return await order
            .find({ status })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(options.populate || [])
    }

    // Tìm orders theo payment status
    static async findByPaymentStatus(paymentStatus, options = {}) {
        const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options

        return await order
            .find({ payment_status: paymentStatus })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(options.populate || [])
    }

    // Tìm orders cần xử lý (pending quá lâu)
    static async findPendingOrders(hoursAgo = 24) {
        const cutoffDate = new Date()
        cutoffDate.setHours(cutoffDate.getHours() - hoursAgo)

        return await order.find({
            status: 'pending',
            payment_status: 'pending',
            createdAt: { $lt: cutoffDate },
        })
    }

    // Statistics
    static async getOrderStats(userId = null) {
        let filter = {}
        
        // CRITICAL: Đảm bảo userId được convert đúng ObjectId
        if (userId) {
            const { Types } = require('mongoose')
            filter.user_id = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId
        }

        const stats = await order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total_amount: { $sum: '$total' },
                },
            },
        ])
        return stats
    }

    // Get paid orders statistics
    static async getPaidOrderStats(userId = null) {
        const filter = { payment_status: 'paid' }
        
        // CRITICAL: Đảm bảo userId được convert đúng ObjectId  
        if (userId) {
            const { Types } = require('mongoose')
            filter.user_id = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId
        }

        const stats = await order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    total_spent: { $sum: '$total' },
                },
            },
        ])

        return stats
    }

    // Revenue by date range
    static async getRevenueByDateRange(startDate, endDate) {
        return await order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    payment_status: 'paid',
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    revenue: { $sum: '$total' },
                    order_count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ])
    }
}

module.exports = OrderRepository
