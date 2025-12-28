'use strict'

const { Schema, model } = require('mongoose')

const DOCUMENT_NAME = 'CouponUsage'
const COLLECTION_NAME = 'coupon_usages'

const couponUsageSchema = new Schema(
    {
        coupon_id: {
            type: Schema.Types.ObjectId,
            ref: 'Coupon',
            required: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        order_id: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        discount_amount: { type: Number, required: true },
        used_at: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

couponUsageSchema.index({ coupon_id: 1, user_id: 1 })
module.exports = { couponUsage: model(DOCUMENT_NAME, couponUsageSchema) }
