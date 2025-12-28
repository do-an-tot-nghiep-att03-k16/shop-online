import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productService } from '../services/productService'

/**
 * Optimized Products Hook - Reduce re-renders and improve performance
 */

export const useOptimizedProducts = (params = {}) => {
    // Memoize query params to prevent unnecessary re-renders
    const queryParams = useMemo(() => {
        // Only include non-empty params
        const cleanParams = {}
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '' && 
                !(Array.isArray(value) && value.length === 0)) {
                cleanParams[key] = value
            }
        })
        
        return cleanParams
    }, [
        params.page,
        params.limit,
        params.search,
        params.category_ids?.join(','),
        params.gender,
        params.min_price,
        params.max_price,
        params.sort_by,
        params.status
    ])

    // Create stable query key
    const queryKey = useMemo(() => 
        ['products', JSON.stringify(queryParams)], 
        [queryParams]
    )

    return useQuery({
        queryKey,
        queryFn: () => productService.getAllProducts(queryParams),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        keepPreviousData: true, // Smooth transitions between pages
        refetchOnWindowFocus: false, // Don't refetch on tab focus
        retry: 2,
        select: (data) => {
            // Consistent data selection
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {},
                total: responseData?.pagination?.total || responseData?.total || 0
            }
        },
    })
}

export const useOptimizedSearch = (query, params = {}) => {
    // Memoize search params
    const searchParams = useMemo(() => {
        if (!query || query.trim() === '') return null
        
        const cleanParams = { q: query.trim() }
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '' && 
                !(Array.isArray(value) && value.length === 0)) {
                cleanParams[key] = value
            }
        })
        
        return cleanParams
    }, [
        query,
        params.page,
        params.limit,
        params.category_ids?.join(','),
        params.gender,
        params.sort_by
    ])

    const queryKey = useMemo(() => 
        ['search', JSON.stringify(searchParams)], 
        [searchParams]
    )

    return useQuery({
        queryKey,
        queryFn: () => productService.searchProducts(query, params),
        enabled: !!searchParams, // Only run if we have search params
        staleTime: 2 * 60 * 1000, // 2 minutes for search
        cacheTime: 5 * 60 * 1000, // 5 minutes
        keepPreviousData: true,
        refetchOnWindowFocus: false,
        select: (data) => {
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {},
                total: responseData?.pagination?.total || responseData?.total || 0
            }
        },
    })
}

export default useOptimizedProducts