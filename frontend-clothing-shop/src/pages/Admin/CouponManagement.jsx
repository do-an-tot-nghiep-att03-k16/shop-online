import { useState } from 'react'
import {
    Card,
    Typography,
    Button,
    Table,
    Space,
    Tag,
    message,
    Row,
    Col,
    Input,
    Select,
    Modal,
    Form,
    InputNumber,
    Switch,
    DatePicker,
    Empty
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    GiftOutlined
} from '@ant-design/icons'
import {
    useCoupons,
    useCreateCoupon,
    useUpdateCoupon,
    useDeleteCoupon,
} from '../../hooks/useCoupons'
import { useActiveCategories } from '../../hooks/useCategories'
import { useProducts } from '../../hooks/useProducts'
import { useUsers } from '../../hooks/useUsers'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input
const { Option } = Select  
const { RangePicker } = DatePicker

const CouponManagement = () => {
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState(null)
    const [form] = Form.useForm()

    // Real data from API
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        is_active: undefined,
        apply_type: undefined
    })
    
    // Real API data using React Query hooks
    const { data: couponsData, isLoading, refetch } = useCoupons(filters)
    const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useActiveCategories()
    const { data: productsData } = useProducts({ limit: 100 })
    const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 100 })
    const createCouponMutation = useCreateCoupon()
    const updateCouponMutation = useUpdateCoupon()
    const deleteCouponMutation = useDeleteCoupon()

    // Extract data from API response
    const coupons = couponsData?.metadata?.coupons || []
    const pagination = couponsData?.metadata?.pagination || {}
    // useActiveCategories hook trả về response chuẩn với metadata
    const categories = categoriesData?.metadata?.categories || []
    const products = productsData?.metadata?.products || []
    const users = usersData?.metadata?.users || []
    
    // Debug logs

    const getApplyTypeColor = (applyType) => {
        const colors = {
            'all': 'purple',
            'category': 'blue', 
            'product': 'green',
            'mixed': 'orange'
        }
        return colors[applyType] || 'default'
    }

    const getApplyTypeText = (applyType) => {
        const texts = {
            'all': 'Tất cả',
            'category': 'Theo danh mục', 
            'product': 'Theo sản phẩm',
            'mixed': 'Hỗn hợp'
        }
        return texts[applyType] || applyType
    }

    // Security fields helpers
    const getTypeColor = (type) => {
        return type === 'private' ? 'red' : 'green'
    }

    const getTypeText = (type) => {
        return type === 'private' ? 'Riêng tư' : 'Công khai'
    }

    const getVisibilityColor = (visibility) => {
        const colors = {
            'hidden': 'default',
            'featured': 'blue',
            'landing_page': 'orange'
        }
        return colors[visibility] || 'default'
    }

    const getVisibilityText = (visibility) => {
        const texts = {
            'hidden': 'Ẩn',
            'featured': 'Nổi bật',
            'landing_page': 'Landing Page'
        }
        return texts[visibility] || visibility
    }

    const columns = [
        {
            title: 'Mã Coupon',
            dataIndex: 'code',
            key: 'code',
            render: (code) => (
                <Tag color="blue" style={{ fontFamily: 'monospace' }}>
                    {code}
                </Tag>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Loại giảm giá',
            key: 'discount',
            render: (_, record) => (
                <Tag color={record.discount_type === 'percentage' ? 'green' : 'orange'}>
                    {record.discount_type === 'percentage' 
                        ? `${record.discount_value}%` 
                        : `${record.discount_value.toLocaleString('vi-VN')}₫`
                    }
                    {record.max_discount && record.discount_type === 'percentage' && 
                        ` (Tối đa: ${record.max_discount.toLocaleString('vi-VN')}₫)`
                    }
                </Tag>
            ),
        },
        {
            title: 'Phạm vi áp dụng',
            dataIndex: 'apply_type', 
            key: 'apply_type',
            render: (applyType) => (
                <Tag color={getApplyTypeColor(applyType)}>
                    {getApplyTypeText(applyType)}
                </Tag>
            ),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={getTypeColor(type)}>
                    {getTypeText(type)}
                </Tag>
            ),
        },
        {
            title: 'Hiển thị',
            dataIndex: 'visibility',
            key: 'visibility',
            render: (visibility) => (
                <Tag color={getVisibilityColor(visibility)}>
                    {getVisibilityText(visibility)}
                </Tag>
            ),
        },
        {
            title: 'Sử dụng',
            key: 'usage',
            render: (_, record) => (
                <span>
                    {record.used_count}
                    {record.usage_limit ? `/${record.usage_limit}` : '/∞'}
                </span>
            ),
        },
        {
            title: 'Đơn hàng tối thiểu',
            dataIndex: 'min_order_value',
            key: 'min_order_value',
            render: (value) => (
                value > 0 ? `${value.toLocaleString('vi-VN')}₫` : 'Không'
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        loading={deleteCouponMutation.isLoading}
                        onClick={() => handleDelete(record._id)}
                    />
                </Space>
            ),
        },
    ]

    const handleCreate = () => {
        setEditingCoupon(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon)
        form.setFieldsValue({
            ...coupon,
            date_range: [
                dayjs(coupon.start_date),
                dayjs(coupon.end_date)
            ],
            apply_type: coupon.apply_type || 'all',
            // Security fields with defaults
            type: coupon.type || 'public',
            visibility: coupon.visibility || 'hidden',
            assigned_users: coupon.assigned_users || []
        })
        setModalVisible(true)
    }

    const handleDelete = async (id) => {
        try {
            await deleteCouponMutation.mutateAsync(id)
            refetch() // Refresh data after deletion
        } catch (error) {
            // Error handled by hook
        }
    }

    const handleSubmit = async (values) => {
        try {
            setLoading(true)
            
            // Tự động xác định apply_type nếu không được set
            let applyType = values.apply_type || 'all'
            const hasCategories = values.applicable_categories && values.applicable_categories.length > 0
            const hasProducts = values.applicable_products && values.applicable_products.length > 0
            
            if (!values.apply_type) {
                if (hasCategories && hasProducts) {
                    applyType = 'mixed'
                } else if (hasCategories) {
                    applyType = 'category'
                } else if (hasProducts) {
                    applyType = 'product'
                } else {
                    applyType = 'all'
                }
            }
            
            // Prepare coupon data for API  
            const couponData = {
                code: values.code.toUpperCase(),
                // Security fields
                type: values.type || 'public',
                visibility: values.visibility || 'hidden',
                assigned_users: values.assigned_users || [],
                description: values.description,
                discount_type: values.discount_type,
                discount_value: values.discount_value,
                min_order_value: values.min_order_value || 0,
                max_discount: values.max_discount || null,
                usage_limit: values.usage_limit || null,
                usage_limit_per_user: values.usage_limit_per_user || 1,
                is_active: values.is_active !== false,
                start_date: values.date_range[0].toISOString(),
                end_date: values.date_range[1].toISOString(),
                apply_type: applyType,
                applicable_categories: values.applicable_categories || [],
                applicable_products: values.applicable_products || []
            }
            
            // Call API using React Query mutation
            if (editingCoupon) {
                // Update existing coupon
                await updateCouponMutation.mutateAsync({
                    id: editingCoupon._id,
                    data: couponData
                })
            } else {
                // Create new coupon
                await createCouponMutation.mutateAsync(couponData)
            }
            
            setModalVisible(false)
            form.resetFields()
            refetch() // Refresh data after creation
        } catch (error) {
            // Error handled by hook
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Header Card */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Search
                            placeholder="Tìm kiếm theo mã hoặc mô tả..."
                            allowClear
                            size="large"
                            onSearch={(value) => setFilters(prev => ({ ...prev, search: value, page: 1 }))}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                        <Select
                            placeholder="Trạng thái"
                            allowClear
                            size="large"
                            onChange={(value) => setFilters(prev => ({ ...prev, is_active: value, page: 1 }))}
                            style={{ width: '100%' }}
                        >
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Tạm dừng</Option>
                        </Select>
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                        <Select
                            placeholder="Phạm vi"
                            allowClear
                            size="large"
                            onChange={(value) => setFilters(prev => ({ ...prev, apply_type: value, page: 1 }))}
                            style={{ width: '100%' }}
                        >
                            <Option value="all">Tất cả</Option>
                            <Option value="category">Danh mục</Option>
                            <Option value="product">Sản phẩm</Option>
                            <Option value="mixed">Hỗn hợp</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleCreate}
                        >
                            Tạo mã giảm giá
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Table Card */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={coupons}
                    rowKey="_id"
                    loading={isLoading}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div>
                                        <Typography.Title level={4} style={{ color: '#8c8c8c', marginBottom: 8 }}>
                                            Chưa có mã giảm giá nào
                                        </Typography.Title>
                                        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                                            Tạo mã giảm giá đầu tiên để bắt đầu chương trình khuyến mãi
                                        </Typography.Text>
                                    </div>
                                }
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleCreate}
                                    style={{
                                        borderRadius: '6px',
                                        height: '40px',
                                        paddingLeft: '20px',
                                        paddingRight: '20px'
                                    }}
                                >
                                    Tạo mã giảm giá đầu tiên
                                </Button>
                            </Empty>
                        )
                    }}
                    scroll={{ x: 1200 }}
                    size="middle"
                    pagination={coupons.length > 0 ? {
                        total: pagination.total || coupons.length,
                        current: pagination.page || filters.page,
                        pageSize: pagination.limit || filters.limit,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Tổng ${total} mã giảm giá`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, pageSize) => {
                            setFilters(prev => ({ ...prev, page, limit: pageSize }))
                        }
                    } : false}
                />
            </Card>

            {/* Modal Form */}
            <Modal
                title={editingCoupon ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false)
                    setEditingCoupon(null)
                    form.resetFields()
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    preserve={false}
                >
                    <Row gutter={[16, 0]}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Mã giảm giá"
                                rules={[{ required: true, message: 'Vui lòng nhập mã giảm giá' }]}
                            >
                                <Input 
                                    placeholder="VD: SALE20, GIAM50K..." 
                                    style={{ textTransform: 'uppercase' }}
                                    onChange={(e) => {
                                        const value = e.target.value.toUpperCase()
                                        form.setFieldValue('code', value)
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="is_active"
                                label="Trạng thái"
                                valuePropName="checked"
                                initialValue={true}
                            >
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="Mô tả chi tiết"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả cho mã giảm giá' }]}
                    >
                        <Input.TextArea 
                            rows={2} 
                            placeholder="VD: Giảm giá 20% cho khách hàng mới, áp dụng cho đơn hàng đầu tiên..." 
                        />
                    </Form.Item>

                    <Row gutter={[16, 0]}>
                        <Col span={12}>
                            <Form.Item
                                name="discount_type"
                                label="Loại giảm giá"
                                rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
                            >
                                <Select placeholder="Chọn loại">
                                    <Option value="percentage">Phần trăm (%)</Option>
                                    <Option value="fixed">Số tiền cố định (₫)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="discount_value"
                                label="Giá trị giảm"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập giá trị' },
                                    { type: 'number', min: 0.01, message: 'Giá trị phải lớn hơn 0' },
                                    {
                                        validator: (_, value) => {
                                            const discountType = form.getFieldValue('discount_type')
                                            if (discountType === 'percentage' && value > 100) {
                                                return Promise.reject('Phần trăm giảm giá không được vượt quá 100%')
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Nhập giá trị"
                                    min={0.01}
                                    max={form.getFieldValue('discount_type') === 'percentage' ? 100 : undefined}
                                    formatter={(value) => {
                                        const discountType = form.getFieldValue('discount_type')
                                        if (discountType === 'percentage') {
                                            return value ? `${value}%` : ''
                                        }
                                        return value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                                    }}
                                    parser={(value) => {
                                        return value.replace(/[^\d.]/g, '')
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Max Discount - Chỉ hiện khi discount_type = percentage */}
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
                        prevValues.discount_type !== currentValues.discount_type
                    }>
                        {({ getFieldValue }) => {
                            const discountType = getFieldValue('discount_type')
                            return discountType === 'percentage' ? (
                                <Form.Item
                                    name="max_discount"
                                    label="Giảm giá tối đa (₫)"
                                    tooltip="Áp dụng cho loại giảm phần trăm. Để trống = không giới hạn"
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder="Không giới hạn"
                                        min={1000}
                                        step={1000}
                                        formatter={(value) =>
                                            value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                                        }
                                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                    />
                                </Form.Item>
                            ) : null
                        }}
                    </Form.Item>

                    <Row gutter={[16, 0]}>
                        <Col span={24}>
                            <Form.Item
                                name="min_order_value"
                                label="Đơn hàng tối thiểu (₫)"
                                initialValue={0}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    formatter={(value) =>
                                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                    }
                                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                        <Col span={8}>
                            <Form.Item
                                name="usage_limit"
                                label="Tổng số lần sử dụng"
                                tooltip="Để trống = không giới hạn"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Không giới hạn"
                                    min={1}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="usage_limit_per_user"
                                label="Số lần/người dùng"
                                initialValue={1}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số lần' },
                                    { type: 'number', min: 1, message: 'Tối thiểu 1 lần' }
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={1}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                        <Col span={24}>
                            <Form.Item
                                name="date_range"
                                label="Thời gian hiệu lực"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian hiệu lực' }]}
                            >
                                <RangePicker
                                    style={{ width: '100%' }}
                                    showTime={{ format: 'HH:mm' }}
                                    format="DD/MM/YYYY HH:mm"
                                    placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Security Fields */}
                    <Row gutter={[16, 0]}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Loại Coupon"
                                initialValue="public"
                                rules={[{ required: true, message: 'Vui lòng chọn loại coupon' }]}
                            >
                                <Select placeholder="Chọn loại coupon">
                                    <Option value="public">Công khai</Option>
                                    <Option value="private">Riêng tư</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="visibility"
                                label="Hiển thị"
                                initialValue="hidden"
                                rules={[{ required: true, message: 'Vui lòng chọn cách hiển thị' }]}
                            >
                                <Select placeholder="Chọn cách hiển thị">
                                    <Option value="hidden">Ẩn</Option>
                                    <Option value="featured">Nổi bật</Option>
                                    <Option value="landing_page">Landing Page</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Assigned Users - Chỉ hiện khi type = private */}
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
                        prevValues.type !== currentValues.type
                    }>
                        {({ getFieldValue }) => {
                            const couponType = getFieldValue('type')
                            return couponType === 'private' ? (
                                <Form.Item
                                    name="assigned_users"
                                    label="Người dùng được phép"
                                    tooltip="Để trống nếu muốn tất cả user đã đăng nhập có thể sử dụng (chỉ ẩn khỏi danh sách công khai)"
                                    rules={[{ required: false }]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Chọn người dùng..."
                                        showSearch
                                        filterOption={(input, option) =>
                                            option?.children?.toLowerCase().includes(input.toLowerCase())
                                        }
                                        loading={usersLoading}
                                        notFoundContent={usersLoading ? 'Đang tải...' : 'Không có dữ liệu'}
                                    >
                                        {users.map(user => (
                                            <Option key={user._id} value={user._id}>
                                                {user.name} ({user.email})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : null
                        }}
                    </Form.Item>

                    {/* Apply Type */}
                    <Form.Item
                        name="apply_type"
                        label="Phạm vi áp dụng"
                        initialValue="all"
                        tooltip="Quy định coupon áp dụng cho đối tượng nào"
                    >
                        <Select 
                            placeholder="Chọn phạm vi áp dụng"
                            onChange={(value) => {
                                // Reset categories/products khi thay đổi apply_type
                                if (value === 'all') {
                                    form.setFieldsValue({
                                        applicable_categories: [],
                                        applicable_products: []
                                    })
                                } else if (value === 'category') {
                                    form.setFieldsValue({
                                        applicable_products: []
                                    })
                                } else if (value === 'product') {
                                    form.setFieldsValue({
                                        applicable_categories: []
                                    })
                                }
                            }}
                        >
                            <Option value="all">
                                <div>
                                    <strong>Tất cả đơn hàng</strong>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                        Áp dụng cho mọi đơn hàng, không giới hạn
                                    </div>
                                </div>
                            </Option>
                            <Option value="category">
                                <div>
                                    <strong>Chỉ danh mục cụ thể</strong>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                        Chỉ áp dụng cho các danh mục được chọn
                                    </div>
                                </div>
                            </Option>
                            <Option value="product">
                                <div>
                                    <strong>Chỉ sản phẩm cụ thể</strong>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                        Chỉ áp dụng cho các sản phẩm được chọn
                                    </div>
                                </div>
                            </Option>
                            <Option value="mixed">
                                <div>
                                    <strong>Hỗn hợp</strong>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                        Áp dụng cho cả danh mục và sản phẩm
                                    </div>
                                </div>
                            </Option>
                        </Select>
                    </Form.Item>

                    {/* Dynamic Categories & Products based on apply_type */}
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
                        prevValues.apply_type !== currentValues.apply_type
                    }>
                        {({ getFieldValue }) => {
                            const applyType = getFieldValue('apply_type')
                            const showCategories = ['category', 'mixed'].includes(applyType)
                            const showProducts = ['product', 'mixed'].includes(applyType)

                            return (
                                <Row gutter={[16, 0]}>
                                    {showCategories && (
                                        <Col span={showProducts ? 12 : 24}>
                                            <Form.Item
                                                name="applicable_categories"
                                                label="Áp dụng cho danh mục"
                                                rules={applyType === 'category' ? [
                                                    { required: true, message: 'Vui lòng chọn ít nhất một danh mục' }
                                                ] : []}
                                            >
                                                <Select
                                                    mode="multiple"
                                                    placeholder="Chọn danh mục..."
                                                    allowClear
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    style={{ width: '100%' }}
                                                    loading={categoriesLoading}
                                                >
                                                    {categories && categories.length > 0 ? (
                                                        categories.map((category) => (
                                                            <Option key={category._id} value={category._id}>
                                                                {category.name}
                                                            </Option>
                                                        ))
                                                    ) : (
                                                        <Option disabled value="">
                                                            {categoriesLoading ? 'Đang tải...' : 'Không có danh mục nào'}
                                                        </Option>
                                                    )}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    )}
                                    
                                    {showProducts && (
                                        <Col span={showCategories ? 12 : 24}>
                                            <Form.Item
                                                name="applicable_products"
                                                label="Áp dụng cho sản phẩm"
                                                rules={applyType === 'product' ? [
                                                    { required: true, message: 'Vui lòng chọn ít nhất một sản phẩm' }
                                                ] : []}
                                            >
                                                <Select
                                                    mode="multiple"
                                                    placeholder="Chọn sản phẩm..."
                                                    allowClear
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    style={{ width: '100%' }}
                                                >
                                                    {products && products.length > 0 ? (
                                                        products.map((product) => (
                                                            <Option key={product._id} value={product._id}>
                                                                {product.name}
                                                            </Option>
                                                        ))
                                                    ) : (
                                                        <Option disabled value="">
                                                            {productsData ? 'Không có sản phẩm nào' : 'Đang tải...'}
                                                        </Option>
                                                    )}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>
                            )
                        }}
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading || createCouponMutation.isLoading || updateCouponMutation.isLoading}
                                style={{
                                    background: 'linear-gradient(45deg, #b77574, #c48783)',
                                    border: 'none',
                                }}
                            >
                                {editingCoupon ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default CouponManagement