'use strict'

const { model, Schema } = require('mongoose')

const DOCUMENT_NAME = 'Order'
const COLLECTION_NAME = 'orders'

const orderSchema = new Schema(
    {
        order_number: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Thông tin items
        items: [
            {
                product_id: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                variant_sku: {
                    type: String,
                    required: true,
                },
                product_name: {
                    type: String,
                    required: true,
                },
                product_slug: String,
                product_image: String,
                variant_color: String,
                variant_size: String,
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                subtotal: {
                    type: Number,
                    required: true,
                },
            },
        ],

        // Thông tin shipping
        shipping_address: {
            full_name: { type: String, required: true },
            phone: { type: String, required: true },
            address_line: { type: String, required: true },
            ward: {
                id: { type: Schema.Types.ObjectId },
                name: String,
                code: String
            },
            district: {
                id: { type: Schema.Types.ObjectId },
                name: String,
                code: String
            },
            province: {
                id: { type: Schema.Types.ObjectId },
                name: String,
                code: String
            },
            country: { type: String, default: 'Vietnam' },
            postal_code: String,
            full_address: String
        },

        // Thông tin payment (COD và QR)
        payment_method: {
            type: String,
            enum: ['cod', 'sepay_qr', 'bank_transfer', 'momo', 'zalopay'],
            default: 'cod',
            required: true,
        },
        payment_status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'cancelled'],
            default: 'pending',
        },
        payment_details: {
            paid_at: Date,
            transaction_id: String,
            transaction_code: String,
            confirmed_by: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            payment_gateway_response: Object, // Raw response từ Sepay webhook
        },

        // Thông tin pricing
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        shipping_fee: {
            type: Number,
            default: 0,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },

        // Coupon đã dùng
        applied_coupon: {
            coupon_id: {
                type: Schema.Types.ObjectId,
                ref: 'Coupon',
            },
            code: String,
            discount: Number,
        },

        // Order status
        status: {
            type: String,
            enum: [
                'pending',
                'confirmed',
                'processing',
                'shipping',
                'delivered',
                'cancelled',
                'returned',
            ],
            default: 'pending',
        },

        // Tracking
        status_history: [
            {
                status: String,
                note: String,
                updated_by: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                updated_at: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // Shipping info
        tracking_number: String,
        shipping_provider: String,
        estimated_delivery: Date,
        delivered_at: Date,

        // Notes
        customer_note: String,
        admin_note: String,

        // Cancellation/Return
        cancellation_reason: String,
        cancelled_at: Date,
        cancelled_by: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },

        return_reason: String,
        returned_at: Date,
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

// Indexes
orderSchema.index({ order_number: 1 })
orderSchema.index({ user_id: 1, createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ payment_status: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ 'items.product_id': 1 })

// Virtual: có thể cancel không
orderSchema.virtual('can_cancel').get(function () {
    return ['pending', 'confirmed'].includes(this.status)
})

// Virtual: có thể return không
orderSchema.virtual('can_return').get(function () {
    return this.status === 'delivered' && this.delivered_at
})

// Method: Thêm status history
orderSchema.methods.addStatusHistory = function (status, note, userId) {
    this.status_history.push({
        status,
        note,
        updated_by: userId,
        updated_at: new Date(),
    })
    this.status = status
}

// Method: Cancel order
orderSchema.methods.cancelOrder = function (reason, userId) {
    if (!this.can_cancel) {
        throw new Error('Order cannot be cancelled')
    }

    this.status = 'cancelled'
    this.cancellation_reason = reason
    this.cancelled_at = new Date()
    this.cancelled_by = userId

    this.addStatusHistory('cancelled', reason, userId)
}

// Method: Update payment status
orderSchema.methods.updatePaymentStatus = function (status, details = {}) {
    this.payment_status = status
    if (status === 'paid') {
        this.payment_details = {
            ...this.payment_details,
            ...details,
            paid_at: new Date(),
        }
    }
}

// Static: Generate order number
orderSchema.statics.generateOrderNumber = async function () {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    const prefix = `ORD${year}${month}${day}`

    // Tìm order cuối cùng trong ngày
    const lastOrder = await this.findOne({
        order_number: { $regex: `^${prefix}` }
    }).sort({ order_number: -1 })

    let sequence = 1
    if (lastOrder) {
        const lastSequence = parseInt(lastOrder.order_number.slice(-4))
        sequence = lastSequence + 1
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`
}


// Middleware: Set virtuals khi toJSON
orderSchema.set('toJSON', { virtuals: true })
orderSchema.set('toObject', { virtuals: true })

module.exports = { order: model(DOCUMENT_NAME, orderSchema) }
