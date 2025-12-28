import apiClient from '../config/apiClient'
import { handleApiError } from '../utils/errorHandler'

class AdminTransactionService {
    /**
     * Get transaction history with filters
     * @param {Object} filters - Filter parameters
     * @param {string} filters.transferType - Transaction type (in/out)
     * @param {string} filters.start_date - Start date
     * @param {string} filters.end_date - End date
     * @param {number} filters.page - Page number
     * @param {number} filters.limit - Items per page
     * @param {string} filters.search - Search term
     */
    async getTransactionHistory(filters = {}) {
        try {
            const response = await apiClient.get('/transaction/admin/history', {
                params: filters
            })
            return response
        } catch (error) {
            throw handleApiError(error, 'Failed to fetch transaction history')
        }
    }

    /**
     * Get transaction details by ID
     * @param {string} transactionId - Transaction ID
     */
    async getTransactionDetails(transactionId) {
        try {
            const response = await apiClient.get(`/transaction/admin/details/${transactionId}`)
            return response.data
        } catch (error) {
            throw handleApiError(error, 'Failed to fetch transaction details')
        }
    }

    /**
     * Get dashboard statistics
     * @param {Object} params - Parameters
     * @param {string} params.period - Time period (24h, 7d, 30d)
     */
    async getDashboardStats(params = {}) {
        try {
            const response = await apiClient.get('/transaction/admin/stats', {
                params
            })
            return response
        } catch (error) {
            throw handleApiError(error, 'Failed to fetch dashboard stats')
        }
    }

    /**
     * Export transaction data
     * @param {string} format - Export format ('csv' or 'json')
     * @param {Object} filters - Filter parameters
     */
    async exportData(format = 'csv', filters = {}) {
        try {
            const response = await apiClient.get('/transaction/admin/export', {
                params: { format, ...filters },
                responseType: format === 'csv' ? 'blob' : 'json'
            })
            
            if (format === 'csv') {
                // Handle CSV download
                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)
                return { success: true, message: 'File downloaded successfully' }
            }
            
            return response.data
        } catch (error) {
            throw handleApiError(error, 'Failed to export data')
        }
    }


    /**
     * Get transaction type options for filters
     */
    getTransactionTypeOptions() {
        return [
            { label: 'Tất cả', value: 'all' },
            { label: 'Tiền vào', value: 'in' },
            { label: 'Tiền ra', value: 'out' }
        ]
    }

    /**
     * Get period options for dashboard
     */
    getPeriodOptions() {
        return [
            { label: '24 giờ qua', value: '24h' },
            { label: '7 ngày qua', value: '7d' },
            { label: '30 ngày qua', value: '30d' }
        ]
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    /**
     * Get transaction type color for display
     */
    getTransactionTypeColor(type) {
        const colors = {
            in: 'green',
            out: 'red'
        }
        return colors[type] || 'default'
    }

    /**
     * Get transaction type text for display
     */
    getTransactionTypeText(type) {
        const texts = {
            in: 'Tiền vào',
            out: 'Tiền ra'
        }
        return texts[type] || type
    }
}

export default new AdminTransactionService()