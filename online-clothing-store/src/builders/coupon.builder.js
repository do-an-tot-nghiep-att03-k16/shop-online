'use strict'

const { BadRequestError } = require('../core/error.response')

class CouponBuilder {
    constructor() {
        this.coupon = {}
    }

    withCode(code) {
        this.coupon.code = code.toUpperCase()
        return this
    }

    withDescription(description) {
        this.coupon.description = description
        return this
    }

    withDiscountType(discountType) {
        this.coupon.discount_type = discountType
        return this
    }

    withDiscountValue(discountValue) {
        if (discountValue <= 0)
            throw new BadRequestError('discount_value must be greater than 0')
        if (this.coupon.discount_type === 'percentage' && discountValue > 100) {
            throw new BadRequestError('percentage discount can not exceed 100%')
        }
        this.coupon.discount_value = discountValue
        return this
    }

    withMinOrderValue(minOrderValue) {
        this.coupon.min_order_value = minOrderValue
        return this
    }

    withMaxDiscount(maxDiscount) {
        this.coupon.max_discount = maxDiscount
        return this
    }

    withUsageLimit(usageLimit) {
        this.coupon.usage_limit = usageLimit
        return this
    }

    withUsageLimitPerUser(usageLimitPerUser) {
        this.coupon.usage_limit_per_user = usageLimitPerUser
        return this
    }

    withStartDate(startDate) {
        this.coupon.start_date= new Date(startDate)
        return this
    }

    withEndDate(endDate) {
        this.coupon.end_date = new Date(endDate)
        return this
    }

    withDateRange(startDate, endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (end <= start) {
            throw new Error('end_date must be after start_date')
        }
        
        this.coupon.start_date = start
        this.coupon.end_date = end
        return this
    }

    withApplicableCategories(categoryIds) {
        this.coupon.applicable_categories = Array.isArray(categoryIds) 
            ? categoryIds 
            : [categoryIds]
        return this
    }

    withApplicableProducts(productIds) {
        this.coupon.applicable_products = Array.isArray(productIds) 
            ? productIds 
            : [productIds]
        return this
    }

    withIsActive(isActive) {
        this.coupon.is_active = isActive
        return this
    }

    // New security methods
    withType(type) {
        if (!['public', 'private'].includes(type)) {
            throw new BadRequestError('type must be either "public" or "private"')
        }
        this.coupon.type = type
        return this
    }

    withVisibility(visibility) {
        if (!['hidden', 'featured', 'landing_page'].includes(visibility)) {
            throw new BadRequestError('visibility must be "hidden", "featured", or "landing_page"')
        }
        this.coupon.visibility = visibility
        return this
    }

    withAssignedUsers(userIds) {
        this.coupon.assigned_users = Array.isArray(userIds) ? userIds : [userIds]
        return this
    }

    // Helper methods for common patterns
    asPublicFeatured() {
        this.coupon.type = 'public'
        this.coupon.visibility = 'featured'
        return this
    }

    asPrivateForUsers(userIds) {
        this.coupon.type = 'private'
        this.coupon.visibility = 'hidden'
        this.coupon.assigned_users = Array.isArray(userIds) ? userIds : [userIds]
        return this
    }

    // Coupon giảm % cho toàn bộ đơn hàng
    asPercentageDiscount(percent, maxDiscount = null) {
        this.coupon.discount_type = 'percentage'
        this.coupon.discount_value = percent
        if (maxDiscount) {
            this.coupon.max_discount = maxDiscount
        }
        return this
    }

    // Coupon giảm số tiền cố định
    asFixedDiscount(amount) {
        this.coupon.discount_type = 'fixed'
        this.coupon.discount_value = amount
        return this
    }

    // Coupon cho khách hàng mới (1 lần dùng)
    asNewCustomerCoupon() {
        this.coupon.usage_limit_per_user = 1
        return this
    }

    // Coupon flash sale (giới hạn số lượng)
    asFlashSale(totalLimit) {
        this.coupon.usage_limit = totalLimit
        return this
    }

    // Coupon cho category cụ thể
    forCategories(...categoryIds) {
        this.coupon.applicable_categories = categoryIds.flat()
        return this
    }

    // Coupon cho product cụ thể
    forProducts(...productIds) {
        this.coupon.applicable_products = productIds.flat()
        return this
    }

    validate() {
        const errors = []

        if (!this.coupon.code) {
            errors.push('code is required')
        }

        if (!this.coupon.discount_type) {
            errors.push('discount_type is required')
        }

        if (!this.coupon.discount_value && this.coupon.discount_value !== 0) {
            errors.push('discount_value is required')
        }

        if (!this.coupon.start_date) {
            errors.push('start_date is required')
        }

        if (!this.coupon.end_date) {
            errors.push('end_date is required')
        }

        if (this.coupon.start_date && this.coupon.end_date) {
            if (this.coupon.end_date <= this.coupon.start_date) {
                errors.push('end_date must be after start_date')
            }
        }

        if (this.coupon.discount_type === 'percentage' && this.coupon.discount_value > 100) {
            errors.push('percentage discount cannot exceed 100%')
        }

        if (this.coupon.discount_value < 0) {
            errors.push('discount_value must be greater than or equal to 0')
        }

        if (errors.length > 0) {
            throw new BadRequestError(`Coupon validation failed: ${errors.join(', ')}`)
        }

        return true
    }

    build() {
        this.validate()
        return this.coupon
    }

    reset() {
        this.coupon = {}
        return this
    }
}

module.exports = CouponBuilder
