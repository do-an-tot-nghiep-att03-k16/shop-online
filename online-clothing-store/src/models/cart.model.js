'use strict'

const { model, Schema } = require('mongoose')

const DOCUMENT_NAME = 'Cart'
const COLLECTION_NAME = 'carts'

const cartSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
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
                // Cache thông tin để hiển thị nhanh (denormalize)
                product_name: String,
                product_slug: String,
                product_image: String,
                variant_color: String,
                variant_size: String,

                added_at: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Tổng số items
        total_items: {
            type: Number,
            default: 0,
        },
        // Tổng giá trị (chưa giảm giá)
        subtotal: {
            type: Number,
            default: 0,
        },
        // Coupon đang áp dụng (nếu có)
        applied_coupon: {
            coupon_id: {
                type: Schema.Types.ObjectId,
                ref: 'Coupon',
            },
            code: String,
            discount: Number,
        },
        // Tổng cuối cùng (sau giảm giá)
        total: {
            type: Number,
            default: 0,
        },
        // Cart status
        status: {
            type: String,
            enum: ['active', 'abandoned', 'converted'],
            default: 'active',
        },
        // Thời gian cart bị bỏ rơi
        abandoned_at: Date,
        // Thời gian chuyển thành order
        converted_at: Date,
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

// Index
cartSchema.index({ user_id: 1 })
cartSchema.index({ status: 1 })
cartSchema.index({ updatedAt: 1 })

// Method: Tính tổng
cartSchema.methods.calculateTotals = function () {
    this.total_items = this.items.reduce((sum, item) => sum + item.quantity, 0)
    this.subtotal = this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    )

    // Áp dụng coupon nếu có
    const discount = this.applied_coupon?.discount || 0
    this.total = this.subtotal - discount
}

// Method: Thêm item
cartSchema.methods.addItem = function (itemData) {
    const existingItemIndex = this.items.findIndex(
        (item) => item.variant_sku === itemData.variant_sku
    )

    if (existingItemIndex > -1) {
        // Item đã tồn tại → tăng quantity
        this.items[existingItemIndex].quantity += itemData.quantity
    } else {
        // Item mới → thêm vào cart
        this.items.push(itemData)
    }

    this.calculateTotals()
}

// Method: Update quantity
cartSchema.methods.updateItemQuantity = function (variantSku, quantity) {
    const item = this.items.find((item) => item.variant_sku === variantSku)

    if (!item) {
        throw new Error('Item not found in cart')
    }

    if (quantity <= 0) {
        // Remove item
        this.items = this.items.filter(
            (item) => item.variant_sku !== variantSku
        )
    } else {
        item.quantity = quantity
    }

    this.calculateTotals()
}

// Method: Remove item
cartSchema.methods.removeItem = function (variantSku) {
    this.items = this.items.filter((item) => item.variant_sku !== variantSku)
    this.calculateTotals()
}

// Method: Clear cart
cartSchema.methods.clearCart = function () {
    this.items = []
    this.applied_coupon = undefined
    this.calculateTotals()
}

// Method: Apply coupon
cartSchema.methods.applyCoupon = function (couponData) {
    this.applied_coupon = {
        coupon_id: couponData.coupon_id,
        code: couponData.code,
        discount: couponData.discount,
    }
    this.calculateTotals()
}

// Method: Remove coupon
cartSchema.methods.removeCoupon = function () {
    this.applied_coupon = undefined
    this.calculateTotals()
}

module.exports = { cart: model(DOCUMENT_NAME, cartSchema) }
