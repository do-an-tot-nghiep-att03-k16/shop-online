const { AccessControl } = require('accesscontrol')

let grantList = [
    // API Key permissions
    {
        role: 'admin',
        resource: 'apikey',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'apikey',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'apikey',
        action: 'delete:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'apikey',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'apikey',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'apikey',
        action: 'delete:any',
        attributes: ['*'],
    },

    // User permissions
    // Admin có full quyền quản lý users
    {
        role: 'admin',
        resource: 'user',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'user',
        action: 'read:any',
        attributes: ['*', '!usr_password'], // Không được xem password
    },
    {
        role: 'admin',
        resource: 'user',
        action: 'read:own',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'user',
        action: 'update:any',
        attributes: ['*', '!usr_password'], // Không được update password trực tiếp
    },
    {
        role: 'admin',
        resource: 'user',
        action: 'update:own',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'user',
        action: 'delete:any',
        attributes: ['*'],
    },
    // Shop có quyền hạn chế
    {
        role: 'shop',
        resource: 'user',
        action: 'read:own',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'user',
        action: 'update:own',
        attributes: ['*'],
    },
    // User chỉ có quyền với tài khoản của mình
    {
        role: 'user',
        resource: 'user',
        action: 'read:own',
        attributes: ['*'],
    },
    {
        role: 'user',
        resource: 'user',
        action: 'update:own',
        attributes: ['*'],
    },

    // Order permissions
    {
        role: 'admin',
        resource: 'order',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'order',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'order',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'order',
        action: 'delete:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'order',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'order',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'order',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'order',
        action: 'delete:any',
        attributes: ['*'],
    },
    {
        role: 'user',
        resource: 'order',
        action: 'create:own',
        attributes: ['*'],
    },
    {
        role: 'user',
        resource: 'order',
        action: 'read:own',
        attributes: ['*'],
    },
    {
        role: 'user',
        resource: 'order',
        action: 'update:own',
        attributes: ['status', 'cancellation_reason', 'return_reason'],
    },

    // Analytics permissions
    {
        role: 'admin',
        resource: 'analytics',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'analytics',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'user',
        resource: 'analytics',
        action: 'read:own',
        attributes: ['*'],
    },

    // System permissions (for cron jobs, auto operations)
    {
        role: 'admin',
        resource: 'system',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'system',
        action: 'update:any',
        attributes: ['*'],
    },

    // Product permissions
    {
        role: 'admin',
        resource: 'product',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'product',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'product',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'product',
        action: 'delete:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'product',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'product',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'product',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'product',
        action: 'delete:any',
        attributes: ['*'],
    },

    // Category permissions
    {
        role: 'admin',
        resource: 'category',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'category',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'category',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'category',
        action: 'delete:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'category',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'category',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'category',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'category',
        action: 'delete:any',
        attributes: ['*'],
    },

    // Upload permissions
    {
        role: 'admin',
        resource: 'upload',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'upload',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'user',
        resource: 'upload',
        action: 'create:own',
        attributes: ['*'],
    },

    // Inventory permissions
    {
        role: 'admin',
        resource: 'inventory',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'inventory',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'inventory',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'inventory',
        action: 'update:any',
        attributes: ['*'],
    },

    // Coupon permissions
    {
        role: 'admin',
        resource: 'coupon',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'coupon',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'coupon',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'coupon',
        action: 'delete:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'coupon',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'coupon',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'coupon',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'coupon',
        action: 'delete:any',
        attributes: ['*'],
    },

    // Payment/Transaction permissions
    {
        role: 'admin',
        resource: 'transaction',
        action: 'create:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'transaction',
        action: 'read:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'transaction',
        action: 'update:any',
        attributes: ['*'],
    },
    {
        role: 'admin',
        resource: 'transaction',
        action: 'delete:any',
        attributes: ['*'],
    },
    {
        role: 'shop',
        resource: 'transaction',
        action: 'read:any',
        attributes: ['*'],
    },
]
const ac = new AccessControl(grantList)

/**
 * Middleware để check role của user
 * @param {Array<string>} allowedRoles - Danh sách các role được phép truy cập
 * @returns {Function} Express middleware
 * @example router.use(roleCheck(['admin', 'shop']))
 */
const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const userRole = req.role

            if (!userRole) {
                throw new Error('User role not found in request')
            }

            if (!allowedRoles.includes(userRole)) {
                const { AuthFailureError } = require('../core/error.response')
                throw new AuthFailureError(
                    `Access denied. Required roles: ${allowedRoles.join(', ')}`
                )
            }

            next()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = ac
module.exports.roleCheck = roleCheck
