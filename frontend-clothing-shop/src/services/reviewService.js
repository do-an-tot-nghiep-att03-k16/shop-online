import { extractData, extractMultipleData } from '../utils/apiUtils'
import { reviewAPI } from './api'
import { handleApiError } from '../utils/errorHandler'

class ReviewService {
    // Lấy reviews của sản phẩm
    async getProductReviews(productId, params = {}) {
        try {
            const response = await reviewAPI.getProductReviews(
                productId,
                params
            )
            return response
        } catch (error) {
            console.error('Error fetching product reviews:', error)
        }
    }

    // Lấy thống kê rating của sản phẩm
    async getProductRatingStats(productId) {
        try {
            const response = await reviewAPI.getProductRatingStats(productId)
            return extractData(response, 'stats')
        } catch (error) {
            console.error('Error fetching rating stats:', error)
            throw error
        }
    }

    // Lấy top reviews của sản phẩm
    async getTopReviews(productId, limit = 3) {
        const response = await reviewAPI.getTopReviews(productId, limit)
        return response
    }

    // Tạo review mới (cần auth)
    async createReview(reviewData) {
        const response = await reviewAPI.createReview(reviewData)
        return response
    }

    // Lấy reviews của user hiện tại
    async getUserReviews(params = {}) {
        const response = await reviewAPI.getUserReviews(params)
        return response
    }

    // Update review
    async updateReview(reviewId, updateData) {
        const response = await reviewAPI.updateReview(reviewId, updateData)
        return response
    }

    // Xóa review
    async deleteReview(reviewId) {
        const response = await reviewAPI.deleteReview(reviewId)
        return response
    }

    // Like/Unlike review
    async toggleReviewLike(reviewId) {
        const response = await reviewAPI.toggleReviewLike(reviewId)
        return response
    }

    // Search reviews
    async searchReviews(query, params = {}) {
        const response = await reviewAPI.searchReviews(query, params)
        return response
    }

    // Lấy chi tiết 1 review
    async getReviewById(reviewId) {
        const response = await reviewAPI.getReviewById(reviewId)
        return response
    }

    // Check if user can review a product from a specific order
    async checkCanReview(orderId, productId) {
        try {
            if (!orderId || !productId) {
                return {
                    canReview: false,
                    reason: 'INVALID_PARAMS',
                    message: 'Thiếu thông tin orderId hoặc productId'
                }
            }

            // Ensure IDs are strings, not objects
            const cleanOrderId = typeof orderId === 'string' ? orderId : orderId.toString()
            const cleanProductId = typeof productId === 'string' ? productId : 
                                 (productId._id || productId.id || productId.toString())


            const response = await reviewAPI.checkCanReview(cleanOrderId, cleanProductId)
            return response.metadata || response.data || response
        } catch (error) {
            console.error('Error checking review eligibility:', error)
            
            // Handle specific error cases
            if (error.response?.status === 401) {
                return {
                    canReview: false,
                    reason: 'UNAUTHORIZED',
                    message: 'Bạn cần đăng nhập để đánh giá'
                }
            }
            
            if (error.response?.status === 400) {
                return {
                    canReview: false,
                    reason: 'BAD_REQUEST',
                    message: error.response.data?.message || 'Thông tin không hợp lệ'
                }
            }

            return {
                canReview: false,
                reason: 'NETWORK_ERROR',
                message: 'Không thể kiểm tra quyền đánh giá. Vui lòng thử lại.'
            }
        }
    }

    async uploadImages(files) {
        try {
            if (!files || files.length === 0) {
                throw new Error('Không có file để upload')
            }
            const response = await reviewAPI.uploadReviewImages(files)

            const uploadData = response?.metadata

            if (!uploadData?.images || uploadData.images.length === 0) {
                console.error('NO IMAGES FOUND IN:', uploadData)
                throw new Error('Không nhận được images từ server')
            }

            return uploadData
        } catch (error) {
            console.error('Upload failed:', error)
            throw handleApiError(error, 'Upload ảnh thất bại')
        }
    }
}

export default new ReviewService()
