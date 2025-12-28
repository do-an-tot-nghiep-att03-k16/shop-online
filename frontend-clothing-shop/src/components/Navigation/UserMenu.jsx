import { Menu, Dropdown, Avatar, Button } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import {
    UserOutlined,
    LogoutOutlined,
    ProfileOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useState, useEffect } from 'react'

const UserMenu = ({ onMenuClick }) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [avatarKey, setAvatarKey] = useState(Date.now())

    // Update avatar key when user changes
    useEffect(() => {
        if (user?.images?.thumbnail) {
            setAvatarKey(Date.now())
        } else {
        }
    }, [user?.images?.thumbnail, user?._id])

    const handleLogout = () => {
        logout()
        navigate('/')
        if (onMenuClick) onMenuClick() // Close mobile menu
    }

    const handleMenuItemClick = () => {
        if (onMenuClick) onMenuClick() // Close mobile menu on any click
    }

    const getUserMenuItems = () => [
        {
            key: 'profile',
            icon: <UserOutlined style={{ color: '#1890ff' }} />,
            label: (
                <Link to="/profile" onClick={handleMenuItemClick}>
                    <span style={{ marginLeft: 8 }}>Hồ sơ cá nhân</span>
                </Link>
            ),
        },
        {
            key: 'orders',
            icon: <ShoppingCartOutlined style={{ color: '#52c41a' }} />,
            label: (
                <Link to="/my-orders" onClick={handleMenuItemClick}>
                    <span style={{ marginLeft: 8 }}>Đơn hàng của tôi</span>
                </Link>
            ),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined style={{ color: '#ff4d4f' }} />,
            label: <span style={{ marginLeft: 8 }}>Đăng xuất</span>,
            onClick: handleLogout,
        },
    ]

    if (!user) {
        return (
            <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                    type="default"
                    style={{
                        fontWeight: 500,
                        height: 40,
                        borderRadius: 8,
                    }}
                    onClick={handleMenuItemClick}
                >
                    <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button
                    type="primary"
                    style={{
                        background:
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontWeight: 500,
                        height: 40,
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
                    }}
                    onClick={handleMenuItemClick}
                >
                    <Link to="/register" style={{ color: 'white' }}>
                        Đăng ký
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <Dropdown
            menu={{ items: getUserMenuItems() }}
            placement="bottomRight"
            trigger={['click']}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                }}
            >
                <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    src={
                        user?.images?.thumbnail
                            ? `${user.images.thumbnail}?v=${avatarKey}`
                            : undefined
                    }
                    style={{ backgroundColor: '#1890ff' }}
                    onError={(e) => {
                        console.log('❌ Avatar load failed:', e.target.src)
                        return false // Use fallback icon
                    }}
                />
                <span style={{ color: '#333' }}>
                    {user.usr_name || user.name || user.usr_email || user.email}
                </span>
            </div>
        </Dropdown>
    )
}

export default UserMenu
