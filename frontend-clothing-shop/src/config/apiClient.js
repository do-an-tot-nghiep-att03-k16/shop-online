import axios from 'axios'
import envConfig from './env'
import authUtils from '../utils/authUtils'
import { STATUS_CODES } from '../constants'

// Define routes that require authentication
const PROTECTED_ROUTES = [
    '/checkout',
    '/payment',
    '/my-orders',
    '/profile',
    '/order-success',
    '/admin',
]

// Define API endpoints that should NOT redirect on 401
// These are typically auth-related endpoints where 401 is expected
const NO_REDIRECT_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/change-password',
    '/auth/refresh-token',
]

// Helper function to check if current route is protected
const isProtectedRoute = (pathname) => {
    return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

// Helper function to check if endpoint should not redirect on 401
const shouldNotRedirect = (url) => {
    return NO_REDIRECT_ENDPOINTS.some((endpoint) => url?.includes(endpoint))
}

const apiClient = axios.create({
    baseURL: envConfig.API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

export const fileClient = axios.create({
    baseURL: envConfig.API_BASE_URL,
    timeout: 30000,
})

// console.log('🚀 API Base URL:', envConfig.API_BASE_URL)

// ===== REQUEST INTERCEPTOR =====
apiClient.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData)
            delete config.headers['Content-Type']

        // console.log('📤 Sending request:', {
        //     url: config.url,
        //     method: config.method,
        //     headers: config.headers,
        //     data: config.data,
        // })
        const accessToken = authUtils.getToken()
        const refreshToken = authUtils.getRefreshToken()
        const user = authUtils.getUser()

        // Set Authorization header (Bearer token)
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }

        // Set refresh token header (nếu backend cần)
        if (refreshToken) {
            config.headers['x-rtoken-id'] = refreshToken
        }

        // Set client ID header (user ID)
        if (user?._id) {
            config.headers['x-client-id'] = user._id
        }

        // Set API key nếu có
        // if (envConfig.API_KEY && !config.headers['x-api-key']) {
        //     config.headers['x-api-key'] = envConfig.API_KEY
        // }

        // console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
        //     hasAuth: !!accessToken,
        //     hasRefresh: !!refreshToken,
        //     clientId: user?.usr_id,
        // })

        return config
    },
    (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
    }
)
fileClient.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }
        // console.log('📤 Sending request:', {
        //     url: config.url,
        //     method: config.method,
        //     headers: config.headers,
        //     data: config.data,
        // })
        const accessToken = authUtils.getToken()
        const refreshToken = authUtils.getRefreshToken()
        const user = authUtils.getUser()

        // Set Authorization header (Bearer token)
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }

        // Set refresh token header (nếu backend cần)
        if (refreshToken) {
            config.headers['x-rtoken-id'] = refreshToken
        }

        // Set client ID header (user ID)
        if (user?._id) {
            config.headers['x-client-id'] = user._id
        }

        // Set API key nếu có
        // if (envConfig.API_KEY && !config.headers['x-api-key']) {
        //     config.headers['x-api-key'] = envConfig.API_KEY
        // }

        // console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
        //     hasAuth: !!accessToken,
        //     hasRefresh: !!refreshToken,
        //     clientId: user?.usr_id,
        // })

        return config
    },
    (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
    }
)

// ===== RESPONSE INTERCEPTOR =====
apiClient.interceptors.response.use(
    (response) => {
        // Backend success response structure: { message, status, metadata }
        // console.log(
        //     `✅ ${response.config.method?.toUpperCase()} ${
        //         response.config.url
        //     }`,
        //     {
        //         status: response.data?.status,
        //         message: response.data?.message,
        //     }
        // )

        // Return response.data (chứa { message, status, metadata })
        return response.data
    },
    async (error) => {
        // Backend error response structure: { message, status }
        // console.error('❌ Response error:', {
        //     message: error.message,
        //     code: error.code,
        //     status: error.response?.status,
        //     url: error.config?.url,
        //     responseData: error.response?.data,
        //     backendStack: error.response?.data?.stack, // log backend stack nếu có
        // })

        // Handle 401 Unauthorized errors - Try refresh token
        if (error.response?.status === 401) {
            const originalRequest = error.config
            const refreshToken = authUtils.getRefreshToken()

            // Avoid infinite loops
            if (
                !originalRequest._retry &&
                refreshToken &&
                !originalRequest.url?.includes('refresh-token')
            ) {
                originalRequest._retry = true

                try {
                    // Call refresh token endpoint
                    const refreshResponse = await axios.post(
                        `${envConfig.API_BASE_URL}/auth/refresh-token`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${authUtils.getToken()}`,
                                'x-rtoken-id': refreshToken,
                                'x-client-id': authUtils.getUser()?._id,
                                'Content-Type': 'application/json',
                            },
                        }
                    )

                    const { metadata } = refreshResponse.data
                    if (metadata?.tokens?.accessToken) {
                        // Update tokens in storage
                        authUtils.setToken(metadata.tokens.accessToken)
                        if (metadata.tokens.refreshToken) {
                            authUtils.setRefreshToken(
                                metadata.tokens.refreshToken
                            )
                        }

                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${metadata.tokens.accessToken}`
                        return apiClient(originalRequest)
                    }
                } catch (refreshError) {
                    console.error('❌ Token refresh failed:', refreshError)

                    // Refresh failed - clear auth and redirect to login
                    // Don't redirect if this is a whitelisted endpoint (auth endpoints where 401 is expected)
                    if (!shouldNotRedirect(originalRequest.url)) {
                        console.log('🚨 Refresh failed, redirecting to login...')
                        authUtils.clearAuth()
                        window.location.href = '/login'
                    }
                    return Promise.reject(refreshError)
                }
            }

            // No refresh token or already retried - handle normally
            // Don't redirect if this is a whitelisted endpoint (auth endpoints where 401 is expected)
            if (!shouldNotRedirect(originalRequest.url)) {
                console.log('🚨 Unauthorized (401), redirecting to login...')
                authUtils.clearAuth()
                window.location.href = '/login'
            }
            return Promise.reject(error)
        }

        // Handle 403 Forbidden errors
        if (error.response?.status === 403) {
        }

        // Return formatted error response
        return Promise.reject({
            message:
                error.response?.data?.message ||
                error.message ||
                'Network Error',
            status:
                error.response?.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            originalError: error,
        })
    }
)

// File client response interceptor
fileClient.interceptors.response.use(
    (response) => {
        // console.log(
        //     `✅ ${response.config.method?.toUpperCase()} ${
        //         response.config.url
        //     }`,
        //     {
        //         status: response.data?.status,
        //         message: response.data?.message,
        //     }
        // )
        return response.data
    },
    async (error) => {
        // console.error('❌ File client error:', {
        //     message: error.message,
        //     code: error.code,
        //     status: error.response?.status,
        //     url: error.config?.url,
        //     responseData: error.response?.data,
        // })

        // Handle 401 Unauthorized errors for file uploads - Try refresh token
        if (error.response?.status === 401) {
            const originalRequest = error.config
            const refreshToken = authUtils.getRefreshToken()

            if (!originalRequest._retry && refreshToken) {
                originalRequest._retry = true

                try {
                    console.log(
                        '🔄 File upload token expired, attempting refresh...'
                    )

                    const refreshResponse = await axios.post(
                        `${envConfig.API_BASE_URL}/auth/refresh-token`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${authUtils.getToken()}`,
                                'x-rtoken-id': refreshToken,
                                'x-client-id': authUtils.getUser()?._id,
                                'Content-Type': 'application/json',
                            },
                        }
                    )

                    const { metadata } = refreshResponse.data
                    if (metadata?.tokens?.accessToken) {
                        authUtils.setToken(metadata.tokens.accessToken)
                        if (metadata.tokens.refreshToken) {
                            authUtils.setRefreshToken(
                                metadata.tokens.refreshToken
                            )
                        }

                        originalRequest.headers.Authorization = `Bearer ${metadata.tokens.accessToken}`
                        return fileClient(originalRequest)
                    }
                } catch (refreshError) {
                    console.error(
                        '❌ File upload token refresh failed:',
                        refreshError
                    )

                    // Don't redirect if this is a whitelisted endpoint (auth endpoints where 401 is expected)
                    if (!shouldNotRedirect(originalRequest.url)) {
                        console.log(
                            '🚨 File upload refresh failed, redirecting to login...'
                        )
                        authUtils.clearAuth()
                        window.location.href = '/login'
                    }
                    return Promise.reject(refreshError)
                }
            }

            // Don't redirect if this is a whitelisted endpoint (auth endpoints where 401 is expected)
            if (!shouldNotRedirect(originalRequest.url)) {
                console.log(
                    '🚨 File upload unauthorized, redirecting to login...'
                )
                authUtils.clearAuth()
                window.location.href = '/login'
            }
            return Promise.reject(error)
        }

        return Promise.reject({
            message:
                error.response?.data?.message ||
                error.message ||
                'File operation failed',
            status:
                error.response?.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            originalError: error,
        })
    }
)

export default apiClient
