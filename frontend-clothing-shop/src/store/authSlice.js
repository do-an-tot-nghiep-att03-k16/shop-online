import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../services/authService'
import authUtils from '../utils/authUtils'

const savedUser = authUtils.getUser() // return object hoặc null
const savedTokens = authUtils.getToken() // return accessToken hoặc null

const initialState = {
    user: savedUser || null,
    isAuthenticated: !!savedUser, // true nếu có user trong localStorage
    loading: false,
    error: null,
}

export const loginAsync = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const { tokens, user, images } = await authService.login(email, password)
            authUtils.saveTokens(tokens)
            authUtils.saveUser(user)

            return { user, tokens, images }
        } catch (error) {
            return rejectWithValue(error.message || 'Đăng nhập thất bại')
        }
    }
)

export const registerAsync = createAsyncThunk(
    'auth/register',
    async ({ email }, { rejectWithValue }) => {
        try {
            const result = await authService.register(email)
            return result
        } catch (error) {
            return rejectWithValue(error.message || 'Gửi email xác thực thất bại')
        }
    }
)

export const verifyEmailAsync = createAsyncThunk(
    'auth/verifyEmail',
    async ({ token }, { rejectWithValue }) => {
        try {
            const { tokens, user, images } = await authService.verifyEmail(token)
            authUtils.saveTokens(tokens)
            authUtils.saveUser(user)

            return { user, tokens, images }
        } catch (error) {
            return rejectWithValue(error.message || 'Xác thực email thất bại')
        }
    }
)

export const changePasswordAsync = createAsyncThunk(
    'auth/changePassword',
    async ({ password }, { rejectWithValue, dispatch }) => {
        try {
            const { tokens } = await authService.changePassword(password)
            
            // Lưu tokens mới vào localStorage
            authUtils.saveTokens(tokens)
            
            // Lấy thông tin user từ localStorage (đã được lưu khi verify email)
            const savedUser = authUtils.getUser()
            
            return { tokens, user: savedUser }
        } catch (error) {
            return rejectWithValue(error.message || 'Đổi mật khẩu thất bại')
        }
    }
)

export const getProfileAsync = createAsyncThunk(
    'auth/getProfile',
    async (_, { rejectWithValue }) => {
        try {
            const { profile, images } = await authService.getProfile()
            const userWithImages = { ...profile, images }
            authUtils.saveUser(userWithImages) // Sync to localStorage
            return userWithImages
        } catch (error) {
            return rejectWithValue(error.message || 'Lấy thông tin thất bại')
        }
    }
)

export const updateProfileAsync = createAsyncThunk(
    'auth/updateProfile',
    async (profileData, { rejectWithValue }) => {
        try {
            const { profile, images } = await authService.updateProfile(profileData) // gọi PUT /profile
            return { ...profile, images }
        } catch (error) {
            return rejectWithValue(error.message || 'Cập nhật thất bại')
        }
    }
)

export const logoutAsync = createAsyncThunk('auth/logout', async (_, {}) => {
    try {
        await authService.logout()
        return null
    } catch (error) {
        // Vẫn logout ở client dù API fail
        return null
    }
})

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        // Manual logout (không call API)
        clearAuth: (state) => {
            state.user = null
            state.isAuthenticated = false
            state.error = null
            authUtils.clearAuth()
        },
        // Manual update user data (không call API)
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload }
            authUtils.saveUser(state.user)
            // console.log('🔥 User saved to localStorage')
        },
    },
    extraReducers: (builder) => {
        const handlePending = (state) => {
            state.loading = true
            state.error = null
        }

        const handleRejected = (state, action) => {
            state.loading = false
            state.error = action.payload
        }

        // Login
        builder
            .addCase(loginAsync.pending, handlePending)
            .addCase(loginAsync.fulfilled, (state, action) => {
                state.loading = false
                state.user = { ...action.payload.user, images: action.payload.images }
                state.isAuthenticated = true
                state.error = null
            })
            .addCase(loginAsync.rejected, handleRejected)

        // Register (chỉ gửi email)
        builder
            .addCase(registerAsync.pending, handlePending)
            .addCase(registerAsync.fulfilled, (state, action) => {
                state.loading = false
                state.error = null
                // Không set user và isAuthenticated vì chỉ gửi email
            })
            .addCase(registerAsync.rejected, handleRejected)

        // Verify Email
        builder
            .addCase(verifyEmailAsync.pending, handlePending)
            .addCase(verifyEmailAsync.fulfilled, (state, action) => {
                state.loading = false
                state.user = { ...action.payload.user, images: action.payload.images }
                state.isAuthenticated = true
                state.error = null
            })
            .addCase(verifyEmailAsync.rejected, handleRejected)

        // Change Password
        builder
            .addCase(changePasswordAsync.pending, handlePending)
            .addCase(changePasswordAsync.fulfilled, (state, action) => {
                state.loading = false
                state.error = null
                // Đảm bảo user vẫn trong state và authenticated = true
                if (action.payload.user) {
                    state.user = action.payload.user
                    state.isAuthenticated = true
                }
            })
            .addCase(changePasswordAsync.rejected, handleRejected)

        // Get profile
        builder
            .addCase(getProfileAsync.pending, (state) => {
                state.loading = true
            })
            .addCase(getProfileAsync.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload
                state.error = null
            })
            .addCase(getProfileAsync.rejected, handleRejected)

        // Update profile
        builder
            .addCase(updateProfileAsync.pending, (state) => {
                state.loading = true
            })
            .addCase(updateProfileAsync.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload
                state.error = null
                authUtils.saveUser(action.payload)
            })
            .addCase(updateProfileAsync.rejected, handleRejected)

        // Logout
        builder
            .addCase(logoutAsync.pending, (state) => {
                state.loading = true
            })
            .addCase(logoutAsync.fulfilled, (state) => {
                state.loading = false
                state.user = null
                state.isAuthenticated = false
                state.error = null
            })
            .addCase(logoutAsync.rejected, (state) => {
                state.loading = false
                state.user = null
                state.isAuthenticated = false
                state.error = null
            })
    },
})

// Export actions
export const { updateUser, clearError, clearAuth } = authSlice.actions
export const selectCanAccessAdmin = (state) => {
    const role = state.auth.user?.usr_role

    if (!role) return false

    const normalizedRole = String(role).toLowerCase().trim()
    return normalizedRole === 'admin' || normalizedRole === 'shop'
}
// Selectors
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsAdmin = (state) => state.auth.user?.usr_role === 'admin'
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectUserRole = (state) => state.auth.user?.usr_role

export default authSlice.reducer
