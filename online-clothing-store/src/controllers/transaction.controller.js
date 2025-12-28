'use strict'

const { SuccessResponse } = require('../core/success.response')
const { BadRequestError, NotFoundError } = require('../core/error.response')
const TransactionRepo = require('../models/repositories/transaction.repo')
// NOTE: asyncHandler wrapped at router level, not controller level

class TransactionController {
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * GET /transaction/admin/history - Get transaction history for admin
     * RBAC: admin, shop
     */
    getTransactionHistory = async (req, res) => {
        const {
            transferType,
            start_date,
            end_date,
            page = 1,
            limit = 20,
            search
        } = req.query

        // Delegate to repository layer
        const result = await TransactionRepo.findWithFilters({
            transferType,
            start_date,
            end_date,
            page,
            limit,
            search
        })

        // Get statistics and revenue for the same filter
        const [stats, revenueStats] = await Promise.all([
            TransactionRepo.getStatsByFilter(result.filter),
            TransactionRepo.getRevenueStats(result.filter)
        ])

        const revenue = revenueStats[0] || { total_in: 0, total_out: 0 }
        revenue.net_revenue = revenue.total_in - revenue.total_out

        new SuccessResponse({
            message: 'Transaction history retrieved successfully',
            metadata: {
                transactions: result.transactions,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    pages: result.pages
                },
                stats,
                revenue,
                filters: { transferType, start_date, end_date, search }
            }
        }).send(res)
    }

    /**
     * GET /transaction/admin/details/:transactionId - Get transaction details
     * RBAC: admin, shop
     */
    getTransactionDetails = async (req, res) => {
        const { transactionId } = req.params

        // Delegate to repository layer
        const transaction = await TransactionRepo.findById(transactionId)

        if (!transaction) {
            throw new NotFoundError('Transaction not found')
        }

        // Get related order info if exists
        let orderInfo = null
        if (transaction.order_id) {
            const { order } = require('../models/order.model')
            orderInfo = await order.findById(transaction.order_id)
                .select('order_number order_status payment_status total_amount user_id')
                .populate('user_id', 'usr_name usr_email')
                .lean()
        }

        new SuccessResponse({
            message: 'Transaction details retrieved successfully',
            metadata: {
                transaction,
                order: orderInfo
            }
        }).send(res)
    }

    /**
     * GET /transaction/admin/stats - Get dashboard statistics
     * RBAC: admin, shop
     */
    getDashboardStats = async (req, res) => {
        const { period = '7d' } = req.query
        
        // Calculate date range based on period
        const now = new Date()
        let startDate
        
        switch (period) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                break
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }

        // Delegate to repository layer
        const dashboardData = await TransactionRepo.getDashboardStats(startDate, now)

        new SuccessResponse({
            message: 'Dashboard stats retrieved successfully',
            metadata: {
                period,
                transaction_stats: dashboardData.transactionStats,
                revenue: dashboardData.revenue,
                recent_transactions: dashboardData.recentTransactions,
                daily_breakdown: dashboardData.dailyStats,
                date_range: {
                    start: startDate,
                    end: now
                }
            }
        }).send(res)
    }

    /**
     * GET /transaction/admin/export - Export transaction data
     * RBAC: admin only
     */
    exportTransactionData = async (req, res) => {
        const { format = 'csv', ...filters } = req.query

        // Delegate to repository layer
        const transactions = await TransactionRepo.findForExport(filters, 1000)

        if (format === 'csv') {
            // Generate CSV data
            const header = 'Transaction ID,Date,Content,Amount,Type,Gateway,Account Number,Order ID,Processed,Created At\n'
            const rows = transactions.map(item => 
                `"${item.id}","${item.transactionDate}","${item.content}","${item.transferAmount}","${item.transferType}","${item.gateway}","${item.accountNumber}","${item.order_id || 'N/A'}","${item.processed}","${item.createdAt}"`
            ).join('\n')
            
            const csvData = header + rows

            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            res.setHeader('Content-Disposition', `attachment; filename="transactions_export_${new Date().toISOString().split('T')[0]}.csv"`)
            res.send(csvData)
        } else {
            // JSON export
            new SuccessResponse({
                message: 'Transaction data exported successfully',
                metadata: { 
                    data: transactions, 
                    count: transactions.length,
                    filters
                }
            }).send(res)
        }
    }
}

module.exports = new TransactionController()