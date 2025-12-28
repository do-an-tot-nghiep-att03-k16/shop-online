'use strict'

const { model, Schema } = require('mongoose')
const { couponUsage } = require('./couponUsage.model')

const DOCUMENT_NAME = 'Coupon'
const COLLECTION_NAME = 'coupons'

const couponSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        discount_type: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true,
        },
        discount_value: {
            type: Number,
            required: true,
            min: 0,
        },

        min_order_value: {
            type: Number,
            default: 0,
        },
        max_discount: {
            type: Number,
            default: null,
        },
        usage_limit: {
            type: Number,
            default: null,
        },
        used_count: {
            type: Number,
            default: 0,
        },
        usage_limit_per_user: {
            type: Number,
            default: 1,
        },
        start_date: {
            type: Date,
            required: true,
        },
        end_date: {
            type: Date,
            required: true,
        },
        applicable_categories: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        applicable_products: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        is_active: {
            type: Boolean,
            default: true,
        },
        // New fields for visibility and targeting
        type: {
            type: String,
            enum: ['public', 'private'],
            default: 'public', // Backward compatible - existing coupons become public
        },
        visibility: {
            type: String,
            enum: ['hidden', 'featured', 'landing_page'],
            default: 'hidden', // Backward compatible - existing coupons stay hidden
        },
        assigned_users: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }], // For private coupons
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

// Index
couponSchema.index({ code: 1 })
couponSchema.index({ is_active: 1, start_date: 1, end_date: 1 })

// Security and performance indexes
couponSchema.index({ type: 1, visibility: 1, is_active: 1 })
couponSchema.index({ assigned_users: 1 })
couponSchema.index({ type: 1, is_active: 1, start_date: 1, end_date: 1 })
couponSchema.index({ visibility: 1, is_active: 1, start_date: 1, end_date: 1 })

// Method: Kiểm tra coupon còn hiệu lực không
couponSchema.methods.isValid = function () {
    const now = new Date()

    // Check active
    if (!this.is_active)
        return { valid: false, message: 'Mã đã bị vô hiệu hóa' }

    // Check date
    if (now < this.start_date)
        return { valid: false, message: 'Mã chưa đến ngày sử dụng' }
    if (now > this.end_date) return { valid: false, message: 'Mã đã hết hạn' }

    // Check usage limit
    if (this.usage_limit && this.used_count >= this.usage_limit) {
        return { valid: false, message: 'Mã đã hết lượt sử dụng' }
    }

    return { valid: true }
}
couponSchema.methods.calculateDiscount = function (orderValue) {
    if (orderValue < this.min_order_value) {
        return {
            discount: 0,
            message: `Đơn hàng tối thiểu ${this.min_order_value.toLocaleString(
                'vi-VN'
            )}đ`,
        }
    }

    let discount = 0

    if (this.discount_type === 'percentage') {
        // Tính % của order value
        discount = Math.round((orderValue * this.discount_value) / 100)

        // Áp dụng max discount nếu có
        if (this.max_discount && discount > this.max_discount) {
            discount = this.max_discount
        }
    } else {
        // Fixed discount - KHÔNG THỂ LỚN HƠN ORDER VALUE
        discount = Math.min(this.discount_value, orderValue)
    }

    return {
        discount,
        message: 'Áp dụng thành công',
        final_amount: orderValue - discount,
    }
}

couponSchema.methods.checkUserUsage = async function (userId) {
    const usageCount = await couponUsage.countDocuments({
        coupon_id: this._id,
        user_id: userId,
    })
    let res = {
        usageCount,
        message: `Bạn đã sử dụng mã này ${usageCount}/${this.usage_limit_per_user}`,
    }
    const canUse =
        this.usage_limit_per_user && usageCount >= this.usage_limit_per_user
            ? false
            : true
    return {
        ...res,
        canUse,
    }
}

module.exports = { coupon: model(DOCUMENT_NAME, couponSchema) }
