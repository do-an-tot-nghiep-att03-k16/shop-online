import React from 'react'
import { Card, Tag, Button, Space, Divider } from 'antd'
import { ShoppingOutlined, GiftOutlined, TruckOutlined, BarChartOutlined, CloseOutlined } from '@ant-design/icons'
import { processMetadata } from '../../utils/metadataProcessor'
import './MetadataDisplay.css'

/**
 * MetadataDisplay - Render metadata content in chatbot widget
 * Compact design for small widget space
 */
const MetadataDisplay = ({ metadata, onProductClick, onCouponApply, onViewMore }) => {
    if (!metadata) return null

    const components = processMetadata(metadata)
    if (!components || components.length === 0) return null

    return (
        <div className="metadata-display" style={{ 
            maxWidth: '100%', 
            fontSize: '12px',
            marginTop: '8px'
        }}>
            {components.map((component, index) => (
                <div key={index} style={{ marginBottom: index < components.length - 1 ? '12px' : '0' }}>
                    {renderComponent(component, { onProductClick, onCouponApply, onViewMore })}
                </div>
            ))}
        </div>
    )
}

const renderComponent = (component, handlers) => {
    switch (component.type) {
        case 'products':
            return <ProductsDisplay {...component} {...handlers} />
        case 'coupons':
            return <CouponsDisplay {...component} {...handlers} />
        case 'track_order':
            return <TrackOrderDisplay {...component} {...handlers} />
        case 'track_orders':
            return <TrackOrdersDisplay {...component} {...handlers} />
        case 'orders_summary':
            return <OrdersSummaryDisplay {...component} {...handlers} />
        case 'cancel_order':
            return <CancelOrderDisplay {...component} {...handlers} />
        case 'cancel_orders':
            return <BulkCancelDisplay {...component} {...handlers} />
        default:
            return null
    }
}

// 🛍️ Products Display Component
const ProductsDisplay = ({ title, data, hasMore, total, onProductClick, onViewMore }) => (
    <Card size="small" style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <ShoppingOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            <strong>{title}</strong>
            {hasMore && (
                <Tag size="small" style={{ marginLeft: '4px' }}>+{total - data.length}</Tag>
            )}
        </div>
        
        {data.map(product => (
            <div key={product.id} style={{ 
                padding: '6px 0', 
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer'
            }}
            onClick={() => onProductClick?.(product.slug)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: '12px', lineHeight: '1.4' }}>
                            {product.name}
                        </div>
                        <div style={{ color: '#666', fontSize: '11px', marginBottom: '6px' }}>
                            <span style={{ color: '#ff4d4f', fontWeight: '500' }}>{product.price}</span>
                            {product.originalPrice && (
                                <span style={{ textDecoration: 'line-through', marginLeft: '4px' }}>
                                    {product.originalPrice}
                                </span>
                            )}
                            {product.discount && (
                                <Tag color="red" size="small" style={{ marginLeft: '4px' }}>
                                    -{product.discount}
                                </Tag>
                            )}
                        </div>
                        <Button 
                            type="primary" 
                            size="small" 
                            style={{ fontSize: '10px', height: '22px', padding: '0 8px' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onProductClick?.(product.slug);
                            }}
                        >
                            Xem chi tiết
                        </Button>
                    </div>
                    {product.image && (
                        <div style={{ width: '32px', height: '32px', marginLeft: '8px' }}>
                            <img 
                                src={product.image} 
                                alt={product.name}
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                    )}
                </div>
                {!product.inStock && (
                    <Tag color="default" size="small" style={{ fontSize: '10px', marginTop: '2px' }}>
                        Hết hàng
                    </Tag>
                )}
            </div>
        ))}
        
        {hasMore && (
            <Button 
                type="link" 
                size="small" 
                style={{ padding: '4px 0', fontSize: '11px' }}
                onClick={() => onViewMore?.('products')}
            >
                Xem thêm {total - data.length} sản phẩm →
            </Button>
        )}
    </Card>
)

// 🎟️ Coupons Display Component
const CouponsDisplay = ({ title, data, hasMore, total, onCouponApply, onViewMore }) => (
    <Card size="small" style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <GiftOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
            <strong>{title}</strong>
            {hasMore && (
                <Tag size="small" style={{ marginLeft: '4px' }}>+{total - data.length}</Tag>
            )}
        </div>
        
        {data.map(coupon => (
            <div key={coupon.id} style={{ 
                padding: '8px',
                border: '1px dashed #d9d9d9',
                borderRadius: '6px',
                marginBottom: '8px',
                background: coupon.isActive ? '#f6ffed' : '#f5f5f5'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <code style={{ 
                        background: '#f0f0f0', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                    }}>
                        {coupon.code}
                    </code>
                    <Tag color={coupon.isActive ? 'green' : 'default'} size="small">
                        {coupon.discountText}
                    </Tag>
                </div>
                
                <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                    {coupon.description}
                </div>
                
                <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    {coupon.minOrder && (
                        <span>Tối thiểu {coupon.minOrder} • </span>
                    )}
                    {coupon.maxDiscount && (
                        <span>Tối đa {coupon.maxDiscount} • </span>
                    )}
                    <span>HSD: {coupon.endDate}</span>
                    {coupon.remaining && (
                        <span> • Còn {coupon.remaining} lượt</span>
                    )}
                </div>
                
                {coupon.isActive && (
                    <Button 
                        type="primary" 
                        size="small" 
                        style={{ marginTop: '6px', fontSize: '11px', height: '24px' }}
                        onClick={() => onCouponApply?.(coupon.code)}
                    >
                        Sử dụng ngay
                    </Button>
                )}
            </div>
        ))}
        
        {hasMore && (
            <Button 
                type="link" 
                size="small" 
                style={{ padding: '4px 0', fontSize: '11px' }}
                onClick={() => onViewMore?.('coupons')}
            >
                Xem thêm {total - data.length} mã giảm giá →
            </Button>
        )}
    </Card>
)

// 📦 Track Order Display Component
const TrackOrderDisplay = ({ title, data, onViewMore }) => (
    <Card size="small" style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <TruckOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            <strong>{title}</strong>
        </div>
        
        <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: '500' }}>#{data.orderNumber}</span>
                <Tag color={data.statusColor} size="small">{data.status}</Tag>
            </div>
            
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                <div>Tổng tiền: <strong style={{ color: '#ff4d4f' }}>{data.total}</strong></div>
                <div>Thanh toán: {data.paymentMethod} • {data.paymentStatus}</div>
            </div>
            
            {data.items.length > 0 && (
                <div style={{ fontSize: '11px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>Sản phẩm:</div>
                    {data.items.map((item, index) => (
                        <div key={`${item.id}-${index}`} style={{ padding: '2px 0', color: '#666' }}>
                            • {item.name} x{item.quantity} - {item.subtotal}
                        </div>
                    ))}
                    {data.hasMoreItems && (
                        <div style={{ color: '#999', fontStyle: 'italic' }}>và nhiều sản phẩm khác...</div>
                    )}
                </div>
            )}
        </div>
    </Card>
)

// 📊 Orders Summary Display Component
const OrdersSummaryDisplay = ({ title, data, onViewMore }) => (
    <Card size="small" style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <BarChartOutlined style={{ color: '#722ed1', marginRight: '4px' }} />
            <strong>{title}</strong>
        </div>
        
        <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Tổng đơn hàng ({data.period}):</span>
                <strong>{data.totalOrders}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Tổng giá trị:</span>
                <strong style={{ color: '#ff4d4f' }}>{data.totalValue}</strong>
            </div>
            
            {data.statusBreakdown.length > 0 && (
                <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>Phân bố trạng thái:</div>
                    {data.statusBreakdown.map(status => (
                        <div key={status.status} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '11px',
                            padding: '2px 0'
                        }}>
                            <span>
                                <Tag color={status.color} size="small">{status.status}</Tag>
                                {status.count} đơn
                            </span>
                            <span>{status.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </Card>
)

// 📦 Track Orders Display Component (multiple)
const TrackOrdersDisplay = ({ title, data, hasMore, total, onViewMore }) => (
    <Card size="small" style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <TruckOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            <strong>{title}</strong>
            {hasMore && (
                <Tag size="small" style={{ marginLeft: '4px' }}>+{total - data.length}</Tag>
            )}
        </div>
        
        {data.map(order => (
            <div key={order.id} style={{ 
                padding: '8px 0', 
                borderBottom: '1px solid #f0f0f0',
                marginBottom: '6px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '500', fontSize: '12px' }}>#{order.orderNumber}</span>
                    <div style={{ backgroundColor: order.statusColor, color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>
                        {order.status}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                    <span>{order.createdAt}</span>
                    <span style={{ fontWeight: '600', color: '#ff4d4f' }}>{order.total}</span>
                </div>
            </div>
        ))}
        
        {hasMore && (
            <Button 
                type="link" 
                size="small" 
                style={{ padding: '4px 0', fontSize: '11px' }}
                onClick={() => onViewMore?.('orders')}
            >
                Xem thêm {total - data.length} đơn hàng →
            </Button>
        )}
    </Card>
)

// ✅ Cancel Order Display Component
const CancelOrderDisplay = ({ title, data }) => (
    <Card size="small" style={{ fontSize: '12px', borderColor: '#52c41a' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <CloseOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
            <strong style={{ color: '#52c41a' }}>{title}</strong>
        </div>
        
        <div style={{ padding: '8px 0' }}>
            <div>✅ Đơn hàng <strong>#{data.orderNumber}</strong> đã được hủy thành công</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Tổng tiền: {data.total}
            </div>
        </div>
    </Card>
)

// 📋 Bulk Cancel Display Component
const BulkCancelDisplay = ({ title, data }) => (
    <Card size="small" style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <CloseOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            <strong>{title}</strong>
        </div>
        
        <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: '6px' }}>
                <Tag color="green">{data.successCount} thành công</Tag>
                {data.failedCount > 0 && (
                    <Tag color="red">{data.failedCount} thất bại</Tag>
                )}
            </div>
            
            {data.failedOrders.length > 0 && (
                <div style={{ fontSize: '11px', color: '#ff4d4f' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>Đơn hàng không thể hủy:</div>
                    {data.failedOrders.slice(0, 2).map(fail => (
                        <div key={fail.orderId}>• #{fail.orderId}: {fail.error}</div>
                    ))}
                    {data.failedOrders.length > 2 && (
                        <div style={{ fontStyle: 'italic' }}>và {data.failedOrders.length - 2} đơn khác...</div>
                    )}
                </div>
            )}
        </div>
    </Card>
)

export default MetadataDisplay