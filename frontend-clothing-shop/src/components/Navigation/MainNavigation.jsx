import { Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import useCategoryDropdown from './CategoryDropdown'

const MainNavigation = () => {
    const location = useLocation()
    const { menuItems: categoryMenuItems, menuKey } = useCategoryDropdown()

    const getMainMenuItems = () => [
        {
            key: '/',
            label: <Link to="/">Trang chủ</Link>,
        },
        {
            key: '/shop',
            label: <Link to="/shop">Cửa hàng</Link>,
        },
        {
            key: '/shop/sale',
            label: <Link to="/shop/sale">🔥 Khuyến mãi</Link>,
        },
        {
            key: '/blog',
            label: <Link to="/blog">Blog</Link>,
        },
        ...categoryMenuItems,
        {
            key: 'male',
            label: <Link to="/shop/nam">Nam</Link>,
        },
        {
            key: 'female',
            label: <Link to="/shop/nu">Nữ</Link>,
        },
        {
            key: 'unisex',
            label: <Link to="/shop/unisex">Unisex</Link>,
        },
    ]

    return (
        <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={getMainMenuItems()}
            style={{
                border: 'none',
                background: 'transparent',
                fontSize: '15px',
                fontWeight: 500,
                flex: 1,
                justifyContent: 'flex-start',
            }}
            key={menuKey}
            triggerSubMenuAction="hover"
        />
    )
}

export default MainNavigation
