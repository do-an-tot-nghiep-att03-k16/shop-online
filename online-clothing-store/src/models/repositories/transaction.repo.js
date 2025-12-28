'use strict'

const Transaction = require('../transaction.model')

class TransactionRepo {
    
    /**
     * ✅ Simplified - Tạo transaction với exact webhook data
     */
    static async createTransaction(webhookData, orderId = null) {
        try {
            // Check duplicate by webhook id
            const existing = await Transaction.findOne({ id: webhookData.id })
            if (existing) {
                return existing
            }

            const newTransaction = await Transaction.create({
                ...webhookData,
                order_id: orderId,
                processed: false
            })

            return newTransaction

        } catch (error) {
            console.error('❌ Failed to create transaction:', error)
            throw error
        }
    }

    /**
     * ✅ Update transaction status
     */
    static async markAsProcessed(transactionId) {
        try {
            return await Transaction.findByIdAndUpdate(
                transactionId,
                { processed: true },
                { new: true }
            )
        } catch (error) {
            console.error('❌ Failed to mark transaction as processed:', error)
            throw error
        }
    }

    /**
     * ✅ Find transaction by webhook id
     */
    static async findByWebhookId(webhookId) {
        try {
            return await Transaction.findOne({ id: webhookId })
        } catch (error) {
            console.error('❌ Failed to find transaction:', error)
            throw error
        }
    }

    /**
     * ✅ Find transactions by order
     */
    static async findByOrderId(orderId) {
        try {
            return await Transaction.find({ order_id: orderId }).sort({ createdAt: -1 })
        } catch (error) {
            console.error('❌ Failed to find transactions by order:', error)
            throw error
        }
    }

    /**
     * ✅ Get recent transactions
     */
    static async getRecent(limit = 20) {
        try {
            return await Transaction.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('id gateway transferAmount transferType content order_id processed createdAt')
        } catch (error) {
            console.error('❌ Failed to get recent transactions:', error)
            throw error
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * Find transactions with filters and pagination for admin
     */
    static async findWithFilters({ 
        transferType, 
        start_date, 
        end_date, 
        search, 
        page = 1, 
        limit = 20 
    }) {
        try {
            // Build filter object
            const filter = {}
            
            if (transferType && transferType !== 'all') {
                filter.transferType = transferType
            }
            
            // Date range filter
            if (start_date || end_date) {
                filter.createdAt = {}
                if (start_date) filter.createdAt.$gte = new Date(start_date)
                if (end_date) filter.createdAt.$lte = new Date(end_date)
            }
            
            // Search in content, description, order_id, or transaction id
            if (search) {
                const searchRegex = { $regex: search, $options: 'i' }
                filter.$or = [
                    { content: searchRegex },
                    { description: searchRegex },
                    { order_id: searchRegex }
                ]
                
                // If search is a number, also search by transaction id
                const searchNumber = parseInt(search)
                if (!isNaN(searchNumber)) {
                    filter.$or.push({ id: searchNumber })
                }
            }

            const skip = (parseInt(page) - 1) * parseInt(limit)

            // Execute queries in parallel
            const [transactions, total] = await Promise.all([
                Transaction.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Transaction.countDocuments(filter)
            ])

            return {
                transactions,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
                filter
            }
        } catch (error) {
            console.error('❌ Failed to find transactions with filters:', error)
            throw error
        }
    }

    /**
     * Get transaction statistics by filter
     */
    static async getStatsByFilter(filter) {
        try {
            return await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$transferType',
                        count: { $sum: 1 },
                        total_amount: { $sum: '$transferAmount' }
                    }
                }
            ])
        } catch (error) {
            console.error('❌ Failed to get transaction stats:', error)
            throw error
        }
    }

    /**
     * Get revenue statistics (in vs out)
     */
    static async getRevenueStats(filter) {
        try {
            return await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        total_in: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$transferType', 'in'] },
                                    '$transferAmount',
                                    0
                                ]
                            }
                        },
                        total_out: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$transferType', 'out'] },
                                    '$transferAmount',
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        } catch (error) {
            console.error('❌ Failed to get revenue stats:', error)
            throw error
        }
    }

    /**
     * Find transaction by MongoDB ID
     */
    static async findById(transactionId) {
        try {
            const { convertToObjectIdMongodb } = require('../../utils')
            return await Transaction.findById(convertToObjectIdMongodb(transactionId)).lean()
        } catch (error) {
            console.error('❌ Failed to find transaction by ID:', error)
            throw error
        }
    }

    /**
     * Get dashboard statistics for a date range
     */
    static async getDashboardStats(startDate, endDate) {
        try {
            const dateFilter = {
                createdAt: { $gte: startDate, $lte: endDate }
            }

            const [transactionStats, revenueStats, recentTransactions, dailyStats] = await Promise.all([
                // Transaction count by type
                this.getStatsByFilter(dateFilter),
                
                // Revenue calculation (only 'in' transactions)
                Transaction.aggregate([
                    {
                        $match: {
                            transferType: 'in',
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total_revenue: { $sum: '$transferAmount' },
                            transaction_count: { $sum: 1 }
                        }
                    }
                ]),
                
                // Recent transactions
                Transaction.find(dateFilter)
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean(),

                // Daily breakdown
                Transaction.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                type: '$transferType'
                            },
                            count: { $sum: 1 },
                            amount: { $sum: '$transferAmount' }
                        }
                    },
                    { $sort: { '_id.date': -1 } }
                ])
            ])

            return {
                transactionStats,
                revenue: revenueStats[0] || { total_revenue: 0, transaction_count: 0 },
                recentTransactions,
                dailyStats
            }
        } catch (error) {
            console.error('❌ Failed to get dashboard stats:', error)
            throw error
        }
    }

    /**
     * Export data with filters
     */
    static async findForExport(filters, limit = 1000) {
        try {
            // Build same filter as findWithFilters but without pagination
            const filter = {}
            
            if (filters.transferType && filters.transferType !== 'all') {
                filter.transferType = filters.transferType
            }
            
            if (filters.start_date || filters.end_date) {
                filter.createdAt = {}
                if (filters.start_date) filter.createdAt.$gte = new Date(filters.start_date)
                if (filters.end_date) filter.createdAt.$lte = new Date(filters.end_date)
            }
            
            if (filters.search) {
                const searchRegex = { $regex: filters.search, $options: 'i' }
                filter.$or = [
                    { content: searchRegex },
                    { description: searchRegex },
                    { order_id: searchRegex }
                ]
                
                const searchNumber = parseInt(filters.search)
                if (!isNaN(searchNumber)) {
                    filter.$or.push({ id: searchNumber })
                }
            }

            return await Transaction.find(filter)
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean()
        } catch (error) {
            console.error('❌ Failed to find transactions for export:', error)
            throw error
        }
    }
}

module.exports = TransactionRepo