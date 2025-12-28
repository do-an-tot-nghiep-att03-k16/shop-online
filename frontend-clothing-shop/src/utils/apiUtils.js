/**
 * Extract data từ backend response
 * Backend success structure: { message, status, metadata }
 * 
 * @param {Object} response - Response object từ API
 * @param {string} dataKey - Key của data cần extract (vd: 'user', 'users', 'tokens')
 * @returns {any} - Data đã extract hoặc null
 */
export const extractData = (response, dataKey = 'data') => {
    if (!response) return null

    // Backend structure: { message, status, metadata: { user, tokens, etc... } }
    // Priority: metadata[dataKey] > metadata > dataKey > data > response
    const patterns = [
        response?.metadata?.[dataKey],  // { metadata: { user: {...} } }
        response?.metadata,              // { metadata: {...} }
        response?.[dataKey],            // { user: {...} }
        response?.data,                 // { data: {...} }
        response                        // Fallback
    ]

    for (const value of patterns) {
        if (value !== undefined && value !== null) {
            return value
        }
    }

    return null
}

/**
 * Extract nhiều keys từ response cùng lúc
 * Ví dụ: extractMultipleData(response, ['tokens', 'user'])
 * Returns: { tokens: {...}, user: {...} }
 */
export const extractMultipleData = (response, keys = []) => {
    const result = {}
    
    keys.forEach(key => {
        result[key] = extractData(response, key)
    })
    
    return result
}

/**
 * Đảm bảo response là array
 */
export const ensureArray = (data) => {
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') return [data]
    return []
}

/**
 * Check xem response có thành công không
 * Backend success response: { message, status: 200/201, metadata }
 */
export const isSuccessResponse = (response) => {
    return response && (response.status === 200 || response.status === 201)
}
