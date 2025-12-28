import { Navigate } from 'react-router-dom'
import { Alert } from 'antd'
import { usePermission } from '../hooks/usePermission'

const PermissionGuard = ({ children, permission, redirect = false }) => {
    const { can } = usePermission()

    // THÊM LOG Ở ĐÂY
    console.log('Permission required:', permission)
    console.log('Redirect mode:', redirect)

    if (!permission) {
        console.log('No permission required -> PASS')
        return children
    }

    const hasPermission = can(permission)

    // THÊM LOG Ở ĐÂY
    console.log('Has permission:', hasPermission)

    if (!hasPermission) {
        // console.log('❌ PermissionGuard BLOCKED - No permission')u

        if (redirect) {
            return <Navigate to="/admin/dashboard" replace />
        }

        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="Không có quyền truy cập"
                    description="Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ."
                    type="error"
                    showIcon
                />
            </div>
        )
    }
    return children
}

export default PermissionGuard
