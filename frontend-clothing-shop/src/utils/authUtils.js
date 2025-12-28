/**
 * Auth Utils - Helper functions for authentication
 */

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'

export const authUtils = {
    /**
     * Save tokens to localStorage
     */
    saveTokens: (tokens) => {
        if (tokens?.accessToken) {
            localStorage.setItem(TOKEN_KEY, tokens.accessToken)
        }
        if (tokens?.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
        }
    },

    /**
     * Get access token
     */
    getToken: () => {
        return localStorage.getItem(TOKEN_KEY)
    },

    /**
     * Get refresh token
     */
    getRefreshToken: () => {
        return localStorage.getItem(REFRESH_TOKEN_KEY)
    },

    /**
     * Save user info to localStorage
     */
    saveUser: (user) => {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user))
        }
    },

    /**
     * Get user info from localStorage
     */
    getUser: () => {
        try {
            const userStr = localStorage.getItem(USER_KEY)
            return userStr ? JSON.parse(userStr) : null
        } catch (e) {
            console.error('Error parsing user from localStorage:', e)
            return null
        }
    },

    /**
     * Check if user is admin
     */
    isAdmin: () => {
        const user = authUtils.getUser()
        return user?.usr_role === 'admin'
    },

    /**
     * Clear all auth data
     */
    clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        return !!authUtils.getToken()
    },
}

export default authUtils

