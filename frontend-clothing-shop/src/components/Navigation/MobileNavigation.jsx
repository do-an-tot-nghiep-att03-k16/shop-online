import { Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { useParentCategories, useChildrenCategories } from '../../hooks/useCategories'
import { createSlug } from '../../utils/slugUtils'

const MobileNavigation = ({ onMenuClick }) => {
    const location = useLocation()
    
    // Load parent categories
    const { data: parentCategories = [] } = useParentCategories()
    
    // Get first 4 parent categories for mobile
    const displayParents = parentCategories.slice(0, 4)
    
    // Load children queries with a fixed number of hooks to avoid hook order changes
    const fixedParents = Array.from({ length: 4 }, (_, i) => displayParents[i] || null)
    const childrenQueries = fixedParents.map(parent =>
        useChildrenCategories(parent?._id, { enabled: !!parent?._id })
    )

    const handleMenuClick = () => {
        // Close mobile menu when any item is clicked
        if (onMenuClick) {
            onMenuClick()
        }
    }

    const getMobileMenuItems = () => [
        {
            key: '/',
            label: <Link to="/" onClick={handleMenuClick}>Trang chủ</Link>
        },
        {
            key: '/shop',
            label: <Link to="/shop" onClick={handleMenuClick}>Cửa hàng</Link>
        },
        {
            key: '/shop/sale',
            label: <Link to="/shop/sale" onClick={handleMenuClick}>🔥 Khuyến mãi</Link>
        },
        // Category items with children loaded for mobile
        ...displayParents.map((parent, index) => {
            const parentSlug = parent.slug || createSlug(parent.name)
            const childrenQuery = childrenQueries[index]
            const children = childrenQuery?.data || []
            
            if (children.length > 0) {
                return {
                    key: `parent-${parent._id}`,
                    label: parent.name,
                    children: [
                        {
                            key: `all-${parent._id}`,
                            label: <Link to={`/shop/${parentSlug}`} onClick={handleMenuClick}>Tất cả {parent.name}</Link>
                        },
                        ...children.map(child => {
                            const childSlug = child.slug || createSlug(child.name)
                            return {
                                key: `child-${child._id}`,
                                label: <Link to={`/shop/${childSlug}`} onClick={handleMenuClick}>{child.name}</Link>
                            }
                        })
                    ]
                }
            }
            
            return {
                key: `parent-${parent._id}`,
                label: <Link to={`/shop/${parentSlug}`} onClick={handleMenuClick}>{parent.name}</Link>
            }
        }),
        // Gender navigation
        {
            key: 'male',
            label: <Link to="/shop/nam" onClick={handleMenuClick}>Nam</Link>
        },
        {
            key: 'female', 
            label: <Link to="/shop/nu" onClick={handleMenuClick}>Nữ</Link>
        },
        {
            key: 'unisex',
            label: <Link to="/shop/unisex" onClick={handleMenuClick}>Unisex</Link>
        }
    ]

    return (
        <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMobileMenuItems()}
            style={{ 
                border: 'none', 
                background: 'transparent',
                fontSize: '16px',
                fontWeight: 500
            }}
            inlineIndent={20}
            defaultOpenKeys={[]} // Start with all submenus closed
        />
    )
}

export default MobileNavigation