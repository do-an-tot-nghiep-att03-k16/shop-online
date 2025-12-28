import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import {
    loginAsync,
    registerAsync,
    verifyEmailAsync,
    changePasswordAsync,
    getProfileAsync,
    logoutAsync,
    updateUser as updateUserLocal,
    clearError,
    clearAuth,
    selectUser,
    selectIsAuthenticated,
    selectIsAdmin,
    selectAuthLoading,
    selectAuthError,
    selectCanAccessAdmin,
    updateProfileAsync,
} from '../store/authSlice'

export const useAuth = () => {
    const dispatch = useDispatch()

    // Selectors
    const user = useSelector(selectUser)
    const isAuthenticated = useSelector(selectIsAuthenticated)
    const isAdmin = useSelector(selectIsAdmin)
    const loading = useSelector(selectAuthLoading)
    const error = useSelector(selectAuthError)
    const canAccessAdmin = useSelector(selectCanAccessAdmin)

    // Actions
    const login = useCallback(
        (email, password) => dispatch(loginAsync({ email, password })),
        [dispatch]
    )

    const register = useCallback(
        (email) => dispatch(registerAsync({ email })),
        [dispatch]
    )

    const verifyEmail = useCallback(
        (token) => dispatch(verifyEmailAsync({ token })),
        [dispatch]
    )

    const changePassword = useCallback(
        (password) => dispatch(changePasswordAsync({ password })),
        [dispatch]
    )

    const getProfile = useCallback(() => {
        // console.trace('🔥🔥🔥 getProfile CALLED') // ← THÊM DÒNG NÀY
        return dispatch(getProfileAsync())
    }, [dispatch])

    const logout = useCallback(() => dispatch(logoutAsync()), [dispatch])

    const updateUserProfile = useCallback(
        (userData) => dispatch(updateProfileAsync(userData)),
        [dispatch]
    )

    const updateUserState = useCallback(
        (userData) => dispatch(updateUserLocal(userData)),
        [dispatch]
    )

    const clearAuthError = useCallback(() => dispatch(clearError()), [dispatch])

    const forceLogout = useCallback(() => dispatch(clearAuth()), [dispatch])

    return {
        user,
        isAuthenticated,
        isAdmin,
        canAccessAdmin,
        loading,
        error,
        login,
        register,
        verifyEmail,
        changePassword,
        getProfile,
        logout,
        updateUser: updateUserProfile, // API call
        updateUserState, // Local state update
        clearError: clearAuthError,
        clearAuth: forceLogout,
    }
}
