import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import reviewService from '../services/reviewService'
import { handleApiError } from '../utils/errorHandler'

// Hook để lấy reviews của sản phẩm
export const useProductReviews = (productId, params = {}) => {
    return useQuery({
        queryKey: ['product-reviews', productId, params],
        queryFn: () => reviewService.getProductReviews(productId, params),
        enabled: !!productId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Hook để lấy thống kê rating của sản phẩm
export const useProductRatingStats = (productId) => {
    return useQuery({
        queryKey: ['product-rating-stats', productId],
        queryFn: () => reviewService.getProductRatingStats(productId),
        enabled: !!productId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Hook để lấy top reviews
export const useTopReviews = (productId, limit = 3) => {
    return useQuery({
        queryKey: ['top-reviews', productId, limit],
        queryFn: () => reviewService.getTopReviews(productId, limit),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    })
}

// Hook để lấy reviews của user
export const useUserReviews = (params = {}) => {
    return useQuery({
        queryKey: ['user-reviews', params],
        queryFn: () => reviewService.getUserReviews(params),
        staleTime: 5 * 60 * 1000,
    })
}

// Hook để tạo review mới
export const useCreateReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: reviewService.createReview,
        onSuccess: (data) => {
            message.success('Đánh giá đã được gửi thành công!')

            // Invalidate các queries liên quan
            const productId = data.metadata?.review?.product
            if (productId) {
                queryClient.invalidateQueries({
                    queryKey: ['product-reviews', productId],
                })
                queryClient.invalidateQueries({
                    queryKey: ['product-rating-stats', productId],
                })
                queryClient.invalidateQueries({
                    queryKey: ['top-reviews', productId],
                })
            }
            queryClient.invalidateQueries({
                queryKey: ['user-reviews'],
            })
        },
        onError: (error) => {
            const errorMessage =
                error.response?.data?.message ||
                'Có lỗi xảy ra khi gửi đánh giá'
            message.error(errorMessage)
        },
    })
}

// Hook để update review
export const useUpdateReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ reviewId, updateData }) =>
            reviewService.updateReview(reviewId, updateData),
        onSuccess: (data, variables) => {
            message.success('Đánh giá đã được cập nhật!')

            const productId = data.metadata?.review?.product
            if (productId) {
                queryClient.invalidateQueries({
                    queryKey: ['product-reviews', productId],
                })
                queryClient.invalidateQueries({
                    queryKey: ['product-rating-stats', productId],
                })
            }
            queryClient.invalidateQueries({
                queryKey: ['user-reviews'],
            })
        },
        onError: (error) => {
            const errorMessage =
                error.response?.data?.message ||
                'Có lỗi xảy ra khi cập nhật đánh giá'
            message.error(errorMessage)
        },
    })
}

// Hook để xóa review
export const useDeleteReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: reviewService.deleteReview,
        onSuccess: () => {
            message.success('Đánh giá đã được xóa!')

            // Invalidate tất cả review queries
            queryClient.invalidateQueries({
                queryKey: ['product-reviews'],
            })
            queryClient.invalidateQueries({
                queryKey: ['product-rating-stats'],
            })
            queryClient.invalidateQueries({
                queryKey: ['top-reviews'],
            })
            queryClient.invalidateQueries({
                queryKey: ['user-reviews'],
            })
        },
        onError: (error) => {
            const errorMessage =
                error.response?.data?.message ||
                'Có lỗi xảy ra khi xóa đánh giá'
            message.error(errorMessage)
        },
    })
}

// Hook để like/unlike review
export const useToggleReviewLike = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: reviewService.toggleReviewLike,
        onSuccess: (data, reviewId) => {
            // Cập nhật cache optimistically
            queryClient.invalidateQueries({
                queryKey: ['product-reviews'],
            })

            const isLiked = data.metadata?.isLiked
            message.success(
                isLiked ? 'Đã thích đánh giá' : 'Đã bỏ thích đánh giá'
            )
        },
        onError: (error) => {
            message.error('Có lỗi xảy ra')
        },
    })
}

// Hook để search reviews
export const useSearchReviews = (query, params = {}) => {
    return useQuery({
        queryKey: ['search-reviews', query, params],
        queryFn: () => reviewService.searchReviews(query, params),
        enabled: !!query && query.trim().length >= 2,
        staleTime: 30 * 1000, // 30 seconds
    })
}

// Hook để lấy chi tiết review
export const useReviewById = (reviewId) => {
    return useQuery({
        queryKey: ['review-detail', reviewId],
        queryFn: () => reviewService.getReviewById(reviewId),
        enabled: !!reviewId,
    })
}

export const useUploadReviewImages = () => {
    return useMutation({
        mutationFn: reviewService.uploadImages,
        onError: (error) => {
            const handledError = handleApiError(error, 'Upload ảnh thất bại!')
            message.error(handledError.message)
        },
    })
}
