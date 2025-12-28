'use strict'

const {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} = require('../core/error.response')
const ReviewRepository = require('../models/repositories/review.repo')
const { product } = require('../models/product.model')
const { findById } = require('../models/repositories/user.repo')
const { buildUserResponse } = require('../utils/user.mapper')
const OrderService = require('./order.service')
const {
    transformReviewsImages,
    transformReviewImages,
} = require('../utils/image.mapper')
const { convertToObjectIdMongodb } = require('../utils')
const orderModel = require('../models/order.model')

class ReviewService {
    // Tạo review mới
    static async createReview({
        userId,
        productId,
        orderId = null,
        rating,
        comment,
        image_ids = [],
        variantInfo = {},
    }) {
        // Kiểm tra sản phẩm có tồn tại
        const productExists = await product.findById(
            convertToObjectIdMongodb(productId)
        )
        if (!productExists) {
            throw new NotFoundError('Product not found')
        }

        // Purchase verification - user phải có order để review
        if (!orderId) {
            throw new BadRequestError(
                'Bạn chỉ có thể đánh giá sản phẩm đã mua. Vui lòng cung cấp mã đơn hàng.'
            )
        }

        // Kiểm tra order có tồn tại và thuộc về user không - lấy raw data không populate
        const { order } = require('../models/order.model')
        const mongoose = require('mongoose')

        const rawOrder = await order.findById(orderId)
        if (!rawOrder) {
            throw new BadRequestError('Không tìm thấy đơn hàng.')
        }

        // Kiểm tra order thuộc về user
        if (rawOrder.user_id.toString() !== userId.toString()) {
            throw new BadRequestError('Đơn hàng không thuộc về bạn.')
        }

        // Kiểm tra sản phẩm có trong đơn hàng này không - dùng raw data
        const productInOrder = rawOrder.items.some((item) => {
            const match = item.product_id.toString() === productId.toString()
            return match
        })

        if (!productInOrder) {
            throw new BadRequestError(
                'Sản phẩm này không có trong đơn hàng đã chọn.'
            )
        }

        // Kiểm tra đã review cho order này chưa (mỗi order được review 1 lần)
        const existingReview = await ReviewRepository.checkOrderReviewExists(
            userId,
            productId,
            orderId
        )
        if (existingReview) {
            throw new BadRequestError(
                'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.'
            )
        }

        let isVerifiedPurchase = true

        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new BadRequestError('Rating must be between 1 and 5')
        }

        // Validate images
        if (image_ids.length > 5) {
            throw new BadRequestError('Maximum 5 images allowed')
        }

        const reviewData = {
            user: userId,
            product: productId,
            order_id: orderId,
            rating,
            comment: comment?.trim() || '',
            image_ids,
            is_verified_purchase: isVerifiedPurchase,
            variant_info: variantInfo,
            status: 'approved',
        }

        // console.log(
        //     'DEBUG: About to create review with data:',
        //     JSON.stringify(reviewData, null, 2)
        // )

        const newReview = await ReviewRepository.createReview(reviewData)
        // console.log('DEBUG: Review created with ID:', newReview._id)

        const retrievedReview = await ReviewRepository.findById(newReview._id)
        // console.log(
        //     'DEBUG: Retrieved review:',
        //     retrievedReview ? 'Found' : 'Not found'
        // )

        // Transform image_ids to image objects for the new review
        const transformedReview = transformReviewImages(retrievedReview)

        return transformedReview
    }

    // Lấy reviews của sản phẩm
    static async getProductReviews(productId, queryOptions = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            rating = null,
        } = queryOptions

        // Validate sort options
        const validSorts = [
            '-createdAt',
            'createdAt',
            '-rating',
            'rating',
            '-helpful_count',
        ]
        if (!validSorts.includes(sort)) {
            throw new BadRequestError('Invalid sort option')
        }

        // console.log('DEBUG: Querying reviews for productId:', productId)

        const result = await ReviewRepository.findByProduct(productId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort,
            rating: rating ? parseInt(rating) : null,
        })

        // console.log(
        //     'DEBUG: Query result:',
        //     result?.reviews?.length || 0,
        //     'reviews found'
        // )

        // Transform image_ids to image objects and apply user mapper to reviews
        const transformedReviews = transformReviewsImages(result.reviews || [])
        const reviewsWithUserAvatars = transformedReviews.map((review) => ({
            ...review,
            user: review.user ? buildUserResponse(review.user) : null,
        }))

        // Lấy thống kê rating
        const stats = await ReviewRepository.getProductRatingStats(productId)

        return {
            ...result,
            reviews: reviewsWithUserAvatars,
            stats,
        }
    }

    // Lấy reviews của user
    static async getUserReviews(userId, queryOptions = {}) {
        const { page = 1, limit = 10 } = queryOptions

        const result = await ReviewRepository.findByUser(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
        })

        // Transform image_ids to image objects and apply user mapper to reviews
        const transformedReviews = transformReviewsImages(result.reviews || [])
        const reviewsWithUserAvatars = transformedReviews.map((review) => ({
            ...review,
            user: review.user ? buildUserResponse(review.user) : null,
        }))

        return {
            ...result,
            reviews: reviewsWithUserAvatars,
        }
    }

    // Lấy top reviews của sản phẩm
    static async getTopReviews(productId, limit = 3) {
        const result = await ReviewRepository.getTopReviews(productId, limit)

        // Transform image_ids to image objects and apply user mapper to reviews
        const transformedReviews = transformReviewsImages(result || [])
        const reviewsWithUserAvatars = transformedReviews.map((review) => ({
            ...review,
            user: review.user ? buildUserResponse(review.user) : null,
        }))

        return reviewsWithUserAvatars
    }

    // Update review (chỉ user tạo review mới được update)
    static async updateReview(reviewId, userId, updateData) {
        const review = await ReviewRepository.findById(reviewId)
        if (!review) {
            throw new NotFoundError('Review not found')
        }

        // Kiểm tra quyền sở hữu
        if (review.user._id.toString() !== userId) {
            throw new ForbiddenError('You can only update your own reviews')
        }

        // Validate data
        const allowedFields = ['rating', 'comment', 'images', 'variant_info']
        const filteredData = {}

        Object.keys(updateData).forEach((key) => {
            if (allowedFields.includes(key)) {
                filteredData[key] = updateData[key]
            }
        })

        // Validate rating nếu có
        if (
            filteredData.rating &&
            (filteredData.rating < 1 || filteredData.rating > 5)
        ) {
            throw new BadRequestError('Rating must be between 1 and 5')
        }

        // Validate images
        if (filteredData.images && filteredData.images.length > 5) {
            throw new BadRequestError('Maximum 5 images allowed')
        }

        // Trim comment
        if (filteredData.comment !== undefined) {
            filteredData.comment = filteredData.comment?.trim() || ''
        }

        return await ReviewRepository.updateReview(reviewId, filteredData)
    }

    // Xóa review (chỉ user tạo review mới được xóa)
    static async deleteReview(reviewId, userId) {
        const review = await ReviewRepository.findById(reviewId)
        if (!review) {
            throw new NotFoundError('Review not found')
        }

        // Kiểm tra quyền sở hữu
        if (review.user._id.toString() !== userId) {
            throw new ForbiddenError('You can only delete your own reviews')
        }

        return await ReviewRepository.deleteReview(reviewId)
    }

    // Like/Unlike review
    static async toggleReviewLike(reviewId, userId) {
        const review = await ReviewRepository.findById(reviewId)
        if (!review) {
            throw new NotFoundError('Review not found')
        }

        const updatedReview = await ReviewRepository.toggleLike(
            reviewId,
            userId
        )
        return {
            review: updatedReview,
            isLiked: updatedReview.likes.some((id) => id.toString() === userId),
            likesCount: updatedReview.likes.length,
        }
    }

    // Lấy thống kê rating của sản phẩm
    static async getProductRatingStats(productId) {
        return await ReviewRepository.getProductRatingStats(productId)
    }

    // Search reviews
    static async searchReviews(query, queryOptions = {}) {
        if (!query || query.trim().length < 2) {
            throw new BadRequestError(
                'Search query must be at least 2 characters'
            )
        }

        const { page = 1, limit = 10 } = queryOptions

        return await ReviewRepository.searchReviews(query.trim(), {
            page: parseInt(page),
            limit: parseInt(limit),
        })
    }

    // ============ ADMIN FUNCTIONS ============

    // Lấy reviews cần moderate
    static async getPendingReviews(queryOptions = {}) {
        const { page = 1, limit = 20 } = queryOptions
        return await ReviewRepository.getPendingReviews({
            page: parseInt(page),
            limit: parseInt(limit),
        })
    }

    // Moderate review (approve/reject)
    static async moderateReview(reviewId, action, moderatorNote = '') {
        const validActions = ['approve', 'reject']
        if (!validActions.includes(action)) {
            throw new BadRequestError(
                'Invalid action. Must be approve or reject'
            )
        }

        const review = await ReviewRepository.findById(reviewId)
        if (!review) {
            throw new NotFoundError('Review not found')
        }

        const status = action === 'approve' ? 'approved' : 'rejected'
        return await ReviewRepository.moderateReview(
            reviewId,
            status,
            moderatorNote
        )
    }

    // Bulk approve/reject reviews
    static async bulkModerateReviews(reviewIds, action) {
        const validActions = ['approve', 'reject']
        if (!validActions.includes(action)) {
            throw new BadRequestError(
                'Invalid action. Must be approve or reject'
            )
        }

        if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
            throw new BadRequestError('Review IDs must be a non-empty array')
        }

        const status = action === 'approve' ? 'approved' : 'rejected'
        const result = await ReviewRepository.bulkUpdateStatus(
            reviewIds,
            status
        )

        return {
            success: true,
            updated: result.modifiedCount,
            action: status,
        }
    }

    // Admin xóa review
    static async adminDeleteReview(reviewId, reason = '') {
        const review = await ReviewRepository.findById(reviewId)
        if (!review) {
            throw new NotFoundError('Review not found')
        }

        return await ReviewRepository.deleteReview(reviewId)
    }

    // Lấy review statistics cho admin dashboard
    static async getReviewStatistics() {
        const { review } = require('../models/review.model')

        const [
            totalReviews,
            pendingReviews,
            approvedReviews,
            rejectedReviews,
            avgRatingOverall,
            recentReviews,
        ] = await Promise.all([
            review.countDocuments(),
            review.countDocuments({ status: 'pending' }),
            review.countDocuments({ status: 'approved' }),
            review.countDocuments({ status: 'rejected' }),
            review.aggregate([
                { $match: { status: 'approved' } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } },
            ]),
            review
                .find({ status: 'approved' })
                .populate('user', 'usr_name')
                .populate('product', 'name')
                .sort('-createdAt')
                .limit(10),
        ])

        return {
            total_reviews: totalReviews,
            pending_reviews: pendingReviews,
            approved_reviews: approvedReviews,
            rejected_reviews: rejectedReviews,
            overall_average_rating: avgRatingOverall[0]?.avgRating || 0,
            recent_reviews: recentReviews,
        }
    }

    static async checkOrderReviewExists(orderId, userId, productId) {
        const existingReview = await ReviewRepository.checkOrderReviewExists(
            userId,
            productId,
            orderId
        )
        existingReview ? existingReview : null
    }

    /**
     * Static function để check user có thể review product không
     * @param {Object} params - Parameters for review check
     * @param {string} params.userId - ID của user
     * @param {string} params.orderId - ID của order
     * @param {string} params.productId - ID của product
     * @returns {Object} { canReview: boolean, reason?: string, message?: string, data?: Object }
     */
    static async canUserReviewProduct({ userId, orderId, productId }) {
        try {
            // Input validation
            if (!userId || !orderId || !productId) {
                return { 
                    canReview: false, 
                    reason: 'INVALID_PARAMS',
                    message: 'Thiếu thông tin cần thiết để kiểm tra quyền đánh giá'
                }
            }

            // Validate and convert to ObjectId safely
            let userObjectId, orderObjectId, productObjectId
            
            try {
                userObjectId = convertToObjectIdMongodb(userId)
            } catch (error) {
                return { 
                    canReview: false, 
                    reason: 'INVALID_USER_ID',
                    message: 'User ID không hợp lệ'
                }
            }
            
            try {
                orderObjectId = convertToObjectIdMongodb(orderId)
            } catch (error) {
                return { 
                    canReview: false, 
                    reason: 'INVALID_ORDER_ID',
                    message: 'Order ID không hợp lệ'
                }
            }
            
            try {
                productObjectId = convertToObjectIdMongodb(productId)
            } catch (error) {
                return { 
                    canReview: false, 
                    reason: 'INVALID_PRODUCT_ID',
                    message: 'Product ID không hợp lệ'
                }
            }

            // 1. Check product tồn tại
            const productExists = await product.findById(productObjectId)
            if (!productExists) {
                return { 
                    canReview: false, 
                    reason: 'PRODUCT_NOT_FOUND',
                    message: 'Không tìm thấy sản phẩm'
                }
            }

            // 2. Check order tồn tại & thuộc user
            const { order } = orderModel
            const rawOrder = await order.findById(orderObjectId)
            if (!rawOrder) {
                return { 
                    canReview: false, 
                    reason: 'ORDER_NOT_FOUND',
                    message: 'Không tìm thấy đơn hàng'
                }
            }

            if (rawOrder.user_id.toString() !== userObjectId.toString()) {
                return { 
                    canReview: false, 
                    reason: 'ORDER_NOT_OWNED',
                    message: 'Đơn hàng này không thuộc về bạn'
                }
            }

            // 3. Check order đã thanh toán chưa
            if (rawOrder.payment_status !== 'paid') {
                return { 
                    canReview: false, 
                    reason: 'ORDER_NOT_PAID',
                    message: 'Chỉ có thể đánh giá sau khi thanh toán thành công',
                    data: { 
                        paymentStatus: rawOrder.payment_status,
                        orderStatus: rawOrder.order_status 
                    }
                }
            }

            // 4. Check product có trong order không & lấy thông tin variant
            const orderItem = rawOrder.items.find(
                (item) => item.product_id.toString() === productObjectId.toString()
            )

            if (!orderItem) {
                return { 
                    canReview: false, 
                    reason: 'PRODUCT_NOT_IN_ORDER',
                    message: 'Sản phẩm này không có trong đơn hàng đã chọn'
                }
            }

            // 5. Check review đã tồn tại chưa
            const existingReview = await ReviewRepository.checkOrderReviewExists(
                userObjectId,
                productObjectId,
                orderObjectId
            )

            if (existingReview) {
                return { 
                    canReview: false, 
                    reason: 'REVIEW_ALREADY_EXISTS',
                    message: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi',
                    data: {
                        reviewId: existingReview._id,
                        reviewDate: existingReview.createdAt,
                        rating: existingReview.rating
                    }
                }
            }

            // 6. OK - có thể review
            return { 
                canReview: true,
                message: 'Bạn có thể đánh giá sản phẩm này',
                data: {
                    productName: productExists.name,
                    orderDate: rawOrder.createdAt,
                    variantInfo: {
                        size: orderItem.size,
                        color: orderItem.color
                    }
                }
            }

        } catch (error) {
            console.error('Error in canUserReviewProduct:', error)
            return { 
                canReview: false, 
                reason: 'SYSTEM_ERROR',
                message: 'Có lỗi xảy ra khi kiểm tra quyền đánh giá'
            }
        }
    }
}

module.exports = ReviewService
