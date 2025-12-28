import { userAPI } from './api'
import { handleApiError } from '../utils/errorHandler'
import { extractData, ensureArray } from '../utils/apiUtils'
import {
    transformToApiFormat,
    transformToFormFormat,
    formatDate,
} from '../utils/transformers'

/**
 * User Service - Business logic layer for user management
 * Backend response structure: { message, status, metadata: { user/users } }
 */
export const userService = {
    /**
     * Lấy tất cả users
     * Backend response: { message, status, metadata: { users: [...] } }
     */
    getAllUsers: async (params = {}) => {
        try {
            // Loại bỏ các giá trị undefined/null khỏi query
            const cleanQuery = Object.entries(params.query || {}).reduce(
                (acc, [key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        acc[key] = value
                    }
                    return acc
                },
                {}
            )

            const apiParams = {
                page: params.page || 1,
                limit: params.limit || 10,
                sortBy: params.sortBy || '_id',
                sortOrder: params.sortOrder || 'desc',
                query: cleanQuery, // Gửi query object
            }

            // Thêm search nếu có
            if (params.search && params.search.trim()) {
                apiParams.search = params.search.trim()
            }

            // console.log('📤 API params:', apiParams)

            const response = await userAPI.getAll(apiParams)


            const metadata = response.metadata || {}

            return {
                users: metadata.data || [],  // Backend trả về 'data' không phải 'users'
                pagination: metadata.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                },
            }
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách user')
        }
    },

    /**
     * Get user by ID
     */
    getUserById: async (id) => {
        try {
            const response = await userAPI.getById(id)
            return extractData(response, 'user')
        } catch (error) {
            throw handleApiError(error, 'Lỗi khi lấy thông tin user')
        }
    },

    /**
     * Create new user with data transformation
     */
    createUser: async (userData) => {
        try {
            // Transform từ form format (usr_*) sang backend format
            const transformedData = userService.transformUserForApi(userData)

                // Debug: userData transformation complete

            const response = await userAPI.create(transformedData)


            return extractData(response, 'user')
        } catch (error) {
            throw handleApiError(error, 'Lỗi khi tạo user')
        }
    },

    /**
     * Update user with data transformation
     */
    updateUser: async (id, userData) => {
        try {
            const transformedData = userService.transformUserForApi(userData)

            // Debug info removed for production

            const response = await userAPI.update(id, transformedData)
            return extractData(response, 'user')
        } catch (error) {
            throw handleApiError(error, 'Lỗi khi cập nhật user')
        }
    },

    /**
     * Delete user
     */
    deleteUser: async (id) => {
        try {
            await userAPI.delete(id)
            return true
        } catch (error) {
            throw handleApiError(error, 'Lỗi khi xóa user')
        }
    },

    /**
     * Transform user data for form (convert date to dayjs)
     */
    transformUserForForm: (user) => {
        return transformToFormFormat(user, 'usr_')
    },

    transformUserForApi: (user) => {
        return transformToApiFormat(user, 'usr_')
    },

    /**
     * Format date for display
     */
    formatDate: (date) => {
        return formatDate(date)
    },
}

export default userService
