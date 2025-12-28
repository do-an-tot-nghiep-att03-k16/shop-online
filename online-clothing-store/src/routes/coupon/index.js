'use strict'

const express = require('express')
const router = express.Router()
const couponController = require('../../controllers/coupon.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')
const { optionalAuthenticate } = require('../../auth/optionalAuth')
const grantAccess = require('../../middlewares/rbac.middleware')

// Public routes
router.get('/active', asyncHandler(couponController.getActiveCoupons))
router.get('/code/:code', optionalAuthenticate, asyncHandler(couponController.getCouponByCode))
router.get(
    '/category/:categoryId',
    asyncHandler(couponController.getCouponsByCategory)
)
router.get(
    '/product/:productId',
    asyncHandler(couponController.getCouponsByProduct)
)

// Authentication required
router.use(authenticate)

// User routes
router.post('/validate', asyncHandler(couponController.validateCoupon))
router.get('/history/me', asyncHandler(couponController.getUserCouponHistory))
router.get(
    '/check/:code',
    asyncHandler(couponController.checkCouponAvailability)
)

// Admin routes - RBAC protected
router.post('/', 
    grantAccess('createAny', 'coupon'), 
    asyncHandler(couponController.createCoupon)
)
router.get('/', 
    grantAccess('readAny', 'coupon'), 
    asyncHandler(couponController.getAllCoupons)
)
router.get('/:id', 
    grantAccess('readAny', 'coupon'), 
    asyncHandler(couponController.getCouponById)
)
router.patch('/:id', 
    grantAccess('updateAny', 'coupon'), 
    asyncHandler(couponController.updateCoupon)
)
router.delete('/:id', 
    grantAccess('deleteAny', 'coupon'), 
    asyncHandler(couponController.deleteCoupon)
)
router.post('/apply', 
    grantAccess('updateOwn', 'order'), // Apply coupon cần quyền update order
    asyncHandler(couponController.applyCoupon)
)

module.exports = router
