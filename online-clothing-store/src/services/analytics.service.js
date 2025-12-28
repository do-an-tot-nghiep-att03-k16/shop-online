'use strict'

const { order } = require('../models/order.model')
const user = require('../models/user.model')
const product = require('../models/product.model')
const review = require('../models/review.model')
const { BadRequestError } = require('../core/error.response')

class AnalyticsService {
    // Dashboard overview statistics
    static async getDashboardStats({ period = '30d' } = {}) {
        const now = new Date()
        const startDate = new Date()
        
        // Set date range based on period
        switch(period) {
            case '1d':
                startDate.setDate(now.getDate() - 1)
                break
            case '7d':
                startDate.setDate(now.getDate() - 7)
                break
            case '30d':
                startDate.setDate(now.getDate() - 30)
                break
            case '90d':
                startDate.setDate(now.getDate() - 90)
                break
            default:
                startDate.setDate(now.getDate() - 30)
        }

        const previousStartDate = new Date(startDate)
        previousStartDate.setTime(startDate.getTime() - (now.getTime() - startDate.getTime()))

        // Current period stats
        const [
            totalUsers,
            totalOrders,
            totalRevenue,
            totalOrdersToday,
            conversionRate
        ] = await Promise.all([
            user.countDocuments({ createdAt: { $gte: startDate } }),
            order.countDocuments({ createdAt: { $gte: startDate } }),
            order.aggregate([
                { $match: { 
                    createdAt: { $gte: startDate },
                    payment_status: 'paid'
                }},
                { $group: { _id: null, total: { $sum: '$total' } }}
            ]).then(result => result[0]?.total || 0),
            order.countDocuments({ 
                createdAt: { 
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                }
            }),
            this.calculateConversionRate(startDate)
        ])

        // Previous period stats for comparison
        const [
            prevTotalUsers,
            prevTotalOrders, 
            prevTotalRevenue
        ] = await Promise.all([
            user.countDocuments({ 
                createdAt: { $gte: previousStartDate, $lt: startDate }
            }),
            order.countDocuments({
                createdAt: { $gte: previousStartDate, $lt: startDate }
            }),
            order.aggregate([
                { $match: { 
                    createdAt: { $gte: previousStartDate, $lt: startDate },
                    payment_status: 'paid'
                }},
                { $group: { _id: null, total: { $sum: '$total' } }}
            ]).then(result => result[0]?.total || 0)
        ])

        // Calculate percentage changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return ((current - previous) / previous) * 100
        }

        return {
            totalUsers: {
                value: totalUsers,
                change: calculateChange(totalUsers, prevTotalUsers),
                trend: totalUsers >= prevTotalUsers ? 'up' : 'down'
            },
            ordersToday: {
                value: totalOrdersToday,
                change: 0, // Would need yesterday's data for comparison
                trend: 'up'
            },
            monthlyRevenue: {
                value: totalRevenue,
                change: calculateChange(totalRevenue, prevTotalRevenue),
                trend: totalRevenue >= prevTotalRevenue ? 'up' : 'down'
            },
            conversionRate: {
                value: conversionRate,
                change: 0, // Would need previous period for comparison
                trend: 'up'
            }
        }
    }

    // Revenue analytics for charts
    static async getRevenueAnalytics({ days = 7 } = {}) {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - days)

        const revenueData = await order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    payment_status: 'paid'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])

        // Fill missing days with 0 revenue
        const result = []
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]
            
            const found = revenueData.find(item => item._id === dateStr)
            const dayName = this.getDayName(date)
            
            result.push({
                day: dayName,
                date: dateStr,
                revenue: found ? found.revenue : 0,
                orders: found ? found.orders : 0
            })
        }

        return result
    }

    // Order status distribution
    static async getOrderStatusDistribution() {
        const distribution = await order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ])

        const statusColors = {
            'pending': '#faad14',
            'confirmed': '#1890ff',
            'processing': '#722ed1',
            'shipping': '#13c2c2',
            'delivered': '#52c41a',
            'cancelled': '#f5222d',
            'returned': '#fa8c16'
        }

        const statusLabels = {
            'pending': 'Chờ xử lý',
            'confirmed': 'Đã xác nhận',
            'processing': 'Đang xử lý',
            'shipping': 'Đang giao',
            'delivered': 'Hoàn thành',
            'cancelled': 'Đã hủy',
            'returned': 'Trả hàng'
        }

        return distribution.map(item => ({
            name: statusLabels[item._id] || item._id,
            value: item.count,
            color: statusColors[item._id] || '#666'
        }))
    }

    // Top selling products
    static async getTopProducts({ limit = 5 } = {}) {
        const topProducts = await order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product_id',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    productName: { $first: '$items.product_name' },
                    productSlug: { $first: '$items.product_slug' },
                    productImage: { $first: '$items.product_image' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: parseInt(limit) }
        ])

        return topProducts.map((item, index) => ({
            rank: index + 1,
            name: item.productName,
            slug: item.productSlug,
            image: item.productImage,
            sold: item.totalSold,
            revenue: item.totalRevenue,
            trend: 'up' // Would need historical data for real trend
        }))
    }

    // Recent activities
    static async getRecentActivities({ limit = 10 } = {}) {
        const activities = []

        // Recent orders
        const recentOrders = await order.find()
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)

        recentOrders.forEach(orderItem => {
            activities.push({
                type: 'order',
                user: orderItem.user_id?.name || 'Unknown User',
                action: 'đặt đơn hàng mới',
                amount: `${orderItem.total.toLocaleString()}₫`,
                time: this.formatTimeAgo(orderItem.createdAt),
                status: 'new'
            })
        })

        // Recent reviews
        const recentReviews = await review.find()
            .populate('user_id', 'name')
            .populate('product_id', 'name')
            .sort({ createdAt: -1 })
            .limit(5)

        recentReviews.forEach(reviewItem => {
            activities.push({
                type: 'review',
                user: reviewItem.user_id?.name || 'Unknown User',
                action: 'đánh giá sản phẩm',
                amount: `${reviewItem.rating} ⭐`,
                time: this.formatTimeAgo(reviewItem.createdAt),
                status: 'positive'
            })
        })

        // Recent users
        const recentUsers = await user.find()
            .sort({ createdAt: -1 })
            .limit(3)

        recentUsers.forEach(userItem => {
            activities.push({
                type: 'user',
                user: userItem.name || 'Unknown User',
                action: 'đăng ký tài khoản',
                amount: 'Khách hàng mới',
                time: this.formatTimeAgo(userItem.createdAt),
                status: 'new'
            })
        })

        // Sort by time and limit
        return activities
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, parseInt(limit))
    }

    // Helper methods
    static async calculateConversionRate(startDate) {
        // Conversion rate: regular users with successful orders / total regular users
        // Only count users with role 'user' (exclude admin, shop)
        const totalCustomers = await user.countDocuments({ 
            createdAt: { $gte: startDate },
            usr_role: 'user'  // Only regular customers
        })
        
        if (totalCustomers === 0) return 0
        
        // Get customer user IDs who have at least one completed order
        const customerIds = await user.distinct('_id', {
            createdAt: { $gte: startDate },
            usr_role: 'user'
        })
        
        const customersWithCompletedOrders = await order.distinct('user_id', {
            createdAt: { $gte: startDate },
            status: 'delivered', // Correct status for completed orders
            user_id: { $in: customerIds }
        })
        
        const conversionRate = ((customersWithCompletedOrders.length / totalCustomers) * 100).toFixed(1)
        // console.log(`Conversion Rate Debug: ${customersWithCompletedOrders.length} customers with orders / ${totalCustomers} total customers = ${conversionRate}%`)
        return conversionRate
    }

    static getDayName(date) {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        return days[date.getDay()]
    }

    static formatTimeAgo(date) {
        const now = new Date()
        const diffMs = now - new Date(date)
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Vừa xong'
        if (diffMins < 60) return `${diffMins} phút trước`
        if (diffHours < 24) return `${diffHours} giờ trước`
        return `${diffDays} ngày trước`
    }

    // User growth analytics
    static async getUserGrowth({ days = 30 } = {}) {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - days)

        const userGrowth = await user.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    newUsers: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])

        return userGrowth
    }

    // Category performance
    static async getCategoryPerformance() {
        const categoryStats = await order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'product.category_ids',
                    foreignField: '_id',
                    as: 'categories'
                }
            },
            { $unwind: '$categories' },
            {
                $group: {
                    _id: '$categories._id',
                    categoryName: { $first: '$categories.name' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    totalOrders: { $sum: 1 },
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ])

        return categoryStats
    }
}

module.exports = AnalyticsService