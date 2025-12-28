import { api } from '../config/apiClient'

export const inventoryService = {
    // Get inventory overview
    getOverview: async (params) => {
        const response = await api.get('/products/inventory/overview', {
            params,
        })
        return response.metadata
    },

    // Get low stock alerts
    getLowStockAlerts: async (threshold) => {
        const response = await api.get('/products/inventory/low-stock-alerts', {
            params: { threshold },
        })
        return response.metadata
    },

    // Update single product stock
    updateStock: async (productId, sku, quantity) => {
        const response = await api.patch(`/products/${productId}/stock`, {
            sku,
            quantity: parseInt(quantity),
        })
        return response.metadata
    },

    // Bulk update stock
    bulkUpdateStock: async (updates) => {
        const response = await api.post('/products/inventory/bulk-update', {
            updates,
        })
        return response.metadata
    },
}
