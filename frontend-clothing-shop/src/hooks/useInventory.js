import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import productService from '../services/productService'

// Hook for inventory overview
export const useInventoryOverview = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ['inventory', 'overview', params],
        queryFn: () => productService.getInventoryOverview(params),
        staleTime: 30000, // 30 seconds
        ...options
    })
}

// Hook for low stock alerts
export const useLowStockAlerts = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ['inventory', 'alerts', params],
        queryFn: () => productService.getLowStockAlerts(params),
        staleTime: 60000, // 1 minute
        ...options
    })
}

// Hook for updating single stock
export const useUpdateStock = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ productId, sku, quantity }) => 
            productService.updateStock(productId, { sku, quantity }),
        onSuccess: () => {
            // Invalidate inventory queries
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
        }
    })
}

// Hook for bulk stock updates
export const useBulkUpdateStock = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (updates) => productService.bulkUpdateStock(updates),
        onSuccess: () => {
            // Invalidate inventory queries
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
        }
    })
}