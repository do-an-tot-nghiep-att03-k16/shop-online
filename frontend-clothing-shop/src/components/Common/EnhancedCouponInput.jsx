import React, { useState } from 'react'
import { Input, Button, message, Space, Tag } from 'antd'
import { GiftOutlined, CloseOutlined } from '@ant-design/icons'
import couponService from '../../services/couponService'

/**
 * Enhanced CouponInput component that handles private coupon errors
 * and provides better user feedback for coupon security
 */
const EnhancedCouponInput = ({ 
    onCouponApplied, 
    onCouponRemoved, 
    appliedCoupon = null,
    cartTotal = 0,
    cartItems = [],
    disabled = false 
}) => {
    const [couponCode, setCouponCode] = useState('')
    const [loading, setLoading] = useState(false)

    // Extract data needed for coupon validation
    const orderValue = cartTotal
    const productIds = cartItems.map(item => item.product_id)
    const categoryIds = cartItems.map(item => item.category_id).filter(Boolean)

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            message.warning('Vui lòng nhập mã coupon')
            return
        }

        if (cartItems.length === 0) {
            message.warning('Giỏ hàng trống, không thể áp dụng coupon')
            return
        }

        setLoading(true)
        try {
            // Validate coupon first to get proper error messages
            const result = await couponService.validateCoupon({
                code: couponCode.toUpperCase(),
                order_value: orderValue,
                category_ids: categoryIds,
                product_ids: productIds
            })

            // If validation successful, call parent handler
            if (onCouponApplied) {
                await onCouponApplied(couponCode.toUpperCase(), result)
            }

            setCouponCode('')
            message.success('Áp dụng mã giảm giá thành công!')

        } catch (error) {
            console.error('Coupon validation error:', error)
            
            // Handle specific security errors
            if (error.message.includes('Authentication required for private coupon')) {
                message.error('Mã giảm giá này yêu cầu đăng nhập. Vui lòng đăng nhập để sử dụng.')
            } else if (error.message.includes('not available for you')) {
                message.error('Mã giảm giá này không dành cho bạn. Vui lòng kiểm tra lại.')
            } else if (error.message.includes('đã hết hạn')) {
                message.error('Mã giảm giá đã hết hạn sử dụng.')
            } else if (error.message.includes('đã hết lượt sử dụng')) {
                message.error('Mã giảm giá đã hết lượt sử dụng.')
            } else if (error.message.includes('không tồn tại')) {
                message.error('Mã giảm giá không tồn tại. Vui lòng kiểm tra lại.')
            } else if (error.message.includes('Đơn hàng tối thiểu')) {
                message.error(error.message)
            } else {
                message.error(error.message || 'Không thể áp dụng mã giảm giá')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveCoupon = () => {
        if (onCouponRemoved) {
            onCouponRemoved()
        }
        message.success('Đã gỡ mã giảm giá')
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleApplyCoupon()
        }
    }

    // If coupon is already applied, show applied state
    if (appliedCoupon) {
        return (
            <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    Mã giảm giá đã áp dụng:
                </div>
                <Tag 
                    color="green" 
                    style={{ padding: '4px 8px', fontSize: '14px' }}
                    closable
                    onClose={handleRemoveCoupon}
                    icon={<GiftOutlined />}
                >
                    {appliedCoupon.code} 
                    {appliedCoupon.discount && (
                        <span style={{ marginLeft: 4 }}>
                            (-{appliedCoupon.discount.toLocaleString('vi-VN')}₫)
                        </span>
                    )}
                </Tag>
            </div>
        )
    }

    // Input state
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
                Mã giảm giá:
            </div>
            <Space.Compact style={{ width: '100%' }}>
                <Input
                    placeholder="Nhập mã coupon..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onPressEnter={handleKeyPress}
                    disabled={disabled || loading}
                    style={{ textTransform: 'uppercase' }}
                />
                <Button 
                    type="primary" 
                    onClick={handleApplyCoupon}
                    loading={loading}
                    disabled={disabled || !couponCode.trim()}
                    icon={<GiftOutlined />}
                >
                    Áp dụng
                </Button>
            </Space.Compact>
            <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: 4 
            }}>
                Nhập mã để được giảm giá cho đơn hàng
            </div>
        </div>
    )
}

export default EnhancedCouponInput