import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cartAPI } from '../services/api'

// Async thunks for cart operations
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await cartAPI.getCart()
            return response.metadata || {}
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch cart')
        }
    }
)

export const fetchCartCount = createAsyncThunk(
    'cart/fetchCartCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await cartAPI.getCartCount()
            return response.metadata?.count || 0
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch cart count')
        }
    }
)

export const addToCartAsync = createAsyncThunk(
    'cart/addToCart',
    async ({ product_id, variant_sku, quantity }, { rejectWithValue }) => {
        try {
            const response = await cartAPI.addToCart({
                product_id,
                variant_sku,
                quantity
            })
            return response.metadata || {}
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to add to cart')
        }
    }
)

export const updateCartItemAsync = createAsyncThunk(
    'cart/updateCartItem',
    async ({ variant_sku, quantity }, { rejectWithValue }) => {
        try {
            const response = await cartAPI.updateItemQuantity(variant_sku, { quantity })
            return response.metadata || {}
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to update cart item')
        }
    }
)

export const removeFromCartAsync = createAsyncThunk(
    'cart/removeFromCart',
    async (variant_sku, { rejectWithValue }) => {
        try {
            const response = await cartAPI.removeItem(variant_sku)
            return response.metadata || {}
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to remove from cart')
        }
    }
)

export const clearCartAsync = createAsyncThunk(
    'cart/clearCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await cartAPI.clearCart()
            return response.metadata || {}
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to clear cart')
        }
    }
)

export const applyCouponAsync = createAsyncThunk(
    'cart/applyCoupon',
    async (code, { rejectWithValue }) => {
        try {
            const response = await cartAPI.applyCoupon({ code })
            return response.metadata || {}
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to apply coupon')
        }
    }
)

export const removeCouponAsync = createAsyncThunk(
    'cart/removeCoupon',
    async (_, { rejectWithValue }) => {
        try {
            const response = await cartAPI.removeCoupon()
            return response.metadata || {}
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to remove coupon')
        }
    }
)

const initialState = {
    items: [],
    total_items: 0,
    subtotal: 0,
    total: 0,
    applied_coupon: null,
    loading: false,
    error: null,
    // For quick cart count updates
    itemCount: 0,
    // Loading states for specific operations
    addingToCart: false,
    updatingCart: false,
    removingFromCart: false,
    applyingCoupon: false,
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        // Optimistic updates for better UX
        optimisticAddToCart: (state, action) => {
            const { variant_sku, quantity } = action.payload
            const existingItem = state.items.find(item => item.variant_sku === variant_sku)
            
            if (existingItem) {
                existingItem.quantity += quantity
            } else {
                state.items.push(action.payload)
            }
            
            state.total_items += quantity
            state.itemCount = state.total_items
        },
        optimisticUpdateQuantity: (state, action) => {
            const { variant_sku, quantity } = action.payload
            const item = state.items.find(item => item.variant_sku === variant_sku)
            
            if (item) {
                const oldQuantity = item.quantity
                if (quantity <= 0) {
                    state.items = state.items.filter(item => item.variant_sku !== variant_sku)
                } else {
                    item.quantity = quantity
                }
                state.total_items += (quantity - oldQuantity)
                state.itemCount = state.total_items
            }
        },
        optimisticRemoveItem: (state, action) => {
            const variant_sku = action.payload
            const item = state.items.find(item => item.variant_sku === variant_sku)
            
            if (item) {
                state.items = state.items.filter(item => item.variant_sku !== variant_sku)
                state.total_items -= item.quantity
                state.itemCount = state.total_items
            }
        }
    },
    extraReducers: (builder) => {
        // Fetch cart
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false
                const cart = action.payload
                state.items = cart.items || []
                state.total_items = cart.total_items || 0
                state.subtotal = cart.subtotal || 0
                state.total = cart.total || 0
                state.applied_coupon = cart.applied_coupon || null
                state.itemCount = state.total_items
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch cart count
        builder
            .addCase(fetchCartCount.fulfilled, (state, action) => {
                state.itemCount = action.payload
            })

        // Add to cart
        builder
            .addCase(addToCartAsync.pending, (state) => {
                state.addingToCart = true
                state.error = null
            })
            .addCase(addToCartAsync.fulfilled, (state, action) => {
                state.addingToCart = false
                const cart = action.payload
                state.items = cart.items || []
                state.total_items = cart.total_items || 0
                state.subtotal = cart.subtotal || 0
                state.total = cart.total || 0
                state.itemCount = state.total_items
            })
            .addCase(addToCartAsync.rejected, (state, action) => {
                state.addingToCart = false
                state.error = action.payload
            })

        // Update cart item
        builder
            .addCase(updateCartItemAsync.pending, (state) => {
                state.updatingCart = true
                state.error = null
            })
            .addCase(updateCartItemAsync.fulfilled, (state, action) => {
                state.updatingCart = false
                const cart = action.payload
                state.items = cart.items || []
                state.total_items = cart.total_items || 0
                state.subtotal = cart.subtotal || 0
                state.total = cart.total || 0
                state.itemCount = state.total_items
            })
            .addCase(updateCartItemAsync.rejected, (state, action) => {
                state.updatingCart = false
                state.error = action.payload
            })

        // Remove from cart
        builder
            .addCase(removeFromCartAsync.pending, (state) => {
                state.removingFromCart = true
                state.error = null
            })
            .addCase(removeFromCartAsync.fulfilled, (state, action) => {
                state.removingFromCart = false
                const cart = action.payload
                state.items = cart.items || []
                state.total_items = cart.total_items || 0
                state.subtotal = cart.subtotal || 0
                state.total = cart.total || 0
                state.itemCount = state.total_items
            })
            .addCase(removeFromCartAsync.rejected, (state, action) => {
                state.removingFromCart = false
                state.error = action.payload
            })

        // Clear cart
        builder
            .addCase(clearCartAsync.fulfilled, (state) => {
                state.items = []
                state.total_items = 0
                state.subtotal = 0
                state.total = 0
                state.applied_coupon = null
                state.itemCount = 0
            })

        // Apply coupon
        builder
            .addCase(applyCouponAsync.pending, (state) => {
                state.applyingCoupon = true
                state.error = null
            })
            .addCase(applyCouponAsync.fulfilled, (state, action) => {
                state.applyingCoupon = false
                const cart = action.payload
                state.applied_coupon = cart.applied_coupon || null
                state.subtotal = cart.subtotal || 0
                state.total = cart.total || 0
            })
            .addCase(applyCouponAsync.rejected, (state, action) => {
                state.applyingCoupon = false
                state.error = action.payload
            })

        // Remove coupon
        builder
            .addCase(removeCouponAsync.fulfilled, (state, action) => {
                const cart = action.payload
                state.applied_coupon = null
                state.subtotal = cart.subtotal || 0
                state.total = cart.total || 0
            })
    }
})

export const { 
    clearError, 
    optimisticAddToCart, 
    optimisticUpdateQuantity, 
    optimisticRemoveItem 
} = cartSlice.actions

// Selectors
export const selectCart = (state) => state.cart
export const selectCartItems = (state) => state.cart.items
export const selectCartTotal = (state) => state.cart.total
export const selectCartSubtotal = (state) => state.cart.subtotal
export const selectCartItemCount = (state) => state.cart.itemCount
export const selectCartLoading = (state) => state.cart.loading
export const selectCartError = (state) => state.cart.error
export const selectAppliedCoupon = (state) => state.cart.applied_coupon

export default cartSlice.reducer