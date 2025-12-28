import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Typography,
    Row,
    Col,
    message,
    Spin,
    Select,
    Input,
    Tag,
    Modal,
    Form,
    DatePicker,
    Descriptions,
    Steps,
    Drawer,
    List,
    Avatar,
    Badge,
    Tooltip,
    Popconfirm,
    Divider,
    Tabs,
    Image,
} from 'antd'
import {
    EyeOutlined,
    EditOutlined,
    TruckOutlined,
    DollarOutlined,
    SearchOutlined,
    ReloadOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ShoppingOutlined,
    UserOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    CalendarOutlined,
    FileTextOutlined,
    CopyOutlined,
} from '@ant-design/icons'
import { orderAPI } from '../../services/api'
import { SHIPPING_PROVIDERS } from '../../constants/shipping'
import TrackingCodeGenerator from '../../utils/trackingCodeGenerator'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography
const { Step } = Steps
const { TabPane } = Tabs

// Order status configuration
const ORDER_STATUS = {
    pending: {
        color: 'orange',
        text: 'Chờ xác nhận',
        icon: <ClockCircleOutlined />,
    },
    confirmed: {
        color: 'blue',
        text: 'Đã xác nhận',
        icon: <CheckCircleOutlined />,
    },
    processing: {
        color: 'cyan',
        text: 'Đang xử lý',
        icon: <ShoppingOutlined />,
    },
    shipping: { color: 'purple', text: 'Đang giao', icon: <TruckOutlined /> },
    delivered: {
        color: 'green',
        text: 'Đã giao',
        icon: <CheckCircleOutlined />,
    },
    cancelled: { color: 'red', text: 'Đã hủy', icon: <CloseCircleOutlined /> },
    returned: {
        color: 'volcano',
        text: 'Trả hàng',
        icon: <ExclamationCircleOutlined />,
    },
}

// Payment status configuration
const PAYMENT_STATUS = {
    pending: { color: 'orange', text: 'Chưa thanh toán' },
    paid: { color: 'green', text: 'Đã thanh toán' },
}

const OrderManagement = () => {
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        payment_status: '',
        search: '',
    })

    // Active tab for separating normal orders and cancelled/returned orders
    const [activeTab, setActiveTab] = useState('active')

    // Modals state
    const [orderDetailVisible, setOrderDetailVisible] = useState(false)
    const [statusModalVisible, setStatusModalVisible] = useState(false)
    const [paymentModalVisible, setPaymentModalVisible] = useState(false)
    const [trackingModalVisible, setTrackingModalVisible] = useState(false)

    const [selectedOrder, setSelectedOrder] = useState(null)
    const [statusForm] = Form.useForm()
    const [paymentForm] = Form.useForm()
    const [trackingForm] = Form.useForm()

    // Fetch orders based on active tab
    const fetchOrders = async (params = {}) => {
        setLoading(true)
        try {
            const queryParams = {
                page: pagination.current,
                limit: pagination.pageSize,
                ...filters,
                ...params,
            }

            // Filter based on active tab - FIXED: Không override khi user chọn status cụ thể
            if (activeTab === 'active') {
                // Nếu user không chọn gì, hiển thị tất cả active orders
                if (!queryParams.status || queryParams.status === '') {
                    queryParams.status =
                        'pending,confirmed,processing,shipping,delivered'
                }
                // Nếu user đã chọn status cụ thể, GIỮ NGUYÊN không thay đổi gì
                // Loại bỏ logic filter vì nó làm hỏng filter của user
            } else if (activeTab === 'cancelled') {
                // Nếu user không chọn gì, hiển thị tất cả cancelled orders
                if (!queryParams.status || queryParams.status === '') {
                    queryParams.status = 'cancelled,returned'
                }
                // Nếu user đã chọn status cụ thể, GIỮ NGUYÊN không thay đổi gì
            }

            // Remove empty filters
            Object.keys(queryParams).forEach((key) => {
                if (!queryParams[key]) delete queryParams[key]
            })

            const response = await orderAPI.getAllOrders(queryParams)

            if (response?.status === 200) {
                const metadata = response.metadata

                // Handle different response formats
                let orderList = []
                let paginationData = {}

                if (metadata) {
                    // Check if metadata has data and pagination properties
                    if (metadata.data && Array.isArray(metadata.data)) {
                        orderList = metadata.data
                        paginationData = metadata.pagination || {}
                    }
                    // Or if metadata is directly the orders array
                    else if (Array.isArray(metadata)) {
                        orderList = metadata
                        paginationData = { total: metadata.length }
                    }
                    // Or if metadata has orders property
                    else if (
                        metadata.orders &&
                        Array.isArray(metadata.orders)
                    ) {
                        orderList = metadata.orders
                        paginationData = metadata.pagination || {
                            total: metadata.orders.length,
                        }
                    }
                }

                //     console.log('🔥 Processed orders:', orderList.map(o => ({
                //     order_number: o.order_number,
                //     status: o.status,
                //     customer: o.shipping_address?.full_name
                // })))

                setOrders(orderList)
                setPagination((prev) => ({
                    ...prev,
                    total: paginationData?.total || 0,
                }))

                if (orderList.length === 0) {
                    message.info('Chưa có đơn hàng nào')
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
            console.error('Error details:', error.response?.data)
            message.error(`Không thể tải danh sách đơn hàng: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchOrders()
    }, [pagination.current, pagination.pageSize, activeTab])

    // Handle table pagination
    const handleTableChange = (newPagination) => {
        setPagination((prev) => ({
            ...prev,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        }))
    }

    // Handle search and filters
    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, current: 1 }))
        fetchOrders()
    }

    const handleReset = () => {
        setFilters({
            status: '',
            payment_status: '',
            search: '',
        })
        setPagination((prev) => ({ ...prev, current: 1 }))
        setTimeout(() => fetchOrders(), 100)
    }

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab)
        // Reset pagination when switching tabs
        setPagination((prev) => ({ ...prev, current: 1 }))
        // Reset filters when switching tabs
        setFilters({
            status: '',
            payment_status: '',
            search: '',
        })
    }

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price || 0)
    }

    // View order detail
    const handleViewOrder = async (orderId) => {
        try {
            setLoading(true)
            const response = await orderAPI.getOrderById(orderId)
            if (response?.status === 200) {
                setSelectedOrder(response.metadata)
                setOrderDetailVisible(true)
            }
        } catch (error) {
            console.error('Error fetching order detail:', error)
            message.error('Không thể tải chi tiết đơn hàng')
        } finally {
            setLoading(false)
        }
    }

    // Update order status
    const handleUpdateStatus = async (values) => {
        if (!selectedOrder) return

        try {
            setLoading(true)
            const response = await orderAPI.updateOrderStatus(
                selectedOrder._id,
                values
            )
            if (response?.status === 200) {
                message.success('Cập nhật trạng thái thành công')
                setStatusModalVisible(false)
                statusForm.resetFields()
                fetchOrders() // Refresh list

                // Update current order detail if viewing
                if (orderDetailVisible) {
                    await handleViewOrder(selectedOrder._id)
                }
            }
        } catch (error) {
            console.error('Error updating order status:', error)
            message.error('Cập nhật trạng thái thất bại')
        } finally {
            setLoading(false)
        }
    }

    // Update payment status
    const handleUpdatePaymentStatus = async (values) => {
        if (!selectedOrder) return

        try {
            setLoading(true)
            const response = await orderAPI.updatePaymentStatus(
                selectedOrder._id,
                values
            )
            if (response?.status === 200) {
                message.success('Cập nhật trạng thái thanh toán thành công')
                setPaymentModalVisible(false)
                paymentForm.resetFields()
                fetchOrders() // Refresh list

                // Update current order detail if viewing
                if (orderDetailVisible) {
                    await handleViewOrder(selectedOrder._id)
                }
            }
        } catch (error) {
            console.error('Error updating payment status:', error)
            message.error('Cập nhật trạng thái thanh toán thất bại')
        } finally {
            setLoading(false)
        }
    }

    // Auto-generate tracking number
    const handleGenerateTracking = () => {
        const selectedProvider = trackingForm.getFieldValue('shipping_provider')
        if (!selectedProvider) {
            message.warning('Vui lòng chọn đơn vị vận chuyển trước!')
            return
        }

        try {
            const trackingNumber =
                TrackingCodeGenerator.generate(selectedProvider)
            trackingForm.setFieldsValue({ tracking_number: trackingNumber })
            message.success('Đã tạo mã vận đơn tự động!')
        } catch (error) {
            message.error('Lỗi khi tạo mã vận đơn!')
            console.error('Error generating tracking:', error)
        }
    }

    // Update tracking info
    const handleUpdateTracking = async (values) => {
        if (!selectedOrder) return

        try {
            setLoading(true)
            const response = await orderAPI.updateTracking(
                selectedOrder._id,
                values
            )
            if (response?.status === 200) {
                message.success('Cập nhật thông tin vận chuyển thành công')
                setTrackingModalVisible(false)
                trackingForm.resetFields()
                fetchOrders() // Refresh list

                // Update current order detail if viewing
                if (orderDetailVisible) {
                    await handleViewOrder(selectedOrder._id)
                }
            }
        } catch (error) {
            console.error('Error updating tracking info:', error)
            message.error('Cập nhật thông tin vận chuyển thất bại')
        } finally {
            setLoading(false)
        }
    }

    // Get table columns
    const getTableColumns = () => [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'order_number',
            key: 'order_number',
            width: 140,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: '#1890ff' }}>
                        {text}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 200,
            render: (_, record) => {
                const address = record.shipping_address
                return (
                    <Space direction="vertical" size={0}>
                        <Text strong>{address?.full_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <PhoneOutlined /> {address?.phone}
                        </Text>
                    </Space>
                )
            },
        },
        {
            title: 'Sản phẩm',
            key: 'items',
            width: 200,
            render: (_, record) => {
                const firstItem = record.items?.[0]
                const itemCount = record.items?.length || 0

                return (
                    <Space direction="vertical" size={2}>
                        <Text strong>{itemCount} sản phẩm</Text>
                        <div
                            style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '160px',
                            }}
                        >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {firstItem?.product_name}
                                {itemCount > 1 &&
                                    ` và ${itemCount - 1} sản phẩm khác`}
                            </Text>
                        </div>
                    </Space>
                )
            },
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total',
            key: 'total',
            width: 120,
            render: (total) => (
                <Text strong style={{ color: '#52c41a' }}>
                    {formatPrice(total)}
                </Text>
            ),
        },
        {
            title: 'Trạng thái đơn hàng',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status) => {
                const config = ORDER_STATUS[status]
                return (
                    <Tag color={config?.color} icon={config?.icon}>
                        {config?.text || status}
                    </Tag>
                )
            },
        },
        {
            title: 'Thanh toán',
            dataIndex: 'payment_status',
            key: 'payment_status',
            width: 120,
            render: (paymentStatus) => {
                const config = PAYMENT_STATUS[paymentStatus]
                return (
                    <Tag color={config?.color}>
                        {config?.text || paymentStatus}
                    </Tag>
                )
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 180,
            fixed: 'right',
            render: (_, record) => (
                <Space wrap>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewOrder(record._id)}
                        />
                    </Tooltip>
                    <Tooltip title="Cập nhật trạng thái">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setSelectedOrder(record)
                                setStatusModalVisible(true)
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Thanh toán">
                        <Button
                            size="small"
                            icon={<DollarOutlined />}
                            onClick={() => {
                                setSelectedOrder(record)
                                setPaymentModalVisible(true)
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Vận chuyển">
                        <Button
                            size="small"
                            icon={<TruckOutlined />}
                            onClick={() => {
                                setSelectedOrder(record)
                                // Find the provider ID from the provider name if it exists
                                let providerValue =
                                    record.shipping_provider || ''
                                if (record.shipping_provider) {
                                    const provider = Object.values(
                                        SHIPPING_PROVIDERS
                                    ).find(
                                        (p) =>
                                            p.name ===
                                                record.shipping_provider ||
                                            p.id === record.shipping_provider ||
                                            p.code === record.shipping_provider
                                    )
                                    providerValue = provider
                                        ? provider.id
                                        : record.shipping_provider
                                }

                                trackingForm.setFieldsValue({
                                    tracking_number:
                                        record.tracking_number || '',
                                    shipping_provider: providerValue,
                                })
                                setTrackingModalVisible(true)
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ]

    // Order Detail Component (will be rendered as Drawer)
    const OrderDetailDrawer = () => {
        if (!selectedOrder) return null

        const getStatusSteps = () => {
            const statusFlow = [
                'pending',
                'confirmed',
                'processing',
                'shipping',
                'delivered',
            ]
            const currentIndex = statusFlow.indexOf(selectedOrder.status)

            if (
                selectedOrder.status === 'cancelled' ||
                selectedOrder.status === 'returned'
            ) {
                return null
            }

            return (
                <Steps
                    current={currentIndex}
                    size="small"
                    style={{ marginBottom: 24 }}
                >
                    <Step title="Chờ xác nhận" icon={<ClockCircleOutlined />} />
                    <Step title="Đã xác nhận" icon={<CheckCircleOutlined />} />
                    <Step title="Đang xử lý" icon={<ShoppingOutlined />} />
                    <Step title="Đang giao hàng" icon={<TruckOutlined />} />
                    <Step title="Đã giao hàng" icon={<CheckCircleOutlined />} />
                </Steps>
            )
        }

        return (
            <Drawer
                title={`Chi tiết đơn hàng #${selectedOrder.order_number}`}
                placement="right"
                width={800}
                open={orderDetailVisible}
                onClose={() => setOrderDetailVisible(false)}
                extra={
                    <Space>
                        <Button
                            onClick={() => handleViewOrder(selectedOrder._id)}
                            icon={<ReloadOutlined />}
                        >
                            Làm mới
                        </Button>
                    </Space>
                }
            >
                <div style={{ padding: '0 8px' }}>
                    {/* Order Status Progress */}
                    {getStatusSteps()}

                    {/* Order Overview */}
                    <Card
                        title="Thông tin đơn hàng"
                        style={{ marginBottom: 16 }}
                    >
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Mã đơn hàng" span={2}>
                                <Space>
                                    <Text strong style={{ color: '#1890ff' }}>
                                        {selectedOrder.order_number}
                                    </Text>
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                selectedOrder.order_number
                                            )
                                            message.success(
                                                'Đã copy mã đơn hàng'
                                            )
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày đặt hàng">
                                <Space direction="vertical" size={0}>
                                    <Text>
                                        {dayjs(selectedOrder.createdAt).format(
                                            'DD/MM/YYYY'
                                        )}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        {dayjs(selectedOrder.createdAt).format(
                                            'HH:mm:ss'
                                        )}
                                    </Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag
                                    color={
                                        ORDER_STATUS[selectedOrder.status]
                                            ?.color
                                    }
                                    icon={
                                        ORDER_STATUS[selectedOrder.status]?.icon
                                    }
                                >
                                    {ORDER_STATUS[selectedOrder.status]?.text ||
                                        selectedOrder.status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thanh toán">
                                <Tag
                                    color={
                                        PAYMENT_STATUS[
                                            selectedOrder.payment_status
                                        ]?.color
                                    }
                                >
                                    {PAYMENT_STATUS[
                                        selectedOrder.payment_status
                                    ]?.text || selectedOrder.payment_status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Phương thức thanh toán">
                                <Text>Thanh toán khi nhận hàng (COD)</Text>
                            </Descriptions.Item>
                            {selectedOrder.tracking_number && (
                                <Descriptions.Item label="Mã vận đơn" span={2}>
                                    <Space>
                                        <Text strong>
                                            {selectedOrder.tracking_number}
                                        </Text>
                                        {selectedOrder.shipping_provider && (
                                            <Text type="secondary">
                                                (
                                                {
                                                    selectedOrder.shipping_provider
                                                }
                                                )
                                            </Text>
                                        )}
                                    </Space>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>

                    {/* Customer Information */}
                    <Card
                        title="Thông tin khách hàng"
                        style={{ marginBottom: 16 }}
                    >
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Họ và tên">
                                <Text strong>
                                    {selectedOrder.shipping_address?.full_name}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                <Text>
                                    <PhoneOutlined />{' '}
                                    {selectedOrder.shipping_address?.phone}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ giao hàng">
                                <Space direction="vertical" size={0}>
                                    <Text>
                                        {
                                            selectedOrder.shipping_address
                                                ?.address_line
                                        }
                                    </Text>
                                    <Text type="secondary">
                                        <EnvironmentOutlined />{' '}
                                        {
                                            selectedOrder.shipping_address?.ward
                                                ?.name
                                        }
                                        ,{' '}
                                        {
                                            selectedOrder.shipping_address
                                                ?.province?.name
                                        }
                                    </Text>
                                </Space>
                            </Descriptions.Item>
                            {selectedOrder.customer_note && (
                                <Descriptions.Item label="Ghi chú của khách hàng">
                                    <Text italic>
                                        {selectedOrder.customer_note}
                                    </Text>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>

                    {/* Order Items */}
                    <Card
                        title="Sản phẩm đặt hàng"
                        style={{ marginBottom: 16 }}
                    >
                        <List
                            dataSource={selectedOrder.items || []}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <div
                                                style={{
                                                    width: 64,
                                                    height: 64,
                                                    overflow: 'hidden',
                                                    borderRadius: 8,
                                                }}
                                            >
                                                {item.product_image ? (
                                                    <Image
                                                        src={item.product_image}
                                                        alt={item.product_name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                                                        preview={{
                                                            mask: (
                                                                <div
                                                                    style={{
                                                                        background:
                                                                            'rgba(0,0,0,0.6)',
                                                                        display:
                                                                            'flex',
                                                                        alignItems:
                                                                            'center',
                                                                        justifyContent:
                                                                            'center',
                                                                        color: 'white',
                                                                    }}
                                                                >
                                                                    Xem
                                                                </div>
                                                            ),
                                                        }}
                                                    />
                                                ) : (
                                                    <Avatar
                                                        icon={
                                                            <ShoppingOutlined />
                                                        }
                                                        size={64}
                                                        shape="square"
                                                        style={{
                                                            backgroundColor:
                                                                '#f5f5f5',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        }
                                        title={
                                            <Space
                                                direction="vertical"
                                                size={0}
                                            >
                                                <Space>
                                                    <Text strong>
                                                        {item.product_name}
                                                    </Text>
                                                    {/* Hiển thị trạng thái product cho admin */}
                                                    {item.product_id && (
                                                        <Space size={4}>
                                                            {!item.product_id
                                                                .isPublished && (
                                                                <Tag
                                                                    color="orange"
                                                                    size="small"
                                                                >
                                                                    Chưa publish
                                                                </Tag>
                                                            )}
                                                            {!item.product_id
                                                                .is_active && (
                                                                <Tag
                                                                    color="red"
                                                                    size="small"
                                                                >
                                                                    Inactive
                                                                </Tag>
                                                            )}
                                                            {item.product_id
                                                                .status ===
                                                                'out_of_stock' && (
                                                                <Tag
                                                                    color="volcano"
                                                                    size="small"
                                                                >
                                                                    Hết hàng
                                                                </Tag>
                                                            )}
                                                        </Space>
                                                    )}
                                                </Space>
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    SKU: {item.variant_sku}
                                                </Text>
                                            </Space>
                                        }
                                        description={
                                            <Space
                                                direction="vertical"
                                                size={0}
                                            >
                                                <Text>
                                                    Màu: {item.variant_color} |
                                                    Size: {item.variant_size}
                                                </Text>
                                                <Text type="secondary">
                                                    Số lượng: {item.quantity} x{' '}
                                                    {formatPrice(item.price)}
                                                </Text>
                                            </Space>
                                        }
                                    />
                                    <div style={{ textAlign: 'right' }}>
                                        <Text
                                            strong
                                            style={{ color: '#52c41a' }}
                                        >
                                            {formatPrice(item.subtotal)}
                                        </Text>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* Order Summary */}
                    <Card title="Tổng kết đơn hàng">
                        <div style={{ textAlign: 'right' }}>
                            <Space
                                direction="vertical"
                                size="small"
                                style={{ width: '100%' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Text>Tạm tính:</Text>
                                    <Text>
                                        {formatPrice(selectedOrder.subtotal)}
                                    </Text>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Text>Phí vận chuyển:</Text>
                                    <Text>
                                        {formatPrice(
                                            selectedOrder.shipping_fee || 0
                                        )}
                                    </Text>
                                </div>
                                {selectedOrder.discount > 0 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Text>Giảm giá:</Text>
                                        <Text style={{ color: '#f5222d' }}>
                                            -
                                            {formatPrice(
                                                selectedOrder.discount
                                            )}
                                        </Text>
                                    </div>
                                )}
                                <Divider style={{ margin: '8px 0' }} />
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Text strong style={{ fontSize: 16 }}>
                                        Tổng cộng:
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 16,
                                            color: '#52c41a',
                                        }}
                                    >
                                        {formatPrice(selectedOrder.total)}
                                    </Text>
                                </div>
                            </Space>
                        </div>
                    </Card>

                    {/* Status History */}
                    {selectedOrder.status_history &&
                        selectedOrder.status_history.length > 0 && (
                            <Card
                                title="Lịch sử trạng thái"
                                style={{ marginTop: 16 }}
                            >
                                <List
                                    dataSource={selectedOrder.status_history.sort(
                                        (a, b) =>
                                            new Date(b.updated_at) -
                                            new Date(a.updated_at)
                                    )}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        icon={
                                                            ORDER_STATUS[
                                                                item.status
                                                            ]?.icon
                                                        }
                                                    />
                                                }
                                                title={
                                                    <Space>
                                                        <Text strong>
                                                            {ORDER_STATUS[
                                                                item.status
                                                            ]?.text ||
                                                                item.status}
                                                        </Text>
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {dayjs(
                                                                item.updated_at
                                                            ).format(
                                                                'DD/MM/YYYY HH:mm'
                                                            )}
                                                        </Text>
                                                    </Space>
                                                }
                                                description={item.note}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}
                </div>
            </Drawer>
        )
    }

    return (
        <div>
            <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: 24 }}
            >
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        Quản lý Đơn hàng
                    </Title>
                </Col>
                <Col>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchOrders()}
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                </Col>
            </Row>

            {/* Tabs for separating active and cancelled orders */}
            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                style={{ marginBottom: 24 }}
            >
                <TabPane
                    tab={
                        <span>
                            <ShoppingOutlined />
                            Đơn hàng hoạt động
                        </span>
                    }
                    key="active"
                >
                    {/* Filters Card for Active Orders */}
                    <Card style={{ marginBottom: 24 }}>
                        <Row gutter={[16, 16]} align="bottom">
                            <Col xs={24} sm={8} md={6}>
                                <Text strong>Tìm kiếm:</Text>
                                <Input
                                    placeholder="Mã đơn hàng, tên khách hàng..."
                                    prefix={<SearchOutlined />}
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            search: e.target.value,
                                        }))
                                    }
                                    onPressEnter={handleSearch}
                                />
                            </Col>
                            <Col xs={24} sm={8} md={6}>
                                <Text strong>Trạng thái đơn hàng:</Text>
                                <Select
                                    placeholder="Tất cả trạng thái"
                                    style={{ width: '100%' }}
                                    value={filters.status}
                                    onChange={(value) => {
                                        setFilters((prev) => ({
                                            ...prev,
                                            status: value,
                                        }))
                                        setPagination((prev) => ({
                                            ...prev,
                                            current: 1,
                                        }))
                                        // FIX: Call fetchOrders immediately with the new value instead of waiting for state update
                                        fetchOrders({ status: value })
                                    }}
                                    allowClear
                                >
                                    {Object.entries(ORDER_STATUS)
                                        .filter(
                                            ([key]) =>
                                                ![
                                                    'cancelled',
                                                    'returned',
                                                ].includes(key)
                                        )
                                        .map(([key, config]) => (
                                            <Option key={key} value={key}>
                                                <Space>
                                                    {config.icon}
                                                    {config.text}
                                                </Space>
                                            </Option>
                                        ))}
                                </Select>
                            </Col>
                            <Col xs={24} sm={8} md={6}>
                                <Text strong>Trạng thái thanh toán:</Text>
                                <Select
                                    placeholder="Tất cả trạng thái"
                                    style={{ width: '100%' }}
                                    value={filters.payment_status}
                                    onChange={(value) => {
                                        setFilters((prev) => ({
                                            ...prev,
                                            payment_status: value,
                                        }))
                                        setPagination((prev) => ({
                                            ...prev,
                                            current: 1,
                                        }))
                                        setTimeout(() => fetchOrders(), 100)
                                    }}
                                    allowClear
                                >
                                    {Object.entries(PAYMENT_STATUS).map(
                                        ([key, config]) => (
                                            <Option key={key} value={key}>
                                                {config.text}
                                            </Option>
                                        )
                                    )}
                                </Select>
                            </Col>
                            <Col xs={24} sm={24} md={6}>
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={handleSearch}
                                    >
                                        Tìm kiếm
                                    </Button>
                                    <Button onClick={handleReset}>
                                        Đặt lại
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    {/* Active Orders Table */}
                    <Card>
                        <Spin spinning={loading}>
                            <Table
                                columns={getTableColumns()}
                                dataSource={orders}
                                rowKey="_id"
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) =>
                                        `${range[0]}-${range[1]} của ${total} đơn hàng hoạt động`,
                                }}
                                onChange={handleTableChange}
                                scroll={{ x: 1200 }}
                            />
                        </Spin>
                    </Card>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            <CloseCircleOutlined />
                            Đơn hàng đã hủy/trả
                        </span>
                    }
                    key="cancelled"
                >
                    {/* Filters Card for Cancelled Orders */}
                    <Card style={{ marginBottom: 24 }}>
                        <Row gutter={[16, 16]} align="bottom">
                            <Col xs={24} sm={12} md={8}>
                                <Text strong>Tìm kiếm:</Text>
                                <Input
                                    placeholder="Mã đơn hàng, tên khách hàng..."
                                    prefix={<SearchOutlined />}
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            search: e.target.value,
                                        }))
                                    }
                                    onPressEnter={handleSearch}
                                />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Text strong>Loại:</Text>
                                <Select
                                    placeholder="Tất cả"
                                    style={{ width: '100%' }}
                                    value={filters.status}
                                    onChange={(value) => {
                                        setFilters((prev) => ({
                                            ...prev,
                                            status: value,
                                        }))
                                        setPagination((prev) => ({
                                            ...prev,
                                            current: 1,
                                        }))
                                        setTimeout(() => fetchOrders(), 100)
                                    }}
                                    allowClear
                                >
                                    <Option value="cancelled">
                                        <Space>
                                            <CloseCircleOutlined />
                                            Đã hủy
                                        </Space>
                                    </Option>
                                    <Option value="returned">
                                        <Space>
                                            <ExclamationCircleOutlined />
                                            Trả hàng
                                        </Space>
                                    </Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={24} md={8}>
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={handleSearch}
                                    >
                                        Tìm kiếm
                                    </Button>
                                    <Button onClick={handleReset}>
                                        Đặt lại
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    {/* Cancelled/Returned Orders Table */}
                    <Card>
                        <Spin spinning={loading}>
                            <Table
                                columns={getTableColumns()}
                                dataSource={orders}
                                rowKey="_id"
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) =>
                                        `${range[0]}-${range[1]} của ${total} đơn hàng đã hủy/trả`,
                                }}
                                onChange={handleTableChange}
                                scroll={{ x: 1200 }}
                            />
                        </Spin>
                    </Card>
                </TabPane>
            </Tabs>

            {/* Order Detail Drawer */}
            <OrderDetailDrawer />

            {/* Update Status Modal */}
            <Modal
                title="Cập nhật trạng thái đơn hàng"
                open={statusModalVisible}
                onCancel={() => {
                    setStatusModalVisible(false)
                    statusForm.resetFields()
                }}
                onOk={() => statusForm.submit()}
                confirmLoading={loading}
            >
                <Form
                    form={statusForm}
                    layout="vertical"
                    onFinish={handleUpdateStatus}
                >
                    <Form.Item
                        name="status"
                        label="Trạng thái mới"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng chọn trạng thái',
                            },
                        ]}
                    >
                        <Select placeholder="Chọn trạng thái">
                            {(() => {
                                // Define valid transitions based on backend logic
                                const validTransitions = {
                                    pending: ['confirmed', 'cancelled'],
                                    confirmed: ['processing', 'cancelled'],
                                    processing: ['shipping', 'cancelled'],
                                    shipping: ['delivered', 'cancelled'],
                                    delivered: ['returned'],
                                    cancelled: [],
                                    returned: [],
                                }

                                const currentStatus = selectedOrder?.status
                                const allowedStatuses =
                                    validTransitions[currentStatus] || []

                                return allowedStatuses
                                    .map((status) => {
                                        const config = ORDER_STATUS[status]
                                        if (!config) return null

                                        return (
                                            <Option key={status} value={status}>
                                                <Space>
                                                    {config.icon}
                                                    {config.text}
                                                </Space>
                                            </Option>
                                        )
                                    })
                                    .filter(Boolean)
                            })()}
                        </Select>
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú (tùy chọn)">
                        <TextArea rows={3} placeholder="Nhập ghi chú..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Update Payment Status Modal */}
            <Modal
                title="Cập nhật trạng thái thanh toán"
                open={paymentModalVisible}
                onCancel={() => {
                    setPaymentModalVisible(false)
                    paymentForm.resetFields()
                }}
                onOk={() => paymentForm.submit()}
                confirmLoading={loading}
            >
                <Form
                    form={paymentForm}
                    layout="vertical"
                    onFinish={handleUpdatePaymentStatus}
                >
                    <Form.Item
                        name="status"
                        label="Trạng thái thanh toán"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng chọn trạng thái thanh toán',
                            },
                        ]}
                    >
                        <Select placeholder="Chọn trạng thái">
                            {Object.entries(PAYMENT_STATUS).map(
                                ([key, config]) => (
                                    <Option key={key} value={key}>
                                        {config.text}
                                    </Option>
                                )
                            )}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Update Tracking Modal */}
            <Modal
                title="Cập nhật thông tin vận chuyển"
                open={trackingModalVisible}
                onCancel={() => {
                    setTrackingModalVisible(false)
                    trackingForm.resetFields()
                }}
                onOk={() => trackingForm.submit()}
                confirmLoading={loading}
                width={600}
            >
                <Form
                    form={trackingForm}
                    layout="vertical"
                    onFinish={handleUpdateTracking}
                >
                    <Form.Item
                        name="shipping_provider"
                        label="Đơn vị vận chuyển"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng chọn đơn vị vận chuyển',
                            },
                        ]}
                    >
                        <Select
                            placeholder="Chọn đơn vị vận chuyển"
                            showSearch
                            filterOption={(input, option) =>
                                option.children
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {Object.values(SHIPPING_PROVIDERS).map(
                                (provider) => (
                                    <Option
                                        key={provider.id}
                                        value={provider.id}
                                    >
                                        <Space>
                                            <Text strong>{provider.name}</Text>
                                            <Text type="secondary">
                                                ({provider.code})
                                            </Text>
                                        </Space>
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                color: '#999',
                                            }}
                                        >
                                            {provider.description}
                                        </div>
                                    </Option>
                                )
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="tracking_number"
                        label="Mã vận đơn"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập mã vận đơn',
                            },
                        ]}
                    >
                        <Input.Group compact>
                            <Form.Item
                                name="tracking_number"
                                noStyle
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mã vận đơn',
                                    },
                                ]}
                            >
                                <Input
                                    style={{ width: 'calc(100% - 120px)' }}
                                    placeholder="Nhập mã vận đơn hoặc tạo tự động"
                                />
                            </Form.Item>
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={handleGenerateTracking}
                                style={{ width: '120px' }}
                            >
                                Tạo tự động
                            </Button>
                        </Input.Group>
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: '12px',
                                color: '#666',
                            }}
                        >
                            Mã vận đơn sẽ được tạo tự động dựa trên đơn vị vận
                            chuyển đã chọn
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default OrderManagement
