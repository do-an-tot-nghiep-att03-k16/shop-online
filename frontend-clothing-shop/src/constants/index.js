export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    SHOP: 'shop'
}

export const USER_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    BLOCK: 'block'
}

// HTTP Status Codes (match với backend)
export const STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
}

// Error messages tương ứng với backend error classes
export const ERROR_MESSAGES = {
    // Network errors (frontend)
    NETWORK: 'Không thể kết nối đến server. Vui lòng kiểm tra backend server.',
    TIMEOUT: 'Kết nối timeout. Vui lòng thử lại.',
    
    // Backend errors (match với ReasonPhrases)
    BAD_REQUEST: 'Yêu cầu không hợp lệ',
    UNAUTHORIZED: 'Chưa xác thực',
    FORBIDDEN: 'Không có quyền truy cập',
    NOT_FOUND: 'Không tìm thấy dữ liệu',
    CONFLICT: 'Dữ liệu bị trùng lặp',
    INTERNAL_SERVER_ERROR: 'Lỗi server. Vui lòng thử lại sau.',
    
    // Generic
    UNKNOWN: 'Có lỗi xảy ra'
}

export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    
    // Users
    USERS: '/users',
    USER_BY_ID: (id) => `/users/${id}`,
}

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user'
}

export const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',
    API: 'YYYY-MM-DD',
    FULL: 'DD/MM/YYYY HH:mm:ss'
}