import React from 'react'
import { Button, Tooltip, Spin } from 'antd'
import { StarOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useCanReview } from '../../hooks/useCanReview'

/**
 * Smart Review Button Component that checks review eligibility
 * @param {Object} props
 * @param {string} props.orderId - ID của order
 * @param {string} props.productId - ID của product  
 * @param {string} props.productName - Tên sản phẩm (optional, for display)
 * @param {Function} props.onReviewClick - Callback khi click review
 * @param {Object} props.buttonProps - Additional button props
 * @param {boolean} props.showTooltip - Hiển thị tooltip hay không (default: true)
 * @param {string} props.size - Size của button (default: 'default')
 * @param {string} props.type - Type của button (default: 'primary')
 */
const ReviewButton = ({
    orderId,
    productId,
    productName,
    onReviewClick,
    buttonProps = {},
    showTooltip = true,
    size = 'default',
    type = 'primary'
}) => {
    const { canReview, loading, reason, message, data } = useCanReview(orderId, productId)

    // Handle review click
    const handleClick = () => {
        if (canReview && onReviewClick) {
            onReviewClick({
                orderId,
                productId,
                productName: productName || data?.productName,
                orderDate: data?.orderDate,
                variantInfo: data?.variantInfo,
                reviewData: data
            })
        }
    }

    // Get button text based on state
    const getButtonText = () => {
        if (loading) return 'Đang kiểm tra...'
        
        // Check if button is circular (icon-only mode)
        const isCircular = buttonProps.shape === 'circle'
        
        switch (reason) {
            case 'REVIEW_ALREADY_EXISTS':
                return isCircular ? '' : 'Đã đánh giá'
            case 'ORDER_NOT_PAID':
                return isCircular ? '' : 'Chưa thanh toán'
            case 'PRODUCT_NOT_IN_ORDER':
                return isCircular ? '' : 'Không hợp lệ'
            case 'ORDER_NOT_OWNED':
                return isCircular ? '' : 'Không có quyền'
            default:
                if (canReview) return isCircular ? '' : 'Viết đánh giá'
                return isCircular ? '' : 'Không thể đánh giá'
        }
    }

    // Get button icon based on state
    const getButtonIcon = () => {
        if (loading) return <Spin size="small" />
        
        switch (reason) {
            case 'REVIEW_ALREADY_EXISTS':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />
            case 'ORDER_NOT_PAID':
                return <ClockCircleOutlined style={{ color: '#faad14' }} />
            case 'PRODUCT_NOT_IN_ORDER':
            case 'ORDER_NOT_OWNED':
                return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            default:
                return <StarOutlined />
        }
    }

    // Get button type based on state
    const getButtonType = () => {
        // For circular buttons, use different styling
        const isCircular = buttonProps.shape === 'circle'
        
        if (!canReview) {
            switch (reason) {
                case 'REVIEW_ALREADY_EXISTS':
                    return isCircular ? 'text' : 'default'
                case 'ORDER_NOT_PAID':
                    return isCircular ? 'text' : 'dashed'
                default:
                    return 'text'
            }
        }
        return type
    }

    // Get tooltip text
    const getTooltipText = () => {
        if (loading) return 'Đang kiểm tra quyền đánh giá...'
        if (message) return message
        if (canReview) return 'Bấm để viết đánh giá cho sản phẩm này'
        return 'Không thể đánh giá sản phẩm này'
    }

    const button = (
        <Button
            {...buttonProps}
            size={size}
            type={getButtonType()}
            icon={getButtonIcon()}
            loading={loading}
            disabled={!canReview || loading}
            onClick={handleClick}
            style={{
                borderRadius: '6px',
                fontWeight: 500,
                ...buttonProps.style
            }}
        >
            {getButtonText()}
        </Button>
    )

    // Wrap with tooltip if enabled
    if (showTooltip) {
        return (
            <Tooltip title={getTooltipText()} placement="top">
                {button}
            </Tooltip>
        )
    }

    return button
}

/**
 * Compact version for cards/lists
 */
export const CompactReviewButton = ({ orderId, productId, onReviewClick, ...props }) => (
    <ReviewButton
        orderId={orderId}
        productId={productId}
        onReviewClick={onReviewClick}
        size="small"
        buttonProps={{
            style: { borderRadius: '50%', width: 32, height: 32, minWidth: 32 },
            ...props.buttonProps
        }}
        {...props}
    />
)

/**
 * Icon-only version for minimal UI
 */
export const IconReviewButton = ({ orderId, productId, onReviewClick, ...props }) => {
    const { canReview, loading, reason } = useCanReview(orderId, productId)
    
    return (
        <ReviewButton
            orderId={orderId}
            productId={productId}
            onReviewClick={onReviewClick}
            buttonProps={{
                shape: 'circle',
                style: { border: 'none', boxShadow: 'none' },
                ...props.buttonProps
            }}
            {...props}
        >
            {/* Empty children for icon only */}
        </ReviewButton>
    )
}

export default ReviewButton