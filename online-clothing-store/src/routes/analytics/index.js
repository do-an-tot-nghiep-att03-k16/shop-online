'use strict'

const express = require('express')
const analyticsController = require('../../controllers/analytics.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')
const { roleCheck } = require('../../middlewares/role.middleware')
const grantAccess = require('../../middlewares/rbac.middleware')

const router = express.Router()

// All analytics routes require authentication
router.use(authenticate)

// Role-based access: admin và shop có thể xem analytics
router.use(roleCheck(['admin', 'shop']))

// Dashboard stats - Tổng quan
router.get(
    '/dashboard/stats',
    grantAccess('readAny', 'analytics'),
    asyncHandler(analyticsController.getDashboardStats)
)

// Revenue analytics - Phân tích doanh thu
router.get(
    '/revenue',
    grantAccess('readAny', 'analytics'),
    asyncHandler(analyticsController.getRevenueAnalytics)
)

// Order status distribution - Phân bố trạng thái đơn hàng
router.get(
    '/orders/status-distribution',
    grantAccess('readAny', 'analytics'),
    asyncHandler(analyticsController.getOrderStatusDistribution)
)

// Top products - Sản phẩm bán chạy
router.get(
    '/products/top',
    grantAccess('readAny', 'analytics'),
    asyncHandler(analyticsController.getTopProducts)
)

// Recent activities - Hoạt động gần đây
router.get(
    '/activities/recent',
    grantAccess('readAny', 'analytics'),
    asyncHandler(analyticsController.getRecentActivities)
)

// User growth - Tăng trưởng người dùng
router.get(
    '/users/growth',
    grantAccess('readAny', 'analytics'),
    asyncHandler(analyticsController.getUserGrowth)
)

// Category performance - Hiệu suất danh mục
router.get(
    '/categories/performance',
    grantAccess('readAny', 'analytics'),
    asyncHandler(analyticsController.getCategoryPerformance)
)

module.exports = router