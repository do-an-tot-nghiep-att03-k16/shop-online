import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import couponService from '../services/couponService'
import { handleApiError } from '../utils/errorHandler'

// Query keys
export const couponKeys = {
    all: ['coupons'],
    lists: () => [...couponKeys.all, 'list'],
    list: (params) => [...couponKeys.lists(), params],
    details: () => [...couponKeys.all, 'detail'],
    detail: (id) => [...couponKeys.details(), id],
    active: (params) => [...couponKeys.all, 'active', params],
    byCode: (code) => [...couponKeys.all, 'code', code],
    byCategory: (categoryId, params) => [...couponKeys.all, 'category', categoryId, params],
    byProduct: (productId, params) => [...couponKeys.all, 'product', productId, params],
    userHistory: (params) => [...couponKeys.all, 'history', params],
}

// ===== GET ALL COUPONS (ADMIN) =====
export const useCoupons = (params = {}) => {
    return useQuery({
        queryKey: couponKeys.list(params),
        queryFn: () => couponService.getAllCoupons(params),
        staleTime: 30000,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải danh sách coupon')
            message.error(handledError.message)
        },
    })
}

// ===== GET COUPON BY ID =====
export const useCoupon = (id) => {
    return useQuery({
        queryKey: couponKeys.detail(id),
        queryFn: () => couponService.getCouponById(id),
        enabled: !!id,
        staleTime: 30000,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải coupon')
            message.error(handledError.message)
        },
    })
}

// ===== GET ACTIVE COUPONS =====
export const useActiveCoupons = (params = {}) => {
    return useQuery({
        queryKey: couponKeys.active(params),
        queryFn: () => couponService.getActiveCoupons(params),
        staleTime: 30000,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải coupons active')
            message.error(handledError.message)
        },
    })
}

// ===== GET COUPON BY CODE =====
export const useCouponByCode = (code) => {
    return useQuery({
        queryKey: couponKeys.byCode(code),
        queryFn: () => couponService.getCouponByCode(code),
        enabled: !!code,
        staleTime: 30000,
        retry: 1,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải coupon')
            // Không hiển thị error message tự động cho trường hợp này
        },
    })
}

// ===== CREATE COUPON =====
export const useCreateCoupon = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: couponService.createCoupon,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: couponKeys.lists() })
            queryClient.invalidateQueries({ queryKey: couponKeys.active() })
            message.success('Tạo coupon thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tạo coupon')
            message.error(handledError.message)
        },
    })
}

// ===== UPDATE COUPON =====
export const useUpdateCoupon = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => couponService.updateCoupon(id, data),
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: couponKeys.lists() })
            queryClient.invalidateQueries({ queryKey: couponKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: couponKeys.active() })
            message.success('Cập nhật coupon thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể cập nhật coupon')
            message.error(handledError.message)
        },
    })
}

// ===== DELETE COUPON =====
export const useDeleteCoupon = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: couponService.deleteCoupon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: couponKeys.lists() })
            queryClient.invalidateQueries({ queryKey: couponKeys.active() })
            message.success('Xóa coupon thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể xóa coupon')
            message.error(handledError.message)
        },
    })
}

// ===== VALIDATE COUPON =====
export const useValidateCoupon = () => {
    return useMutation({
        mutationFn: couponService.validateCoupon,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể validate coupon')
            message.error(handledError.message)
        },
    })
}

// ===== APPLY COUPON =====
export const useApplyCoupon = () => {
    return useMutation({
        mutationFn: couponService.applyCoupon,
        onSuccess: () => {
            message.success('Áp dụng coupon thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể áp dụng coupon')
            message.error(handledError.message)
        },
    })
}

// ===== CHECK COUPON AVAILABILITY =====
export const useCheckCouponAvailability = (code) => {
    return useQuery({
        queryKey: ['coupon-availability', code],
        queryFn: () => couponService.checkCouponAvailability(code),
        enabled: !!code,
        retry: 1,
        staleTime: 0, // Always fresh
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể kiểm tra coupon')
            // Không hiển thị error message tự động
        },
    })
}

// ===== GET USER COUPON HISTORY =====
export const useUserCouponHistory = (params = {}) => {
    return useQuery({
        queryKey: couponKeys.userHistory(params),
        queryFn: () => couponService.getUserCouponHistory(params),
        staleTime: 30000,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải lịch sử coupon')
            message.error(handledError.message)
        },
    })
}

// ===== GET COUPONS BY CATEGORY =====
export const useCouponsByCategory = (categoryId, params = {}) => {
    return useQuery({
        queryKey: couponKeys.byCategory(categoryId, params),
        queryFn: () => couponService.getCouponsByCategory(categoryId, params),
        enabled: !!categoryId,
        staleTime: 30000,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải coupons theo category')
            message.error(handledError.message)
        },
    })
}

// ===== GET COUPONS BY PRODUCT =====
export const useCouponsByProduct = (productId, params = {}) => {
    return useQuery({
        queryKey: couponKeys.byProduct(productId, params),
        queryFn: () => couponService.getCouponsByProduct(productId, params),
        enabled: !!productId,
        staleTime: 30000,
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải coupons theo product')
            message.error(handledError.message)
        },
    })
}