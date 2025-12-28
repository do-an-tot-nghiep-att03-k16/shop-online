import { useState } from 'react'
import {
    Row,
    Col,
    Card,
    Button,
    InputNumber,
    Image,
    Typography,
    Divider,
    Empty,
    Spin,
    Space,
    Popconfirm,
} from 'antd'
import {
    DeleteOutlined,
    MinusOutlined,
    PlusOutlined,
    ShoppingOutlined,
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import {
    useCart,
    useCartSelectors,
    useUpdateCartItem,
    useRemoveFromCart,
    useClearCart,
} from '../hooks/useCart'
import CouponInput from '../components/Common/CouponInput'

const { Title, Text } = Typography

const Cart = () => {
    const navigate = useNavigate()

    // This will trigger the cart fetch from server
    useCart()

    const { items, total, subtotal, loading, appliedCoupon } =
        useCartSelectors()
    const updateCartItem = useUpdateCartItem()
    const removeFromCart = useRemoveFromCart()
    const clearCart = useClearCart()

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price || 0)
    }

    const handleUpdateQuantity = (variant_sku, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(variant_sku)
            return
        }

        updateCartItem.mutate({ variant_sku, quantity: newQuantity })
    }

    const handleRemoveItem = (variant_sku) => {
        removeFromCart.mutate(variant_sku)
    }

    const handleClearCart = () => {
        clearCart.mutate()
    }

    const handleCheckout = () => {
        if (!items || items.length === 0) {
            return
        }
        navigate('/checkout')
    }

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                }}
            >
                <Spin size="large" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div style={{ padding: '40px 0' }}>
                <Row justify="center">
                    <Col xs={24} sm={20} md={16} lg={12}>
                        <Card>
                            <Empty
                                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                                imageStyle={{ height: 120 }}
                                description={
                                    <span
                                        style={{
                                            fontSize: '16px',
                                            color: '#999',
                                        }}
                                    >
                                        Giỏ hàng của bạn đang trống
                                    </span>
                                }
                            >
                                <Link to="/shop">
                                    <Button
                                        type="primary"
                                        icon={<ShoppingOutlined />}
                                    >
                                        Tiếp tục mua sắm
                                    </Button>
                                </Link>
                            </Empty>
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }

    return (
        <div
            style={{
                padding: '20px 24px',
                maxWidth: '1200px',
                margin: '0 auto',
            }}
        >
            <Row gutter={[24, 24]}>
                {/* Cart Items */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Title level={4} style={{ margin: 0 }}>
                                    Giỏ hàng ({items.length} sản phẩm)
                                </Title>
                                <Popconfirm
                                    title="Xóa toàn bộ giỏ hàng?"
                                    description="Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?"
                                    onConfirm={handleClearCart}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        loading={clearCart.isPending}
                                    >
                                        Xóa tất cả
                                    </Button>
                                </Popconfirm>
                            </div>
                        }
                    >
                        <Space
                            direction="vertical"
                            style={{ width: '100%' }}
                            size="middle"
                        >
                            {items.map((item, index) => (
                                <div key={item.variant_sku || index}>
                                    <Row gutter={[16, 16]} align="middle">
                                        {/* Product Image */}
                                        <Col xs={6} sm={4}>
                                            <Image
                                                width={80}
                                                height={80}
                                                src={
                                                    item.product_images
                                                        ?.thumbnail ||
                                                    item.product_image ||
                                                    '/placeholder.jpg'
                                                }
                                                alt={item.product_name}
                                                style={{
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                }}
                                                placeholder={
                                                    <div
                                                        style={{
                                                            width: 80,
                                                            height: 80,
                                                            backgroundColor:
                                                                '#f5f5f5',
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            borderRadius: '8px',
                                                        }}
                                                    >
                                                        <ShoppingOutlined
                                                            style={{
                                                                fontSize: 24,
                                                                color: '#ccc',
                                                            }}
                                                        />
                                                    </div>
                                                }
                                            />
                                        </Col>

                                        {/* Product Info */}
                                        <Col xs={18} sm={12} md={10}>
                                            <div>
                                                <Text
                                                    strong
                                                    style={{ fontSize: '16px' }}
                                                >
                                                    {item.product_name}
                                                </Text>
                                                {(item.variant_color ||
                                                    item.variant_size) && (
                                                    <div
                                                        style={{
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                fontSize:
                                                                    '14px',
                                                            }}
                                                        >
                                                            {[
                                                                item.variant_color,
                                                                item.variant_size,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' - ')}
                                                        </Text>
                                                    </div>
                                                )}
                                                <div
                                                    style={{ marginTop: '4px' }}
                                                >
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        SKU: {item.variant_sku}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Quantity Controls */}
                                        <Col xs={12} sm={4}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                }}
                                            >
                                                <Button
                                                    size="small"
                                                    icon={<MinusOutlined />}
                                                    onClick={() =>
                                                        handleUpdateQuantity(
                                                            item.variant_sku,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                    disabled={
                                                        updateCartItem.isPending ||
                                                        item.quantity <= 1
                                                    }
                                                />
                                                <InputNumber
                                                    min={1}
                                                    max={99}
                                                    value={item.quantity}
                                                    onChange={(value) =>
                                                        handleUpdateQuantity(
                                                            item.variant_sku,
                                                            value
                                                        )
                                                    }
                                                    style={{ width: '60px' }}
                                                    size="small"
                                                    disabled={
                                                        updateCartItem.isPending
                                                    }
                                                />
                                                <Button
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    onClick={() =>
                                                        handleUpdateQuantity(
                                                            item.variant_sku,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                    disabled={
                                                        updateCartItem.isPending
                                                    }
                                                />
                                            </div>
                                        </Col>

                                        {/* Price & Remove */}
                                        <Col
                                            xs={12}
                                            sm={4}
                                            style={{ textAlign: 'right' }}
                                        >
                                            <div>
                                                <Text
                                                    strong
                                                    style={{
                                                        fontSize: '16px',
                                                        color: '#1890ff',
                                                    }}
                                                >
                                                    {formatPrice(
                                                        item.price *
                                                            item.quantity
                                                    )}
                                                </Text>
                                                <div
                                                    style={{ marginTop: '8px' }}
                                                >
                                                    <Popconfirm
                                                        title="Xóa sản phẩm?"
                                                        description="Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?"
                                                        onConfirm={() =>
                                                            handleRemoveItem(
                                                                item.variant_sku
                                                            )
                                                        }
                                                        okText="Xóa"
                                                        cancelText="Hủy"
                                                        okButtonProps={{
                                                            danger: true,
                                                        }}
                                                    >
                                                        <Button
                                                            type="text"
                                                            danger
                                                            size="small"
                                                            icon={
                                                                <DeleteOutlined />
                                                            }
                                                            loading={
                                                                removeFromCart.isPending
                                                            }
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </Popconfirm>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                    {index < items.length - 1 && <Divider />}
                                </div>
                            ))}
                        </Space>
                    </Card>
                </Col>

                {/* Cart Summary */}
                <Col xs={24} lg={8}>
                    <Space
                        direction="vertical"
                        style={{ width: '100%' }}
                        size="middle"
                    >
                        {/* Coupon Section */}
                        <Card title="Mã giảm giá">
                            <CouponInput />
                        </Card>

                        {/* Order Summary */}
                        <Card title="Tóm tắt đơn hàng">
                            <Space
                                direction="vertical"
                                style={{ width: '100%' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Text>Tạm tính:</Text>
                                    <Text>{formatPrice(subtotal)}</Text>
                                </div>

                                {appliedCoupon && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Text type="success">
                                            Giảm giá ({appliedCoupon.code}):
                                        </Text>
                                        <Text type="success">
                                            -
                                            {formatPrice(
                                                appliedCoupon?.discount ||
                                                    subtotal - total ||
                                                    0
                                            )}
                                        </Text>
                                    </div>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Text>Phí vận chuyển:</Text>
                                    <Text type="secondary">
                                        Tính khi thanh toán
                                    </Text>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    <Text strong>Tổng cộng:</Text>
                                    <Text strong style={{ color: '#1890ff' }}>
                                        {formatPrice(total)}
                                    </Text>
                                </div>

                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    style={{ marginTop: '16px' }}
                                    onClick={handleCheckout}
                                >
                                    Tiến hành thanh toán
                                </Button>

                                <Link to="/shop">
                                    <Button block style={{ marginTop: '8px' }}>
                                        Tiếp tục mua sắm
                                    </Button>
                                </Link>
                            </Space>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    )
}

export default Cart
