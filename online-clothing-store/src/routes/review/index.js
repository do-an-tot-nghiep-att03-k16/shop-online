'use strict'

const express = require('express')
const reviewController = require('../../controllers/review.controller')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')
const   grantAccess = require('../../middlewares/rbac.middleware')
const router = express.Router()

// ============ PUBLIC ROUTES ============

// Lấy reviews của sản phẩm (public - không cần auth)
router.get('/product/:productId', reviewController.getProductReviews)

// Lấy top reviews của sản phẩm (public)
router.get('/product/:productId/top', reviewController.getTopReviews)

// Lấy thống kê rating của sản phẩm (public)
router.get('/product/:productId/stats', reviewController.getProductRatingStats)

// Search reviews (public)
router.get('/search', reviewController.searchReviews)

// Check if user can review (MUST BE BEFORE /:reviewId to avoid conflict)
router.get('/can-review', authenticate, reviewController.checkCanReview)

// Lấy chi tiết 1 review (public)
router.get('/:reviewId', reviewController.getReviewById)

// ============ AUTHENTICATED ROUTES ============

// Authentication middleware cho tất cả routes phía dưới
router.use(authenticate)

// Tạo review mới (user phải đăng nhập)
router.post('/', reviewController.createReview)

// Lấy reviews của user hiện tại
router.get('/user/me', reviewController.getUserReviews)

// Update review của mình
router.patch('/:reviewId', reviewController.updateReview)

// Xóa review của mình
router.delete('/:reviewId', reviewController.deleteReview)

// Like/Unlike review
router.post('/:reviewId/like', reviewController.toggleReviewLike)

// ============ ADMIN ROUTES ============

// Lấy reviews cần moderate (admin only)
router.get(
    '/admin/pending',
    grantAccess('readAny', 'review'),
    reviewController.getPendingReviews
)

// Lấy thống kê reviews (admin only)
router.get(
    '/admin/statistics',
    grantAccess('readAny', 'review'),
    reviewController.getReviewStatistics
)

// Lấy reviews của user cụ thể (admin only)
router.get(
    '/admin/user/:userId',
    grantAccess('readAny', 'review'),
    reviewController.getReviewsByUserId
)

// Moderate review (admin only)
router.patch(
    '/admin/:reviewId/moderate',
    grantAccess('updateAny', 'review'),
    reviewController.moderateReview
)

// Bulk moderate reviews (admin only)
router.post(
    '/admin/bulk-moderate',
    grantAccess('updateAny', 'review'),
    reviewController.bulkModerateReviews
)

// Admin delete review (admin only)
router.delete(
    '/admin/:reviewId',
    grantAccess('deleteAny', 'review'),
    reviewController.adminDeleteReview
)

module.exports = router
