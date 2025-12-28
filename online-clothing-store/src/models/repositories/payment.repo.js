'use strict'

const Payment = require('../payment.model')

class PaymentRepository {
    // Tạo payment mới
    static async createPayment(paymentData) {
        return await Payment.create(paymentData)
    }

    // Tìm payment theo transaction code
    static async findByTransactionCode(transaction_code) {
        return await Payment.findByTransactionCode(transaction_code)
    }

    // Tìm payment theo order ID
    static async findByOrderId(order_id) {
        return await Payment.findByOrderId(order_id)
    }

    // Tìm payments của user
    static async findByUserId(user_id, options = {}) {
        const {
            status = null,
            limit = 20,
            skip = 0,
            sort = { createdAt: -1 }
        } = options

        const query = { user_id }
        if (status) {
            query.status = status
        }

        return await Payment.find(query)
            .limit(limit)
            .skip(skip)
            .sort(sort)
            .lean()
    }

    // Cập nhật payment status
    static async updatePaymentStatus(transaction_code, updateData) {
        return await Payment.findOneAndUpdate(
            { transaction_code },
            { 
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        )
    }

    // Đánh dấu payment hoàn thành
    static async markAsCompleted(transaction_code, sepayData) {
        const payment = await Payment.findOne({ transaction_code })
        if (!payment) {
            throw new Error('Payment not found')
        }

        return await payment.markAsCompleted(sepayData)
    }

    // Đánh dấu payment thất bại
    static async markAsFailed(transaction_code, reason) {
        const payment = await Payment.findOne({ transaction_code })
        if (!payment) {
            throw new Error('Payment not found')
        }

        return await payment.markAsFailed(reason)
    }

    // Đánh dấu payment bị hủy
    static async markAsCancelled(transaction_code, reason) {
        const payment = await Payment.findOne({ transaction_code })
        if (!payment) {
            throw new Error('Payment not found')
        }

        return await payment.markAsCancelled(reason)
    }

    // Tìm payments đang chờ xử lý
    static async findPendingPayments() {
        return await Payment.findPendingPayments()
    }

    // Tìm payments đã hết hạn
    static async findExpiredPayments() {
        return await Payment.findExpiredPayments()
    }

    // Thống kê payments
    static async getPaymentStats(userId = null) {
        return await Payment.getPaymentStats(userId)
    }

    // Auto cleanup expired payments (chạy bằng cron job)
    static async cleanupExpiredPayments() {
        const expiredPayments = await Payment.findExpiredPayments()
        
        const results = await Promise.all(
            expiredPayments.map(async (payment) => {
                try {
                    payment.status = 'expired'
                    await payment.save()
                    return { success: true, transaction_code: payment.transaction_code }
                } catch (error) {
                    return { success: false, transaction_code: payment.transaction_code, error: error.message }
                }
            })
        )

        return {
            total_expired: expiredPayments.length,
            updated: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        }
    }

    // Lấy payment history cho user
    static async getPaymentHistory(user_id, options = {}) {
        const {
            page = 1,
            limit = 10,
            status = null,
            from_date = null,
            to_date = null
        } = options

        const query = { user_id }

        // Filter theo status
        if (status && status !== 'all') {
            query.status = status
        }

        // Filter theo date range
        if (from_date || to_date) {
            query.createdAt = {}
            if (from_date) query.createdAt.$gte = new Date(from_date)
            if (to_date) query.createdAt.$lte = new Date(to_date)
        }

        const skip = (page - 1) * limit

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .populate('user_id', 'name email')
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 })
                .lean(),
            Payment.countDocuments(query)
        ])

        return {
            payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    // Kiểm tra xem user có payment pending nào không
    static async hasPendingPayment(user_id) {
        const pendingPayment = await Payment.findOne({
            user_id,
            status: 'pending',
            expires_at: { $gt: new Date() }
        })

        return !!pendingPayment
    }
}

module.exports = PaymentRepository