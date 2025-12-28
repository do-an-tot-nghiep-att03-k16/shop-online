import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
    Result, 
    Button, 
    Card, 
    Row, 
    Col, 
    Typography, 
    Space, 
    Divider,
    Spin,
    Tag
} from 'antd'
import { 
    CheckCircleOutlined, 
    ShopOutlined, 
    EyeOutlined,
    EnvironmentOutlined,
    PhoneOutlined
} from '@ant-design/icons'
import { orderAPI } from '../services/api'

const { Title, Text } = Typography

const OrderSuccess = () => {
    const { orderNumber } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrder()
    }, [orderNumber])

    const fetchOrder = async () => {
        try {
            setLoading(true)
            const response = await orderAPI.getOrderByNumber(orderNumber)
            setOrder(response.metadata)
        } catch (error) {
            console.error('Fetch order error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0)
    }

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date))
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Đang tải thông tin đơn hàng...</div>
            </div>
        )
    }

    if (!order) {
        return (
            <Result
                status="404"
                title="Không tìm thấy đơn hàng"
                subTitle="Đơn hàng không tồn tại hoặc đã bị xóa"
                extra={
                    <Button type="primary" onClick={() => navigate('/shop')}>
                        Tiếp tục mua sắm
                    </Button>
                }
            />
        )
    }

    return (
        <div style={{ 
            padding: '16px 12px', 
            maxWidth: 1200, 
            margin: '0 auto',
            minHeight: '80vh'
        }}>
            <Result
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                title="Đặt hàng thành công!"
                subTitle={`Mã đơn hàng: ${order.order_number}`}
                extra={[
                    <Button 
                        key="view-orders" 
                        icon={<EyeOutlined />}
                        onClick={() => navigate('/my-orders')}
                    >
                        Xem đơn hàng
                    </Button>,
                    <Button 
                        key="continue-shopping" 
                        type="primary" 
                        icon={<ShopOutlined />}
                        onClick={() => navigate('/shop')}
                    >
                        Tiếp tục mua sắm
                    </Button>
                ]}
            />

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {/* Order Details */}
                <Col xs={24} lg={16}>
                    <Card 
                        title="Chi tiết đơn hàng" 
                        style={{ marginBottom: 16 }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                                gap: '8px'
                            }}>
                                <Title level={5} style={{ margin: 0, fontSize: '16px' }}>
                                    Mã đơn hàng: {order.order_number}
                                </Title>
                                <Tag color={
                                    order.status === 'pending' ? 'orange' :
                                    order.status === 'confirmed' ? 'blue' :
                                    order.status === 'processing' ? 'purple' :
                                    order.status === 'shipping' ? 'cyan' :
                                    order.status === 'delivered' ? 'green' : 'red'
                                }>
                                    {order.status === 'pending' ? 'Chờ xác nhận' :
                                     order.status === 'confirmed' ? 'Đã xác nhận' :
                                     order.status === 'processing' ? 'Đang xử lý' :
                                     order.status === 'shipping' ? 'Đang giao hàng' :
                                     order.status === 'delivered' ? 'Đã giao hàng' : 'Đã hủy'}
                                </Tag>
                            </div>
                            
                            <Text type="secondary">
                                Đặt hàng lúc: {formatDate(order.createdAt)}
                            </Text>

                            {order.estimated_delivery && (
                                <Text type="secondary">
                                    Dự kiến giao hàng: {formatDate(order.estimated_delivery)}
                                </Text>
                            )}
                        </Space>

                        <Divider />

                        {/* Order Items */}
                        <div>
                            <Title level={5}>Sản phẩm đã đặt</Title>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {order.items.map((item) => (
                                    <div key={item.variant_sku} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: 16,
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 8
                                    }}>
                                        <img 
                                            src={
                                                item.product_images?.thumbnail || 
                                                item.product_image || 
                                                '/placeholder.jpg'
                                            }
                                            alt={item.product_name}
                                            style={{ 
                                                width: 60, 
                                                height: 60, 
                                                objectFit: 'cover', 
                                                borderRadius: 8,
                                                marginRight: 16 
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                            <div style={{ color: '#666', fontSize: 14 }}>
                                                {item.variant_color} - {item.variant_size}
                                            </div>
                                            <div style={{ color: '#999', fontSize: 12 }}>
                                                SKU: {item.variant_sku}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div>Số lượng: {item.quantity}</div>
                                            <div style={{ fontWeight: 500, color: '#1890ff' }}>
                                                {formatPrice(item.price)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Space>
                        </div>
                    </Card>

                    {/* Shipping Address */}
                    <Card title={<><EnvironmentOutlined /> Địa chỉ giao hàng</>}>
                        <Space direction="vertical">
                            <Text strong>{order.shipping_address.name}</Text>
                            <Text><PhoneOutlined /> {order.shipping_address.phone}</Text>
                            <Text>
                                {order.shipping_address.address_line}, {' '}
                                {typeof order.shipping_address.ward === 'object' ? order.shipping_address.ward.name : order.shipping_address.ward}, {' '}
                                {order.shipping_address.district}, {' '}
                                {typeof order.shipping_address.province === 'object' ? order.shipping_address.province.name : order.shipping_address.province}
                            </Text>
                            {order.customer_note && (
                                <div style={{ marginTop: 12 }}>
                                    <Text strong>Ghi chú:</Text>
                                    <div style={{ 
                                        padding: 8, 
                                        backgroundColor: '#f9f9f9', 
                                        borderRadius: 4,
                                        marginTop: 4
                                    }}>
                                        {order.customer_note}
                                    </div>
                                </div>
                            )}
                        </Space>
                    </Card>
                </Col>

                {/* Order Summary */}
                <Col xs={24} lg={8}>
                    <Card 
                        title="Tóm tắt thanh toán" 
                        style={{ 
                            position: 'sticky', 
                            top: 20,
                            marginTop: 0
                        }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Tạm tính:</Text>
                                <Text>{formatPrice(order.subtotal)}</Text>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Phí vận chuyển:</Text>
                                <Text>{formatPrice(order.shipping_fee)}</Text>
                            </div>
                            
                            {order.discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Giảm giá:</Text>
                                    <Text style={{ color: '#52c41a' }}>
                                        -{formatPrice(order.discount)}
                                    </Text>
                                </div>
                            )}
                            
                            <Divider style={{ margin: '12px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Title level={5}>Tổng cộng:</Title>
                                <Title level={5} style={{ color: '#1890ff' }}>
                                    {formatPrice(order.total)}
                                </Title>
                            </div>
                            
                            <div style={{ 
                                padding: 12, 
                                backgroundColor: '#f6ffed', 
                                border: '1px solid #b7eb8f',
                                borderRadius: 6,
                                marginTop: 16,
                                textAlign: 'center'
                            }}>
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                <Text strong>
                                    {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán trực tuyến'}
                                </Text>
                                <br />
                                <Text style={{ fontSize: 12, color: '#666' }}>
                                    Trạng thái: {order.payment_status === 'pending' ? 'Chưa thanh toán' : 'Đã thanh toán'}
                                </Text>
                            </div>
                            
                            {/* ✅ CHỈ hiển thị lưu ý tiền mặt cho COD và chưa thanh toán */}
                            {order.payment_method === 'cod' && order.payment_status !== 'paid' && (
                                <div style={{ 
                                    padding: 12, 
                                    backgroundColor: '#fff7e6', 
                                    border: '1px solid #ffd591',
                                    borderRadius: 6,
                                    marginTop: 12
                                }}>
                                    <Text style={{ fontSize: 12 }}>
                                        💡 <strong>Lưu ý:</strong> Vui lòng chuẩn bị đủ tiền mặt khi nhận hàng. 
                                        Shipper sẽ liên hệ với bạn trước khi giao hàng.
                                    </Text>
                                </div>
                            )}
                            
                            {/* ✅ Thông báo cho đơn đã thanh toán online */}
                            {order.payment_status === 'paid' && order.payment_method !== 'cod' && (
                                <div style={{ 
                                    padding: 12, 
                                    backgroundColor: '#f6ffed', 
                                    border: '1px solid #b7eb8f',
                                    borderRadius: 6,
                                    marginTop: 12
                                }}>
                                    <Text style={{ fontSize: 12, color: '#389e0d' }}>
                                        ✅ <strong>Đã thanh toán:</strong> Đơn hàng sẽ được xử lý và giao trong thời gian sớm nhất.
                                    </Text>
                                </div>
                            )}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default OrderSuccess