import { useQuery } from '@tanstack/react-query'
import productService from '../services/productService'
import { message } from 'antd'
import { handleApiError } from '../utils/errorHandler'

// Admin-specific hook for getting ALL products (published + unpublished)
export const useAdminProducts = (params = {}) => {
    const queryParams = {
        page: 1,
        limit: 10,
        ...params
    }
    
    return useQuery({
        queryKey: ['admin-products', 'paginated', queryParams],
        queryFn: () => productService.getAllProductsForAdmin(queryParams),
        keepPreviousData: true,
        staleTime: 30000,
        select: (data) => {
            // Backend returns: {metadata: {products: [...], pagination: {...}}}
            // or {products: [...], pagination: {...}}
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {}
            }
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải sản phẩm admin')
            message.error(handledError.message)
        },
    })
}