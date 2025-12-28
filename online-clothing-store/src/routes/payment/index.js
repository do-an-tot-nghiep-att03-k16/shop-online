'use strict'

const express = require('express')
const paymentController = require('../../controllers/payment.controller')
const { authenticate, permission, sepayApiKey } = require('../../auth/checkAuth')
const asyncHandler = require('../../helpers/asyncHandler')
const router = express.Router()

// ✅ SSE SESSION SETUP - Tạo session key cho SSE (PROTECTED)  
// POST /payment/sse-session - Tạo session key để connect SSE
// NOTE: This route is defined in main router to bypass API key middleware  
// router.post('/sse-session', authenticate, asyncHandler(paymentController.createSSESession)) // Disabled - using main router

// ✅ SSE ROUTES - Server-Sent Events for realtime payment updates (PUBLIC with session)
// Note: This route is also defined in main router to bypass API key middleware
// GET /payment/events/:orderId - SSE stream cho payment updates
// router.get('/events/:orderId', asyncHandler(paymentController.paymentSSE)) // Disabled - using main router instead

// GET /payment/sse-status - Debug endpoint để check SSE connections (public for debug)
router.get('/sse-status', asyncHandler(paymentController.getSSEStatus))

// Protected routes (cần authentication)
router.use(authenticate)

// ===============================
// SEPAY PAYMENT ENDPOINTS - MINIMAL
// ===============================


// GET /payment/sepay/check-status/:order_id - Kiểm tra trạng thái thanh toán
router.get(
    '/sepay/check-status/:order_id',
    asyncHandler(paymentController.checkSepayStatus)
)

// ===============================
// TRANSACTION MANAGEMENT - MINIMAL
// ===============================

// NOTE: Transaction endpoint moved to /transaction routes

// NOTE: Admin transaction management moved to /transaction routes
// to keep payment routes focused on QR payment functionality only

module.exports = router
