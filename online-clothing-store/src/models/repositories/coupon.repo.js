'use strict'

const { coupon } = require('../coupon.model')
const { couponUsage } = require('../couponUsage.model')

class CouponRepository {
    // Tạo coupon mới
    static async create(couponData) {
        return await coupon.create(couponData)
    }

    // Tìm coupon theo ID
    static async findById(couponId, options = {}) {
        const query = coupon.findById(couponId)

        if (options.populate) {
            query.populate(options.populate)
        }

        if (options.select) {
            query.select(options.select)
        }

        return await query.lean()
    }

    // Tìm coupon theo code
    static async findByCode(code, options = {}) {
        const query = coupon.findOne({ code: code.toUpperCase() })

        if (options.populate) {
            query.populate(options.populate)
        }

        return await query.lean()
    }

    // Lấy tất cả coupons
    static async findAll({
        filter = {},
        sort = {},
        skip = 0,
        limit = 10,
        populate,
    } = {}) {
        const query = coupon.find(filter).sort(sort).skip(skip).limit(limit)

        if (populate) {
            query.populate(populate)
        }

        return await query.lean()
    }

    // Đếm số lượng coupons
    static async count(filter = {}) {
        return await coupon.countDocuments(filter)
    }

    // Update coupon theo ID
    static async updateById(couponId, updateData) {
        return await coupon
            .findByIdAndUpdate(couponId, updateData, {
                new: true,
                runValidators: true,
            })
            .lean()
    }

    // Xóa coupon
    static async deleteById(couponId) {
        return await coupon.findByIdAndDelete(couponId)
    }

    // Tìm coupons còn hiệu lực
    static async findActiveCoupons({ skip = 0, limit = 10, additionalFilter = {} } = {}) {
        const now = new Date()
        const baseFilter = {
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now },
        }
        
        // Merge additional filters for security
        const filter = { ...baseFilter, ...additionalFilter }
        
        return await coupon
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    }

    // Tăng used_count
    static async incrementUsedCount(couponId) {
        return await coupon.findByIdAndUpdate(
            couponId,
            { $inc: { used_count: 1 } },
            { new: true }
        )
    }

    // Tăng used_count với session (for transactions)
    static async incrementUsedCountWithSession(couponId, session) {
        return await coupon.findByIdAndUpdate(
            couponId,
            { $inc: { used_count: 1 } },
            { new: true, session }
        )
    }

    // Tìm coupons áp dụng cho category
    static async findByCategory(categoryId, { skip = 0, limit = 10, additionalFilter = {} } = {}) {
        const now = new Date()
        const baseFilter = {
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now },
            applicable_categories: categoryId,
        }
        
        // Merge additional filters for security
        const filter = { ...baseFilter, ...additionalFilter }
        
        return await coupon
            .find(filter)
            .skip(skip)
            .limit(limit)
            .lean()
    }

    // Tìm coupons áp dụng cho product
    static async findByProduct(productId, { skip = 0, limit = 10, additionalFilter = {} } = {}) {
        const now = new Date()
        const baseFilter = {
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now },
            applicable_products: productId,
        }
        
        // Merge additional filters for security
        const filter = { ...baseFilter, ...additionalFilter }
        
        return await coupon
            .find(filter)
            .skip(skip)
            .limit(limit)
            .lean()
    }

    // Lấy số lần user đã dùng coupon
    static async getUserUsageCount(couponId, userId) {
        return await couponUsage.countDocuments({
            coupon_id: couponId,
            user_id: userId,
        })
    }

    // Lưu lịch sử sử dụng coupon
    static async recordUsage({ couponId, userId, orderId, discountAmount }) {
        return await couponUsage.create({
            coupon_id: couponId,
            user_id: userId,
            order_id: orderId,
            discount_amount: discountAmount,
        })
    }

    // Lấy lịch sử sử dụng của user
    static async getUserUsageHistory(
        userId,
        couponId,
        { skip = 0, limit = 10 } = {}
    ) {
        return await couponUsage
            .find({
                user_id: userId,
                ...(couponId && { coupon_id: couponId }),
            })
            .populate('coupon_id', 'code discount_type discount_value')
            .populate('order_id', 'order_number total_amount')
            .sort({ used_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    }

    // Tìm coupons sắp hết hạn
    static async findExpiringSoon(days = 7) {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + days)

        return await coupon
            .find({
                is_active: true,
                end_date: {
                    $gte: now,
                    $lte: futureDate,
                },
            })
            .lean()
    }

    // Kiểm tra code có tồn tại không
    static async checkCodeExists(code, excludeId = null) {
        const query = { code: code.toUpperCase() }
        if (excludeId) {
            query._id = { $ne: excludeId }
        }
        return await coupon.exists(query)
    }
}

module.exports = CouponRepository
