'use strict'

const CouponService = require('../services/coupon.service')
const { SuccessResponse } = require('../core/success.response')

class CouponController {
    // POST /coupons - Tạo coupon mới
    createCoupon = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create coupon successfully',
            metadata: await CouponService.createCoupon(req.body),
        }).send(res)
    }

    // GET /coupons/:id - Lấy coupon theo ID
    getCouponById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get coupon successfully',
            metadata: await CouponService.getCouponById(req.params.id),
        }).send(res)
    }

    // GET /coupons/code/:code - Lấy coupon theo code
    getCouponByCode = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get coupon successfully',
            metadata: await CouponService.getCouponByCode(
                req.params.code, 
                req.userId || null  // userId từ auth middleware (có thể null cho public route)
            ),
        }).send(res)
    }

    // GET /coupons - Lấy tất cả coupons
    getAllCoupons = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all coupons successfully',
            metadata: await CouponService.getAllCoupons(req.query),
        }).send(res)
    }

    // GET /coupons/active - Lấy coupons còn hiệu lực
    getActiveCoupons = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get active coupons successfully',
            metadata: await CouponService.getActiveCoupons(req.query),
        }).send(res)
    }

    // PATCH /coupons/:id - Update coupon
    updateCoupon = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update coupon successfully',
            metadata: await CouponService.updateCoupon(req.params.id, req.body),
        }).send(res)
    }

    // DELETE /coupons/:id - Xóa coupon
    deleteCoupon = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete coupon successfully',
            metadata: await CouponService.deleteCoupon(req.params.id),
        }).send(res)
    }

    // POST /coupons/validate - Validate coupon
    validateCoupon = async (req, res, next) => {
        new SuccessResponse({
            message: 'Validate coupon successfully',
            metadata: await CouponService.validateCoupon({
                code: req.body.code,
                userId: req.userId, // từ auth middleware
                orderValue: req.body.order_value,
                categoryIds: req.body.category_ids || [],
                productIds: req.body.product_ids || [],
            }),
        }).send(res)
    }

    // POST /coupons/apply - Áp dụng coupon (sau khi order thành công)
    applyCoupon = async (req, res, next) => {
        new SuccessResponse({
            message: 'Apply coupon successfully',
            metadata: await CouponService.applyCoupon({
                couponId: req.body.coupon_id,
                userId: req.userId,
                orderId: req.body.order_id,
                discountAmount: req.body.discount_amount,
            }),
        }).send(res)
    }

    // GET /coupons/history/me - Lấy lịch sử sử dụng coupon của user
    getUserCouponHistory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get user coupon history successfully',
            metadata: await CouponService.getUserCouponHistory(
                req.userId,
                req.query
            ),
        }).send(res)
    }

    // GET /coupons/category/:categoryId - Lấy coupons theo category
    getCouponsByCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get coupons by category successfully',
            metadata: await CouponService.getCouponsByCategory(
                req.params.categoryId,
                req.query
            ),
        }).send(res)
    }

    // GET /coupons/product/:productId - Lấy coupons theo product
    getCouponsByProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get coupons by product successfully',
            metadata: await CouponService.getCouponsByProduct(
                req.params.productId,
                req.query
            ),
        }).send(res)
    }

    // GET /coupons/check/:code - Kiểm tra coupon availability
    checkCouponAvailability = async (req, res, next) => {
        new SuccessResponse({
            message: 'Check coupon availability successfully',
            metadata: await CouponService.checkCouponAvailability(
                req.params.code,
                req.userId
            ),
        }).send(res)
    }
}

module.exports = new CouponController()
