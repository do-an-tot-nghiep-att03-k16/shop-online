'use strict'

const { review } = require('../review.model')
const { Types } = require('mongoose')

class ReviewRepository {
    // Tạo review mới
    static async createReview(reviewData) {
        return await review.create(reviewData)
    }

    // Tìm review theo ID
    static async findById(reviewId) {
        return await review.findById(reviewId)
            .populate('user', 'usr_name usr_avatar')
            .populate('product', 'name slug')
    }

    // Lấy reviews của 1 sản phẩm với pagination
    static async findByProduct(productId, { 
        page = 1, 
        limit = 10, 
        sort = '-createdAt',
        rating = null 
    } = {}) {
        const skip = (page - 1) * limit
        
        const filter = { 
            product: new Types.ObjectId(productId), 
            status: 'approved' 
        }
        
        if (rating) {
            filter.rating = rating
        }

        const reviews = await review.find(filter)
            .populate('user', 'usr_name usr_avatar')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()

        const total = await review.countDocuments(filter)

        return {
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    // Lấy reviews của 1 user
    static async findByUser(userId, { page = 1, limit = 10 } = {}) {
        const skip = (page - 1) * limit
        
        const reviews = await review.find({ user: new Types.ObjectId(userId) })
            .populate('product', 'name slug color_images')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)
            .lean()

        const total = await review.countDocuments({ user: new Types.ObjectId(userId) })

        return {
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    // Kiểm tra user đã review sản phẩm chưa
    static async checkUserReviewExists(userId, productId) {
        return await review.findOne({ 
            user: new Types.ObjectId(userId), 
            product: new Types.ObjectId(productId) 
        })
    }

    // Kiểm tra user đã review sản phẩm cho order này chưa (mỗi order chỉ được review 1 lần)
    static async checkOrderReviewExists(userId, productId, orderId) {
        return await review.findOne({
            user: new Types.ObjectId(userId),
            product: new Types.ObjectId(productId),
            order_id: orderId
        })
    }

    // Update review
    static async updateReview(reviewId, updateData) {
        return await review.findByIdAndUpdate(reviewId, updateData, { 
            new: true,
            runValidators: true
        }).populate('user', 'usr_name usr_avatar')
    }

    // Xóa review
    static async deleteReview(reviewId) {
        return await review.findByIdAndDelete(reviewId)
    }

    // Like/Unlike review
    static async toggleLike(reviewId, userId) {
        const reviewDoc = await review.findById(reviewId)
        if (!reviewDoc) return null

        const userObjectId = new Types.ObjectId(userId)
        const isLiked = reviewDoc.likes.some(id => id.equals(userObjectId))

        if (isLiked) {
            return await reviewDoc.removeLike(userObjectId)
        } else {
            return await reviewDoc.addLike(userObjectId)
        }
    }

    // Lấy thống kê rating của sản phẩm
    static async getProductRatingStats(productId) {
        const [avgData, distribution] = await Promise.all([
            review.getAverageRating(new Types.ObjectId(productId)),
            review.getRatingDistribution(new Types.ObjectId(productId))
        ])

        return {
            average_rating: avgData.average,
            total_reviews: avgData.total,
            rating_distribution: distribution
        }
    }

    // Lấy top reviews (most helpful)
    static async getTopReviews(productId, limit = 3) {
        return await review.find({ 
            product: new Types.ObjectId(productId), 
            status: 'approved' 
        })
        .populate('user', 'usr_name usr_avatar')
        .sort('-helpful_count -createdAt')
        .limit(limit)
        .lean()
    }

    // Lấy reviews cần moderate (cho admin)
    static async getPendingReviews({ page = 1, limit = 20 } = {}) {
        const skip = (page - 1) * limit
        
        const reviews = await review.find({ status: 'pending' })
            .populate('user', 'usr_name usr_email')
            .populate('product', 'name slug')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)

        const total = await review.countDocuments({ status: 'pending' })

        return {
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    // Approve/Reject review (cho admin)
    static async moderateReview(reviewId, status, moderatorNote = '') {
        return await review.findByIdAndUpdate(reviewId, { 
            status,
            moderator_note: moderatorNote,
            moderated_at: new Date()
        }, { new: true })
    }

    // Tìm reviews theo order (để check verified purchase)
    static async findByOrderId(orderId) {
        return await review.find({ order_id: new Types.ObjectId(orderId) })
    }

    // Bulk operations
    static async bulkUpdateStatus(reviewIds, status) {
        return await review.updateMany(
            { _id: { $in: reviewIds.map(id => new Types.ObjectId(id)) } },
            { status, moderated_at: new Date() }
        )
    }

    // Search reviews
    static async searchReviews(query, { page = 1, limit = 10 } = {}) {
        const skip = (page - 1) * limit
        
        const searchFilter = {
            status: 'approved',
            $or: [
                { comment: { $regex: query, $options: 'i' } }
            ]
        }

        const reviews = await review.find(searchFilter)
            .populate('user', 'usr_name usr_avatar')
            .populate('product', 'name slug')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)

        const total = await review.countDocuments(searchFilter)

        return {
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }
}

module.exports = ReviewRepository