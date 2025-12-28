import { useAuth } from './useAuth'
import {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
} from '../config/permissions'

/**
 * Custom hook để kiểm tra permissions
 */
export const usePermission = () => {
    const { user } = useAuth()

    /**
     * Kiểm tra 1 quyền cụ thể
     */
    const can = (permission) => {
        if (!user) {
            return false
        }
        
        // Check both usr_role and role fields
        const userRole = user.usr_role || user.role
        if (!userRole) {
            return false
        }
        
        const result = hasPermission(userRole, permission)
        return result
    }

    /**
     * Kiểm tra có ít nhất 1 trong các quyền
     */
    const canAny = (permissions) => {
        const userRole = user?.usr_role || user?.role
        if (!user || !userRole) return false
        return hasAnyPermission(userRole, permissions)
    }

    /**
     * Kiểm tra có tất cả các quyền
     */
    const canAll = (permissions) => {
        const userRole = user?.usr_role || user?.role
        if (!user || !userRole) return false
        return hasAllPermissions(userRole, permissions)
    }

    return {
        can,
        canAny,
        canAll,
        role: user?.usr_role || user?.role,
    }
}
