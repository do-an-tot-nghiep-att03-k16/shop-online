import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Space,
    Typography,
    Row,
    Col,
    Empty,
    message,
    Spin,
    Pagination,
    Select,
    Input,
    Avatar,
    Badge,
    Drawer,
    Steps,
    Progress,
    Tooltip,
    List,
    Tag,
    Tabs,
    Popconfirm,
} from 'antd'
import {
    EyeOutlined,
    ShoppingOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    TruckOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    UndoOutlined,
    FileTextOutlined,
    CopyOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    DollarOutlined,
    CalendarOutlined,
    FilterOutlined,
    SearchOutlined,
    StarOutlined,
} from '@ant-design/icons'
import { orderAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useState as useReviewState } from 'react'
import {
    ReviewForm,
    ReviewButton,
    CompactReviewButton,
} from '../components/Review'
import ProductReviewSelector from '../components/Review/ProductReviewSelector'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Search } = Input
const { Step } = Steps

// Enhanced Status configurations with gradients
const ORDER_STATUS = {
    pending: {
        color: 'gold',
        icon: <ClockCircleOutlined />,
        text: 'Chờ xử lý',
        gradient: 'linear-gradient(135deg, #ffd700, #ffed4a)',
        bgColor: '#fff7e6',
    },
    confirmed: {
        color: 'blue',
        icon: <CheckCircleOutlined />,
        text: 'Đã xác nhận',
        gradient: 'linear-gradient(135deg, #1890ff, #40a9ff)',
        bgColor: '#e6f7ff',
    },
    processing: {
        color: 'cyan',
        icon: <ShoppingOutlined />,
        text: 'Đang xử lý',
        gradient: 'linear-gradient(135deg, #13c2c2, #36cfc9)',
        bgColor: '#e6fffb',
    },
    shipping: {
        color: 'purple',
        icon: <TruckOutlined />,
        text: 'Đang giao hàng',
        gradient: 'linear-gradient(135deg, #722ed1, #9254de)',
        bgColor: '#f9f0ff',
    },
    delivered: {
        color: 'green',
        icon: <CheckCircleOutlined />,
        text: 'Đã giao hàng',
        gradient: 'linear-gradient(135deg, #52c41a, #73d13d)',
        bgColor: '#f6ffed',
    },
    cancelled: {
        color: 'red',
        icon: <CloseCircleOutlined />,
        text: 'Đã hủy',
        gradient: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
        bgColor: '#fff2f0',
    },
    returned: {
        color: 'orange',
        icon: <UndoOutlined />,
        text: 'Đã trả hàng',
        gradient: 'linear-gradient(135deg, #fa8c16, #ffa940)',
        bgColor: '#fff7e6',
    },
}

const PAYMENT_STATUS = {
    pending: { color: 'gold', text: 'Chưa thanh toán', bgColor: '#fff7e6' },
    paid: { color: 'green', text: 'Đã thanh toán', bgColor: '#f6ffed' },
    failed: { color: 'red', text: 'Thanh toán thất bại', bgColor: '#fff2f0' },
    refunded: { color: 'orange', text: 'Đã hoàn tiền', bgColor: '#fff7e6' },
}

// Responsive Order Card Component
const OrderCard = ({
    order,
    onViewOrder,
    formatPrice,
    onCancelOrder,
    cancellingOrders = {},
    onReviewProduct,
}) => {
    // 🔧 DEBUG: Check if onReviewProduct prop is received
    // console.log(`🔧 OrderCard received props for ${order.order_number}:`, {
    //     onReviewProduct: onReviewProduct,
    //     hasFunc: !!onReviewProduct,
    //     funcType: typeof onReviewProduct,
    // })

    const statusConfig = ORDER_STATUS[order.status]
    const paymentConfig = PAYMENT_STATUS[order.payment_status]

    const getOrderProgress = () => {
        const statusOrder = [
            'pending',
            'confirmed',
            'preparing',
            'shipping',
            'delivered',
        ]
        const currentIndex = statusOrder.indexOf(order.status)
        return currentIndex >= 0
            ? ((currentIndex + 1) / statusOrder.length) * 100
            : 0
    }

    return (
        <Card
            hoverable
            className="order-card"
            style={{
                marginBottom: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0',
                overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
        >
            {/* Header with gradient background */}
            <div
                style={{
                    background: statusConfig?.gradient || '#f5f5f5',
                    color: 'white',
                    padding: '12px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Space>
                    {statusConfig?.icon}
                    <Text strong style={{ color: 'white' }}>
                        #{order.order_number}
                    </Text>
                </Space>
                <Badge
                    count={order.items?.length}
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                    showZero
                />
            </div>

            {/* Progress bar for order status */}
            {!['cancelled', 'returned'].includes(order.status) && (
                <div style={{ padding: '8px 20px 0' }}>
                    <Progress
                        percent={getOrderProgress()}
                        showInfo={false}
                        strokeColor={statusConfig?.gradient}
                        size="small"
                    />
                </div>
            )}

            <div style={{ padding: 20 }}>
                {/* Product images preview */}
                <div style={{ marginBottom: 16 }}>
                    <Avatar.Group maxCount={3} size="large">
                        {order.items?.slice(0, 3).map((item, index) => (
                            <Avatar
                                key={index}
                                src={
                                    item.product_images?.thumbnail ||
                                    item.product_images?.medium ||
                                    item.product_image ||
                                    '/placeholder.png'
                                }
                                shape="square"
                                size={48}
                                style={{ border: '2px solid #f0f0f0' }}
                            />
                        ))}
                    </Avatar.Group>
                    {order.items?.length > 3 && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                            +{order.items.length - 3} sản phẩm khác
                        </Text>
                    )}
                </div>

                {/* Order info */}
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12}>
                        <Space direction="vertical" size={4}>
                            <Space>
                                <DollarOutlined style={{ color: '#1890ff' }} />
                                <Text
                                    strong
                                    style={{ color: '#1890ff', fontSize: 16 }}
                                >
                                    {formatPrice(order.total)}
                                </Text>
                            </Space>
                            <Space>
                                <CalendarOutlined
                                    style={{ color: '#8c8c8c' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {dayjs(order.createdAt).format(
                                        'DD/MM/YYYY HH:mm'
                                    )}
                                </Text>
                            </Space>
                        </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: 8 }}>
                                <Badge
                                    color={statusConfig?.color}
                                    text={statusConfig?.text}
                                    style={{
                                        backgroundColor: statusConfig?.bgColor,
                                        padding: '4px 8px',
                                        borderRadius: 12,
                                        fontSize: 11,
                                    }}
                                />
                            </div>
                            <div>
                                <Badge
                                    color={paymentConfig?.color}
                                    text={paymentConfig?.text}
                                    style={{
                                        backgroundColor: paymentConfig?.bgColor,
                                        padding: '4px 8px',
                                        borderRadius: 12,
                                        fontSize: 11,
                                    }}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Action buttons */}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Space size="middle" wrap>
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => onViewOrder(order._id || order.id)}
                            style={{
                                borderRadius: 20,
                                paddingLeft: 24,
                                paddingRight: 24,
                            }}
                        >
                            Xem chi tiết
                        </Button>

                        {/* Button hủy đơn - chỉ hiện khi status là pending hoặc confirmed */}
                        {['pending', 'confirmed'].includes(order.status) &&
                            onCancelOrder && (
                                <Popconfirm
                                    title="Hủy đơn hàng?"
                                    description="Bạn có chắc chắn muốn hủy đơn hàng này?"
                                    onConfirm={() =>
                                        onCancelOrder(order._id || order.id)
                                    }
                                    okText="Hủy đơn"
                                    cancelText="Không"
                                    okType="danger"
                                >
                                    <Button
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        loading={
                                            cancellingOrders[
                                                order._id || order.id
                                            ]
                                        }
                                        style={{
                                            borderRadius: 20,
                                            paddingLeft: 24,
                                            paddingRight: 24,
                                        }}
                                    >
                                        Hủy đơn
                                    </Button>
                                </Popconfirm>
                            )}

                        {/* Button đánh giá - hiện khi status là delivered/completed và payment_status là paid */}
                        {(() => {
                            const statusOk = [
                                'delivered',
                                'completed',
                            ].includes(order.status)
                            const paymentOk = order.payment_status === 'paid'
                            const hasReviewFunc = !!onReviewProduct
                            const shouldShow =
                                statusOk && paymentOk && hasReviewFunc

                            // Debug logs removed

                            return shouldShow
                        })() && (
                            <Button
                                type="default"
                                icon={<StarOutlined />}
                                onClick={() => {
                                    // 🔧 DEBUG: Check button click
                                    // console.log(
                                    //     '🔧 Review button clicked for order:',
                                    //     order.order_number
                                    // )
                                    // console.log(
                                    //     '🔧 Calling onReviewProduct with order:',
                                    //     order
                                    // )

                                    // Always show product selection modal first
                                    onReviewProduct(order)
                                }}
                                style={{
                                    borderRadius: 20,
                                    paddingLeft: 24,
                                    paddingRight: 24,
                                    borderColor: '#faad14',
                                    color: '#faad14',
                                }}
                            >
                                Đánh giá
                            </Button>
                        )}
                    </Space>
                </div>
            </div>
        </Card>
    )
}

// Enhanced Stats Card
const StatsCard = ({ title, value, icon, color, formatter, suffix }) => (
    <Card
        style={{
            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
            border: `1px solid ${color}30`,
            borderRadius: 12,
            height: '100%',
        }}
        bodyStyle={{ padding: '20px 24px' }}
    >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <div>
                <Text
                    style={{ color: '#8c8c8c', fontSize: 14, display: 'block' }}
                >
                    {title}
                </Text>
                <Text
                    strong
                    style={{ color: color, fontSize: 24, display: 'block' }}
                >
                    {formatter ? formatter(value) : `${value}${suffix || ''}`}
                </Text>
            </div>
            <div
                style={{
                    fontSize: 28,
                    color: color,
                    background: `${color}15`,
                    padding: 12,
                    borderRadius: 12,
                }}
            >
                {icon}
            </div>
        </div>
    </Card>
)

const MyOrders = () => {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
    const [orderStats, setOrderStats] = useState(null)
    const [viewMode, setViewMode] = useState('cards')
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [selectedProductForReview, setSelectedProductForReview] =
        useState(null)
    const [productSelectorModalOpen, setProductSelectorModalOpen] =
        useState(false)
    const [selectedOrderForReview, setSelectedOrderForReview] = useState(null)

    // 🔧 DEBUG: Track modal state changes
    useEffect(() => {}, [productSelectorModalOpen])

    useEffect(() => {}, [selectedOrderForReview])
    const [cancellingOrders, setCancellingOrders] = useState({})

    const [activeTab, setActiveTab] = useState('active')
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        limit: 9,
    })
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 9,
        total: 0,
    })

    useEffect(() => {
        fetchOrders(activeTab)
    }, [filters, activeTab])

    useEffect(() => {
        fetchOrderStats()
    }, []) // Fetch stats once on component mount

    const fetchOrders = async (tabKey = activeTab) => {
        try {
            setLoading(true)

            // Sử dụng backend filter với multiple status
            let statusFilter = undefined
            if (tabKey === 'active') {
                statusFilter = 'pending,confirmed,processing,shipping' // Đang hoạt động
            } else if (tabKey === 'completed') {
                statusFilter = 'delivered' // Đã hoàn thành
            } else if (tabKey === 'cancelled') {
                statusFilter = 'cancelled,returned' // Đã hủy/hoàn trả
            }

            const params = {
                page: filters.page,
                limit: filters.limit,
                status: statusFilter,
                search: filters.search || undefined,
            }

            const response = await orderAPI.getMyOrders(params)

            // Handle different response structures
            const responseData = response.data || response
            const metadata = responseData.metadata || responseData

            let orderList = []
            let paginationData = {}

            if (Array.isArray(metadata)) {
                // If metadata is directly an array of orders (old format)
                orderList = metadata
                paginationData = {
                    current: filters.page,
                    pageSize: filters.limit,
                    total: metadata.length,
                }
            } else if (metadata && typeof metadata === 'object') {
                // If metadata is an object with orders and pagination (correct format)
                orderList = metadata.orders || metadata.data || []
                paginationData = {
                    current: metadata.pagination?.page || filters.page,
                    pageSize: metadata.pagination?.limit || filters.limit,
                    total:
                        metadata.pagination?.total ||
                        metadata.pagination?.totalCount ||
                        orderList.length,
                    totalPages: metadata.pagination?.totalPages,
                }
            }

            // Backend đã filter theo status - không cần client-side filtering

            setOrders(orderList)
            setPagination(paginationData)
        } catch (error) {
            console.error('Error fetching orders:', error)
            message.error('Không thể tải danh sách đơn hàng')
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const fetchOrderStats = async () => {
        try {
            const response = await orderAPI.getMyOrderStats()

            // Handle different response structures
            const responseData = response.data || response
            const metadata = responseData.metadata || responseData

            // Use API stats if available and valid
            if (
                metadata &&
                typeof metadata === 'object' &&
                metadata.total_orders !== undefined
            ) {
                setOrderStats(metadata)
            } else {
                // If API stats not available, fetch all orders to calculate
                await fetchAllOrdersForStats()
            }
        } catch (error) {
            console.error('Error fetching order stats:', error)
            // Try to fetch all orders for stats calculation
            await fetchAllOrdersForStats()
        }
    }

    const fetchAllOrdersForStats = async () => {
        try {
            // Set default stats - let backend handle this
            setOrderStats({
                total_orders: 0,
                completed_orders: 0,
                pending_orders: 0,
                paid_orders: 0,
                total_spent: 0,
            })
        } catch (error) {
            console.error('Error in stats fallback:', error)
            // Set default stats
            setOrderStats({
                total_orders: 0,
                completed_orders: 0,
                pending_orders: 0,
                paid_orders: 0,
                total_spent: 0,
            })
        }
    }

    const calculateStatsFromOrders = (ordersList) => {
        if (!ordersList || ordersList.length === 0) {
            return {
                total_orders: 0,
                completed_orders: 0, // Đã hoàn thành và thanh toán
                pending_orders: 0, // Đang xử lý
                paid_orders: 0, // Đã thanh toán
                total_spent: 0, // Tổng chi tiêu (đã thanh toán)
            }
        }

        const stats = ordersList.reduce(
            (acc, order) => {
                // Tổng đơn hàng - tất cả orders đã đặt
                acc.total_orders += 1

                // Đã hoàn thành - orders delivered và paid
                if (
                    order.status === 'delivered' &&
                    order.payment_status === 'paid'
                ) {
                    acc.completed_orders += 1
                }

                // Đang xử lý - orders chưa delivered (pending, confirmed, processing, shipping)
                if (
                    ['pending', 'confirmed', 'processing', 'shipping'].includes(
                        order.status
                    )
                ) {
                    acc.pending_orders += 1
                }

                // Đã thanh toán - payment_status = 'paid'
                if (order.payment_status === 'paid') {
                    acc.paid_orders += 1
                    // Tổng chi tiêu - chỉ tính orders đã thanh toán
                    acc.total_spent += order.total || order.total_amount || 0
                }

                return acc
            },
            {
                total_orders: 0,
                completed_orders: 0,
                pending_orders: 0,
                paid_orders: 0,
                total_spent: 0,
            }
        )

        return stats
    }

    // Handle cancel order
    const handleCancelOrder = async (orderId) => {
        try {
            setCancellingOrders((prev) => ({ ...prev, [orderId]: true }))

            await orderAPI.cancelOrder(orderId, {
                reason: 'Khách hàng yêu cầu hủy đơn',
            })

            message.success('Hủy đơn hàng thành công!')
            await fetchOrders() // Refresh danh sách đơn hàng
        } catch (error) {
            console.error('Error cancelling order:', error)
            message.error(
                error.response?.data?.message || 'Không thể hủy đơn hàng'
            )
        } finally {
            setCancellingOrders((prev) => ({ ...prev, [orderId]: false }))
        }
    }

    const handleViewOrder = async (orderId) => {
        try {
            const response = await orderAPI.getOrderById(orderId)

            // Handle different response structures
            const responseData = response.data || response
            const metadata = responseData.metadata || responseData

            setSelectedOrder(metadata)
            setDetailDrawerOpen(true)
        } catch (error) {
            console.error('Error fetching order details:', error)
            message.error('Không thể tải chi tiết đơn hàng')
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    const handleFilterChange = (key, value) => {
        const newFilters = {
            ...filters,
            [key]: value,
            page: 1, // Reset về trang 1 khi filter
        }
        setFilters(newFilters)
        // fetchOrders will be called automatically by useEffect
    }

    const handlePageChange = (page, pageSize) => {
        setFilters((prev) => ({
            ...prev,
            page,
            limit: pageSize,
        }))
    }

    const handleReviewProduct = (productData) => {
        // 🔧 DEBUG: Check what data is received

        // If it's an order (from button click), show product selector
        if (
            productData &&
            productData.items &&
            Array.isArray(productData.items)
        ) {
            setSelectedOrderForReview(productData)

            // Force state update with setTimeout to ensure React batching doesn't interfere
            setTimeout(() => {
                setProductSelectorModalOpen(true)
            }, 0)
        } else {
            // If it's product data (from selector), show review form
            setSelectedProductForReview(productData)
            setReviewModalOpen(true)
        }
    }

    // No client-side filtering - backend handles this via status filter
    // All orders from API are already filtered by status if filter is applied
    const allOrders = orders

    // For display in tabs, we'll use backend filtering by changing the status filter
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'shipping']
    const completedStatuses = ['delivered', 'completed']
    const cancelledStatuses = ['cancelled', 'returned']

    // Show loading state if no data yet
    if (loading && orders.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                    background: '#f5f5f5',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <Spin size="large" />
                    <Title level={4} style={{ marginTop: 16, color: '#666' }}>
                        Đang tải đơn hàng của bạn...
                    </Title>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#f5f5f5',
                padding: '24px',
            }}
        >
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Hero Section */}
                <div
                    style={{
                        textAlign: 'center',
                        padding: '32px 0',
                        background: 'white',
                        borderRadius: 16,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        marginBottom: 24,
                    }}
                >
                    <Title
                        level={1}
                        style={{
                            color: '#333',
                            marginBottom: 8,
                            fontSize: 42,
                            fontWeight: 600,
                        }}
                    >
                        Đơn hàng của tôi
                    </Title>
                    <Paragraph
                        style={{
                            color: '#666',
                            fontSize: 16,
                            marginBottom: 0,
                        }}
                    >
                        Theo dõi và quản lý tất cả đơn hàng của bạn
                    </Paragraph>
                </div>

                {/* Enhanced Stats Section */}
                {orderStats && (
                    <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                        <Col xs={12} md={6}>
                            <StatsCard
                                title="Tổng đơn hàng"
                                value={orderStats.total_orders}
                                icon={<ShoppingOutlined />}
                                color="#1890ff"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <StatsCard
                                title="Đã thanh toán"
                                value={orderStats.paid_orders}
                                icon={<CheckCircleOutlined />}
                                color="#52c41a"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <StatsCard
                                title="Đang xử lý"
                                value={orderStats.pending_orders}
                                icon={<ClockCircleOutlined />}
                                color="#faad14"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <StatsCard
                                title="Tổng chi tiêu"
                                value={orderStats.total_spent}
                                icon={<DollarOutlined />}
                                color="#722ed1"
                                formatter={formatPrice}
                            />
                        </Col>
                    </Row>
                )}

                {/* Enhanced Filter Section */}
                <Card
                    style={{
                        marginBottom: 24,
                        borderRadius: 16,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: 'none',
                    }}
                    bodyStyle={{ padding: '24px 32px' }}
                >
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={8}>
                            <Search
                                placeholder="🔍 Tìm kiếm theo mã đơn hàng"
                                value={filters.search}
                                onChange={(e) =>
                                    handleFilterChange('search', e.target.value)
                                }
                                style={{ width: '100%' }}
                                size="large"
                                allowClear
                            />
                        </Col>
                        <Col xs={24} md={4}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    setFilters({
                                        search: '',
                                        page: 1,
                                        limit: 9,
                                    })
                                    fetchOrders(activeTab)
                                }}
                                size="large"
                                style={{ width: '100%' }}
                            >
                                Làm mới
                            </Button>
                        </Col>
                        <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                            <Button.Group size="large">
                                <Tooltip title="Xem dạng thẻ">
                                    <Button
                                        type={
                                            viewMode === 'cards'
                                                ? 'primary'
                                                : 'default'
                                        }
                                        icon={<ShoppingOutlined />}
                                        onClick={() => setViewMode('cards')}
                                    />
                                </Tooltip>
                                <Tooltip title="Xem dạng danh sách">
                                    <Button
                                        type={
                                            viewMode === 'list'
                                                ? 'primary'
                                                : 'default'
                                        }
                                        icon={<FileTextOutlined />}
                                        onClick={() => setViewMode('list')}
                                    />
                                </Tooltip>
                            </Button.Group>
                        </Col>
                    </Row>
                </Card>

                {/* Orders Display with Tabs */}
                <Card
                    style={{
                        borderRadius: 16,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: 'none',
                        minHeight: 400,
                    }}
                    bodyStyle={{ padding: 0 }}
                    loading={loading}
                >
                    <Tabs
                        activeKey={activeTab}
                        defaultActiveKey="active"
                        size="large"
                        style={{ padding: '0 32px' }}
                        onChange={(key) => {
                            setActiveTab(key)
                            setFilters((prev) => ({ ...prev, page: 1 })) // Reset to page 1 when changing tabs
                        }}
                        items={[
                            {
                                key: 'active',
                                label: (
                                    <Space>
                                        <ClockCircleOutlined />
                                        <span>Đang hoạt động</span>
                                        <Badge
                                            count={
                                                orderStats?.pending_orders || 0
                                            }
                                            showZero
                                            style={{
                                                backgroundColor: '#faad14',
                                            }}
                                        />
                                    </Space>
                                ),
                                children: (
                                    <div style={{ padding: '0 0 32px 0' }}>
                                        {allOrders.length === 0 ? (
                                            <Empty
                                                description={
                                                    <div
                                                        style={{
                                                            textAlign: 'center',
                                                            padding: 40,
                                                        }}
                                                    >
                                                        <ShoppingOutlined
                                                            style={{
                                                                fontSize: 64,
                                                                color: '#d9d9d9',
                                                                marginBottom: 16,
                                                            }}
                                                        />
                                                        <Title
                                                            level={4}
                                                            style={{
                                                                color: '#8c8c8c',
                                                            }}
                                                        >
                                                            Chưa có đơn hàng nào
                                                        </Title>
                                                        <Paragraph
                                                            style={{
                                                                color: '#8c8c8c',
                                                            }}
                                                        >
                                                            Hãy bắt đầu mua sắm
                                                            để tạo đơn hàng đầu
                                                            tiên của bạn!
                                                        </Paragraph>
                                                        <Button
                                                            type="primary"
                                                            size="large"
                                                            style={{
                                                                marginTop: 16,
                                                            }}
                                                        >
                                                            Khám phá sản phẩm
                                                        </Button>
                                                    </div>
                                                }
                                            />
                                        ) : (
                                            <>
                                                {/* Card View */}
                                                {viewMode === 'cards' && (
                                                    <Row gutter={[16, 16]}>
                                                        {allOrders.map(
                                                            (order) => (
                                                                <Col
                                                                    xs={24}
                                                                    md={12}
                                                                    lg={8}
                                                                    key={
                                                                        order._id ||
                                                                        order.id
                                                                    }
                                                                >
                                                                    <OrderCard
                                                                        order={
                                                                            order
                                                                        }
                                                                        onViewOrder={
                                                                            handleViewOrder
                                                                        }
                                                                        formatPrice={
                                                                            formatPrice
                                                                        }
                                                                        onCancelOrder={
                                                                            handleCancelOrder
                                                                        }
                                                                        cancellingOrders={
                                                                            cancellingOrders
                                                                        }
                                                                        onReviewProduct={
                                                                            handleReviewProduct
                                                                        }
                                                                    />
                                                                </Col>
                                                            )
                                                        )}
                                                    </Row>
                                                )}

                                                {/* List View similar structure */}
                                                {viewMode === 'list' && (
                                                    <List
                                                        itemLayout="vertical"
                                                        dataSource={allOrders}
                                                        renderItem={(order) => {
                                                            const statusConfig =
                                                                ORDER_STATUS[
                                                                    order.status
                                                                ]
                                                            return (
                                                                <List.Item
                                                                    key={
                                                                        order._id ||
                                                                        order.id
                                                                    }
                                                                    style={{
                                                                        background:
                                                                            '#fafafa',
                                                                        borderRadius: 8,
                                                                        marginBottom: 16,
                                                                        padding: 16,
                                                                    }}
                                                                    actions={[
                                                                        <Button
                                                                            type="primary"
                                                                            onClick={() =>
                                                                                handleViewOrder(
                                                                                    order._id ||
                                                                                        order.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Chi
                                                                            tiết
                                                                        </Button>,
                                                                        [
                                                                            'pending',
                                                                            'confirmed',
                                                                        ].includes(
                                                                            order.status
                                                                        ) && (
                                                                            <Popconfirm
                                                                                title="Hủy đơn hàng?"
                                                                                onConfirm={() =>
                                                                                    handleCancelOrder(
                                                                                        order._id ||
                                                                                            order.id
                                                                                    )
                                                                                }
                                                                                okText="Hủy đơn"
                                                                                cancelText="Không"
                                                                                okType="danger"
                                                                            >
                                                                                <Button
                                                                                    danger
                                                                                    loading={
                                                                                        cancellingOrders[
                                                                                            order._id ||
                                                                                                order.id
                                                                                        ]
                                                                                    }
                                                                                >
                                                                                    Hủy
                                                                                    đơn
                                                                                </Button>
                                                                            </Popconfirm>
                                                                        ),
                                                                    ].filter(
                                                                        Boolean
                                                                    )}
                                                                >
                                                                    <List.Item.Meta
                                                                        avatar={
                                                                            <Avatar.Group
                                                                                maxCount={
                                                                                    2
                                                                                }
                                                                            >
                                                                                {order.items
                                                                                    ?.slice(
                                                                                        0,
                                                                                        2
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            item,
                                                                                            index
                                                                                        ) => (
                                                                                            <Avatar
                                                                                                key={
                                                                                                    index
                                                                                                }
                                                                                                src={
                                                                                                    item
                                                                                                        .product_images
                                                                                                        ?.thumbnail ||
                                                                                                    '/placeholder.png'
                                                                                                }
                                                                                                shape="square"
                                                                                                size={
                                                                                                    40
                                                                                                }
                                                                                            />
                                                                                        )
                                                                                    )}
                                                                            </Avatar.Group>
                                                                        }
                                                                        title={
                                                                            <Space>
                                                                                <Text
                                                                                    strong
                                                                                >
                                                                                    #
                                                                                    {
                                                                                        order.order_number
                                                                                    }
                                                                                </Text>
                                                                                <Badge
                                                                                    color={
                                                                                        statusConfig?.color
                                                                                    }
                                                                                    text={
                                                                                        statusConfig?.text
                                                                                    }
                                                                                />
                                                                            </Space>
                                                                        }
                                                                        description={
                                                                            <Space>
                                                                                <Text
                                                                                    strong
                                                                                    style={{
                                                                                        color: '#1890ff',
                                                                                    }}
                                                                                >
                                                                                    {formatPrice(
                                                                                        order.total
                                                                                    )}
                                                                                </Text>
                                                                                <Text type="secondary">
                                                                                    {dayjs(
                                                                                        order.createdAt
                                                                                    ).format(
                                                                                        'DD/MM/YYYY HH:mm'
                                                                                    )}
                                                                                </Text>
                                                                            </Space>
                                                                        }
                                                                    />
                                                                </List.Item>
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* Pagination for Active Tab */}
                                        {allOrders.length > 0 && (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    marginTop: 24,
                                                }}
                                            >
                                                <Pagination
                                                    current={pagination.current}
                                                    pageSize={
                                                        pagination.pageSize
                                                    }
                                                    total={pagination.total}
                                                    onChange={handlePageChange}
                                                    showSizeChanger
                                                    showQuickJumper
                                                    showTotal={(total, range) =>
                                                        `${range[0]}-${range[1]} của ${total} đơn hàng đang hoạt động`
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'completed',
                                label: (
                                    <Space>
                                        <CheckCircleOutlined />
                                        <span>Đã hoàn thành</span>
                                        <Badge
                                            count={
                                                orderStats?.completed_orders ||
                                                0
                                            }
                                            showZero
                                            style={{
                                                backgroundColor: '#52c41a',
                                            }}
                                        />
                                    </Space>
                                ),
                                children: (
                                    <div style={{ padding: '0 0 32px 0' }}>
                                        {allOrders.length === 0 ? (
                                            <Empty
                                                description={
                                                    <div
                                                        style={{
                                                            textAlign: 'center',
                                                            padding: 40,
                                                        }}
                                                    >
                                                        <ShoppingOutlined
                                                            style={{
                                                                fontSize: 64,
                                                                color: '#d9d9d9',
                                                                marginBottom: 16,
                                                            }}
                                                        />
                                                        <Title
                                                            level={4}
                                                            style={{
                                                                color: '#8c8c8c',
                                                            }}
                                                        >
                                                            Chưa có đơn hàng
                                                            hoạt động
                                                        </Title>
                                                        <Paragraph
                                                            style={{
                                                                color: '#8c8c8c',
                                                            }}
                                                        >
                                                            Hãy bắt đầu mua sắm
                                                            để tạo đơn hàng đầu
                                                            tiên của bạn!
                                                        </Paragraph>
                                                        <Button
                                                            type="primary"
                                                            size="large"
                                                            style={{
                                                                marginTop: 16,
                                                            }}
                                                        >
                                                            Khám phá sản phẩm
                                                        </Button>
                                                    </div>
                                                }
                                            />
                                        ) : (
                                            <>
                                                {/* Card View */}
                                                {viewMode === 'cards' && (
                                                    <Row gutter={[16, 16]}>
                                                        {allOrders.map(
                                                            (order) => (
                                                                <Col
                                                                    xs={24}
                                                                    md={12}
                                                                    lg={8}
                                                                    key={
                                                                        order._id ||
                                                                        order.id
                                                                    }
                                                                >
                                                                    <OrderCard
                                                                        order={
                                                                            order
                                                                        }
                                                                        onViewOrder={
                                                                            handleViewOrder
                                                                        }
                                                                        formatPrice={
                                                                            formatPrice
                                                                        }
                                                                        onCancelOrder={
                                                                            handleCancelOrder
                                                                        }
                                                                        cancellingOrders={
                                                                            cancellingOrders
                                                                        }
                                                                        onReviewProduct={
                                                                            handleReviewProduct
                                                                        }
                                                                    />
                                                                </Col>
                                                            )
                                                        )}
                                                    </Row>
                                                )}

                                                {/* List View */}
                                                {viewMode === 'list' && (
                                                    <List
                                                        itemLayout="vertical"
                                                        dataSource={allOrders}
                                                        renderItem={(order) => {
                                                            const statusConfig =
                                                                ORDER_STATUS[
                                                                    order.status
                                                                ]
                                                            return (
                                                                <List.Item
                                                                    key={
                                                                        order._id ||
                                                                        order.id
                                                                    }
                                                                    style={{
                                                                        background:
                                                                            '#fafafa',
                                                                        borderRadius: 8,
                                                                        marginBottom: 16,
                                                                        padding: 16,
                                                                    }}
                                                                    actions={[
                                                                        <Button
                                                                            type="primary"
                                                                            onClick={() =>
                                                                                handleViewOrder(
                                                                                    order._id ||
                                                                                        order.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Chi
                                                                            tiết
                                                                        </Button>,
                                                                        // Chỉ cho hủy đơn khi status là pending hoặc confirmed
                                                                        [
                                                                            'pending',
                                                                            'confirmed',
                                                                        ].includes(
                                                                            order.status
                                                                        ) && (
                                                                            <Popconfirm
                                                                                title="Hủy đơn hàng?"
                                                                                description="Bạn có chắc chắn muốn hủy đơn hàng này?"
                                                                                onConfirm={() =>
                                                                                    handleCancelOrder(
                                                                                        order._id ||
                                                                                            order.id
                                                                                    )
                                                                                }
                                                                                okText="Hủy đơn"
                                                                                cancelText="Không"
                                                                                okType="danger"
                                                                            >
                                                                                <Button
                                                                                    danger
                                                                                    loading={
                                                                                        cancellingOrders[
                                                                                            order._id ||
                                                                                                order.id
                                                                                        ]
                                                                                    }
                                                                                >
                                                                                    Hủy
                                                                                    đơn
                                                                                </Button>
                                                                            </Popconfirm>
                                                                        ),
                                                                    ].filter(
                                                                        Boolean
                                                                    )}
                                                                >
                                                                    <List.Item.Meta
                                                                        avatar={
                                                                            <Avatar.Group
                                                                                maxCount={
                                                                                    2
                                                                                }
                                                                            >
                                                                                {order.items
                                                                                    ?.slice(
                                                                                        0,
                                                                                        2
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            item,
                                                                                            index
                                                                                        ) => (
                                                                                            <Avatar
                                                                                                key={
                                                                                                    index
                                                                                                }
                                                                                                src={
                                                                                                    item
                                                                                                        .product_images
                                                                                                        ?.thumbnail ||
                                                                                                    '/placeholder.png'
                                                                                                }
                                                                                                shape="square"
                                                                                                size={
                                                                                                    40
                                                                                                }
                                                                                            />
                                                                                        )
                                                                                    )}
                                                                            </Avatar.Group>
                                                                        }
                                                                        title={
                                                                            <Space>
                                                                                <Text
                                                                                    strong
                                                                                >
                                                                                    #
                                                                                    {
                                                                                        order.order_number
                                                                                    }
                                                                                </Text>
                                                                                <Badge
                                                                                    color={
                                                                                        statusConfig?.color
                                                                                    }
                                                                                    text={
                                                                                        statusConfig?.text
                                                                                    }
                                                                                />
                                                                            </Space>
                                                                        }
                                                                        description={
                                                                            <Space>
                                                                                <Text
                                                                                    strong
                                                                                    style={{
                                                                                        color: '#1890ff',
                                                                                    }}
                                                                                >
                                                                                    {formatPrice(
                                                                                        order.total
                                                                                    )}
                                                                                </Text>
                                                                                <Text type="secondary">
                                                                                    {dayjs(
                                                                                        order.createdAt
                                                                                    ).format(
                                                                                        'DD/MM/YYYY HH:mm'
                                                                                    )}
                                                                                </Text>
                                                                            </Space>
                                                                        }
                                                                    />
                                                                </List.Item>
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* Pagination for Completed Tab */}
                                        {allOrders.length > 0 && (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    marginTop: 24,
                                                }}
                                            >
                                                <Pagination
                                                    current={pagination.current}
                                                    pageSize={
                                                        pagination.pageSize
                                                    }
                                                    total={pagination.total}
                                                    onChange={handlePageChange}
                                                    showSizeChanger
                                                    showQuickJumper
                                                    showTotal={(total, range) =>
                                                        `${range[0]}-${range[1]} của ${total} đơn hàng đã hoàn thành`
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'cancelled',
                                label: (
                                    <Space>
                                        <CloseCircleOutlined />
                                        <span>Đã hủy</span>
                                        <Badge
                                            count={
                                                (orderStats?.total_orders ||
                                                    0) -
                                                (orderStats?.pending_orders ||
                                                    0) -
                                                (orderStats?.completed_orders ||
                                                    0)
                                            }
                                            showZero
                                            style={{
                                                backgroundColor: '#ff4d4f',
                                            }}
                                        />
                                    </Space>
                                ),
                                children: (
                                    <div style={{ padding: '0 0 32px 0' }}>
                                        {allOrders.length === 0 ? (
                                            <Empty
                                                description={
                                                    <div
                                                        style={{
                                                            textAlign: 'center',
                                                            padding: 40,
                                                        }}
                                                    >
                                                        <CloseCircleOutlined
                                                            style={{
                                                                fontSize: 64,
                                                                color: '#d9d9d9',
                                                                marginBottom: 16,
                                                            }}
                                                        />
                                                        <Title
                                                            level={4}
                                                            style={{
                                                                color: '#8c8c8c',
                                                            }}
                                                        >
                                                            Chưa có đơn hàng bị
                                                            hủy
                                                        </Title>
                                                        <Paragraph
                                                            style={{
                                                                color: '#8c8c8c',
                                                            }}
                                                        >
                                                            Các đơn hàng đã hủy
                                                            hoặc hoàn trả sẽ
                                                            hiển thị ở đây.
                                                        </Paragraph>
                                                    </div>
                                                }
                                            />
                                        ) : (
                                            <>
                                                {/* Card View */}
                                                {viewMode === 'cards' && (
                                                    <Row gutter={[16, 16]}>
                                                        {allOrders.map(
                                                            (order) => (
                                                                <Col
                                                                    xs={24}
                                                                    md={12}
                                                                    lg={8}
                                                                    key={
                                                                        order._id ||
                                                                        order.id
                                                                    }
                                                                >
                                                                    <OrderCard
                                                                        order={
                                                                            order
                                                                        }
                                                                        onViewOrder={
                                                                            handleViewOrder
                                                                        }
                                                                        formatPrice={
                                                                            formatPrice
                                                                        }
                                                                        onReviewProduct={
                                                                            handleReviewProduct
                                                                        }
                                                                    />
                                                                </Col>
                                                            )
                                                        )}
                                                    </Row>
                                                )}

                                                {/* List View */}
                                                {viewMode === 'list' && (
                                                    <List
                                                        itemLayout="vertical"
                                                        dataSource={allOrders}
                                                        renderItem={(order) => {
                                                            const statusConfig =
                                                                ORDER_STATUS[
                                                                    order.status
                                                                ]
                                                            return (
                                                                <List.Item
                                                                    key={
                                                                        order._id ||
                                                                        order.id
                                                                    }
                                                                    style={{
                                                                        background:
                                                                            '#fafafa',
                                                                        borderRadius: 8,
                                                                        marginBottom: 16,
                                                                        padding: 16,
                                                                    }}
                                                                    actions={[
                                                                        <Button
                                                                            type="primary"
                                                                            onClick={() =>
                                                                                handleViewOrder(
                                                                                    order._id ||
                                                                                        order.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Chi
                                                                            tiết
                                                                        </Button>,
                                                                    ]}
                                                                >
                                                                    <List.Item.Meta
                                                                        avatar={
                                                                            <Avatar.Group
                                                                                maxCount={
                                                                                    2
                                                                                }
                                                                            >
                                                                                {order.items
                                                                                    ?.slice(
                                                                                        0,
                                                                                        2
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            item,
                                                                                            index
                                                                                        ) => (
                                                                                            <Avatar
                                                                                                key={
                                                                                                    index
                                                                                                }
                                                                                                src={
                                                                                                    item
                                                                                                        .product_images
                                                                                                        ?.thumbnail ||
                                                                                                    '/placeholder.png'
                                                                                                }
                                                                                                shape="square"
                                                                                                size={
                                                                                                    40
                                                                                                }
                                                                                            />
                                                                                        )
                                                                                    )}
                                                                            </Avatar.Group>
                                                                        }
                                                                        title={
                                                                            <Space>
                                                                                <Text
                                                                                    strong
                                                                                >
                                                                                    #
                                                                                    {
                                                                                        order.order_number
                                                                                    }
                                                                                </Text>
                                                                                <Badge
                                                                                    color={
                                                                                        statusConfig?.color
                                                                                    }
                                                                                    text={
                                                                                        statusConfig?.text
                                                                                    }
                                                                                />
                                                                            </Space>
                                                                        }
                                                                        description={
                                                                            <Space>
                                                                                <Text
                                                                                    strong
                                                                                    style={{
                                                                                        color: '#ff4d4f',
                                                                                    }}
                                                                                >
                                                                                    {formatPrice(
                                                                                        order.total
                                                                                    )}
                                                                                </Text>
                                                                                <Text type="secondary">
                                                                                    {dayjs(
                                                                                        order.createdAt
                                                                                    ).format(
                                                                                        'DD/MM/YYYY HH:mm'
                                                                                    )}
                                                                                </Text>
                                                                            </Space>
                                                                        }
                                                                    />
                                                                </List.Item>
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* Pagination for Cancelled Tab */}
                                        {allOrders.length > 0 && (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    marginTop: 24,
                                                }}
                                            >
                                                <Pagination
                                                    current={pagination.current}
                                                    pageSize={
                                                        pagination.pageSize
                                                    }
                                                    total={pagination.total}
                                                    onChange={handlePageChange}
                                                    showSizeChanger
                                                    showQuickJumper
                                                    showTotal={(total, range) =>
                                                        `${range[0]}-${range[1]} của ${total} đơn hàng đã hủy`
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Card>

                {/* Product Review Selector Modal */}
                <ProductReviewSelector
                    visible={productSelectorModalOpen}
                    onClose={() => setProductSelectorModalOpen(false)}
                    order={selectedOrderForReview}
                    onProductSelect={handleReviewProduct}
                    formatPrice={formatPrice}
                />

                {/* Review Form Modal */}
                <ReviewForm
                    visible={reviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    productId={selectedProductForReview?.productId}
                    productName={selectedProductForReview?.productName}
                    orderId={selectedProductForReview?.orderId}
                    availableVariants={
                        selectedProductForReview?.availableVariants
                    }
                />

                {/* Order Detail Drawer */}
                <Drawer
                    title="Chi tiết đơn hàng"
                    placement="right"
                    onClose={() => setDetailDrawerOpen(false)}
                    open={detailDrawerOpen}
                    width={600}
                >
                    {selectedOrder && (
                        <div>
                            <Title level={4}>
                                #{selectedOrder.order_number}
                            </Title>
                            {selectedOrder && (
                                <>
                                    {/* Order Header */}
                                    <div
                                        style={{
                                            background:
                                                ORDER_STATUS[
                                                    selectedOrder.status
                                                ]?.gradient || '#f5f5f5',
                                            color: 'white',
                                            padding: '20px',
                                            marginBottom: '24px',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                        >
                                            <Col>
                                                <Space
                                                    direction="vertical"
                                                    size={0}
                                                >
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: 'white',
                                                            fontSize: 18,
                                                        }}
                                                    >
                                                        Đơn hàng #
                                                        {
                                                            selectedOrder.order_number
                                                        }
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            color: 'rgba(255,255,255,0.8)',
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        Đặt ngày{' '}
                                                        {dayjs(
                                                            selectedOrder.createdAt
                                                        ).format(
                                                            'DD/MM/YYYY HH:mm'
                                                        )}
                                                    </Text>
                                                </Space>
                                            </Col>
                                            <Col>
                                                <Space
                                                    direction="vertical"
                                                    align="end"
                                                    size={0}
                                                >
                                                    <Badge
                                                        color={
                                                            ORDER_STATUS[
                                                                selectedOrder
                                                                    .status
                                                            ]?.color
                                                        }
                                                        text={
                                                            ORDER_STATUS[
                                                                selectedOrder
                                                                    .status
                                                            ]?.text
                                                        }
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    />
                                                    <Badge
                                                        color={
                                                            PAYMENT_STATUS[
                                                                selectedOrder
                                                                    .payment_status
                                                            ]?.color
                                                        }
                                                        text={
                                                            PAYMENT_STATUS[
                                                                selectedOrder
                                                                    .payment_status
                                                            ]?.text
                                                        }
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    />
                                                </Space>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Order Progress - Custom Beautiful Design */}
                                    {!['cancelled', 'returned'].includes(
                                        selectedOrder.status
                                    ) && (
                                        <Card
                                            title={
                                                <Space>
                                                    <TruckOutlined
                                                        style={{
                                                            color: '#1890ff',
                                                        }}
                                                    />
                                                    <Text strong>
                                                        Tiến trình đơn hàng
                                                    </Text>
                                                </Space>
                                            }
                                            style={{ marginBottom: 24 }}
                                        >
                                            <div
                                                style={{ padding: '20px 10px' }}
                                            >
                                                {(() => {
                                                    const steps = [
                                                        {
                                                            key: 'pending',
                                                            title: 'Chờ xử lý',
                                                            description:
                                                                'Đơn hàng được tiếp nhận',
                                                            icon: (
                                                                <ClockCircleOutlined />
                                                            ),
                                                            color: '#faad14',
                                                        },
                                                        {
                                                            key: 'confirmed',
                                                            title: 'Đã xác nhận',
                                                            description:
                                                                'Đơn hàng được xác nhận',
                                                            icon: (
                                                                <CheckCircleOutlined />
                                                            ),
                                                            color: '#1890ff',
                                                        },
                                                        {
                                                            key: 'processing',
                                                            title: 'Đang chuẩn bị',
                                                            description:
                                                                'Đóng gói sản phẩm',
                                                            icon: (
                                                                <ShoppingOutlined />
                                                            ),
                                                            color: '#13c2c2',
                                                        },
                                                        {
                                                            key: 'shipping',
                                                            title: 'Đang giao hàng',
                                                            description:
                                                                'Đang trên đường giao',
                                                            icon: (
                                                                <TruckOutlined />
                                                            ),
                                                            color: '#722ed1',
                                                        },
                                                        {
                                                            key: 'delivered',
                                                            title: 'Đã giao hàng',
                                                            description:
                                                                'Giao hàng thành công',
                                                            icon: (
                                                                <CheckCircleOutlined />
                                                            ),
                                                            color: '#52c41a',
                                                        },
                                                    ]

                                                    const currentStepIndex =
                                                        steps.findIndex(
                                                            (step) =>
                                                                step.key ===
                                                                selectedOrder.status
                                                        )

                                                    return (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'space-between',
                                                                alignItems:
                                                                    'flex-start',
                                                            }}
                                                        >
                                                            {steps.map(
                                                                (
                                                                    step,
                                                                    index
                                                                ) => {
                                                                    const isCompleted =
                                                                        index <
                                                                        currentStepIndex
                                                                    const isCurrent =
                                                                        index ===
                                                                        currentStepIndex
                                                                    const isPending =
                                                                        index >
                                                                        currentStepIndex

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                step.key
                                                                            }
                                                                            style={{
                                                                                display:
                                                                                    'flex',
                                                                                flexDirection:
                                                                                    'column',
                                                                                alignItems:
                                                                                    'center',
                                                                                flex: 1,
                                                                                position:
                                                                                    'relative',
                                                                            }}
                                                                        >
                                                                            {/* Connector Line */}
                                                                            {index <
                                                                                steps.length -
                                                                                    1 && (
                                                                                <div
                                                                                    style={{
                                                                                        position:
                                                                                            'absolute',
                                                                                        top: '24px',
                                                                                        left: '60%',
                                                                                        right: '-60%',
                                                                                        height: '2px',
                                                                                        background:
                                                                                            isCompleted ||
                                                                                            isCurrent
                                                                                                ? step.color
                                                                                                : '#f0f0f0',
                                                                                        zIndex: 0,
                                                                                    }}
                                                                                />
                                                                            )}

                                                                            {/* Step Circle */}
                                                                            <div
                                                                                style={{
                                                                                    width: '48px',
                                                                                    height: '48px',
                                                                                    borderRadius:
                                                                                        '50%',
                                                                                    background:
                                                                                        isCompleted ||
                                                                                        isCurrent
                                                                                            ? `linear-gradient(135deg, ${step.color}, ${step.color}dd)`
                                                                                            : '#f5f5f5',
                                                                                    border: `2px solid ${
                                                                                        isCompleted ||
                                                                                        isCurrent
                                                                                            ? step.color
                                                                                            : '#d9d9d9'
                                                                                    }`,
                                                                                    display:
                                                                                        'flex',
                                                                                    alignItems:
                                                                                        'center',
                                                                                    justifyContent:
                                                                                        'center',
                                                                                    color:
                                                                                        isCompleted ||
                                                                                        isCurrent
                                                                                            ? 'white'
                                                                                            : '#8c8c8c',
                                                                                    fontSize:
                                                                                        '18px',
                                                                                    marginBottom:
                                                                                        '12px',
                                                                                    zIndex: 1,
                                                                                    position:
                                                                                        'relative',
                                                                                    boxShadow:
                                                                                        isCompleted ||
                                                                                        isCurrent
                                                                                            ? `0 4px 12px ${step.color}30`
                                                                                            : '0 2px 4px rgba(0,0,0,0.1)',
                                                                                    transform:
                                                                                        isCurrent
                                                                                            ? 'scale(1.1)'
                                                                                            : 'scale(1)',
                                                                                    transition:
                                                                                        'all 0.3s ease',
                                                                                }}
                                                                            >
                                                                                {isCompleted ? (
                                                                                    <CheckCircleOutlined />
                                                                                ) : (
                                                                                    step.icon
                                                                                )}
                                                                            </div>

                                                                            {/* Step Content */}
                                                                            <div
                                                                                style={{
                                                                                    textAlign:
                                                                                        'center',
                                                                                    maxWidth:
                                                                                        '120px',
                                                                                }}
                                                                            >
                                                                                <Text
                                                                                    strong
                                                                                    style={{
                                                                                        color:
                                                                                            isCompleted ||
                                                                                            isCurrent
                                                                                                ? step.color
                                                                                                : '#8c8c8c',
                                                                                        fontSize:
                                                                                            '14px',
                                                                                        display:
                                                                                            'block',
                                                                                        marginBottom:
                                                                                            '4px',
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        step.title
                                                                                    }
                                                                                </Text>
                                                                                <Text
                                                                                    style={{
                                                                                        color: '#8c8c8c',
                                                                                        fontSize:
                                                                                            '12px',
                                                                                        lineHeight:
                                                                                            '1.4',
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        step.description
                                                                                    }
                                                                                </Text>
                                                                                {isCurrent && (
                                                                                    <div
                                                                                        style={{
                                                                                            marginTop:
                                                                                                '8px',
                                                                                            padding:
                                                                                                '4px 8px',
                                                                                            background: `${step.color}15`,
                                                                                            borderRadius:
                                                                                                '12px',
                                                                                            border: `1px solid ${step.color}30`,
                                                                                        }}
                                                                                    >
                                                                                        <Text
                                                                                            style={{
                                                                                                color: step.color,
                                                                                                fontSize:
                                                                                                    '11px',
                                                                                                fontWeight:
                                                                                                    'bold',
                                                                                            }}
                                                                                        >
                                                                                            HIỆN
                                                                                            TẠI
                                                                                        </Text>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                }
                                                            )}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        </Card>
                                    )}

                                    {/* Products List */}
                                    <Card
                                        title="Sản phẩm trong đơn hàng"
                                        style={{ marginBottom: 24 }}
                                    >
                                        <List
                                            dataSource={
                                                selectedOrder.items || []
                                            }
                                            renderItem={(item) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        avatar={
                                                            <Avatar
                                                                src={
                                                                    item
                                                                        .product_images
                                                                        ?.thumbnail ||
                                                                    item
                                                                        .product_images
                                                                        ?.medium ||
                                                                    item.product_image ||
                                                                    '/placeholder.png'
                                                                }
                                                                size={64}
                                                                shape="square"
                                                            />
                                                        }
                                                        title={
                                                            <div>
                                                                <Text strong>
                                                                    {item.product_name ||
                                                                        item.name}
                                                                </Text>
                                                                {item.variant_name && (
                                                                    <Tag
                                                                        style={{
                                                                            marginLeft: 8,
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.variant_name
                                                                        }
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        }
                                                        description={
                                                            <Space
                                                                direction="vertical"
                                                                size={4}
                                                            >
                                                                <Text>
                                                                    Số lượng:{' '}
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </Text>
                                                                <Text
                                                                    strong
                                                                    style={{
                                                                        color: '#1890ff',
                                                                    }}
                                                                >
                                                                    {formatPrice(
                                                                        item.price
                                                                    )}{' '}
                                                                    x{' '}
                                                                    {
                                                                        item.quantity
                                                                    }{' '}
                                                                    ={' '}
                                                                    {formatPrice(
                                                                        item.price *
                                                                            item.quantity
                                                                    )}
                                                                </Text>
                                                            </Space>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    </Card>

                                    {/* Order Summary */}
                                    <Card
                                        title="Tóm tắt đơn hàng"
                                        style={{ marginBottom: 24 }}
                                    >
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} md={12}>
                                                <Space
                                                    direction="vertical"
                                                    size={12}
                                                    style={{ width: '100%' }}
                                                >
                                                    <div>
                                                        <Text strong>
                                                            Thông tin thanh
                                                            toán:
                                                        </Text>
                                                        <div
                                                            style={{
                                                                marginTop: 8,
                                                            }}
                                                        >
                                                            <Space
                                                                direction="vertical"
                                                                size={4}
                                                            >
                                                                <Row justify="space-between">
                                                                    <Text>
                                                                        Tạm
                                                                        tính:
                                                                    </Text>
                                                                    <Text>
                                                                        {formatPrice(
                                                                            selectedOrder.subtotal ||
                                                                                selectedOrder.total
                                                                        )}
                                                                    </Text>
                                                                </Row>
                                                                <Row justify="space-between">
                                                                    <Text>
                                                                        Phí vận
                                                                        chuyển:
                                                                    </Text>
                                                                    <Text>
                                                                        {formatPrice(
                                                                            selectedOrder.shipping_fee ||
                                                                                0
                                                                        )}
                                                                    </Text>
                                                                </Row>
                                                                {selectedOrder.discount >
                                                                    0 && (
                                                                    <Row justify="space-between">
                                                                        <Text>
                                                                            Giảm
                                                                            giá:
                                                                        </Text>
                                                                        <Text
                                                                            style={{
                                                                                color: '#52c41a',
                                                                            }}
                                                                        >
                                                                            -
                                                                            {formatPrice(
                                                                                selectedOrder.discount
                                                                            )}
                                                                        </Text>
                                                                    </Row>
                                                                )}
                                                                <Row
                                                                    justify="space-between"
                                                                    style={{
                                                                        borderTop:
                                                                            '1px solid #f0f0f0',
                                                                        paddingTop: 8,
                                                                    }}
                                                                >
                                                                    <Text
                                                                        strong
                                                                        style={{
                                                                            fontSize: 16,
                                                                        }}
                                                                    >
                                                                        Tổng
                                                                        cộng:
                                                                    </Text>
                                                                    <Text
                                                                        strong
                                                                        style={{
                                                                            fontSize: 16,
                                                                            color: '#1890ff',
                                                                        }}
                                                                    >
                                                                        {formatPrice(
                                                                            selectedOrder.total
                                                                        )}
                                                                    </Text>
                                                                </Row>
                                                            </Space>
                                                        </div>
                                                    </div>
                                                </Space>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Space
                                                    direction="vertical"
                                                    size={12}
                                                    style={{ width: '100%' }}
                                                >
                                                    <div>
                                                        <Text strong>
                                                            Thông tin giao hàng:
                                                        </Text>
                                                        <div
                                                            style={{
                                                                marginTop: 8,
                                                            }}
                                                        >
                                                            <Space
                                                                direction="vertical"
                                                                size={4}
                                                            >
                                                                <Text>
                                                                    <EnvironmentOutlined />{' '}
                                                                    {selectedOrder
                                                                        .shipping_address
                                                                        ?.full_name ||
                                                                        selectedOrder
                                                                            .shipping_address
                                                                            ?.name ||
                                                                        selectedOrder.customer_name ||
                                                                        'Chưa có thông tin'}
                                                                </Text>
                                                                <Text>
                                                                    <PhoneOutlined />{' '}
                                                                    {selectedOrder
                                                                        .shipping_address
                                                                        ?.phone ||
                                                                        selectedOrder.customer_phone ||
                                                                        'Chưa có số điện thoại'}
                                                                </Text>
                                                                <Text>
                                                                    {[
                                                                        selectedOrder
                                                                            .shipping_address
                                                                            ?.address_line,
                                                                        typeof selectedOrder
                                                                            .shipping_address
                                                                            ?.ward ===
                                                                        'object'
                                                                            ? selectedOrder
                                                                                  .shipping_address
                                                                                  .ward
                                                                                  ?.name
                                                                            : selectedOrder
                                                                                  .shipping_address
                                                                                  ?.ward,
                                                                        typeof selectedOrder
                                                                            .shipping_address
                                                                            ?.province ===
                                                                        'object'
                                                                            ? selectedOrder
                                                                                  .shipping_address
                                                                                  .province
                                                                                  ?.name
                                                                            : selectedOrder
                                                                                  .shipping_address
                                                                                  ?.province,
                                                                        typeof selectedOrder.shipping_address ===
                                                                        'string'
                                                                            ? selectedOrder.shipping_address
                                                                            : null,
                                                                    ]
                                                                        .filter(
                                                                            Boolean
                                                                        )
                                                                        .join(
                                                                            ', '
                                                                        ) ||
                                                                        'Chưa có địa chỉ'}
                                                                </Text>
                                                            </Space>
                                                        </div>
                                                    </div>
                                                    {selectedOrder.notes && (
                                                        <div>
                                                            <Text strong>
                                                                Ghi chú:
                                                            </Text>
                                                            <Paragraph
                                                                style={{
                                                                    marginTop: 8,
                                                                    marginBottom: 0,
                                                                }}
                                                            >
                                                                {
                                                                    selectedOrder.notes
                                                                }
                                                            </Paragraph>
                                                        </div>
                                                    )}
                                                </Space>
                                            </Col>
                                        </Row>
                                    </Card>

                                    {/* Payment Details */}
                                    {selectedOrder.payment_details && (
                                        <Card
                                            title="Thông tin thanh toán"
                                            style={{ marginBottom: 24 }}
                                        >
                                            <Space
                                                direction="vertical"
                                                size={8}
                                                style={{ width: '100%' }}
                                            >
                                                <Row justify="space-between">
                                                    <Text>Phương thức:</Text>
                                                    <Tag color="blue">
                                                        {selectedOrder.payment_method ===
                                                        'sepay_qr'
                                                            ? 'Chuyển khoản QR'
                                                            : selectedOrder.payment_method}
                                                    </Tag>
                                                </Row>
                                                {selectedOrder.payment_details
                                                    .transaction_id && (
                                                    <Row justify="space-between">
                                                        <Text>
                                                            Mã giao dịch:
                                                        </Text>
                                                        <Text code>
                                                            {
                                                                selectedOrder
                                                                    .payment_details
                                                                    .transaction_id
                                                            }
                                                        </Text>
                                                    </Row>
                                                )}
                                                {selectedOrder.payment_details
                                                    .paid_at && (
                                                    <Row justify="space-between">
                                                        <Text>
                                                            Thời gian thanh
                                                            toán:
                                                        </Text>
                                                        <Text>
                                                            {dayjs(
                                                                selectedOrder
                                                                    .payment_details
                                                                    .paid_at
                                                            ).format(
                                                                'DD/MM/YYYY HH:mm:ss'
                                                            )}
                                                        </Text>
                                                    </Row>
                                                )}
                                            </Space>
                                        </Card>
                                    )}

                                    {/* Order History */}
                                    {selectedOrder.status_history &&
                                        selectedOrder.status_history.length >
                                            0 && (
                                            <Card title="Lịch sử đơn hàng">
                                                <List
                                                    dataSource={
                                                        selectedOrder.status_history
                                                    }
                                                    renderItem={(history) => (
                                                        <List.Item>
                                                            <List.Item.Meta
                                                                avatar={
                                                                    <Badge
                                                                        color={
                                                                            ORDER_STATUS[
                                                                                history
                                                                                    .status
                                                                            ]
                                                                                ?.color
                                                                        }
                                                                    />
                                                                }
                                                                title={
                                                                    ORDER_STATUS[
                                                                        history
                                                                            .status
                                                                    ]?.text ||
                                                                    history.status
                                                                }
                                                                description={
                                                                    <Space
                                                                        direction="vertical"
                                                                        size={2}
                                                                    >
                                                                        <Text type="secondary">
                                                                            {dayjs(
                                                                                history.created_at
                                                                            ).format(
                                                                                'DD/MM/YYYY HH:mm:ss'
                                                                            )}
                                                                        </Text>
                                                                        {history.note && (
                                                                            <Text>
                                                                                {
                                                                                    history.note
                                                                                }
                                                                            </Text>
                                                                        )}
                                                                    </Space>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            </Card>
                                        )}
                                </>
                            )}
                        </div>
                    )}
                </Drawer>
            </div>
        </div>
    )
}

export default MyOrders
