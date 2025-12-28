'use strict'

const { SuccessResponse } = require('../core/success.response')
const AnalyticsService = require('../services/analytics.service')

class AnalyticsController {
    // Dashboard overview stats
    getDashboardStats = async (req, res, next) => {
        new SuccessResponse({
            message: 'Dashboard stats retrieved successfully',
            metadata: await AnalyticsService.getDashboardStats(req.query)
        }).send(res)
    }

    // Revenue analytics (7 days, 30 days, etc.)
    getRevenueAnalytics = async (req, res, next) => {
        new SuccessResponse({
            message: 'Revenue analytics retrieved successfully', 
            metadata: await AnalyticsService.getRevenueAnalytics(req.query)
        }).send(res)
    }

    // Order status distribution
    getOrderStatusDistribution = async (req, res, next) => {
        new SuccessResponse({
            message: 'Order status distribution retrieved successfully',
            metadata: await AnalyticsService.getOrderStatusDistribution(req.query)
        }).send(res)
    }

    // Top selling products
    getTopProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Top products retrieved successfully',
            metadata: await AnalyticsService.getTopProducts(req.query)
        }).send(res)
    }

    // Recent activities
    getRecentActivities = async (req, res, next) => {
        new SuccessResponse({
            message: 'Recent activities retrieved successfully',
            metadata: await AnalyticsService.getRecentActivities(req.query)
        }).send(res)
    }

    // User growth analytics
    getUserGrowth = async (req, res, next) => {
        new SuccessResponse({
            message: 'User growth analytics retrieved successfully',
            metadata: await AnalyticsService.getUserGrowth(req.query)
        }).send(res)
    }

    // Category performance
    getCategoryPerformance = async (req, res, next) => {
        new SuccessResponse({
            message: 'Category performance retrieved successfully',
            metadata: await AnalyticsService.getCategoryPerformance(req.query)
        }).send(res)
    }
}

module.exports = new AnalyticsController()