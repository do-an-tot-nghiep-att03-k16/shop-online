import { useState } from 'react'
import { Layout, Menu, Button, Badge, Dropdown, Avatar, Space } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    HomeOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    LoginOutlined,
    LogoutOutlined,
    MenuOutlined,
    HeartOutlined,
    SearchOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useParentCategories, useChildrenCategories } from '../../hooks/useCategories'

const { Header, Content, Footer } = Layout

const WebsiteLayout = ({ children }) => {
    const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    
    // Use React Query hooks for categories
    const { data: parentCategories = [], isLoading: isLoadingParents } = useParentCategories()
    const [hoveredParentId, setHoveredParentId] = useState(null)
    const { data: childrenData = [], isLoading: isLoadingChildren } = useChildrenCategories(
        hoveredParentId,
        { enabled: !!hoveredParentId }
    )

    // Mock cart data - replace with real cart hook
    const cartItemsCount = 3

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const userMenu = user ? (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />}>
                <Link to="/profile">Thông tin cá nhân</Link>
            </Menu.Item>
            <Menu.Item key="orders" icon={<ShopOutlined />}>
                <Link to="/my-orders">Đơn hàng của tôi</Link>
            </Menu.Item>
            <Menu.Item key="wishlist" icon={<HeartOutlined />}>
                <Link to="/wishlist">Danh sách yêu thích</Link>
            </Menu.Item>
            {(user.role === 'admin' || user.role === 'shop') && (
                <>
                    <Menu.Divider />
                    <Menu.Item key="admin">
                        <Link to="/admin">Quản trị</Link>
                    </Menu.Item>
                </>
            )}
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
            </Menu.Item>
        </Menu>
    ) : null

    // Create category menu items with children
    const createCategoryMenuItems = () => {
        if (!Array.isArray(parentCategories)) return []
        
        return parentCategories.slice(0, 4).map(parent => {
            // Check if this parent is currently hovered and has children data
            const children = (hoveredParentId === parent._id && Array.isArray(childrenData)) ? childrenData : []
            
            // Always create submenu structure  
            const menuItem = {
                key: `parent-${parent._id}`,
                label: parent.name,
                children: [
                    {
                        key: `all-${parent._id}`,
                        label: <Link to={`/shop?category=${parent._id}`}>Tất cả {parent.name}</Link>
                    },
                    ...(children.length > 0 ? [{ type: 'divider' }] : []),
                    ...children.map(child => ({
                        key: `child-${child._id}`,
                        label: <Link to={`/shop?category=${child._id}`}>{child.name}</Link>
                    })),
                    // Show loading when fetching children for this parent
                    ...(isLoadingChildren && hoveredParentId === parent._id ? [{
                        key: `loading-${parent._id}`,
                        label: 'Đang tải...',
                        disabled: true
                    }] : [])
                ],
                onMouseEnter: () => {
                    // Set hovered parent to trigger children fetch
                    setHoveredParentId(parent._id)
                }
            }
            
            return menuItem
        })
    }
    
    const categoryMenuItems = createCategoryMenuItems()
    

    const mainMenuItems = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: <Link to="/">Trang chủ</Link>
        },
        {
            key: '/shop',
            icon: <ShopOutlined />,
            label: <Link to="/shop">Cửa hàng</Link>
        },
        // Add parent category items to main menu
        ...categoryMenuItems,
        // Gender menu items (simplified - no dropdown for now)
        {
            key: 'gender-male',
            label: <Link to="/shop?gender=male">👨 Nam</Link>
        },
        {
            key: 'gender-female', 
            label: <Link to="/shop?gender=female">👩 Nữ</Link>
        },
        {
            key: 'gender-unisex',
            label: <Link to="/shop?gender=unisex">👥 Unisex</Link>
        }
    ]

    return (
        <Layout className="website-layout" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <Header 
                style={{ 
                    background: '#fff', 
                    padding: '0 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000
                }}
            >
                <div style={{ 
                    maxWidth: 1200, 
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {/* Logo */}
                    <div className="logo">
                        <Link to="/" style={{ 
                            fontSize: 24, 
                            fontWeight: 'bold',
                            color: '#1890ff',
                            textDecoration: 'none'
                        }}>
                            MyShop
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="desktop-menu" style={{ flex: 1, marginLeft: 48 }}>
                        <Menu
                            mode="horizontal"
                            selectedKeys={[location.pathname]}
                            items={mainMenuItems}
                            style={{ border: 'none', background: 'transparent' }}
                            key={parentCategories.length}
                            triggerSubMenuAction="hover"
                        />
                    </div>

                    {/* Right Actions */}
                    <Space size="middle" className="header-actions">
                        {/* Search */}
                        <Button 
                            icon={<SearchOutlined />} 
                            type="text"
                            onClick={() => navigate('/shop')}
                        />

                        {/* Cart */}
                        <Badge count={cartItemsCount} size="small">
                            <Button 
                                icon={<ShoppingCartOutlined />} 
                                type="text"
                                onClick={() => navigate('/cart')}
                            />
                        </Badge>

                        {/* User Menu */}
                        {user ? (
                            <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                                <Button type="text" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar size="small" icon={<UserOutlined />} />
                                </Button>
                            </Dropdown>
                        ) : (
                            <Button icon={<LoginOutlined />} type="primary">
                                <Link to="/login">Đăng nhập</Link>
                            </Button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <Button
                            className="mobile-menu-btn"
                            icon={<MenuOutlined />}
                            type="text"
                            onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
                            style={{ display: 'none' }}
                        />
                    </Space>
                </div>

                {/* Mobile Menu */}
                {mobileMenuVisible && (
                    <div className="mobile-menu" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        borderTop: '1px solid #f0f0f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <Menu
                            mode="vertical"
                            selectedKeys={[location.pathname]}
                            items={mainMenuItems}
                            style={{ border: 'none' }}
                        />
                    </div>
                )}
            </Header>

            {/* Content */}
            <Content style={{ background: '#f5f5f5', minHeight: 'calc(100vh - 64px - 69px)' }}>
                {children}
            </Content>

            {/* Footer */}
            <Footer style={{ 
                background: '#001529', 
                color: 'white',
                padding: '40px 20px 20px'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 32,
                        marginBottom: 32
                    }}>
                        {/* Company Info */}
                        <div>
                            <h3 style={{ color: '#1890ff', marginBottom: 16 }}>MyShop</h3>
                            <p>Cửa hàng thời trang trực tuyến hàng đầu Việt Nam</p>
                            <p>📧 contact@myshop.com</p>
                            <p>📞 1900 1234</p>
                            <p>📍 123 Đường ABC, Quận 1, TP.HCM</p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 style={{ color: 'white', marginBottom: 16 }}>Liên kết nhanh</h4>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: 8 }}>
                                    <Link to="/" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Trang chủ
                                    </Link>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    <Link to="/shop" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Cửa hàng
                                    </Link>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Về chúng tôi
                                    </a>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Liên hệ
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Customer Support */}
                        <div>
                            <h4 style={{ color: 'white', marginBottom: 16 }}>Hỗ trợ khách hàng</h4>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: 8 }}>
                                    <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Hướng dẫn mua hàng
                                    </a>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Chính sách đổi trả
                                    </a>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Bảo mật thông tin
                                    </a>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        Câu hỏi thường gặp
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Social Media */}
                        <div>
                            <h4 style={{ color: 'white', marginBottom: 16 }}>Theo dõi chúng tôi</h4>
                            <Space>
                                <Button type="primary" shape="circle">F</Button>
                                <Button type="primary" shape="circle">I</Button>
                                <Button type="primary" shape="circle">Y</Button>
                                <Button type="primary" shape="circle">T</Button>
                            </Space>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div style={{ 
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: 20,
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.65)'
                    }}>
                        <p>&copy; 2024 MyShop. All rights reserved.</p>
                    </div>
                </div>
            </Footer>
        </Layout>
    )
}

export default WebsiteLayout