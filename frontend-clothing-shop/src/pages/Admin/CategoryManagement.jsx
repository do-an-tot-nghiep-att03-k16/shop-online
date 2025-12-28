import { useState, useEffect, useMemo } from 'react'
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Switch,
    Tag,
    Row,
    Col,
    Card,
    Typography,
    Tooltip,
    Popconfirm,
    Select,
    TreeSelect,
    Upload,
    message,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UploadOutlined,
    LoadingOutlined,
} from '@ant-design/icons'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../config/permissions'
import {
    useCategories,
    useSearchCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    usePublishCategory,
    useUnpublishCategory,
    useParentCategories,
    useUploadCategoryImage, // Hook upload ảnh
} from '../../hooks/useCategories'

const { Title } = Typography
const { TextArea } = Input

const CategoryManagement = () => {
    // States
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    })
    const [searchText, setSearchText] = useState('')
    const [debouncedSearchText, setDebouncedSearchText] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // Upload states
    const [imageData, setImageData] = useState(null) // {image_id, image_url, image_name}
    const [previewImage, setPreviewImage] = useState(null) // Preview URL khi chọn file

    const [form] = Form.useForm()
    const { can } = usePermission()

    // Permissions
    const canCreate = can(PERMISSIONS.CREATE_CATEGORY)
    const canUpdate = can(PERMISSIONS.UPDATE_CATEGORY)
    const canDelete = can(PERMISSIONS.DELETE_CATEGORY)

    // React Query Hooks
    const { data: categoriesData, isLoading } = useCategories({
        page: pagination.current,
        limit: pagination.pageSize,
    })

    const { data: searchData } = useSearchCategories(debouncedSearchText, {
        page: 1,
        limit: 20,
    })

    // === HOOK MỚI: Lấy parent categories cho dropdown ===
    const { data: parentCategories, isLoading: isLoadingParents } =
        useParentCategories()

    const createMutation = useCreateCategory()
    const updateMutation = useUpdateCategory()
    const deleteMutation = useDeleteCategory()
    const publishMutation = usePublishCategory()
    const unpublishMutation = useUnpublishCategory()
    const uploadImageMutation = useUploadCategoryImage()

    // Debounce search text
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText)
            if (searchText.trim()) {
                setIsSearching(true)
            } else {
                setIsSearching(false)
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [searchText])

    // Get data from correct source
    const displayData = isSearching ? searchData : categoriesData
    const categories = displayData?.metadata?.categories || []
    const total = displayData?.metadata?.pagination?.total || 0

    // Handle table change
    const handleTableChange = (newPagination) => {
        setPagination({
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        })
    }

    // Open create modal
    const handleCreate = () => {
        setEditingCategory(null)
        form.resetFields()
        setImageData(null)
        setPreviewImage(null)
        setIsModalOpen(true)
    }

    // Open edit modal
    const handleEdit = (record) => {
        setEditingCategory(record)
        form.setFieldsValue({
            name: record.name,
            description: record.description,
            is_active: record.is_active,
            parentId: record.parentId || undefined, // Thêm parentId
        })
        // Set existing image data if available
        if (record.image_id || record.images?.medium) {
            setImageData({
                image_id: record.image_id,
                image_url:
                    typeof record.images?.medium === 'string'
                        ? record.images.medium
                        : record.images?.medium?.url || record.image_url,
                image_name: record.name || 'Existing image',
            })
        }
        setIsModalOpen(true)
    }

    // Handle form submit
    const handleSubmit = async (values) => {
        try {
            // Include image_id in form data
            const formData = {
                ...values,
                image_id: imageData?.image_id || null,
            }

            if (editingCategory) {
                await updateMutation.mutateAsync({
                    categoryId: editingCategory._id,
                    data: formData,
                })
            } else {
                await createMutation.mutateAsync(formData)
            }

            setIsModalOpen(false)
            form.resetFields()
            setEditingCategory(null)
            setImageData(null)
        } catch (error) {
            console.error('Error saving category:', error)
        }
    }

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await deleteMutation.mutateAsync(id)
        } catch (error) {
            console.error('Error deleting category:', error)
        }
    }

    // Handle toggle publish
    const handleTogglePublish = async (record) => {
        try {
            if (record.isPublished) {
                await unpublishMutation.mutateAsync(record._id)
            } else {
                await publishMutation.mutateAsync(record._id)
            }
        } catch (error) {
            console.error('Error toggling publish:', error)
        }
    }

    // Handle search
    const handleSearch = () => {
        if (!searchText.trim()) {
            setIsSearching(false)
            return
        }
        setIsSearching(true)
    }

    // Reset search
    const handleResetSearch = () => {
        setSearchText('')
        setDebouncedSearchText('')
        setIsSearching(false)
    }

    // === HÀM TÌM TÊN PARENT ===
    const getParentName = (parentId) => {
        if (!parentId || !parentCategories) return null
        const parent = parentCategories.find((cat) => cat._id === parentId)
        return parent?.name
    }

    // === HÀM XỬ LÝ UPLOAD ẢNH ===
    const handleUpload = async (file) => {
        try {
            // Tạo preview URL ngay lập tức
            const previewUrl = URL.createObjectURL(file)
            setPreviewImage(previewUrl)

            const uploadData = await uploadImageMutation.mutateAsync(file)

            setImageData({
                image_id: uploadData.image_id,
                image_url: uploadData.image_url,
                image_name: uploadData.image_name,
            })

            // Clear preview sau khi upload thành công
            setPreviewImage(null)
            URL.revokeObjectURL(previewUrl) // Cleanup memory

            message.success('Upload ảnh thành công!')
        } catch (error) {
            // Clear preview nếu upload thất bại
            setPreviewImage(null)
            console.error('Upload error:', error)
        }

        return false // Prevent default upload behavior
    }

    // Xóa ảnh đã upload
    const handleRemoveImage = () => {
        setImageData(null)
        setPreviewImage(null)
        message.success('Đã xóa ảnh')
    }

    // Table columns
    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 100,
            render: (images, record) => {
                // Backend trả về images object: {thumbnail, medium, large}
                let imageUrl = 'https://via.placeholder.com/60'

                if (images?.thumbnail) {
                    // Backend trả về string URL trực tiếp, không phải object
                    imageUrl =
                        typeof images.thumbnail === 'string'
                            ? images.thumbnail
                            : images.thumbnail.url
                } else if (record.image_url) {
                    // Fallback cho data cũ
                    imageUrl = record.image_url
                } else {
                    console.log('❌ No image found, using placeholder')
                }

                return (
                    <img
                        src={imageUrl}
                        alt="category"
                        style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 8,
                        }}
                        onError={(e) => {
                            console.log('❌ Image load error:', imageUrl)
                            e.target.src = 'https://via.placeholder.com/60'
                        }}
                    />
                )
            },
        },
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                        /{record.slug}
                    </div>
                    {/* === HIỂN THỊ PARENT NẾU CÓ === */}
                    {record.parentId && (
                        <div
                            style={{
                                fontSize: 12,
                                color: '#1890ff',
                                marginTop: 4,
                            }}
                        >
                            📁 {getParentName(record.parentId)}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) =>
                text || <span style={{ color: '#999' }}>---</span>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 120,
            filters: [
                { text: 'Active', value: true },
                { text: 'Inactive', value: false },
            ],
            onFilter: (value, record) => record.is_active === value,
            render: (_, record) => (
                <Tag color={record.is_active ? 'green' : 'red'}>
                    {record.is_active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Xuất bản',
            key: 'published',
            width: 120,
            filters: [
                { text: 'Published', value: true },
                { text: 'Draft', value: false },
            ],
            onFilter: (value, record) => record.isPublished === value,
            render: (_, record) => (
                <Tag color={record.isPublished ? 'blue' : 'default'}>
                    {record.isPublished ? 'Published' : 'Draft'}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>

                    {canUpdate && (
                        <>
                            <Tooltip
                                title={record.isPublished ? 'Ẩn' : 'Xuất bản'}
                            >
                                <Button
                                    type="text"
                                    icon={
                                        record.isPublished ? (
                                            <CloseCircleOutlined />
                                        ) : (
                                            <CheckCircleOutlined />
                                        )
                                    }
                                    onClick={() => handleTogglePublish(record)}
                                    loading={
                                        publishMutation.isLoading ||
                                        unpublishMutation.isLoading
                                    }
                                />
                            </Tooltip>

                            <Tooltip title="Chỉnh sửa">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(record)}
                                />
                            </Tooltip>
                        </>
                    )}

                    {canDelete && (
                        <Popconfirm
                            title="Xóa danh mục"
                            description="Bạn có chắc muốn xóa danh mục này?"
                            onConfirm={() => handleDelete(record._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Xóa">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    loading={deleteMutation.isLoading}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ]

    return (
        <div>
            {/* Header */}
            <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: 24 }}
            >
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        Quản lý Danh mục
                    </Title>
                </Col>
            </Row>

            {/* Search & Actions */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} justify="space-between">
                    <Col xs={24} sm={16} md={12}>
                        <Input.Search
                            placeholder="Tìm kiếm danh mục..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                            onClear={handleResetSearch}
                        />
                    </Col>
                    <Col>
                        {canCreate && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                                onClick={handleCreate}
                            >
                                Thêm danh mục
                            </Button>
                        )}
                    </Col>
                </Row>
            </Card>

            {/* Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey="_id"
                    loading={isLoading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} danh mục`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={
                    editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false)
                    form.resetFields()
                    setEditingCategory(null)
                    setImageData(null)
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        is_active: true,
                    }}
                >
                    <Form.Item
                        label="Hình ảnh danh mục"
                        tooltip="Tải lên hình ảnh cho danh mục"
                    >
                        {imageData ? (
                            // Ảnh đã upload thành công
                            <div style={{ marginBottom: 16 }}>
                                <div
                                    style={{
                                        border: '1px solid #d9d9d9',
                                        borderRadius: 8,
                                        padding: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                    }}
                                >
                                    <img
                                        src={imageData.image_url}
                                        alt="Category"
                                        style={{
                                            width: 80,
                                            height: 80,
                                            objectFit: 'cover',
                                            borderRadius: 8,
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontWeight: 500,
                                                marginBottom: 4,
                                            }}
                                        >
                                            {imageData.image_name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: '#999',
                                            }}
                                        >
                                            ID: {imageData.image_id}
                                        </div>
                                    </div>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={handleRemoveImage}
                                    >
                                        Xóa
                                    </Button>
                                </div>
                            </div>
                        ) : previewImage ? (
                            // Preview + loading state
                            <div style={{ marginBottom: 16 }}>
                                <div
                                    style={{
                                        border: '1px solid #1890ff',
                                        borderRadius: 8,
                                        padding: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        backgroundColor: '#f6ffed',
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            style={{
                                                width: 80,
                                                height: 80,
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                opacity:
                                                    uploadImageMutation.isLoading
                                                        ? 0.6
                                                        : 1,
                                            }}
                                        />
                                        {uploadImageMutation.isLoading && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform:
                                                        'translate(-50%, -50%)',
                                                }}
                                            >
                                                <LoadingOutlined
                                                    style={{
                                                        fontSize: 24,
                                                        color: '#1890ff',
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontWeight: 500,
                                                marginBottom: 4,
                                            }}
                                        >
                                            {uploadImageMutation.isLoading
                                                ? 'Đang tải lên...'
                                                : 'Đã chọn ảnh'}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: '#52c41a',
                                            }}
                                        >
                                            {uploadImageMutation.isLoading
                                                ? 'Vui lòng đợi...'
                                                : 'Sẵn sàng upload'}
                                        </div>
                                    </div>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={handleRemoveImage}
                                        disabled={uploadImageMutation.isLoading}
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Upload area
                            <Upload
                                listType="picture-card"
                                beforeUpload={handleUpload}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>
                                        Tải ảnh lên
                                    </div>
                                </div>
                            </Upload>
                        )}
                    </Form.Item>

                    {/* === THÊM TRƯỜNG PARENT CATEGORY === */}
                    <Form.Item
                        label="Danh mục cha (nếu có)"
                        name="parentId"
                        tooltip="Để trống nếu đây là danh mục chính"
                    >
                        <Select
                            placeholder="Chọn danh mục cha..."
                            allowClear
                            loading={isLoadingParents}
                            size="large"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '')
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                            options={parentCategories?.map((cat) => ({
                                value: cat._id,
                                label: cat.name,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tên danh mục"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tên danh mục!',
                            },
                        ]}
                    >
                        <Input placeholder="Ví dụ: Áo thun" size="large" />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <TextArea
                            rows={4}
                            placeholder="Mô tả về danh mục này..."
                        />
                    </Form.Item>

                    <Form.Item
                        label="Kích hoạt"
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="Active"
                            unCheckedChildren="Inactive"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Space
                            style={{
                                width: '100%',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Button
                                onClick={() => {
                                    setIsModalOpen(false)
                                    form.resetFields()
                                    setEditingCategory(null)
                                    setImageData(null)
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={
                                    createMutation.isLoading ||
                                    updateMutation.isLoading
                                }
                            >
                                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default CategoryManagement
