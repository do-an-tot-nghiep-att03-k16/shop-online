'use strict'

const { SuccessResponse, CREATED } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const ReviewService = require('../services/review.service')
const asyncHandler = require('../helpers/asyncHandler')

class ReviewController {
    // [POST] /api/reviews - Tạo review mới
    createReview = asyncHandler(async (req, res) => {
        const userId = req.userId
        const {
            product_id,
            order_id,
            rating,
            comment,
            image_ids = [],
            variant_info = {},
        } = req.body

        if (!product_id || !rating) {
            throw new BadRequestError('Product ID and rating are required')
        }

        const newReview = await ReviewService.createReview({
            userId,
            productId: product_id,
            orderId: order_id,
            rating: parseInt(rating),
            comment,
            image_ids,
            variantInfo: variant_info,
        })

        new CREATED({
            message: 'Review created successfully',
            metadata: { review: newReview },
        }).send(res)
    })

    // [GET] /api/reviews/can-review - Check if user can review a product
    checkCanReview = asyncHandler(async (req, res) => {
        const userId = req.userId
        const { orderId, productId } = req.query

        if (!orderId || !productId) {
            throw new BadRequestError('Order ID and Product ID are required')
        }

        const result = await ReviewService.canUserReviewProduct({
            userId,
            orderId,
            productId
        })

        new SuccessResponse({
            message: 'Review eligibility checked successfully',
            metadata: result
        }).send(res)
    })

    // [GET] /api/reviews/product/:productId - Lấy reviews của sản phẩm
    getProductReviews = asyncHandler(async (req, res) => {
        const { productId } = req.params
        const queryOptions = req.query

        const result = await ReviewService.getProductReviews(
            productId,
            queryOptions
        )

        new SuccessResponse({
            message: 'Product reviews retrieved successfully',
            metadata: result,
        }).send(res)
    })

    // [GET] /api/reviews/user/me - Lấy reviews của user hiện tại
    getUserReviews = asyncHandler(async (req, res) => {
        const userId = req.userId
        const queryOptions = req.query

        const result = await ReviewService.getUserReviews(userId, queryOptions)

        new SuccessResponse({
            message: 'User reviews retrieved successfully',
            metadata: result,
        }).send(res)
    })

    // [GET] /api/reviews/product/:productId/top - Lấy top reviews của sản phẩm
    getTopReviews = asyncHandler(async (req, res) => {
        const { productId } = req.params
        const { limit = 3 } = req.query

        const reviews = await ReviewService.getTopReviews(
            productId,
            parseInt(limit)
        )

        new SuccessResponse({
            message: 'Top reviews retrieved successfully',
            metadata: { reviews },
        }).send(res)
    })

    // [GET] /api/reviews/product/:productId/stats - Lấy thống kê rating của sản phẩm
    getProductRatingStats = asyncHandler(async (req, res) => {
        const { productId } = req.params

        const stats = await ReviewService.getProductRatingStats(productId)

        new SuccessResponse({
            message: 'Product rating stats retrieved successfully',
            metadata: { stats },
        }).send(res)
    })

    // [PATCH] /api/reviews/:reviewId - Update review
    updateReview = asyncHandler(async (req, res) => {
        const { reviewId } = req.params
        const userId = req.userId
        const updateData = req.body

        const updatedReview = await ReviewService.updateReview(
            reviewId,
            userId,
            updateData
        )

        new SuccessResponse({
            message: 'Review updated successfully',
            metadata: { review: updatedReview },
        }).send(res)
    })

    // [DELETE] /api/reviews/:reviewId - Xóa review
    deleteReview = asyncHandler(async (req, res) => {
        const { reviewId } = req.params
        const userId = req.userId

        await ReviewService.deleteReview(reviewId, userId)

        new SuccessResponse({
            message: 'Review deleted successfully',
            metadata: {},
        }).send(res)
    })

    // [POST] /api/reviews/:reviewId/like - Like/Unlike review
    toggleReviewLike = asyncHandler(async (req, res) => {
        const { reviewId } = req.params
        const userId = req.userId

        const result = await ReviewService.toggleReviewLike(reviewId, userId)

        new SuccessResponse({
            message: `Review ${
                result.isLiked ? 'liked' : 'unliked'
            } successfully`,
            metadata: result,
        }).send(res)
    })

    // [GET] /api/reviews/search - Search reviews
    searchReviews = asyncHandler(async (req, res) => {
        const { q: query } = req.query
        const queryOptions = req.query

        if (!query) {
            throw new BadRequestError('Search query is required')
        }

        const result = await ReviewService.searchReviews(query, queryOptions)

        new SuccessResponse({
            message: 'Reviews search completed',
            metadata: result,
        }).send(res)
    })

    // ============ ADMIN ENDPOINTS ============

    // [GET] /api/admin/reviews/pending - Lấy reviews cần moderate
    getPendingReviews = asyncHandler(async (req, res) => {
        const queryOptions = req.query

        const result = await ReviewService.getPendingReviews(queryOptions)

        new SuccessResponse({
            message: 'Pending reviews retrieved successfully',
            metadata: result,
        }).send(res)
    })

    // [PATCH] /api/admin/reviews/:reviewId/moderate - Moderate review
    moderateReview = asyncHandler(async (req, res) => {
        const { reviewId } = req.params
        const { action, note } = req.body

        if (!action) {
            throw new BadRequestError('Action (approve/reject) is required')
        }

        const result = await ReviewService.moderateReview(
            reviewId,
            action,
            note
        )

        new SuccessResponse({
            message: `Review ${action}d successfully`,
            metadata: { review: result },
        }).send(res)
    })

    // [POST] /api/admin/reviews/bulk-moderate - Bulk moderate reviews
    bulkModerateReviews = asyncHandler(async (req, res) => {
        const { review_ids, action } = req.body

        if (!review_ids || !action) {
            throw new BadRequestError('Review IDs and action are required')
        }

        const result = await ReviewService.bulkModerateReviews(
            review_ids,
            action
        )

        new SuccessResponse({
            message: 'Bulk moderation completed',
            metadata: result,
        }).send(res)
    })

    // [DELETE] /api/admin/reviews/:reviewId - Admin delete review
    adminDeleteReview = asyncHandler(async (req, res) => {
        const { reviewId } = req.params
        const { reason } = req.body

        await ReviewService.adminDeleteReview(reviewId, reason)

        new SuccessResponse({
            message: 'Review deleted successfully',
            metadata: {},
        }).send(res)
    })

    // [GET] /api/admin/reviews/statistics - Lấy thống kê reviews cho admin
    getReviewStatistics = asyncHandler(async (req, res) => {
        const stats = await ReviewService.getReviewStatistics()

        new SuccessResponse({
            message: 'Review statistics retrieved successfully',
            metadata: { statistics: stats },
        }).send(res)
    })

    // [GET] /api/reviews/:reviewId - Lấy chi tiết 1 review
    getReviewById = asyncHandler(async (req, res) => {
        const { reviewId } = req.params
        const ReviewRepository = require('../models/repositories/review.repo')

        const review = await ReviewRepository.findById(reviewId)
        if (!review) {
            throw new NotFoundError('Review not found')
        }

        new SuccessResponse({
            message: 'Review retrieved successfully',
            metadata: { review },
        }).send(res)
    })

    // [GET] /api/reviews/user/:userId - Admin lấy reviews của user cụ thể
    getReviewsByUserId = asyncHandler(async (req, res) => {
        const { userId } = req.params
        const queryOptions = req.query

        const result = await ReviewService.getUserReviews(userId, queryOptions)

        new SuccessResponse({
            message: 'User reviews retrieved successfully',
            metadata: result,
        }).send(res)
    })
}

module.exports = new ReviewController()
