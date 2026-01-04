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
        expireAt: { type: Date, default: Date.now(), expires: 60 * 5 },
    },
    {
        collection: COLLECTION_NAME,
        timestamps: true,
    }
)

otpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

module.exports = model(DOCUMENT_NAME, otpSchema)
