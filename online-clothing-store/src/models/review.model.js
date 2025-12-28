'use strict'

const { Schema, model, Types } = require('mongoose')

const DOCUMENT_NAME = 'Review'
const COLLECTION_NAME = 'reviews'

const reviewSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: 'User',
            required: true,
        },
        product: {
            type: Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        order_id: {
            type: Types.ObjectId,
            ref: 'Order',
            default: null, // Để track được review từ order nào
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
            required: true,
        },
        comment: {
            type: String,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
            default: '',
        },
        images: [
            {
                type: String,
            },
        ],
        image_ids: [
            {
                type: String,
            },
        ],
        likes: [
            {
                type: Types.ObjectId,
                ref: 'User',
            },
        ],
        is_verified_purchase: {
            type: Boolean,
            default: false, // true nếu user đã mua sản phẩm này
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'approved', // Có thể set thành pending nếu muốn moderate
        },
        helpful_count: {
            type: Number,
            default: 0,
        },
        // Lưu thông tin variant cụ thể mà user đánh giá
        variant_info: {
            size: String,
            color: String,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true }) // 1 user chỉ review 1 lần cho 1 product
reviewSchema.index({ product: 1, rating: -1 })
reviewSchema.index({ user: 1 })
reviewSchema.index({ createdAt: -1 })
reviewSchema.index({ status: 1 })

// Virtual cho số lượng likes
reviewSchema.virtual('likes_count').get(function () {
    return this.likes.length
})

// Static methods
reviewSchema.statics.getAverageRating = async function (productId) {
    const result = await this.aggregate([
        { $match: { product: productId, status: 'approved' } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
            },
        },
    ])

    return result[0]
        ? {
              average: Math.round(result[0].avgRating * 10) / 10,
              total: result[0].totalReviews,
          }
        : { average: 0, total: 0 }
}

// Static method để get rating distribution
reviewSchema.statics.getRatingDistribution = async function (productId) {
    const result = await this.aggregate([
        { $match: { product: productId, status: 'approved' } },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: -1 } },
    ])

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    result.forEach((item) => {
        distribution[item._id] = item.count
    })

    return distribution
}

// Instance methods
reviewSchema.methods.addLike = function (userId) {
    if (!this.likes.includes(userId)) {
        this.likes.push(userId)
        this.helpful_count = this.likes.length
    }
    return this.save()
}

reviewSchema.methods.removeLike = function (userId) {
    this.likes = this.likes.filter((id) => !id.equals(userId))
    this.helpful_count = this.likes.length
    return this.save()
}

// Middleware để update product rating khi review thay đổi
reviewSchema.post('save', async function () {
    if (this.status === 'approved') {
        await this.updateProductRating()
    }
})

reviewSchema.post('findOneAndUpdate', async function () {
    if (this.getUpdate()?.status === 'approved') {
        const review = await this.model.findOne(this.getQuery())
        if (review) {
            await review.updateProductRating()
        }
    }
})

reviewSchema.post('findOneAndDelete', async function () {
    const review = this.getQuery()
    if (review._id) {
        const deletedReview = await this.model.findById(review._id)
        if (deletedReview && deletedReview.status === 'approved') {
            await deletedReview.updateProductRating()
        }
    }
})

// Instance method để update product rating
reviewSchema.methods.updateProductRating = async function () {
    const Product = require('./product.model').product
    const ratingData = await this.constructor.getAverageRating(this.product)
    await Product.findByIdAndUpdate(this.product, {
        ratings_average: ratingData.average,
        ratings_count: ratingData.total,
    })
}

// Virtuals trong JSON
reviewSchema.set('toJSON', { virtuals: true })
reviewSchema.set('toObject', { virtuals: true })

module.exports = {
    review: model(DOCUMENT_NAME, reviewSchema),
}
