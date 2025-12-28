'use strict'

const express = require('express')
const router = express.Router()
const { apiKey, permission } = require('../auth/checkAuth')
const asyncHandler = require('../helpers/asyncHandler')
const accessController = require('../controllers/access.controller')

router.get('/v1/api/verify', asyncHandler(accessController.verifyEmailToken))

// Special routes: Bypass standard API key middleware (external services dùng custom auth)
const paymentController = require('../controllers/payment.controller')
const { sepayApiKey } = require('../auth/checkAuth')

router.post(
    '/v1/api/hook/sepay-payment',
    sepayApiKey,
    permission('1111'),
    asyncHandler(paymentController.sepayWebhook)
)

router.get(
    '/v1/api/payment/events/:orderId',
    asyncHandler(paymentController.paymentSSE)
)
router.post(
    '/v1/api/payment/sse-session',
    require('../auth/checkAuth').authenticate, // Need user auth for session creation
    asyncHandler(paymentController.createSSESession)
)

// SePay webhook - dùng Authorization header thay vì x-api-key

// API key middleware cho tất cả routes còn lại
// router.use(permission('0000'))

router.use('/v1/api/auth', require('./access'))

router.use('/v1/api/template', require('./template'))
router.use('/v1/api/product', require('./product')) // Product có public routes
router.use('/v1/api/category', require('./category')) // Category có public routes
router.use('/v1/api/coupon', require('./coupon')) // Coupon có public routes
router.use('/v1/api/location', require('./location')) // Location có public routes
router.use('/v1/api/review', require('./review')) // Review có public routes

router.use('/v1/api/cart', require('./cart'))
router.use('/v1/api/order', require('./order'))

// NOTE: Webhook route defined above to bypass payment router's authenticate middleware
router.use('/v1/api/payment', require('./payment'))
router.use('/v1/api/transaction', require('./transaction'))
router.use('/v1/api/upload', require('./upload'))
router.use('/v1/api/user', require('./user'))
router.use('/v1/api/user/addresses', require('./address'))
router.use('/v1/api/analytics', require('./analytics')) // Analytics routes
router.use('/v1/api/jobs', require('./job')) // Job routes

router.use(apiKey)
router.use(permission('2222'))
router.use('/v1/api/apikey', require('./apikey'))

module.exports = router
