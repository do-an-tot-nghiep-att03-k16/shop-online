import { useState, useEffect } from 'react'
import { Layout, Button, Drawer } from 'antd'
import { Outlet } from 'react-router-dom'
import { MenuOutlined } from '@ant-design/icons'
import { MainNavigation, UserMenu, CartDropdown } from '../Navigation'
import MobileNavigation from '../Navigation/MobileNavigation'
import AIChatWidget from '../Common/AIChatWidget'
import { useSettingContext } from '../../context/SettingContext'

const { Header, Content, Footer } = Layout

const WebsiteLayout = () => {
    const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const { setting, contactInfo, socialLinks, isLoading: settingLoading, getShopName, getHotline, getEmail } = useSettingContext()

    const showMobileMenu = () => setMobileMenuVisible(true)
    const hideMobileMenu = () => setMobileMenuVisible(false)

    // Handle responsive
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])


    return (
        <Layout style={{ minHeight: '100vh', margin: 0, padding: 0 }}>
            <Header 
                style={{
                    position: 'fixed',
                    zIndex: 1000,
                    width: '100%',
                    backgroundColor: '#fff',
                    borderBottom: '2px solid #f0f2f5',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    padding: '0 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 72
                }}
            >
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src="/logo.svg" 
                        alt={`${getShopName()} Logo`}
                        style={{ 
                            width: 40, 
                            height: 40, 
                            marginRight: '12px',
                            objectFit: 'contain'
                        }}
                    />
                    <h1 style={{ 
                        margin: 0, 
                        padding: 0,
                        color: '#724947', 
                        fontSize: 28,
                        fontFamily: 'Dancing Script, cursive',
                        fontWeight: 400,
                        lineHeight: 1
                    }}>
                        {settingLoading ? 'Loading...' : getShopName()}
                    </h1>
                </div>

                {/* Navigation Menu - Take up remaining space */}
                {!isMobile && (
                    <div style={{ flex: 1, marginLeft: '40px' }}>
                        <MainNavigation />
                    </div>
                )}

                {/* User Menu & Cart - Move to right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!isMobile && (
                        <>
                            <CartDropdown />
                            <div className="user-menu">
                                <UserMenu />
                            </div>
                        </>
                    )}

                    {/* Mobile Cart & Menu */}
                    {isMobile && (
                        <>
                            <CartDropdown />
                            <Button 
                                type="text" 
                                icon={<MenuOutlined style={{ fontSize: '18px' }} />}
                                onClick={showMobileMenu}
                                className="mobile-menu-btn"
                                size="large"
                                style={{ marginLeft: '8px' }}
                            />
                        </>
                    )}
                </div>

                {/* Mobile Drawer */}
                <Drawer
                    title="Menu"
                    placement="left"
                    onClose={hideMobileMenu}
                    open={mobileMenuVisible}
                    size="default"
                    style={{
                        zIndex: 1001
                    }}
                    bodyStyle={{
                        padding: '16px 0'
                    }}
                    className="mobile-drawer"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <MobileNavigation onMenuClick={hideMobileMenu} />
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                            <UserMenu onMenuClick={hideMobileMenu} />
                        </div>
                    </div>
                </Drawer>
            </Header>

            <Content style={{ paddingTop: 72, minHeight: 'calc(100vh - 72px)', margin: 0, padding: '72px 0 0 0' }}>
                <div style={{ outline: 'none' }} tabIndex={-1}>
                    <Outlet />
                </div>
            </Content>

            <Footer style={{ 
                background: 'linear-gradient(135deg, #724947 0%, #b77574 100%)', 
                color: 'white',
                padding: '60px 0 20px'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    {/* Footer Content */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
                        {/* About Section */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                <img 
                                    src="/logo.svg" 
                                    alt={`${getShopName()} Logo`}
                                    style={{ 
                                        width: 40, 
                                        height: 40, 
                                        marginRight: '12px',
                                        objectFit: 'contain',
                                        opacity: 0.9
                                    }}
                                />
                                <h3 style={{ 
                                    color: 'white', 
                                    margin: 0, 
                                    fontSize: '20px',
                                    fontFamily: 'Dancing Script, cursive',
                                    fontWeight: 400
                                }}>{getShopName()}</h3>
                            </div>
                            <p style={{ color: '#bdc3c7', lineHeight: 1.6, margin: 0 }}>
                                {getShopName()} - Nơi phong cách gặp gỡ sự tinh tế. Khám phá bộ sưu tập thời trang cao cấp 
                                với thiết kế độc đáo và chất lượng vượt trội.
                            </p>
                        </div>


                        {/* Contact Info */}
                        <div>
                            <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '16px' }}>Liên hệ</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ color: '#bdc3c7' }}>
                                    <i className="fas fa-envelope" style={{ marginRight: '8px' }}></i>
                                    {getEmail()}
                                </span>
                                <span style={{ color: '#bdc3c7' }}>
                                    <i className="fas fa-phone" style={{ marginRight: '8px' }}></i>
                                    {getHotline()}
                                </span>
                                <span style={{ color: '#bdc3c7' }}>
                                    <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
                                    TP. Hồ Chí Minh, Việt Nam
                                </span>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    {socialLinks.map((social, index) => {
                                        let iconClass = ''
                                        switch(social.name.toLowerCase()) {
                                            case 'facebook':
                                                iconClass = 'fab fa-facebook-f'
                                                break
                                            case 'instagram': 
                                                iconClass = 'fab fa-instagram'
                                                break
                                            case 'messenger':
                                                iconClass = 'fab fa-facebook-messenger'
                                                break
                                            default:
                                                iconClass = 'fas fa-link'
                                        }
                                        
                                        return (
                                            <a 
                                                key={index}
                                                href={social.url} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ 
                                                    background: social.color,
                                                    color: 'white',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    textDecoration: 'none',
                                                    transition: 'transform 0.3s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }} 
                                                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                            >
                                                <i className={iconClass}></i>
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div style={{ 
                        borderTop: '1px solid rgba(255,255,255,0.1)', 
                        paddingTop: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)' }}>
                            © {new Date().getFullYear()} {getShopName()}. All rights reserved. Made with ❤️
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>
                                Chính sách bảo mật
                            </a>
                            <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>
                                Điều khoản sử dụng
                            </a>
                        </div>
                    </div>
                </div>
            </Footer>
            
            {/* AI Chat Widget */}
            <AIChatWidget />
        </Layout>
    )
}

export default WebsiteLayout