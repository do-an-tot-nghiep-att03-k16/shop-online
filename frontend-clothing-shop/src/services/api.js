import apiClient, { fileClient } from '../config/apiClient'
// Product APIs
export const productAPI = {
    // Public endpoints - Updated to match backend routes (product/ not products/)
    getAll: (params) => apiClient.get('/product', { params }),
    getById: (id) => apiClient.get(`/product/${id}`),
    getBySlug: (slug) => apiClient.get(`/product/${slug}`), // Backend handles ID/slug in same route
    getBySKU: (sku) => apiClient.get('/product', { params: { sku } }), // Backend supports SKU query
    getByCategory: (categoryId, params) => {
        // Backend expects 'category' parameter for single category
        return apiClient.get('/product', {
            params: { category: categoryId, ...params },
        })
    },
    getByGender: (gender, params) => {
        // Backend filters by gender in main route
        return apiClient.get('/product', {
            params: { gender, ...params },
        })
    },
    getOnSale: (params) => {
        // Backend filters with on_sale flag
        return apiClient.get('/product', {
            params: { on_sale: true, ...params },
        })
    },
    search: (query, params) => {
        // Ensure query is properly encoded for URL but readable by backend
        const cleanQuery =
            typeof query === 'string' ? query.trim() : String(query).trim()

        return apiClient.get('/product/search', {
            params: { q: cleanQuery, ...params },
        })
    },
    checkVariant: (productId, sku) =>
        apiClient.get(`/product/${productId}/variants/${sku}/availability`),
    getAvailableSizes: (productId, color) =>
        apiClient.get(`/product/${productId}/sizes/${color}`),

    // Admin/Shop endpoints (require authentication)
    create: (data) => apiClient.post('/product', data),
    update: (id, data) => apiClient.patch(`/product/${id}`, data),
    delete: (id) => apiClient.delete(`/product/${id}`),
    publish: (id) => apiClient.patch(`/product/${id}/publish`),
    unpublish: (id) => apiClient.patch(`/product/${id}/unpublish`),
    updateStock: (id, data) => apiClient.patch(`/product/${id}/stock`, data),
    
    // Admin-specific endpoint to get ALL products (published + unpublished)
    getAllForAdmin: (params) => apiClient.get('/product/admin/all', { params }),
    
    // Inventory management
    getInventoryOverview: (params) => apiClient.get('/product/inventory/overview', { params }),
    getLowStockAlerts: (params) => apiClient.get('/product/inventory/low-stock-alerts', { params }),
    bulkUpdateStock: (data) => apiClient.post('/product/inventory/bulk-update', data),

    uploadImages: (files) => {
        const formData = new FormData()

        // Append tất cả files với cùng field name 'products'
        files.forEach((file) => {
            formData.append('products', file)
        })

        return fileClient.post('/upload/cloudinary/product', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

// Category APIs
export const categoryAPI = {
    getAll: (params) => apiClient.get('/category', { params }),
    getById: (id) => apiClient.get(`/category/${id}`),
    getBySlug: (slug) => apiClient.get(`/category/slug/${slug}`),
    getActive: (params) => apiClient.get('/category/active', { params }),
    search: (query, params) =>
        apiClient.get('/category/search', { params: { q: query, ...params } }),
    create: (data) => apiClient.post('/category', data),
    update: (id, data) => apiClient.put(`/category/${id}`, data),
    delete: (id) => apiClient.delete(`/category/${id}`),
    publish: (id) => apiClient.patch(`/category/${id}/publish`),
    unpublish: (id) => apiClient.patch(`/category/${id}/unpublish`),
    getParents: () => apiClient.get('/category/parents'),

    // Lấy children của một parent
    getChildren: (parentId) => apiClient.get(`/category/${parentId}/children`),

    // Upload category image
    uploadImage: (formData) => {
        return fileClient.post('/upload/cloudinary/category', formData, {
            transformRequest: [(data) => data], // Giữ nguyên FormData
            headers: {
                'Content-Type': undefined, // Force axios tự set
            },
        })
    },
}

// User APIs
export const accessAPI = {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (email) => apiClient.post('/auth/register', { email }),
    verifyEmail: (token) => apiClient.get(`/auth/verify-email?token=${token}`),
    changePassword: (password) => apiClient.post('/auth/change-password', { password }),
    logout: () => apiClient.post('/auth/logout'),
    getProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (data) => apiClient.patch('/auth/profile', data),
    getOrders: () => apiClient.get('/auth/orders'),
    uploadAvatar: (formData) => {
        return fileClient.post('/auth/avatar', formData, {
            transformRequest: [(data) => data], // Giữ nguyên FormData
            headers: {
                'Content-Type': undefined, // Force axios tự set
            },
        })
    },
}

export const userAPI = {
    create: (userData) => apiClient.post('/user', userData),
    getAll: (params) => apiClient.get('/user', { params }),
    getById: (id) => apiClient.get(`/user/${id}`),
    update: (id, userData) => apiClient.put(`/user/${id}`, userData),
    delete: (id) => apiClient.delete(`/user/${id}`),
}

// Address APIs
export const addressAPI = {
    // Get user addresses
    getAll: () => apiClient.get('/user/addresses'),
    getById: (addressId) => apiClient.get(`/user/addresses/${addressId}`),
    getDefault: () => apiClient.get('/user/addresses/default'),

    // CRUD operations
    create: (data) => apiClient.post('/user/addresses', data),
    update: (addressId, data) =>
        apiClient.put(`/user/addresses/${addressId}`, data),
    delete: (addressId) => apiClient.delete(`/user/addresses/${addressId}`),

    // Set default
    setDefault: (addressId) =>
        apiClient.patch(`/user/addresses/${addressId}/set-default`),

    // Search by location
    searchByLocation: (params) =>
        apiClient.get('/user/addresses/search', { params }),
}

// Cart APIs
export const cartAPI = {
    // Get cart
    getCart: () => apiClient.get('/cart'),

    // Get cart item count (faster)
    getCartCount: () => apiClient.get('/cart/count'),

    // Add item to cart
    addToCart: (data) => apiClient.post('/cart/items', data),

    // Update item quantity
    updateItemQuantity: (sku, data) =>
        apiClient.patch(`/cart/items/${sku}`, data),

    // Remove item from cart
    removeItem: (sku) => apiClient.delete(`/cart/items/${sku}`),

    // Clear entire cart
    clearCart: () => apiClient.delete('/cart'),

    // Apply coupon
    applyCoupon: (data) => apiClient.post('/cart/coupon', data),

    // Remove coupon
    removeCoupon: () => apiClient.delete('/cart/coupon'),

    // Validate cart before checkout
    validateCart: () => apiClient.get('/cart/validate'),

    // Sync cart prices
    syncCartPrices: () => apiClient.post('/cart/sync-prices'),
}

// Location APIs
export const locationAPI = {
    // Get all provinces
    getProvinces: () => apiClient.get('/location/provinces'),

    // Get wards by province ID (only province -> ward, no district)
    getWardsByProvince: (provinceId) =>
        apiClient.get(`/location/province/${provinceId}/wards`),

    // Alias for backward compatibility
    getWards: (provinceId) =>
        apiClient.get(`/location/province/${provinceId}/wards`),

    // Get location tree (provinces with wards)
    getLocationTree: () => apiClient.get('/location/tree'),

    // Search locations
    searchLocations: (params) => apiClient.get('/location/search', { params }),

    // Legacy search method
    search: (query) =>
        apiClient.get('/location/search', { params: { q: query } }),
}

// Order APIs
export const orderAPI = {
    // Review order before checkout
    reviewOrder: () => apiClient.get('/order/review'),

    // Checkout - create order
    checkout: (data) => apiClient.post('/order/checkout', data),

    // Get user orders with pagination (updated to match backend route)
    getMyOrders: (params) => apiClient.get('/order/my-orders', { params }),

    // Get order by ID
    getOrderById: (orderId) => apiClient.get(`/order/${orderId}`),

    // Get order by order number
    getOrderByNumber: (orderNumber) =>
        apiClient.get(`/order/number/${orderNumber}`),

    // Cancel order (updated to use PUT method)
    cancelOrder: (orderId, data) =>
        apiClient.put(`/order/${orderId}/cancel`, data),

    // Return order (updated to use PUT method)
    returnOrder: (orderId, data) =>
        apiClient.put(`/order/${orderId}/return`, data),

    // Get user order statistics (updated route)
    getMyOrderStats: () => apiClient.get('/order/my-stats'),

    // Admin endpoints
    getAllOrders: (params) => apiClient.get('/order', { params }),
    updateOrderStatus: (orderId, data) =>
        apiClient.put(`/order/${orderId}/status`, data),
    updateTracking: (orderId, data) =>
        apiClient.put(`/order/${orderId}/tracking`, data),
    updatePaymentStatus: (orderId, data) =>
        apiClient.put(`/order/${orderId}/payment-status`, data),
}

// Coupon APIs - Updated to match backend security features
export const couponAPI = {
    // Public endpoints
    getActive: (params) => apiClient.get('/coupon/active', { params }),
    getByCode: (code) => apiClient.get(`/coupon/code/${code}`),
    getByCategory: (categoryId, params) =>
        apiClient.get(`/coupon/category/${categoryId}`, { params }),
    getByProduct: (productId, params) =>
        apiClient.get(`/coupon/product/${productId}`, { params }),

    // Authenticated endpoints
    validate: (data) => apiClient.post('/coupon/validate', data),
    apply: (data) => apiClient.post('/coupon/apply', data),
    checkAvailability: (code) => apiClient.get(`/coupon/check/${code}`),
    getUserHistory: (params) => apiClient.get('/coupon/history/me', { params }),

    // Admin endpoints - Support new fields: type, visibility, assigned_users
    getAll: (params) => apiClient.get('/coupon', { params }),
    getById: (id) => apiClient.get(`/coupon/${id}`),
    create: (data) => apiClient.post('/coupon', data),
    update: (id, data) => apiClient.patch(`/coupon/${id}`, data),
    delete: (id) => apiClient.delete(`/coupon/${id}`),
}

// Shipping APIs
export const shippingAPI = {
    // Get available shipping providers
    getProviders: () => apiClient.get('/shipping/providers'),

    // Calculate shipping fee
    calculateFee: (data) => apiClient.post('/shipping/calculate-fee', data),

    // Create shipping order (admin)
    createOrder: (data) => apiClient.post('/shipping/create-order', data),

    // Track shipping order
    track: (trackingCode) => apiClient.get(`/shipping/track/${trackingCode}`),

    // Update shipping status (admin/webhook)
    updateStatus: (trackingCode, data) =>
        apiClient.put(`/shipping/update-status/${trackingCode}`, data),

    // Cancel shipping order
    cancel: (trackingCode, data) =>
        apiClient.put(`/shipping/cancel/${trackingCode}`, data),

    // Get providers for specific location
    getProvidersForLocation: (data) =>
        apiClient.post('/shipping/providers-for-location', data),

    // Webhook endpoints for shipping providers
    handleWebhook: (provider, data) =>
        apiClient.post(`/shipping/webhook/${provider}`, data),

    // Get shipping rates
    getRates: (data) => apiClient.post('/shipping/rates', data),

    // Generate tracking code
    generateTrackingCode: (provider) =>
        apiClient.post(`/shipping/generate-tracking/${provider}`),

    // Validate tracking code format
    validateTrackingCode: (trackingCode) =>
        apiClient.post('/shipping/validate-tracking', {
            tracking_code: trackingCode,
        }),
}

// Review APIs
export const reviewAPI = {
    // Public endpoints
    getProductReviews: (productId, params) =>
        apiClient.get(`/review/product/${productId}`, { params }),
    getProductRatingStats: (productId) =>
        apiClient.get(`/review/product/${productId}/stats`),
    getTopReviews: (productId, limit = 3) =>
        apiClient.get(`/review/product/${productId}/top?limit=${limit}`),
    getReviewById: (reviewId) => apiClient.get(`/review/${reviewId}`),
    searchReviews: (query, params) =>
        apiClient.get('/review/search', { params: { q: query, ...params } }),

    // Authenticated endpoints  
    checkCanReview: (orderId, productId) =>
        apiClient.get(`/review/can-review?orderId=${orderId}&productId=${productId}`),
    createReview: (reviewData) => apiClient.post('/review', reviewData),
    getUserReviews: (params) => apiClient.get('/review/user/me', { params }),
    updateReview: (reviewId, updateData) =>
        apiClient.patch(`/review/${reviewId}`, updateData),
    deleteReview: (reviewId) => apiClient.delete(`/review/${reviewId}`),
    toggleReviewLike: (reviewId) => apiClient.post(`/review/${reviewId}/like`),
    uploadReviewImages: (files) => {
        const formData = new FormData()

        // Dùng field name 'images' như route định nghĩa
        files.forEach((file) => {
            formData.append('images', file)
        })

        return fileClient.post('/upload/cloudinary/review', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

// Job Management APIs - REMOVED (Jobs run in background only)

// Analytics APIs
export const analyticsAPI = {
    // Dashboard overview
    getDashboardStats: (params) => apiClient.get('/analytics/dashboard/stats', { params }),
    
    // Revenue analytics
    getRevenueAnalytics: (params) => apiClient.get('/analytics/revenue', { params }),
    
    // Order status distribution  
    getOrderStatusDistribution: () => apiClient.get('/analytics/orders/status-distribution'),
    
    // Top products
    getTopProducts: (params) => apiClient.get('/analytics/products/top', { params }),
    
    // Recent activities
    getRecentActivities: (params) => apiClient.get('/analytics/activities/recent', { params }),
    
    // User growth
    getUserGrowth: (params) => apiClient.get('/analytics/users/growth', { params }),
    
    // Category performance
    getCategoryPerformance: () => apiClient.get('/analytics/categories/performance'),
}

// Payment APIs
export const paymentAPI = {
    // Tạo QR code Sepay
    createSepayQR: async (data) => {
        return apiClient.post('/payment/sepay/create-qr', data)
    },

    // Kiểm tra trạng thái thanh toán
    checkSepayStatus: async (order_id) => {
        return apiClient.get(`/payment/sepay/check-status/${order_id}`)
    },

    // Hủy thanh toán
    cancelSepayPayment: async (data) => {
        return apiClient.post('/payment/sepay/cancel', data)
    }
}

export default apiClient
