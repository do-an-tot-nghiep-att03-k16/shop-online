import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'

/**
 * Custom hook để check user có thể review product không
 * @param {string} orderId - ID của order
 * @param {string} productId - ID của product  
 * @param {boolean} enabled - Có enable check hay không (default: true)
 * @returns {Object} { canReview, loading, error, reason, message, data, refetch }
 */
export const useCanReview = (orderId, productId, enabled = true) => {
    const [state, setState] = useState({
        canReview: false,
        loading: false,
        error: null,
        reason: null,
        message: '',
        data: null
    })

    const checkReviewEligibility = useCallback(async () => {
        if (!enabled || !orderId || !productId) {
            setState(prev => ({
                ...prev,
                loading: false,
                canReview: false,
                reason: 'INVALID_PARAMS',
                message: 'Thiếu thông tin orderId hoặc productId'
            }))
            return
        }

        // Clean the IDs to ensure they're strings
        const cleanOrderId = typeof orderId === 'string' ? orderId : orderId.toString()
        const cleanProductId = typeof productId === 'string' ? productId : 
                             (productId._id || productId.id || productId.toString())


        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const result = await reviewService.checkCanReview(cleanOrderId, cleanProductId)
            
            setState({
                canReview: result.canReview,
                loading: false,
                error: null,
                reason: result.reason,
                message: result.message || '',
                data: result.data || null
            })
        } catch (error) {
            console.error('useCanReview error:', error)
            setState({
                canReview: false,
                loading: false,
                error: error.message || 'Có lỗi xảy ra',
                reason: 'SYSTEM_ERROR',
                message: 'Không thể kiểm tra quyền đánh giá',
                data: null
            })
        }
    }, [orderId, productId, enabled])

    // Auto check when dependencies change
    useEffect(() => {
        checkReviewEligibility()
    }, [checkReviewEligibility])

    return {
        ...state,
        refetch: checkReviewEligibility
    }
}

/**
 * Hook để check multiple products cùng lúc
 * @param {Array} items - Array of {orderId, productId}
 * @param {boolean} enabled - Có enable check hay không
 * @returns {Object} { results, loading, refetchAll }
 */
export const useCanReviewMultiple = (items = [], enabled = true) => {
    const [state, setState] = useState({
        results: {},
        loading: false
    })

    const checkMultiple = useCallback(async () => {
        if (!enabled || !items.length) {
            setState({ results: {}, loading: false })
            return
        }

        setState(prev => ({ ...prev, loading: true }))

        try {
            const promises = items.map(async (item) => {
                const key = `${item.orderId}-${item.productId}`
                const result = await reviewService.checkCanReview(item.orderId, item.productId)
                return { key, result }
            })

            const results = await Promise.all(promises)
            const resultMap = {}
            
            results.forEach(({ key, result }) => {
                resultMap[key] = result
            })

            setState({ results: resultMap, loading: false })
        } catch (error) {
            console.error('useCanReviewMultiple error:', error)
            setState({ results: {}, loading: false })
        }
    }, [items, enabled])

    useEffect(() => {
        checkMultiple()
    }, [checkMultiple])

    return {
        ...state,
        refetchAll: checkMultiple
    }
}

export default useCanReview