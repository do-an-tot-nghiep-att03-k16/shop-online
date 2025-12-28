import { ERROR_MESSAGES, STATUS_CODES } from '../constants'

/**
 * Map status code sang error message
 */
const getErrorMessageByStatus = (status) => {
    const statusMap = {
        [STATUS_CODES.BAD_REQUEST]: ERROR_MESSAGES.BAD_REQUEST,
        [STATUS_CODES.UNAUTHORIZED]: ERROR_MESSAGES.UNAUTHORIZED,
        [STATUS_CODES.FORBIDDEN]: ERROR_MESSAGES.FORBIDDEN,
        [STATUS_CODES.NOT_FOUND]: ERROR_MESSAGES.NOT_FOUND,
        [STATUS_CODES.CONFLICT]: ERROR_MESSAGES.CONFLICT,
        [STATUS_CODES.INTERNAL_SERVER_ERROR]: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    }
    
    return statusMap[status] || ERROR_MESSAGES.UNKNOWN
}

/**
 * Xử lý lỗi API tập trung - Khớp với backend error structure
 * Backend response structure:
 * - Success: { message, status, metadata }
 * - Error: { message, status } từ ErrorResponse class
 * 
 * @param {Error} error - Error object từ axios
 * @param {string} defaultMessage - Message mặc định nếu không có message cụ thể
 * @returns {Error} - Error object đã được format
 */
export const handleApiError = (error, defaultMessage = ERROR_MESSAGES.UNKNOWN) => {
    console.error('🔴 API Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data
    })

    // ===== FRONTEND ERRORS (Network/Timeout) =====
    
    // Network errors - không kết nối được server
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        return new Error(ERROR_MESSAGES.NETWORK)
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new Error(ERROR_MESSAGES.TIMEOUT)
    }

    // Không có response từ server
    if (!error.response) {
        return new Error(`Lỗi kết nối: ${error.message || ERROR_MESSAGES.NETWORK}`)
    }

    // ===== BACKEND ERRORS (Có response) =====
    
    const { status, data } = error.response
    
    // Backend trả về structure: { message, status, metadata? }
    // hoặc từ ErrorResponse: { message, status }
    let errorMessage = data?.message || data?.error
    
    // Nếu không có message cụ thể, dùng message theo status code
    if (!errorMessage) {
        errorMessage = getErrorMessageByStatus(status) || defaultMessage
    }

    // Log để debug
    console.error('🔴 Backend Error:', {
        status,
        message: errorMessage,
        fullData: data
    })

    return new Error(errorMessage)
}

/**
 * Kiểm tra xem có phải lỗi authentication không
 */
export const isAuthError = (error) => {
    return error.response?.status === STATUS_CODES.UNAUTHORIZED
}

/**
 * Kiểm tra xem có phải lỗi forbidden không
 */
export const isForbiddenError = (error) => {
    return error.response?.status === STATUS_CODES.FORBIDDEN
}