import { accessAPI } from './api'
import apiClient from '../config/apiClient'
import authUtils from '../utils/authUtils'
import { handleApiError, isAuthError } from '../utils/errorHandler'
import { extractMultipleData, extractData } from '../utils/apiUtils'
import envConfig from '../config/env'
/**
 * Auth Service - Business logic layer for authentication
 */
export const authService = {
    /**
     * Login user
     */
    login: async (email, password) => {
        try {
            const response = await accessAPI.login({ email, password })

            // Extract cả tokens, user và images từ metadata
            const { tokens, user, images } = extractMultipleData(response, [
                'tokens',
                'user',
                'images',
            ])

            // Validate tokens
            if (!tokens?.accessToken) {
                throw new Error('Không nhận được access token từ server')
            }

            // console.log('✅ Login successful:', {
            //     hasTokens: !!tokens,
            //     hasUser: !!user,
            //     hasImages: !!images,
            //     userRole: user?.usr_role,
            // })

            return { tokens, user, images }
        } catch (error) {
            throw handleApiError(error, 'Đăng nhập thất bại')
        }
    },

    /**
     * Register user - Chỉ gửi email để verify
     */
    register: async (email) => {
        try {
            const response = await accessAPI.register(email)
            return response.data || response
        } catch (error) {
            throw handleApiError(error, 'Gửi email xác thực thất bại')
        }
    },

    /**
     * Verify email với token
     */
    verifyEmail: async (token) => {
        try {
            const response = await accessAPI.verifyEmail(token)

            const { tokens, user, images } = extractMultipleData(response, [
                'tokens',
                'user',
                'images',
            ])

            // Validate tokens
            if (!tokens?.accessToken) {
                throw new Error('Không nhận được access token từ server')
            }

            // console.log('✅ Email verification successful:', {
            //     hasTokens: !!tokens,
            //     hasUser: !!user,
            //     hasImages: !!images,
            //     userRole: user?.usr_role,
            // })

            return { tokens, user, images }
        } catch (error) {
            throw handleApiError(error, 'Xác thực email thất bại')
        }
    },

    /**
     * Đổi mật khẩu sau khi verify email
     * Backend trả về tokens mới để invalidate tokens cũ
     */
    changePassword: async (password) => {
        try {
            const response = await accessAPI.changePassword(password)
            
            // Extract tokens từ response
            const { tokens } = extractMultipleData(response, ['tokens'])
            
            // Validate tokens
            if (!tokens?.accessToken) {
                throw new Error('Không nhận được token mới từ server')
            }
            
            return { tokens }
        } catch (error) {
            throw handleApiError(error, 'Đổi mật khẩu thất bại')
        }
    },

    getProfile: async () => {
        try {
            const response = await accessAPI.getProfile()
            const { profile, images } = extractMultipleData(response, [
                'profile',
                'images',
            ])
            return { profile, images }
        } catch (error) {
            throw handleApiError(error, 'Lấy thông tin thất bại')
        }
    },

    updateAvatar: async (file) => {
        const formData = new FormData()
        formData.append('avatar', file)
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1])
        }

        return await accessAPI.uploadAvatar(formData)
    },

    updateProfile: async (profileData) => {
        try {
            const response = await accessAPI.updateProfile(profileData)
            const { profile, images } = extractMultipleData(response, [
                'profile',
                'images',
            ])
            return { profile, images }
        } catch (error) {
            throw handleApiError(error, 'Cập nhật profile thất bại')
        }
    },

    logout: async () => {
        try {
            const response = await accessAPI.logout()

            return true
        } catch (error) {
            console.error('❌ Logout error:', error)

            // Nếu là lỗi auth (401), coi như đã logout
            if (isAuthError(error)) {
                return true
            }

            throw handleApiError(error, 'Đăng xuất thất bại')
        } finally {
            // Luôn clear auth dù có lỗi hay không
            authUtils.clearAuth()
            delete apiClient.defaults.headers.common['Authorization']

            // Clear chat session khi logout
            try {
                const { chatService } = await import('./chatService')
                chatService.clearCurrentSession()
            } catch (error) {
                console.error('Error clearing chat session on logout:', error)
            }
        }
    },
}

export default authService
