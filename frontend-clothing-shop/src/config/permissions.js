// Define all available permissions
export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: 'view_dashboard',

    // Users Management - Only Admin
    VIEW_USERS: 'view_users',
    CREATE_USER: 'create_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',

    // Products Management - Admin & Shop
    VIEW_PRODUCTS: 'view_products',
    CREATE_PRODUCT: 'create_product',
    UPDATE_PRODUCT: 'update_product',
    DELETE_PRODUCT: 'delete_product',

    // Orders Management - Admin & Shop
    VIEW_ORDERS: 'view_orders',
    UPDATE_ORDER_STATUS: 'update_order_status',
    DELETE_ORDER: 'delete_order',

    // Categories - Admin & Shop
    VIEW_CATEGORIES: 'view_categories',
    CREATE_CATEGORY: 'create_category',
    UPDATE_CATEGORY: 'update_category',
    DELETE_CATEGORY: 'delete_category',

    // Reports & Analytics
    VIEW_REPORTS: 'view_reports',
    EXPORT_REPORTS: 'export_reports',

    // Settings - Only Admin
    VIEW_SETTINGS: 'view_settings',
    UPDATE_SETTINGS: 'update_settings',
}

// Role permissions mapping cho Admin Panel
export const ROLE_PERMISSIONS = {
    admin: [
        // Admin có full quyền
        PERMISSIONS.VIEW_DASHBOARD,

        // Users - Only Admin
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_USER,
        PERMISSIONS.UPDATE_USER,
        PERMISSIONS.DELETE_USER,

        // Products - Admin can do everything
        PERMISSIONS.VIEW_PRODUCTS,
        PERMISSIONS.CREATE_PRODUCT,
        PERMISSIONS.UPDATE_PRODUCT,
        PERMISSIONS.DELETE_PRODUCT,

        // Orders
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.UPDATE_ORDER_STATUS,
        PERMISSIONS.DELETE_ORDER,

        // Categories
        PERMISSIONS.VIEW_CATEGORIES,
        PERMISSIONS.CREATE_CATEGORY,
        PERMISSIONS.UPDATE_CATEGORY,
        PERMISSIONS.DELETE_CATEGORY,

        // Reports
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.EXPORT_REPORTS,

        // Settings - Only Admin
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.UPDATE_SETTINGS,
    ],

    shop: [
        // Shop chỉ quản lý products, orders, categories
        PERMISSIONS.VIEW_DASHBOARD,

        // Products - Shop can manage their products
        PERMISSIONS.VIEW_PRODUCTS,
        PERMISSIONS.CREATE_PRODUCT,
        PERMISSIONS.UPDATE_PRODUCT,
        PERMISSIONS.DELETE_PRODUCT,

        // Orders - Shop can view and update status
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.UPDATE_ORDER_STATUS,

        // Categories
        PERMISSIONS.VIEW_CATEGORIES,
        PERMISSIONS.CREATE_CATEGORY,
        PERMISSIONS.UPDATE_CATEGORY,

        // Reports - View only
        PERMISSIONS.VIEW_REPORTS,
    ],

    // User role KHÔNG có quyền vào Admin Panel
    // User chỉ dùng Website (Customer side)
    user: [],
}
/**
 * Check if user is admin (admin or shop)
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isAdmin = (role) => {
    return role === 'admin' || role === 'shop'
}

/**
 * Check if user can access Admin Panel
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canAccessAdminPanel = (role) => {
    return isAdmin(role)
}

/**
 * Check if a role has a specific permission
 * @param {string} role - User role (admin, shop, user)
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
    if (!role || !permission) return false
    const rolePermissions = ROLE_PERMISSIONS[role] || []
    return rolePermissions.includes(permission)
}

/**
 * Check if a role has ANY of the permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions) => {
    if (!role || !permissions || !Array.isArray(permissions)) return false
    return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Check if a role has ALL of the permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
    if (!role || !permissions || !Array.isArray(permissions)) return false
    return permissions.every((permission) => hasPermission(role, permission))
}
