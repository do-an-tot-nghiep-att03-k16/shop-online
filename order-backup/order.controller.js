'use strict'

const { CREATED, SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const OrderService = require('../services/order.service')

class OrderController {
    // Lấy order theo ID
    getOrderById = async (req, res, next) => {
        const { orderId } = req.params
        const userId = req.userId
        const isAdmin = req.role === 'admin'

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        new SuccessResponse({
            message: 'Get order success!',
            metadata: await OrderService.getOrderById(orderId, userId, isAdmin),
        }).send(res)
    }

    // Lấy order theo order number
    getOrderByNumber = async (req, res, next) => {
        const { orderNumber } = req.params
        const userId = req.userId
        const isAdmin = req.role === 'admin'

        if (!orderNumber) {
            throw new BadRequestError('Order number is required')
        }

        new SuccessResponse({
            message: 'Get order success!',
            metadata: await OrderService.getOrderByNumber(orderNumber, userId, isAdmin),
        }).send(res)
    }

    // Lấy danh sách orders của user hiện tại
    getUserOrders = async (req, res, next) => {
        const userId = req.userId
        const {
            page = 1,
            limit = 10,
            status,
        } = req.query

        new SuccessResponse({
            message: 'Get user orders success!',
            metadata: await OrderService.getUserOrders(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                status,
            }),
        }).send(res)
    }

    // Lấy tất cả orders (Admin only)
    getAllOrders = async (req, res, next) => {
        const {
            page = 1,
            limit = 10,
            status,
            payment_status,
            sort = 'createdAt',
            order = 'desc',
        } = req.query

        new SuccessResponse({
            message: 'Get all orders success!',
            metadata: await OrderService.getAllOrders({
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                payment_status,
                sort,
                order,
            }),
        }).send(res)
    }

    // Update order status (Admin only)
    updateOrderStatus = async (req, res, next) => {
        const { orderId } = req.params
        const { status, note } = req.body
        const adminId = req.userId

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!status) {
            throw new BadRequestError('Status is required')
        }

        new SuccessResponse({
            message: 'Update order status success!',
            metadata: await OrderService.updateOrderStatus(orderId, status, note, adminId),
        }).send(res)
    }

    // Cancel order
    cancelOrder = async (req, res, next) => {
        const { orderId } = req.params
        const { reason } = req.body
        const userId = req.userId
        const isAdmin = req.role === 'admin'

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!reason) {
            throw new BadRequestError('Cancellation reason is required')
        }

        new SuccessResponse({
            message: 'Cancel order success!',
            metadata: await OrderService.cancelOrder(orderId, reason, userId, isAdmin),
        }).send(res)
    }

    // Return order (User only)
    returnOrder = async (req, res, next) => {
        const { orderId } = req.params
        const { reason } = req.body
        const userId = req.userId

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!reason) {
            throw new BadRequestError('Return reason is required')
        }

        new SuccessResponse({
            message: 'Return order success!',
            metadata: await OrderService.returnOrder(orderId, reason, userId),
        }).send(res)
    }

    // Update tracking info (Admin only)
    updateTracking = async (req, res, next) => {
        const { orderId } = req.params
        const { tracking_number, shipping_provider } = req.body

        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        new SuccessResponse({
            message: 'Update tracking info success!',
            metadata: await OrderService.updateTracking(orderId, {
                tracking_number,
                shipping_provider,
            }),
        }).send(res)
    }

    // Update payment status (Admin only)
    updatePaymentStatus = async (req, res, next) => {
        const { orderId } = req.params
        const { status, details = {} } = req.body
        
        if (!orderId) {
            throw new BadRequestError('Order ID is required')
        }

        if (!status) {
            throw new BadRequestError('Payment status is required')
        }

        // Add confirmed_by if status is paid
        if (status === 'paid') {
            details.confirmed_by = req.userId
        }

        new SuccessResponse({
            message: 'Update payment status success!',
            metadata: await OrderService.updatePaymentStatus(orderId, status, details),
        }).send(res)
    }

    // Get order statistics
    getOrderStats = async (req, res, next) => {
        const { userId } = req.query
        const requestUserId = req.userId
        const isAdmin = req.role === 'admin'

        // User chỉ xem được stats của mình, admin xem được tất cả
        const targetUserId = isAdmin ? userId : requestUserId

        new SuccessResponse({
            message: 'Get order statistics success!',
            metadata: await OrderService.getOrderStats(targetUserId),
        }).send(res)
    }

    // Get revenue by date range (Admin only)
    getRevenue = async (req, res, next) => {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            throw new BadRequestError('Start date and end date are required')
        }

        new SuccessResponse({
            message: 'Get revenue success!',
            metadata: await OrderService.getRevenue(startDate, endDate),
        }).send(res)
    }

    // Auto cancel pending orders (Cron job / Admin only)
    autoCancelPendingOrders = async (req, res, next) => {
        const { hoursAgo = 24 } = req.query

        new SuccessResponse({
            message: 'Auto cancel pending orders success!',
            metadata: await OrderService.autoCancelPendingOrders(parseInt(hoursAgo)),
        }).send(res)
    }
}

module.exports = new OrderController()