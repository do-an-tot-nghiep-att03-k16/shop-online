import { useState } from 'react'
import { Input, Button, Space, Alert, Typography } from 'antd'
import { GiftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useApplyCoupon, useRemoveCoupon, useCartSelectors } from '../../hooks/useCart'

const { Text } = Typography

const CouponInput = () => {
    const [couponCode, setCouponCode] = useState('')
    const [error, setError] = useState(null)
    
    const { appliedCoupon, subtotal } = useCartSelectors()
    const applyCoupon = useApplyCoupon()
    const removeCoupon = useRemoveCoupon()

    const handleApply = () => {
        if (!couponCode.trim()) {
            setError('Vui lòng nhập mã coupon')
            return
        }

        setError(null)
        applyCoupon.mutate(couponCode.toUpperCase(), {
            onSuccess: () => {
                setCouponCode('')
            },
            onError: (err) => {
                setError(err?.message || 'Mã coupon không hợp lệ')
            }
        })
    }

    const handleRemove = () => {
        removeCoupon.mutate(null, {
            onError: (err) => {
                setError(err?.message || 'Không thể hủy mã giảm giá')
            }
        })
    }

    const handleChange = (e) => {
        setCouponCode(e.target.value.toUpperCase())
        setError(null)
    }

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
                <Text strong>
                    <GiftOutlined style={{ marginRight: '8px', color: '#b77574' }} />
                    Mã giảm giá
                </Text>
            </div>
            
            {!appliedCoupon ? (
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        placeholder="Nhập mã coupon..."
                        value={couponCode}
                        onChange={handleChange}
                        onPressEnter={handleApply}
                        style={{ textTransform: 'uppercase' }}
                        status={error ? 'error' : ''}
                    />
                    <Button
                        type="primary"
                        onClick={handleApply}
                        loading={applyCoupon.isPending}
                        style={{
                            background: 'linear-gradient(45deg, #b77574, #c48783)',
                            border: 'none',
                        }}
                    >
                        Áp dụng
                    </Button>
                </Space.Compact>
            ) : (
                <div 
                    style={{ 
                        border: '1px solid #52c41a', 
                        borderRadius: '6px', 
                        padding: '12px',
                        background: '#f6ffed',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <div>
                            <Text strong style={{ color: '#52c41a' }}>
                                {appliedCoupon?.code}
                            </Text>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                {appliedCoupon?.coupon_id?.discount_type === 'percentage' 
                                    ? `Giảm ${appliedCoupon?.coupon_id?.discount_value}%`
                                    : `Giảm ${appliedCoupon?.coupon_id?.discount_value?.toLocaleString('vi-VN')}₫`
                                }
                            </div>
                        </div>
                    </Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={handleRemove}
                        loading={removeCoupon.isPending}
                        style={{ color: '#999' }}
                    >
                        Bỏ
                    </Button>
                </div>
            )}

            {error && (
                <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginTop: '8px' }}
                />
            )}

            {appliedCoupon && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#52c41a' }}>
                    <Text type="success">
                        ✓ Mã giảm giá đã được áp dụng thành công
                    </Text>
                </div>
            )}
        </div>
    )
}

export default CouponInput