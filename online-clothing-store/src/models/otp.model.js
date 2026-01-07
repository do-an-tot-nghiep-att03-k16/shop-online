'use strict'

const { model, Schema, Collection } = require('mongoose')

const DOCUMENT_NAME = 'otp_log'
const COLLECTION_NAME = 'otp_logs'

const otpSchema = new Schema(
    {
        otp_token: { type: String, required: true },
        otp_email: { type: String, required: true },
        otp_status: {
            type: String,
            default: 'pending',
            enum: ['pending', 'active', 'block'],
        },
        // ✅ Sửa: Dùng function thay vì gọi Date.now() ngay
        // Mỗi document mới sẽ có expireAt = thời điểm tạo + 5 phút
        expireAt: { 
            type: Date, 
            default: () => new Date(Date.now() + 5 * 60 * 1000) // Thời điểm hiện tại + 5 phút
            // Note: TTL index is defined separately using schema.index()
        },
    },
    {
        collection: COLLECTION_NAME,
        timestamps: true,
    }
)

otpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

module.exports = model(DOCUMENT_NAME, otpSchema)
