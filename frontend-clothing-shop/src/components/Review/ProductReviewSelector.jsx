import React, { useState } from 'react'
import {
    Modal,
    List,
    Card,
    Button,
    Space,
    Typography,
    Avatar,
    Tag,
    Row,
    Col,
} from 'antd'
import { StarOutlined } from '@ant-design/icons'
import ReviewButton from './ReviewButton'

const { Text, Title } = Typography

const ProductReviewSelector = ({
    visible,
    onClose,
    order,
    onProductSelect,
    formatPrice,
}) => {
    // 🔧 DEBUG: Check if modal should open
    console.log('🔧 ProductReviewSelector render:', {
        visible,
        order,
        hasOrder: !!order,
        orderItems: order?.items?.length || 0,
        onProductSelect,
        formatPrice,
    })

    React.useEffect(() => {
        if (visible) {
        }
    }, [visible])
    const [selectedProduct, setSelectedProduct] = useState(null)

    const handleSelectProduct = (item) => {
        const productData = {
            productId: item.product_id || item.product?._id,
            productName: item.product_name || item.product?.name,
            orderNumber: order.order_number,
            orderId: order._id || order.id,
            variant: {
                color: item.variant_color,
                size: item.variant_size,
            },
            availableVariants: item.product?.variants || [],
        }
        onProductSelect(productData)
        onClose()
    }

    if (!order) {
        console.log(
            '❌ ProductReviewSelector: No order provided, returning null'
        )
        return null
    }

    if (
        !order.items ||
        !Array.isArray(order.items) ||
        order.items.length === 0
    ) {
        console.log('❌ ProductReviewSelector: Order has no items:', order)
        return (
            <Modal
                title="Không thể đánh giá"
                open={visible}
                onCancel={onClose}
                footer={[
                    <Button key="close" onClick={onClose}>
                        Đóng
                    </Button>,
                ]}
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Text type="secondary">
                        Đơn hàng này không có sản phẩm để đánh giá.
                    </Text>
                </div>
            </Modal>
        )
    }

    return (
        <Modal
            title={
                <div>
                    <Title
                        level={4}
                        style={{
                            margin: 0,
                            fontSize: 'clamp(16px, 4vw, 20px)',
                        }}
                    >
                        Chọn sản phẩm để đánh giá
                    </Title>
                    <Text
                        type="secondary"
                        style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
                    >
                        Đơn hàng #{order.order_number}
                    </Text>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width="95%"
            style={{ maxWidth: 700, top: 20 }}
            destroyOnClose
        >
            <div
                style={{
                    maxHeight: 'calc(70vh - 100px)',
                    overflowY: 'auto',
                    padding: '8px 0',
                    margin: '0 -8px', // Offset card padding on mobile
                }}
            >
                <List
                    dataSource={order.items || []}
                    renderItem={(item, index) => (
                        <Card
                            key={index}
                            style={{
                                marginBottom: 12,
                                cursor: 'pointer',
                                border:
                                    selectedProduct === index
                                        ? '2px solid #1890ff'
                                        : '1px solid #f0f0f0',
                                borderRadius: 8,
                                transition: 'all 0.3s ease',
                            }}
                            hoverable
                            bodyStyle={{ padding: 12 }}
                            onClick={() => setSelectedProduct(index)}
                        >
                            {/* Mobile Layout */}
                            <div
                                className="mobile-layout"
                                style={{
                                    display: 'block',
                                }}
                            >
                                {/* Mobile: Stack layout */}
                                <Row gutter={[8, 8]} align="middle">
                                    {/* Image - smaller on mobile */}
                                    <Col xs={6} sm={4} md={4}>
                                        <Avatar
                                            src={
                                                item.product_images
                                                    ?.thumbnail ||
                                                item.product_images?.medium ||
                                                item.product_image ||
                                                '/placeholder.png'
                                            }
                                            shape="square"
                                            size={{ xs: 48, sm: 56, md: 64 }}
                                            style={{
                                                border: '1px solid #f0f0f0',
                                            }}
                                        />
                                    </Col>

                                    {/* Product info - flexible space */}
                                    <Col xs={12} sm={13} md={12}>
                                        <div>
                                            <Text
                                                strong
                                                style={{
                                                    fontSize:
                                                        'clamp(13px, 3vw, 16px)',
                                                    display: 'block',
                                                    lineHeight: 1.3,
                                                    marginBottom: 4,
                                                }}
                                                ellipsis={{
                                                    tooltip:
                                                        item.product_name ||
                                                        item.product?.name,
                                                }}
                                            >
                                                {item.product_name ||
                                                    item.product?.name}
                                            </Text>

                                            {/* Tags - wrap on mobile */}
                                            <Space
                                                size={[4, 4]}
                                                wrap
                                                style={{ marginBottom: 4 }}
                                            >
                                                {item.variant_color && (
                                                    <Tag
                                                        color="blue"
                                                        style={{
                                                            fontSize:
                                                                'clamp(10px, 2.5vw, 12px)',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {item.variant_color}
                                                    </Tag>
                                                )}
                                                {item.variant_size && (
                                                    <Tag
                                                        color="green"
                                                        style={{
                                                            fontSize:
                                                                'clamp(10px, 2.5vw, 12px)',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {item.variant_size}
                                                    </Tag>
                                                )}
                                            </Space>

                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize:
                                                        'clamp(11px, 2.5vw, 13px)',
                                                }}
                                            >
                                                SL: {item.quantity}
                                            </Text>
                                        </div>
                                    </Col>

                                    {/* Price - mobile: below on small screens */}
                                    <Col xs={24} sm={5} md={6}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: {
                                                    xs: 'space-between',
                                                    sm: 'center',
                                                },
                                                alignItems: 'center',
                                                marginTop: { xs: 8, sm: 0 },
                                            }}
                                        >
                                            <Text
                                                strong
                                                style={{
                                                    fontSize:
                                                        'clamp(14px, 3.5vw, 16px)',
                                                    color: '#1890ff',
                                                }}
                                            >
                                                {formatPrice(
                                                    item.price * item.quantity
                                                )}
                                            </Text>
                                        </div>
                                    </Col>

                                    {/* Review Button */}
                                    <Col xs={24} sm={2} md={2}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: {
                                                    xs: 'center',
                                                    sm: 'flex-end',
                                                },
                                                marginTop: { xs: 8, sm: 0 },
                                            }}
                                        >
                                            <ReviewButton
                                                orderId={order._id || order.id}
                                                productId={
                                                    item.product_id ||
                                                    item.product?._id
                                                }
                                                productName={
                                                    item.product_name ||
                                                    item.product?.name
                                                }
                                                onReviewClick={(reviewData) => {
                                                    handleSelectProduct({
                                                        ...item,
                                                        reviewEligibility:
                                                            reviewData,
                                                    })
                                                }}
                                                buttonProps={{
                                                    shape: 'circle',
                                                    style: {
                                                        width: {
                                                            xs: 36,
                                                            sm: 40,
                                                        },
                                                        height: {
                                                            xs: 36,
                                                            sm: 40,
                                                        },
                                                        minWidth: {
                                                            xs: 36,
                                                            sm: 40,
                                                        },
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                    },
                                                }}
                                                size={{
                                                    xs: 'default',
                                                    sm: 'large',
                                                }}
                                                showTooltip={true}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </Card>
                    )}
                />
            </div>

            <div
                style={{
                    textAlign: 'center',
                    padding: '12px 8px',
                    borderTop: '1px solid #f0f0f0',
                    marginTop: 8,
                    backgroundColor: '#fafafa',
                }}
            >
                <Text
                    type="secondary"
                    style={{
                        fontSize: 'clamp(11px, 2.8vw, 13px)',
                        lineHeight: 1.4,
                    }}
                >
                    💡 Nhấn vào nút ⭐ để bắt đầu đánh giá
                </Text>
            </div>
        </Modal>
    )
}

export default ProductReviewSelector
