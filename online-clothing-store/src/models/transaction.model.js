'use strict'

const { Schema, model } = require('mongoose')

const DOCUMENT_NAME = 'Transaction'
const COLLECTION_NAME = 'transactions'

// Simplified schema chỉ lưu data cần thiết từ SePay webhook
const transactionSchema = new Schema({
    // Exact fields từ SePay webhook
    id: {
        type: Number,
        required: true
    },
    gateway: {
        type: String,
        required: true
    },
    transactionDate: {
        type: String, // Keep as string như webhook
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    code: {
        type: String,
        default: null
    },
    content: {
        type: String,
        required: true
    },
    transferType: {
        type: String,
        required: true,
        enum: ['in', 'out']
    },
    transferAmount: {
        type: Number,
        required: true,
        min: 0
    },
    accumulated: {
        type: Number,
        default: 0
    },
    subAccount: {
        type: String,
        default: null
    },
    referenceCode: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    
    // Processing info
    order_id: {
        type: String
    },
    processed: {
        type: Boolean,
        default: false
    },
    
    // Error handling fields
    error_message: {
        type: String,
        default: null
    },
    error_stack: {
        type: String,
        default: null
    },
    failed_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

// Simple indexes
transactionSchema.index({ id: 1 }, { unique: true })
transactionSchema.index({ content: 1 })
transactionSchema.index({ order_id: 1 })
transactionSchema.index({ createdAt: -1 })

module.exports = model(DOCUMENT_NAME, transactionSchema)