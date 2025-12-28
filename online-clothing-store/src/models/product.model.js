'use strict'

const { model, Schema } = require('mongoose')

const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'products'

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        category_ids: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
                required: true,
            },
        ],
        material: {
            type: String,
            default: '',
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'unisex'],
            required: true,
        },

        base_price: {
            type: Number,
            required: true,
            min: 0,
        },
        discount_percent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        color_images: [
            {
                color: {
                    type: String,
                    required: true,
                },
                color_code: {
                    type: String,
                    required: true,
                    match: /^#[0-9A-F]{6}$/i,
                },
                images: [
                    {
                        type: String,
                        required: true,
                    },
                ],
            },
        ],

        variants: [
            {
                sku: {
                    type: String,
                    required: true,
                    uppercase: true,
                    trim: true,
                },
                size: { type: String, required: true },
                color: { type: String, required: true },
                color_code: { type: String, required: true },
                stock_quantity: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0,
                },
            },
        ],
        status: {
            type: String,
            enum: ['active', 'inactive', 'out_of_stock'],
            default: 'active',
        },
        ratings_average: {
            type: Number,
            default: 0,
            min: [0, 'Rating must be above 0.0'],
            max: [5, 'Rating must be bellow 5.0'],
            set: (val) => Math.round(val * 10) / 10,
        },
        isDraft: { type: Boolean, default: true },
        isPublished: { type: Boolean, default: false },
    },
    { timestamps: true, collection: COLLECTION_NAME }
)

productSchema.index({ slug: 1 })
productSchema.index({ category_ids: 1 })
productSchema.index({ status: 1 })
productSchema.index({ 'variants.sku': 1 }, { unique: true })
productSchema.index({ created_at: -1 })
productSchema.index({ name: 'text', description: 'text' })

productSchema.virtual('sale_price').get(function () {
    if (this.discount_percent > 0) {
        return Math.round(this.base_price * (1 - this.discount_percent / 100))
    }
    return this.base_price
})

// Method: Lấy ảnh theo màu
productSchema.methods.getImagesByColor = function (color) {
    const colorData = this.color_images.find((c) => c.color === color)
    return colorData ? colorData.images : []
}

// Method: Lấy sizes có sẵn theo màu
productSchema.methods.getAvailableSizes = function (color) {
    return this.variants
        .filter((v) => v.color === color && v.stock_quantity > 0)
        .map((v) => v.size)
}

// Method: Check variant còn hàng
productSchema.methods.isInStock = function (sku) {
    const variant = this.variants.find((v) => v.sku === sku)
    return variant && variant.stock_quantity > 0
}

// Static: Tìm theo SKU
productSchema.statics.findBySKU = function (sku) {
    return this.findOne({ 'variants.sku': sku })
}

// Middleware: Tự động set virtuals khi toJSON
productSchema.set('toJSON', { virtuals: true })
productSchema.set('toObject', { virtuals: true })

module.exports = {
    product: model(DOCUMENT_NAME, productSchema),
}
