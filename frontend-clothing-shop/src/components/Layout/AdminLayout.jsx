import { useState, useMemo } from 'react'
import { Layout, Menu } from 'antd'
import {
    DashboardOutlined,
    UserOutlined,
    ShoppingOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    BarChartOutlined,
    SettingOutlined,
    GiftOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    RobotOutlined,
    TransactionOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import AdminHeader from '../Admin/AdminHeader'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../config/permissions'

const { Sider, Content } = Layout

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { can } = usePermission()

    // All possible menu items với permissions
    const allMenuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            permission: PERMISSIONS.VIEW_DASHBOARD,
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'Người dùng',
            permission: PERMISSIONS.VIEW_USERS, // Only Admin
        },
        {
            key: '/admin/products',
            icon: <ShoppingOutlined />,
            label: 'Sản phẩm',
            permission: PERMISSIONS.VIEW_PRODUCTS, // Admin & Shop
        },
        {
            key: '/admin/categories',
            icon: <AppstoreOutlined />,
            label: 'Danh mục',
            permission: PERMISSIONS.VIEW_CATEGORIES, // Admin & Shop
        },
        {
            key: '/admin/coupons',
            icon: <GiftOutlined />,
            label: 'Khuyến mãi',
            permission: PERMISSIONS.VIEW_PRODUCTS, // Admin & Shop (có thể tạo permission riêng)
        },
        {
            key: '/admin/orders',
            icon: <ShoppingCartOutlined />,
            label: 'Đơn hàng',
            permission: PERMISSIONS.VIEW_ORDERS, // Admin & Shop
        },
        {
            key: '/admin/transactions',
            icon: <TransactionOutlined />,
            label: 'Lịch sử giao dịch',
            permission: PERMISSIONS.VIEW_ORDERS, // Admin & Shop (same as orders)
        },
        {
            key: '/admin/inventory',
            icon: <BarChartOutlined />,
            label: 'Tồn kho',
            permission: PERMISSIONS.VIEW_PRODUCTS, // Admin & Shop
        },
    ]

    // Filter menu items dựa trên permissions của user
    const menuItems = useMemo(() => {
        return allMenuItems.filter((item) => {
            // Nếu không có permission required, show cho tất cả
            if (!item.permission) return true
            // Check permission
            return can(item.permission)
        })
    }, [can])

    const handleMenuClick = ({ key }) => {
        navigate(key)
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AdminHeader />

            <Layout>
                {/* Sidebar */}
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    breakpoint="lg"
                    collapsedWidth={80}
                    width={250}
                    style={{
                        overflow: 'auto',
                        height: 'calc(100vh - 64px)',
                        position: 'sticky',
                        top: 64,
                        left: 0,
                        background: '#fff',
                        borderRight: '1px solid #f0f0f0',
                    }}
                    trigger={
                        collapsed ? (
                            <MenuUnfoldOutlined style={{ fontSize: 18 }} />
                        ) : (
                            <MenuFoldOutlined style={{ fontSize: 18 }} />
                        )
                    }
                >
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={handleMenuClick}
                        style={{ borderRight: 0, paddingTop: 16 }}
                    />
                </Sider>

                {/* Main Content Area */}
                <Content
                    style={{
                        padding: '24px',
                        background: '#f0f2f5',
                        minHeight: 'calc(100vh - 64px)',
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            padding: '24px',
                            borderRadius: '8px',
                            minHeight: '100%',
                        }}
                    >
                        {/* Render nested routes */}
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default AdminLayout
