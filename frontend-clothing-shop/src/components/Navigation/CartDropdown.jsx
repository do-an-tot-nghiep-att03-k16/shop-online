import { Badge, Dropdown, Button, Divider, Empty } from 'antd'
import { ShoppingCartOutlined, DeleteOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useCart, useCartCount, useCartSelectors, useRemoveFromCart } from '../../hooks/useCart'

const CartDropdown = () => {
    // Fetch full cart data including items
    useCart()
    
    const cartCount = useCartCount()
    const { items, total, loading } = useCartSelectors()
    const removeFromCart = useRemoveFromCart()

    const handleRemoveItem = (variant_sku) => {
        removeFromCart.mutate(variant_sku)
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price)
    }

    const cartMenuItems = []

    if (loading) {
        cartMenuItems.push({
            key: 'loading',
            label: (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    Đang tải...
                </div>
            ),
            disabled: true
        })
    } else if (items.length === 0) {
        cartMenuItems.push({
            key: 'empty',
            label: (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description="Giỏ hàng trống"
                        style={{ margin: 0 }}
                    />
                </div>
            ),
            disabled: true
        })
    } else {
        // Add cart items
        items.slice(0, 5).forEach((item, index) => {
            cartMenuItems.push({
                key: `item-${index}`,
                label: (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '8px 0',
                        maxWidth: '300px'
                    }}>
                        <img 
                            src={
                                item.product_images?.thumbnail || 
                                item.product_image || 
                                '/placeholder.jpg'
                            } 
                            alt={item.product_name}
                            style={{ 
                                width: 40, 
                                height: 40, 
                                objectFit: 'cover',
                                borderRadius: '4px'
                            }} 
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                                fontSize: '14px',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {item.product_name}
                            </div>
                            <div style={{ 
                                color: '#999', 
                                fontSize: '12px',
                                marginTop: '2px'
                            }}>
                                {item.variant_color && item.variant_size && 
                                    `${item.variant_color} - ${item.variant_size} | `
                                }
                                SL: {item.quantity}
                            </div>
                            <div style={{ 
                                color: '#1890ff',
                                fontSize: '12px',
                                fontWeight: 500
                            }}>
                                {formatPrice(item.price * item.quantity)}
                            </div>
                        </div>
                        <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveItem(item.variant_sku)
                            }}
                            loading={removeFromCart.isLoading}
                            style={{ color: '#ff4d4f' }}
                        />
                    </div>
                ),
                disabled: removeFromCart.isLoading
            })
        })

        // Show more items if needed
        if (items.length > 5) {
            cartMenuItems.push({
                key: 'more',
                label: (
                    <div style={{ textAlign: 'center', color: '#999', fontSize: '12px' }}>
                        +{items.length - 5} sản phẩm khác
                    </div>
                ),
                disabled: true
            })
        }

        // Divider and total
        cartMenuItems.push({
            type: 'divider'
        })

        cartMenuItems.push({
            key: 'total',
            label: (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    fontWeight: 600
                }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#1890ff' }}>
                        {formatPrice(total)}
                    </span>
                </div>
            ),
            disabled: true
        })

        // View cart button
        cartMenuItems.push({
            key: 'view-cart',
            label: (
                <Link to="/cart">
                    <Button type="primary" block style={{ marginTop: '8px' }}>
                        Xem giỏ hàng
                    </Button>
                </Link>
            )
        })
    }

    return (
        <Dropdown
            menu={{ items: cartMenuItems }}
            placement="bottomRight"
            trigger={['click']}
        >
            <Badge count={cartCount} size="small">
                <Button 
                    type="text" 
                    icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                    size="large"
                    style={{ 
                        height: 40,
                        width: 40,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                />
            </Badge>
        </Dropdown>
    )
}

export default CartDropdown