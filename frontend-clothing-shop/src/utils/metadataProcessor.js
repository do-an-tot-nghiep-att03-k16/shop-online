/**
 * Metadata Processor for Chatbot Widget
 * Xử lý và format metadata từ chatbot responses
 */

// Utility functions
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫'
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
}

const getStatusText = (status) => {
    const statusMap = {
        'pending': 'Đang chờ xử lý',
        'processing': 'Đang xử lý', 
        'shipped': 'Đã giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
    }
    return statusMap[status] || status
}

const getPaymentStatusText = (status) => {
    const statusMap = {
        'pending': 'Chưa thanh toán',
        'paid': 'Đã thanh toán',
        'failed': 'Thanh toán thất bại'
    }
    return statusMap[status] || status
}

const getStatusColor = (status) => {
    const statusColors = {
        'pending': 'orange',
        'processing': 'blue', 
        'shipped': 'cyan',
        'delivered': 'green',
        'cancelled': 'red'
    }
    return statusColors[status] || 'default'
}

const getPaymentMethodText = (method) => {
    const methodMap = {
        'cod': 'Thanh toán khi nhận hàng',
        'bank_transfer': 'Chuyển khoản ngân hàng',
        'credit_card': 'Thẻ tín dụng',
        'vnpay': 'VNPay',
        'momo': 'MoMo'
    }
    return methodMap[method] || method
}

/**
 * Process metadata and return formatted components for chatbot widget
 */
export const processMetadata = (metadata) => {
    
    if (!metadata || typeof metadata !== 'object') {
        return null
    }

    const components = []

    // 🛍️ Products Display
    if (metadata.products && Array.isArray(metadata.products)) {
        components.push({
            type: 'products',
            title: '🛍️ Sản phẩm',
            data: metadata.products.slice(0, 3).map(product => {
                // Calculate total stock from variants
                const totalStock = product.variants?.reduce((sum, variant) => 
                    sum + (variant.stock_quantity || 0), 0) || 0
                
                // Calculate discounted price
                const basePrice = product.base_price || product.price || 0
                const discountPercent = product.discount_percent || product.discount_percentage || 0
                const finalPrice = basePrice - (basePrice * discountPercent / 100)
                
                return {
                    id: product._id,
                    name: product.name,
                    slug: product.slug, // Use actual slug from metadata
                    price: formatPrice(finalPrice),
                    originalPrice: discountPercent > 0 ? formatPrice(basePrice) : null,
                    discount: discountPercent > 0 ? `${discountPercent}%` : null,
                    image: product.image || product.thumbnail || product.images?.[0],
                    variants: product.variants?.length || 0,
                    inStock: totalStock > 0,
                    stockCount: totalStock
                }
            }),
            hasMore: metadata.products.length > 3,
            total: metadata.products.length
        })
    }

    // 🎟️ Coupons Display  
    if (metadata.coupons && Array.isArray(metadata.coupons)) {
        components.push({
            type: 'coupons',
            title: '🎟️ Mã giảm giá',
            data: metadata.coupons.slice(0, 2).map(coupon => ({
                id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                discountText: coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}%` 
                    : formatPrice(coupon.discount_value),
                minOrder: coupon.min_order_value ? formatPrice(coupon.min_order_value) : null,
                maxDiscount: coupon.max_discount ? formatPrice(coupon.max_discount) : null,
                startDate: formatDate(coupon.start_date),
                endDate: formatDate(coupon.end_date),
                remaining: coupon.usage_limit ? (coupon.usage_limit - coupon.used_count) : null,
                isActive: coupon.is_active && new Date(coupon.end_date) > new Date()
            })),
            hasMore: metadata.coupons.length > 2,
            total: metadata.coupons.length
        })
    }

    // 📦 Order Tracking (single order)
    if (metadata.track_order) {
        const order = metadata.track_order
        components.push({
            type: 'track_order',
            title: '📦 Theo dõi đơn hàng',
            data: {
                id: order._id,
                orderNumber: order.order_number,
                status: getStatusText(order.status),
                statusColor: getStatusColor(order.status),
                paymentMethod: getPaymentMethodText(order.payment_method),
                paymentStatus: getPaymentStatusText(order.payment_status),
                total: formatPrice(order.total),
                items: order.items?.slice(0, 2).map((item, index) => ({
                    id: `${item._id}-${index}`,
                    name: item.name,
                    slug: item.slug,
                    quantity: item.quantity,
                    subtotal: formatPrice(item.subtotal)
                })) || [],
                hasMoreItems: order.items?.length > 2
            }
        })
    }

    // 📦 Track Orders Summary (từ template metadata.txt)
    if (metadata.track_orders && !Array.isArray(metadata.track_orders)) {
        const orders = metadata.track_orders
        components.push({
            type: 'orders_summary',
            title: '📊 Tổng quan đơn hàng', 
            data: {
                totalOrders: orders.total_orders,
                totalValue: formatPrice(orders.total_amount),
                period: 'tuần này',
                statusBreakdown: orders.by_status ? Object.entries(orders.by_status).map(([status, data]) => ({
                    status: getStatusText(status),
                    count: data.count,
                    value: formatPrice(data.amount),
                    color: getStatusColor(status)
                })) : []
            }
        })
        console.log('✅ Added orders_summary component for track_orders')
    }

    // 📦 Track Orders Array (nếu có array đơn hàng)
    if (metadata.track_orders && Array.isArray(metadata.track_orders)) {
        components.push({
            type: 'track_orders',
            title: '📦 Danh sách đơn hàng',
            data: metadata.track_orders.slice(0, 5).map(order => ({
                id: order._id,
                orderNumber: order.order_number,
                status: getStatusText(order.status),
                statusColor: getStatusColor(order.status),
                total: formatPrice(order.total),
                createdAt: formatDate(order.created_at)
            })),
            hasMore: metadata.track_orders.length > 5,
            total: metadata.pagination?.total || metadata.track_orders.length
        })
    }

    // 📊 Orders Summary
    if (metadata.orders_summary) {
        const summary = metadata.orders_summary
        components.push({
            type: 'orders_summary', 
            title: '📊 Tổng quan đơn hàng',
            data: {
                totalOrders: summary.total_orders,
                totalValue: formatPrice(summary.total_value),
                period: summary.period || 'tuần này',
                statusBreakdown: summary.status_breakdown ? Object.entries(summary.status_breakdown).map(([status, data]) => ({
                    status: getStatusText(status),
                    count: data.count,
                    value: formatPrice(data.total_value),
                    color: getStatusColor(status)
                })) : []
            }
        })
    }

    // ✅ Cancel Order Success (single)
    if (metadata.cancel_order) {
        const order = metadata.cancel_order
        components.push({
            type: 'cancel_order',
            title: '✅ Hủy đơn hàng',
            data: {
                id: order._id,
                orderNumber: order.order_number,
                status: getStatusText(order.status),
                total: formatPrice(order.total),
                success: true
            }
        })
    }

    // 📋 Bulk Cancel Orders Result
    if (metadata.cancel_orders) {
        const result = metadata.cancel_orders
        components.push({
            type: 'cancel_orders',
            title: '📋 Kết quả hủy nhiều đơn hàng',
            data: {
                totalRequested: result.total_requested,
                successCount: result.successfully_cancelled,
                failedCount: result.failed_to_cancel,
                successOrders: result.success || [],
                failedOrders: result.failed?.map(fail => ({
                    orderId: fail.order_id,
                    error: fail.error
                })) || []
            }
        })
    }
    
    return components.length > 0 ? components : null
}

// Note: Helper functions are defined at the top of file

/**
 * Check if metadata contains displayable content
 */
export const hasDisplayableMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object') {
        return false
    }
    
    // Check for track_orders (both object summary and array)
    const hasTrackOrders = metadata.track_orders && 
        (Array.isArray(metadata.track_orders) ? metadata.track_orders.length > 0 : true)

    return !!(
        (metadata.products && metadata.products.length > 0) ||
        (metadata.coupons && metadata.coupons.length > 0) ||
        metadata.track_order ||
        hasTrackOrders ||
        metadata.orders_summary ||
        metadata.cancel_order ||
        metadata.cancel_orders
    )
}

/**
 * Get summary text for metadata (for collapsed view)
 */
export const getMetadataSummary = (metadata) => {
    if (!metadata) return null

    const summaries = []

    if (metadata.products?.length) {
        summaries.push(`${metadata.products.length} sản phẩm`)
    }

    if (metadata.coupons?.length) {
        summaries.push(`${metadata.coupons.length} mã giảm giá`)
    }

    if (metadata.track_order) {
        summaries.push(`Đơn hàng ${metadata.track_order.order_number}`)
    }

    if (metadata.orders_summary) {
        summaries.push(`${metadata.orders_summary.total_orders} đơn hàng`)
    }

    if (metadata.cancel_order || metadata.cancel_orders) {
        summaries.push('Kết quả hủy đơn')
    }

    return summaries.join(' • ')
}

export default {
    processMetadata,
    hasDisplayableMetadata, 
    getMetadataSummary
}