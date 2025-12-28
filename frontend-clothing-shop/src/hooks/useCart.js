import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { cartAPI } from '../services/api'
import { useAuth } from './useAuth'
import {
    fetchCart,
    fetchCartCount,
    addToCartAsync,
    updateCartItemAsync,
    removeFromCartAsync,
    clearCartAsync,
    applyCouponAsync,
    removeCouponAsync,
    optimisticAddToCart,
    optimisticUpdateQuantity,
    optimisticRemoveItem,
    clearError,
    selectCart,
    selectCartItems,
    selectCartTotal,
    selectCartSubtotal,
    selectCartItemCount,
    selectCartLoading,
    selectCartError,
    selectAppliedCoupon
} from '../store/cartSlice'

// Main cart hook
export const useCart = () => {
    const dispatch = useDispatch()
    const cart = useSelector(selectCart)
    const { isAuthenticated } = useAuth()
    
    // React Query for server sync
    const { data: cartData, isLoading: queryLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartAPI.getCart()
            return response.metadata || {}
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: isAuthenticated, // Only fetch when user is authenticated
    })
    
    // Sync React Query data with Redux
    React.useEffect(() => {
        if (cartData) {
            // Manually sync cart data to Redux
            dispatch(fetchCart.fulfilled(cartData))
        }
    }, [cartData, dispatch])
    
    return {
        ...cart,
        isLoading: cart.loading || queryLoading,
        refetch: () => dispatch(fetchCart())
    }
}

// Cart item count hook (optimized for header)
export const useCartCount = () => {
    const dispatch = useDispatch()
    const itemCount = useSelector(selectCartItemCount)
    const { isAuthenticated } = useAuth()
    
    const { data } = useQuery({
        queryKey: ['cart', 'count'],
        queryFn: async () => {
            const response = await cartAPI.getCartCount()
            return response.metadata?.count || 0
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: isAuthenticated, // Only fetch when authenticated
    })
    
    React.useEffect(() => {
        if (data !== undefined) {
            dispatch(fetchCartCount.fulfilled(data))
        }
    }, [data, dispatch])
    
    return itemCount
}

// Add to cart hook
export const useAddToCart = (options = {}) => {
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    const { silent = false } = options
    
    return useMutation({
        mutationFn: ({ product_id, variant_sku, quantity, productData }) => {
            // Optimistic update first
            dispatch(optimisticAddToCart({
                variant_sku,
                quantity,
                product_id,
                ...productData
            }))
            
            return cartAPI.addToCart({ product_id, variant_sku, quantity })
        },
        onSuccess: (data) => {
            // Update Redux with server response
            dispatch(addToCartAsync.fulfilled(data.metadata || {}))
            
            // Invalidate React Query cache
            queryClient.invalidateQueries(['cart'])
            queryClient.invalidateQueries(['cart', 'count'])
            
            // Only show message if not silent
            if (!silent) {
                message.success('Đã thêm sản phẩm vào giỏ hàng!')
            }
        },
        onError: (error) => {
            // Revert optimistic update by refetching
            dispatch(fetchCart())
            message.error(error?.message || 'Không thể thêm vào giỏ hàng')
        }
    })
}

// Update cart item hook
export const useUpdateCartItem = () => {
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ variant_sku, quantity }) => {
            // Optimistic update
            dispatch(optimisticUpdateQuantity({ variant_sku, quantity }))
            
            return cartAPI.updateItemQuantity(variant_sku, { quantity })
        },
        onSuccess: (data) => {
            dispatch(updateCartItemAsync.fulfilled(data.metadata || {}))
            queryClient.invalidateQueries(['cart'])
            queryClient.invalidateQueries(['cart', 'count'])
        },
        onError: (error) => {
            dispatch(fetchCart())
            message.error(error?.message || 'Không thể cập nhật giỏ hàng')
        }
    })
}

// Remove from cart hook
export const useRemoveFromCart = () => {
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (variant_sku) => {
            // Optimistic update
            dispatch(optimisticRemoveItem(variant_sku))
            
            return cartAPI.removeItem(variant_sku)
        },
        onSuccess: (data) => {
            dispatch(removeFromCartAsync.fulfilled(data.metadata || {}))
            queryClient.invalidateQueries(['cart'])
            queryClient.invalidateQueries(['cart', 'count'])
            message.success('Đã xóa sản phẩm khỏi giỏ hàng!')
        },
        onError: (error) => {
            dispatch(fetchCart())
            message.error(error?.message || 'Không thể xóa khỏi giỏ hàng')
        }
    })
}

// Clear cart hook
export const useClearCart = () => {
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: () => cartAPI.clearCart(),
        onSuccess: (data) => {
            dispatch(clearCartAsync.fulfilled(data.metadata || {}))
            queryClient.invalidateQueries(['cart'])
            queryClient.invalidateQueries(['cart', 'count'])
            message.success('Đã xóa toàn bộ giỏ hàng!')
        },
        onError: (error) => {
            message.error(error?.message || 'Không thể xóa giỏ hàng')
        }
    })
}

// Apply coupon hook
export const useApplyCoupon = () => {
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (code) => cartAPI.applyCoupon({ code }),
        onSuccess: (data) => {
            dispatch(applyCouponAsync.fulfilled(data.metadata || {}))
            queryClient.invalidateQueries(['cart'])
            message.success('Đã áp dụng mã giảm giá!')
        },
        onError: (error) => {
            message.error(error?.message || 'Mã giảm giá không hợp lệ')
        }
    })
}

// Remove coupon hook
export const useRemoveCoupon = () => {
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: () => cartAPI.removeCoupon(),
        onSuccess: (data) => {
            dispatch(removeCouponAsync.fulfilled(data.metadata || {}))
            queryClient.invalidateQueries(['cart'])
            message.success('Đã hủy mã giảm giá!')
        },
        onError: (error) => {
            message.error(error?.message || 'Không thể hủy mã giảm giá')
        }
    })
}

// Validate cart hook
export const useValidateCart = () => {
    return useQuery({
        queryKey: ['cart', 'validate'],
        queryFn: async () => {
            const response = await cartAPI.validateCart()
            return response.metadata || {}
        },
        enabled: false, // Only run manually
    })
}

// Cart selectors (for easy access in components)
export const useCartSelectors = () => {
    return {
        items: useSelector(selectCartItems),
        total: useSelector(selectCartTotal),
        subtotal: useSelector(selectCartSubtotal),
        itemCount: useSelector(selectCartItemCount),
        loading: useSelector(selectCartLoading),
        error: useSelector(selectCartError),
        appliedCoupon: useSelector(selectAppliedCoupon),
    }
}