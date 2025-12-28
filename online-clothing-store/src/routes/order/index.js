'use strict'

const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const orderController = require('../../controllers/order.controller')
const { authenticationV2, authenticate } = require('../../auth/checkAuth')
const grantAccess = require('../../middlewares/rbac.middleware')

// Tất cả routes cần authentication
router.use(authenticate)

// Checkout routes
router.get(
    '/review',
    grantAccess('readOwn', 'order'),
    asyncHandler(orderController.reviewOrder)
)

router.post(
    '/checkout',
    grantAccess('createOwn', 'order'),
    asyncHandler(orderController.checkout)
)

// User routes - user có thể đọc orders của mình
router.get(
    '/my-orders',
    grantAccess('readOwn', 'order'),
    asyncHandler(orderController.getUserOrders)
)

router.get(
    '/my-stats',
    grantAccess('readOwn', 'analytics'),
    asyncHandler(orderController.getOrderStats)
)

// User có thể bulk cancel nhiều orders cùng lúc (PHẢI ĐẶT TRƯỚC /:orderId)
router.put(
    '/bulk/cancel',
    grantAccess('updateOwn', 'order'),
    asyncHandler(orderController.bulkCancelOrders)
)

// User và Admin có thể xem order (controller sẽ check ownership)
router.get(
    '/:orderId',
    grantAccess('readOwn', 'order'),
    asyncHandler(orderController.getOrderById)
)

router.get(
    '/number/:orderNumber',
    grantAccess('readOwn', 'order'),
    asyncHandler(orderController.getOrderByNumber)
)

// User có thể cancel và return order của mình
router.put(
    '/:orderId/cancel',
    grantAccess('updateOwn', 'order'),
    asyncHandler(orderController.cancelOrder)
)

router.put(
    '/:orderId/return',
    grantAccess('updateOwn', 'order'),
    asyncHandler(orderController.returnOrder)
)

// Admin only routes - quản lý tất cả orders
router.get(
    '/',
    grantAccess('readAny', 'order'),
    asyncHandler(orderController.getAllOrders)
)

router.put(
    '/:orderId/status',
    grantAccess('updateAny', 'order'),
    asyncHandler(orderController.updateOrderStatus)
)

router.put(
    '/:orderId/tracking',
    grantAccess('updateAny', 'order'),
    asyncHandler(orderController.updateTracking)
)

router.put(
    '/:orderId/payment-status',
    grantAccess('updateAny', 'order'),
    asyncHandler(orderController.updatePaymentStatus)
)

// Admin analytics routes
router.get(
    '/analytics/stats',
    grantAccess('readAny', 'analytics'),
    asyncHandler(orderController.getOrderStats)
)

router.get(
    '/analytics/revenue',
    grantAccess('readAny', 'analytics'),
    asyncHandler(orderController.getRevenue)
)

// System/Cron routes - chỉ admin
router.post(
    '/system/auto-cancel-pending',
    grantAccess('updateAny', 'system'),
    asyncHandler(orderController.autoCancelPendingOrders)
)

module.exports = router
