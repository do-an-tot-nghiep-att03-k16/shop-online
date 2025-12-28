// components/Header/AdminHeader.jsx
import { Layout, Dropdown, Avatar, Space, message, Badge } from 'antd'
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../config/permissions'

const { Header: AntHeader } = Layout

const AdminHeader = () => {
    const navigate = useNavigate()
    const { user, logout, loading } = useAuth()
    const { can } = usePermission()
    const { getProfile } = useAuth()

    const handleProfileClick = async () => {
        try {
            await getProfile()
            navigate('/profile')
        } catch (error) {
            message.error('Không thể tải thông tin tài khoản')
        }
    }

    const handleLogout = async () => {
        const result = await logout()

        if (result.type.includes('fulfilled')) {
            message.success('Đăng xuất thành công')
            navigate('/login', { replace: true })
        }
    }

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin tài khoản',
            onClick: handleProfileClick,
        },
        ...(can(PERMISSIONS.VIEW_SETTINGS)
            ? [
                  {
                      key: 'settings',
                      icon: <SettingOutlined />,
                      label: 'Cài đặt',
                      onClick: () => navigate('/admin/settings'),
                  },
              ]
            : []),
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
            disabled: loading,
        },
    ]

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { color: 'red', text: 'Admin' },
            shop: { color: 'blue', text: 'Shop' },
        }
        return roleConfig[role] || { color: 'default', text: 'User' }
    }

    const roleBadge = getRoleBadge(user?.usr_role)

    return (
        <AntHeader
            style={{
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
        >
            <div
                style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1890ff',
                }}
            >
                Admin Dashboard
            </div>

            <Dropdown
                menu={{ items: menuItems }}
                placement="bottomRight"
                trigger={['click']}
            >
                <Space style={{ cursor: 'pointer' }}>
                    <Avatar
                        src={user?.images?.thumbnail || undefined}
                        style={{ backgroundColor: '#1890ff' }}
                        icon={<UserOutlined />}
                    />
                    <Space orientation="vertical" size={0} align="end">
                        <span style={{ fontWeight: 500 }}>
                            {user?.usr_name || user?.usr_email || 'User'}
                        </span>
                        <Badge
                            count={roleBadge.text}
                            style={{
                                backgroundColor:
                                    roleBadge.color === 'red'
                                        ? '#ff4d4f'
                                        : '#1890ff',
                                fontSize: '10px',
                            }}
                        />
                    </Space>
                </Space>
            </Dropdown>
        </AntHeader>
    )
}

export default AdminHeader
