'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')
const CouponRepository = require('../models/repositories/coupon.repo')
const CouponBuilder = require('../builders/coupon.builder')
const { removeUndefinedObject } = require('../utils')

class CouponService {
    // Tạo coupon mới với Builder
    static async createCoupon({
        code,
        description,
        discount_type,
        discount_value,
        min_order_value = 0,
        max_discount = null,
        usage_limit = null,
        usage_limit_per_user = 1,
        start_date,
        end_date,
        applicable_categories = [],
        applicable_products = [],
        is_active = true,
    }) {
        // Check code đã tồn tại chưa
        const codeExists = await CouponRepository.checkCodeExists(code.toUpperCase())
        if (codeExists) {
            throw new BadRequestError('Coupon code already exists')
        }

        // Sử dụng Builder để tạo coupon
        const couponPayload = new CouponBuilder()
            .withCode(code)
            .withDescription(description)
            .withDiscountType(discount_type)
            .withDiscountValue(discount_value)
            .withMinOrderValue(min_order_value)
            .withMaxDiscount(max_discount)
            .withUsageLimit(usage_limit)
            .withUsageLimitPerUser(usage_limit_per_user)
            .withDateRange(start_date, end_date)
            .withApplicableCategories(applicable_categories)
            .withApplicableProducts(applicable_products)
            .withIsActive(is_active)
            .build()

        return await CouponRepository.create(removeUndefinedObject(couponPayload))
    }

    // Tạo coupon giảm % nhanh
    static async createPercentageCoupon({
        code,
        percent,
        max_discount = null,
        min_order_value = 0,
        start_date,
        end_date,
        description = '',
        applicable_categories = [],
        applicable_products = [],
    }) {
        const codeExists = await CouponRepository.checkCodeExists(code.toUpperCase())
        if (codeExists) {
            throw new BadRequestError('Coupon code already exists')
        }

        const couponPayload = new CouponBuilder()
            .withCode(code)
            .withDescription(description)
            .asPercentageDiscount(percent, max_discount)
            .withMinOrderValue(min_order_value)
            .withDateRange(start_date, end_date)
            .withApplicableCategories(applicable_categories)
            .withApplicableProducts(applicable_products)
            .build()

        return await CouponRepository.create(removeUndefinedObject(couponPayload))
    }

    // Tạo coupon giảm số tiền cố định nhanh
    static async createFixedCoupon({
        code,
        amount,
        min_order_value = 0,
        start_date,
        end_date,
        description = '',
        applicable_categories = [],
        applicable_products = [],
    }) {
        const codeExists = await CouponRepository.checkCodeExists(code.toUpperCase())
        if (codeExists) {
            throw new BadRequestError('Coupon code already exists')
        }

        const couponPayload = new CouponBuilder()
            .withCode(code)
            .withDescription(description)
            .asFixedDiscount(amount)
            .withMinOrderValue(min_order_value)
            .withDateRange(start_date, end_date)
            .withApplicableCategories(applicable_categories)
            .withApplicableProducts(applicable_products)
            .build()

        return await CouponRepository.create(removeUndefinedObject(couponPayload))
    }

    // Tạo coupon cho khách hàng mới
    static async createNewCustomerCoupon({
        code,
        discount_type,
        discount_value,
        max_discount = null,
        start_date,
        end_date,
        description = 'Dành cho khách hàng mới',
    }) {
        const codeExists = await CouponRepository.checkCodeExists(code.toUpperCase())
        if (codeExists) {
            throw new BadRequestError('Coupon code already exists')
        }

        const builder = new CouponBuilder()
            .withCode(code)
            .withDescription(description)
            .withDiscountType(discount_type)
            .withDiscountValue(discount_value)
            .withDateRange(start_date, end_date)
            .asNewCustomerCoupon()

        if (max_discount) {
            builder.withMaxDiscount(max_discount)
        }

        const couponPayload = builder.build()
        return await CouponRepository.create(removeUndefinedObject(couponPayload))
    }

    // Tạo Flash Sale coupon
    static async createFlashSaleCoupon({
        code,
        discount_type,
        discount_value,
        total_limit,
        max_discount = null,
        start_date,
        end_date,
        description = 'Flash Sale - Số lượng có hạn',
    }) {
        const codeExists = await CouponRepository.checkCodeExists(code.toUpperCase())
        if (codeExists) {
            throw new BadRequestError('Coupon code already exists')
        }

        const builder = new CouponBuilder()
            .withCode(code)
            .withDescription(description)
            .withDiscountType(discount_type)
            .withDiscountValue(discount_value)
            .withDateRange(start_date, end_date)
            .asFlashSale(total_limit)

        if (max_discount) {
            builder.withMaxDiscount(max_discount)
        }

        const couponPayload = builder.build()
        return await CouponRepository.create(removeUndefinedObject(couponPayload))
    }

    // Lấy coupon theo ID
    static async getCouponById(couponId) {
        const coupon = await CouponRepository.findById(couponId, {
            populate: [
                { path: 'applicable_categories', select: 'name slug' },
                { path: 'applicable_products', select: 'name slug' },
            ],
        })

        if (!coupon) {
            throw new NotFoundError('Coupon not found')
        }

        return coupon
    }

    // Lấy coupon theo code
    static async getCouponByCode(code) {
        const coupon = await CouponRepository.findByCode(code, {
            populate: [
                { path: 'applicable_categories', select: 'name slug' },
                { path: 'applicable_products', select: 'name slug' },
            ],
        })

        if (!coupon) {
            throw new NotFoundError('Coupon not found')
        }

        return coupon
    }

    // Lấy tất cả coupons
    static async getAllCoupons({
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        is_active,
    }) {
        const skip = (page - 1) * limit
        const filter = {}
        
        if (is_active !== undefined) {
            filter.is_active = is_active
        }

        const sortObj = {}
        sortObj[sort] = order === 'desc' ? -1 : 1

        const [coupons, total] = await Promise.all([
            CouponRepository.findAll({
                filter,
                sort: sortObj,
                skip,
                limit,
                populate: [
                    { path: 'applicable_categories', select: 'name slug' },
                    { path: 'applicable_products', select: 'name slug' },
                ],
            }),
            CouponRepository.count(filter),
        ])

        return {
            coupons,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    // Lấy coupons còn hiệu lực
    static async getActiveCoupons({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit
        const coupons = await CouponRepository.findActiveCoupons({ skip, limit })

        return {
            coupons,
            pagination: {
                page,
                limit,
                total: coupons.length,
            },
        }
    }

    // Update coupon
    static async updateCoupon(couponId, updateData) {
        const coupon = await CouponRepository.findById(couponId)
        if (!coupon) {
            throw new NotFoundError('Coupon not found')
        }

        // Nếu update code, check trùng
        if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
            const codeExists = await CouponRepository.checkCodeExists(
                updateData.code.toUpperCase(),
                couponId
            )
            if (codeExists) {
                throw new BadRequestError('Coupon code already exists')
            }
            updateData.code = updateData.code.toUpperCase()
        }

        // Validate dates nếu có update
        if (updateData.start_date || updateData.end_date) {
            const startDate = updateData.start_date 
                ? new Date(updateData.start_date) 
                : new Date(coupon.start_date)
            const endDate = updateData.end_date 
                ? new Date(updateData.end_date) 
                : new Date(coupon.end_date)

            if (endDate <= startDate) {
                throw new BadRequestError('end_date must be after start_date')
            }

            updateData.start_date = startDate
            updateData.end_date = endDate
        }

        // Validate discount value nếu có update
        if (updateData.discount_value !== undefined) {
            if (updateData.discount_value <= 0) {
                throw new BadRequestError('discount_value must be greater than 0')
            }
            
            const discountType = updateData.discount_type || coupon.discount_type
            if (discountType === 'percentage' && updateData.discount_value > 100) {
                throw new BadRequestError('percentage discount cannot exceed 100%')
            }
        }

        return await CouponRepository.updateById(
            couponId,
            removeUndefinedObject(updateData)
        )
    }

    // Xóa coupon
    static async deleteCoupon(couponId) {
        const coupon = await CouponRepository.findById(couponId)
        if (!coupon) {
            throw new NotFoundError('Coupon not found')
        }

        return await CouponRepository.deleteById(couponId)
    }

    // Validate coupon trước khi áp dụng
    static async validateCoupon({
        code,
        userId,
        orderValue,
        categoryIds = [],
        productIds = [],
    }) {
        // 1. Tìm coupon
        const coupon = await CouponRepository.findByCode(code)
        if (!coupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại')
        }

        // 2. Kiểm tra active
        if (!coupon.is_active) {
            throw new BadRequestError('Mã giảm giá đã bị vô hiệu hóa')
        }

        // 3. Kiểm tra thời gian
        const now = new Date()
        if (now < new Date(coupon.start_date)) {
            throw new BadRequestError('Mã giảm giá chưa đến ngày sử dụng')
        }
        if (now > new Date(coupon.end_date)) {
            throw new BadRequestError('Mã giảm giá đã hết hạn')
        }

        // 4. Kiểm tra usage limit tổng
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            throw new BadRequestError('Mã giảm giá đã hết lượt sử dụng')
        }

        // 5. Kiểm tra usage limit per user
        const userUsageCount = await CouponRepository.getUserUsageCount(
            coupon._id,
            userId
        )
        if (coupon.usage_limit_per_user && userUsageCount >= coupon.usage_limit_per_user) {
            throw new BadRequestError(
                `Bạn đã sử dụng mã này ${userUsageCount}/${coupon.usage_limit_per_user} lần`
            )
        }

        // 6. Kiểm tra giá trị đơn hàng tối thiểu
        if (orderValue < coupon.min_order_value) {
            throw new BadRequestError(
                `Đơn hàng tối thiểu ${coupon.min_order_value.toLocaleString('vi-VN')}đ`
            )
        }

        // 7. Kiểm tra applicable categories
        if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
            const hasMatchingCategory = categoryIds.some((catId) =>
                coupon.applicable_categories.some(
                    (appCat) => appCat.toString() === catId.toString()
                )
            )
            if (!hasMatchingCategory) {
                throw new BadRequestError('Mã giảm giá không áp dụng cho danh mục này')
            }
        }

        // 8. Kiểm tra applicable products
        if (coupon.applicable_products && coupon.applicable_products.length > 0) {
            const hasMatchingProduct = productIds.some((prodId) =>
                coupon.applicable_products.some(
                    (appProd) => appProd.toString() === prodId.toString()
                )
            )
            if (!hasMatchingProduct) {
                throw new BadRequestError('Mã giảm giá không áp dụng cho sản phẩm này')
            }
        }

        // 9. Tính discount
        let discount = 0
        if (coupon.discount_type === 'percentage') {
            discount = Math.round((orderValue * coupon.discount_value) / 100)
            if (coupon.max_discount && discount > coupon.max_discount) {
                discount = coupon.max_discount
            }
        } else {
            discount = Math.min(coupon.discount_value, orderValue)
        }

        return {
            coupon_id: coupon._id,
            code: coupon.code,
            discount,
            final_amount: orderValue - discount,
            remaining_uses: coupon.usage_limit_per_user - userUsageCount,
        }
    }

    // Áp dụng coupon (gọi sau khi order thành công)
    static async applyCoupon({ couponId, userId, orderId, discountAmount }) {
        const coupon = await CouponRepository.findById(couponId)
        if (!coupon) {
            throw new NotFoundError('Coupon not found')
        }

        // Lưu lịch sử sử dụng
        await CouponRepository.recordUsage({
            couponId,
            userId,
            orderId,
            discountAmount,
        })

        // Tăng used_count
        await CouponRepository.incrementUsedCount(couponId)

        return { success: true }
    }

    // Lấy lịch sử sử dụng coupon của user
    static async getUserCouponHistory(userId, { page = 1, limit = 10, couponId = null }) {
        const skip = (page - 1) * limit
        const history = await CouponRepository.getUserUsageHistory(
            userId,
            couponId,
            { skip, limit }
        )

        return {
            history,
            pagination: {
                page,
                limit,
                total: history.length,
            },
        }
    }

    // Lấy coupons áp dụng cho category
    static async getCouponsByCategory(categoryId, { page = 1, limit = 10 }) {
        const skip = (page - 1) * limit
        const coupons = await CouponRepository.findByCategory(categoryId, { skip, limit })

        return {
            coupons,
            pagination: {
                page,
                limit,
                total: coupons.length,
            },
        }
    }

    // Lấy coupons áp dụng cho product
    static async getCouponsByProduct(productId, { page = 1, limit = 10 }) {
        const skip = (page - 1) * limit
        const coupons = await CouponRepository.findByProduct(productId, { skip, limit })

        return {
            coupons,
            pagination: {
                page,
                limit,
                total: coupons.length,
            },
        }
    }

    // Kiểm tra coupon availability cho user
    static async checkCouponAvailability(code, userId) {
        const coupon = await CouponRepository.findByCode(code)
        if (!coupon) {
            throw new NotFoundError('Coupon not found')
        }

        const now = new Date()
        const isActive = coupon.is_active
        const isWithinDate = now >= new Date(coupon.start_date) && now <= new Date(coupon.end_date)
        const hasGlobalLimit = coupon.usage_limit ? coupon.used_count < coupon.usage_limit : true

        const userUsageCount = await CouponRepository.getUserUsageCount(coupon._id, userId)
        const hasUserLimit = coupon.usage_limit_per_user 
            ? userUsageCount < coupon.usage_limit_per_user 
            : true

        return {
            available: isActive && isWithinDate && hasGlobalLimit && hasUserLimit,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_order_value: coupon.min_order_value,
            user_usage_count: userUsageCount,
            user_usage_limit: coupon.usage_limit_per_user,
            total_usage: coupon.used_count,
            total_limit: coupon.usage_limit,
            reasons: {
                is_active: isActive,
                is_within_date: isWithinDate,
                has_global_limit: hasGlobalLimit,
                has_user_limit: hasUserLimit,
            },
        }
    }
}

module.exports = CouponService