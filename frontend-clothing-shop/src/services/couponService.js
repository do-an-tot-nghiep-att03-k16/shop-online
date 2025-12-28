import { handleApiError } from '../utils/errorHandler'
import { couponAPI } from './api'

const couponService = {
    // Lấy tất cả coupons
    getAllCoupons: async (params = {}) => {
        try {
            const response = await couponAPI.getAll(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách coupon')
        }
    },

    // Tạo coupon mới
    createCoupon: async (data) => {
        try {
            const response = await couponAPI.create(data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tạo coupon')
        }
    },

    // Cập nhật coupon
    updateCoupon: async (id, data) => {
        try {
            const response = await couponAPI.update(id, data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể cập nhật coupon')
        }
    },

    // Xóa coupon
    deleteCoupon: async (id) => {
        try {
            const response = await couponAPI.delete(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể xóa coupon')
        }
    },

    // Lấy coupon theo ID
    getCouponById: async (id) => {
        try {
            const response = await couponAPI.getById(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải coupon')
        }
    },

    // Lấy coupon theo code
    getCouponByCode: async (code) => {
        try {
            const response = await couponAPI.getByCode(code)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải coupon')
        }
    },

    // Validate coupon
    validateCoupon: async (data) => {
        try {
            const response = await couponAPI.validate(data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể validate coupon')
        }
    },

    // Apply coupon
    applyCoupon: async (data) => {
        try {
            const response = await couponAPI.apply(data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể áp dụng coupon')
        }
    },

    // Lấy coupons active
    getActiveCoupons: async (params = {}) => {
        try {
            const response = await couponAPI.getActive(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải coupons active')
        }
    },

    // Lấy coupons theo category
    getCouponsByCategory: async (categoryId, params = {}) => {
        try {
            const response = await couponAPI.getByCategory(categoryId, params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải coupons theo category')
        }
    },

    // Lấy coupons theo product
    getCouponsByProduct: async (productId, params = {}) => {
        try {
            const response = await couponAPI.getByProduct(productId, params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải coupons theo product')
        }
    },

    // Check coupon availability
    checkCouponAvailability: async (code) => {
        try {
            const response = await couponAPI.checkAvailability(code)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể kiểm tra coupon')
        }
    },

    // Lấy lịch sử sử dụng coupon
    getUserCouponHistory: async (params = {}) => {
        try {
            const response = await couponAPI.getUserHistory(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải lịch sử coupon')
        }
    }
}

export default couponService