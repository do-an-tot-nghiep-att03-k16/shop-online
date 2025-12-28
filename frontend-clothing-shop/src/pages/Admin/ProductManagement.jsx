import { useState, useEffect } from 'react'
import {
    Card,
    Typography,
    Button,
    Table,
    Space,
    Image,
    Tag,
    Switch,
    Modal,
    message,
    Input,
    Select,
    Dropdown,
    Popconfirm,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    MoreOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons'
import {
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    usePublishProduct,
    useUnpublishProduct,
} from '../../hooks/useProducts'
import { useAdminProducts } from '../../hooks/useAdminProducts'
import { useCategories } from '../../hooks/useCategories'
import { useAuth } from '../../hooks/useAuth'
import ProductFormModal from '../../components/Admin/ProductFormModal'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

const ProductManagement = () => {
    // State
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    })
    const [modalVisible, setModalVisible] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)

    // Query parameters - Admin có thể thấy tất cả sản phẩm
    const queryParams = {
        ...pagination,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        // Admin filters for new admin endpoint
        ...(statusFilter === 'published' && { isPublished: true }),
        ...(statusFilter === 'draft' && { isPublished: false }),
        ...(statusFilter === 'inactive' && { status: 'inactive' }),
        ...(statusFilter === 'active' && { status: 'active' }),
        ...(statusFilter === 'out_of_stock' && { status: 'out_of_stock' }),
        // Admin filters for dedicated admin endpoint
    }

    // Hooks
    const { user, isAuthenticated, isAdmin } = useAuth()
    const {
        data: productsData,
        isLoading,
        error,
        refetch,
    } = useAdminProducts(queryParams)
    const { data: categoriesData } = useCategories({
        page: 1,
        limit: 100,
        showAll: true,
    }) // Get all categories for admin
    const createProductMutation = useCreateProduct()
    const updateProductMutation = useUpdateProduct()
    const deleteProductMutation = useDeleteProduct()
    const publishProductMutation = usePublishProduct()
    const unpublishProductMutation = useUnpublishProduct()

    // Data extraction with multiple fallbacks
    const products = productsData?.products || []
    const paginationInfo = productsData?.pagination || {}

    // Try multiple ways to extract categories
    let categories = []
    if (categoriesData?.metadata?.categories) {
        categories = categoriesData.metadata.categories
    } else if (categoriesData?.categories) {
        categories = categoriesData.categories
    } else if (Array.isArray(categoriesData)) {
        categories = categoriesData
    } else if (categoriesData?.data?.categories) {
        categories = categoriesData.data.categories
    }

    // Debug info removed for production

    // Handlers
    const handleSearch = (value) => {
        setSearchTerm(value)
        setPagination((prev) => ({ ...prev, page: 1 }))
    }

    const handleCategoryFilter = (value) => {
        setCategoryFilter(value)
        setPagination((prev) => ({ ...prev, page: 1 }))
    }

    const handleStatusFilter = (value) => {
        setStatusFilter(value)
        setPagination((prev) => ({ ...prev, page: 1 }))
    }

    const handleTableChange = (pag) => {
        setPagination({
            page: pag.current,
            limit: pag.pageSize,
        })
    }

    const handleCreate = () => {
        setEditingProduct(null)
        setModalVisible(true)
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setModalVisible(true)
    }

    const handleDelete = async (productId) => {
        try {
            await deleteProductMutation.mutateAsync(productId)
            refetch()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handlePublishToggle = async (product) => {
        // Kiểm tra auth trước
        if (!isAuthenticated) {
            message.error('Bạn cần đăng nhập để thực hiện thao tác này')
            return
        }

        if (!isAdmin) {
            message.error('Bạn không có quyền thực hiện thao tác này')
            return
        }

        try {
            const isCurrentlyPublished = !product.isDraft && product.isPublished
            // console.log('🔄 Toggle publish:', {
            //     user: user?.email,
            //     userId: user?._id,
            //     productId: product._id,
            //     productName: product.name,
            //     currentState: { isDraft: product.isDraft, isPublished: product.isPublished },
            //     isCurrentlyPublished,
            //     action: isCurrentlyPublished ? 'unpublish' : 'publish'
            // })

            if (isCurrentlyPublished) {
                await unpublishProductMutation.mutateAsync(product._id)
            } else {
                await publishProductMutation.mutateAsync(product._id)
            }

            // Force refetch immediately
            refetch()
        } catch (error) {
            console.error('Publish toggle error:', error)
            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại')
            } else {
                message.error(
                    `Không thể thay đổi trạng thái: ${
                        error.response?.data?.message || error.message
                    }`
                )
            }
        }
    }

    const handleProductSubmit = async (formData) => {
        try {
            if (editingProduct && !editingProduct._viewOnly) {
                // Update existing product

                const result = await updateProductMutation.mutateAsync({
                    id: editingProduct._id,
                    data: formData,
                })

                message.success('Cập nhật sản phẩm thành công!')
            } else {
                // Create new product

                const result = await createProductMutation.mutateAsync(formData)

                message.success('Tạo sản phẩm thành công!')
            }

            // Close modal and refresh
            setModalVisible(false)
            setEditingProduct(null)
            refetch()
        } catch (error) {
            console.error('❌ Product submit error:', error)
            console.error('❌ Error details:', {
                message: error.message,
                response: error.response,
                stack: error.stack,
            })
            message.error(
                `Lỗi ${
                    editingProduct && !editingProduct._viewOnly
                        ? 'cập nhật'
                        : 'tạo'
                } sản phẩm: ${error.response?.data?.message || error.message}`
            )
        }
    }

    const handleModalClose = (shouldRefresh = false) => {
        setModalVisible(false)
        setEditingProduct(null)
        if (shouldRefresh) {
            setTimeout(() => {
                refetch()
            }, 500)
        }
    }

    // Table columns
    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 80,
            render: (images, record) => {
                // Handle backend structure: color_images[0].images[0].thumbnail
                let imageUrl = '/placeholder.jpg'

                // Try different image paths
                if (record.color_images && record.color_images.length > 0) {
                    const firstColorImages = record.color_images[0].images
                    if (firstColorImages && firstColorImages.length > 0) {
                        const firstImage = firstColorImages[0]
                        imageUrl =
                            firstImage?.thumbnail ||
                            firstImage?.medium ||
                            firstImage?.large ||
                            imageUrl
                    }
                }

                return (
                    <Image
                        width={50}
                        height={50}
                        src={imageUrl}
                        fallback="/placeholder.jpg"
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                )
            },
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                        Variants: {record.variants?.length || 0}
                    </div>
                </div>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: 'category_ids',
            key: 'category_ids',
            render: (category_ids) => {
                if (category_ids && category_ids.length > 0) {
                    return (
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 4,
                            }}
                        >
                            {category_ids.map((category, index) => (
                                <Tag
                                    key={category._id || index}
                                    color="blue"
                                    size="small"
                                >
                                    {category?.name || 'N/A'}
                                </Tag>
                            ))}
                        </div>
                    )
                }
                return <Tag>N/A</Tag>
            },
        },
        {
            title: 'Giá',
            dataIndex: 'base_price',
            key: 'base_price',
            render: (base_price, record) => {
                const originalPrice = base_price || 0
                const discountPercent = record.discount_percent || 0

                // Calculate sale price if discount exists
                const salePrice =
                    discountPercent > 0
                        ? Math.round(
                              originalPrice * (1 - discountPercent / 100)
                          )
                        : record.sale_price

                return (
                    <div>
                        {discountPercent > 0 ? (
                            <>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#f50',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    -{discountPercent}%
                                </div>
                                <div
                                    style={{
                                        textDecoration: 'line-through',
                                        color: '#999',
                                        fontSize: 12,
                                    }}
                                >
                                    {originalPrice?.toLocaleString('vi-VN')}đ
                                </div>
                                <div
                                    style={{
                                        color: '#f50',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {salePrice?.toLocaleString('vi-VN')}đ
                                </div>
                            </>
                        ) : (
                            <div style={{ fontWeight: 500 }}>
                                {originalPrice?.toLocaleString('vi-VN')}đ
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: 'Tồn kho',
            dataIndex: 'variants',
            key: 'stock',
            render: (variants, record) => {
                // Calculate total stock from variants using correct field name
                let totalStock = 0
                if (variants && variants.length > 0) {
                    totalStock = variants.reduce((sum, variant) => {
                        return (
                            sum + (variant.stock_quantity || variant.stock || 0)
                        )
                    }, 0)
                }

                return (
                    <Tag color={totalStock > 0 ? 'green' : 'red'}>
                        {totalStock}
                    </Tag>
                )
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => {
                const isDraft = record.isDraft
                const isPublished = record.isPublished
                const status = record.status
                const isCurrentlyPublished = !isDraft && isPublished

                return (
                    <div>
                        <div style={{ marginBottom: 4 }}>
                            {isDraft ? (
                                <Tag color="orange">Bản nháp</Tag>
                            ) : isPublished ? (
                                <Tag color="green">Đã xuất bản</Tag>
                            ) : (
                                <Tag color="red">Chưa xuất bản</Tag>
                            )}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                            {status === 'active' && (
                                <Tag color="blue">Hoạt động</Tag>
                            )}
                            {status === 'inactive' && (
                                <Tag color="default">Không hoạt động</Tag>
                            )}
                            {status === 'out_of_stock' && (
                                <Tag color="volcano">Hết hàng</Tag>
                            )}
                        </div>
                        <Button
                            type="text"
                            icon={
                                isCurrentlyPublished ? (
                                    <CloseCircleOutlined />
                                ) : (
                                    <CheckCircleOutlined />
                                )
                            }
                            onClick={() => handlePublishToggle(record)}
                            loading={
                                publishProductMutation.isLoading ||
                                unpublishProductMutation.isLoading
                            }
                            title={
                                isCurrentlyPublished
                                    ? 'Ẩn xuất bản'
                                    : 'Xuất bản'
                            }
                        />
                    </div>
                )
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            render: (_, record) => {
                const menuItems = [
                    {
                        key: 'view',
                        label: 'Xem chi tiết',
                        icon: <EyeOutlined />,
                        onClick: () => {
                            const viewProduct = { ...record, _viewOnly: true }
                            setEditingProduct(viewProduct)
                            setModalVisible(true)
                        },
                    },
                    {
                        key: 'edit',
                        label: 'Chỉnh sửa',
                        icon: <EditOutlined />,
                        onClick: () => handleEdit(record),
                    },
                    {
                        type: 'divider',
                    },
                    {
                        key: 'delete',
                        label: 'Xóa',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: 'Xác nhận xóa sản phẩm',
                                content: `Bạn có chắc chắn muốn xóa sản phẩm "${record.name}"?`,
                                okText: 'Xóa',
                                cancelText: 'Hủy',
                                okType: 'danger',
                                onOk: () => handleDelete(record._id),
                            })
                        },
                    },
                ]

                return (
                    <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined />}
                            size="small"
                        />
                    </Dropdown>
                )
            },
        },
    ]

    if (error) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Title level={4} type="danger">
                        Lỗi tải dữ liệu
                    </Title>
                    <p>{error.message}</p>
                    <Button type="primary" onClick={refetch}>
                        Thử lại
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div>
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <Title level={3} style={{ margin: 0 }}>
                            Quản lý Sản phẩm
                        </Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                        >
                            Thêm sản phẩm
                        </Button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Search
                            placeholder="Tìm kiếm sản phẩm..."
                            style={{ width: 250 }}
                            onSearch={handleSearch}
                            enterButton
                        />
                        <Select
                            placeholder="Danh mục"
                            style={{ width: 200 }}
                            allowClear
                            value={categoryFilter || undefined}
                            onChange={handleCategoryFilter}
                            showSearch
                            filterOption={(input, option) =>
                                option?.children
                                    ?.toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <Option
                                        key={category._id}
                                        value={category._id}
                                    >
                                        {category.name}
                                    </Option>
                                ))
                            ) : (
                                <Option disabled value="">
                                    Không có danh mục nào
                                </Option>
                            )}
                        </Select>
                        <Select
                            placeholder="Trạng thái"
                            style={{ width: 150 }}
                            allowClear
                            value={statusFilter || undefined}
                            onChange={handleStatusFilter}
                        >
                            <Option value="all">Tất cả</Option>
                            <Option value="published">Đã xuất bản</Option>
                            <Option value="draft">Bản nháp</Option>
                            <Option value="active">Hoạt động</Option>
                            <Option value="inactive">Không hoạt động</Option>
                            <Option value="out_of_stock">Hết hàng</Option>
                        </Select>
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="_id"
                    loading={isLoading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: paginationInfo.total || 0,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} sản phẩm`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    size="middle"
                />
            </Card>

            {/* Product Form Modal */}
            <ProductFormModal
                open={modalVisible}
                onCancel={() => handleModalClose()}
                onSubmit={handleProductSubmit}
                editingProduct={editingProduct}
                categories={categories}
                loading={
                    createProductMutation.isLoading ||
                    updateProductMutation.isLoading
                }
            />
        </div>
    )
}

export default ProductManagement
