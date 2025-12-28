import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({
    children,
    requireAuth = true,
    requireAdminAccess = false,
}) => {
    const { isAuthenticated, canAccessAdmin, loading } = useAuth()

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <Spin size="large" tip="Đang tải..." />
            </div>
        )
    }

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (requireAdminAccess && !canAccessAdmin) {
        return <Navigate to="/admin/login" replace />
    }

    return children
}

export default ProtectedRoute
