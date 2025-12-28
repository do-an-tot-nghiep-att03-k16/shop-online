'use strict'

const { model, Schema } = require('mongoose')

const DOCUMENT_NAME = 'Payment'
const COLLECTION_NAME = 'Payments'

const paymentSchema = new Schema({
    order_id: {
        type: String,
        required: true,
        index: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    transaction_code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ['sepay_qr', 'cod', 'bank_transfer', 'momo', 'zalopay'],
        default: 'sepay_qr'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled', 'expired'],
        default: 'pending',
        index: true
    },
    transfer_content: {
        type: String,
        required: true
    },
    // Sepay specific data
    sepay_transaction_id: {
        type: String,
        sparse: true,
        index: true
    },
    qr_data: {
        account_number: String,
        account_name: String,
        bank_id: String,
        template: String
    },
    received_amount: {
        type: Number,
        default: 0
    },
    // Webhook raw data for debugging
    webhook_data: {
        type: Object,
        default: null
    },
    // Payment timing
    expires_at: {
        type: Date,
        default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        index: { expires: 0 } // TTL index for auto cleanup
    },
    completed_at: {
        type: Date,
        default: null
    },
    // Metadata
    notes: {
        type: String,
        default: ''
    },
    ip_address: {
        type: String,
        default: ''
    },
    user_agent: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

// Indexes for performance
paymentSchema.index({ order_id: 1, status: 1 })
paymentSchema.index({ user_id: 1, createdAt: -1 })
paymentSchema.index({ transaction_code: 1, status: 1 })
paymentSchema.index({ status: 1, expires_at: 1 })

// Methods
paymentSchema.methods.isExpired = function() {
    return this.status === 'pending' && new Date() > this.expires_at
}

paymentSchema.methods.canBeCancelled = function() {
    return ['pending'].includes(this.status) && !this.isExpired()
}

paymentSchema.methods.markAsCompleted = function(sepayData = {}) {
    this.status = 'completed'
    this.completed_at = new Date()
    if (sepayData.transaction_id) {
        this.sepay_transaction_id = sepayData.transaction_id
    }
    if (sepayData.received_amount) {
        this.received_amount = sepayData.received_amount
    }
    if (sepayData.webhook_data) {
        this.webhook_data = sepayData.webhook_data
    }
    return this.save()
}

paymentSchema.methods.markAsFailed = function(reason = '') {
    this.status = 'failed'
    this.notes = reason
    return this.save()
}

paymentSchema.methods.markAsCancelled = function(reason = '') {
    this.status = 'cancelled'
    this.notes = reason
    return this.save()
}

// Statics
paymentSchema.statics.findByTransactionCode = function(transaction_code) {
    return this.findOne({ transaction_code, status: 'pending' })
}

paymentSchema.statics.findByOrderId = function(order_id) {
    return this.findOne({ order_id }).sort({ createdAt: -1 })
}

paymentSchema.statics.findPendingPayments = function() {
    return this.find({ status: 'pending', expires_at: { $gt: new Date() } })
}

paymentSchema.statics.findExpiredPayments = function() {
    return this.find({ 
        status: 'pending', 
        expires_at: { $lt: new Date() } 
    })
}

paymentSchema.statics.getPaymentStats = function(userId = null) {
    const match = userId ? { user_id: userId } : {}
    
    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total_amount: { $sum: '$amount' }
            }
        }
    ])
}

module.exports = model(DOCUMENT_NAME, paymentSchema)