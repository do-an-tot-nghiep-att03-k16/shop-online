import React, { useState } from 'react'
import { Card, Table, Button, Input, Select, Tag, Typography, Space, Row, Col, Statistic, InputNumber, message } from 'antd'
import { ReloadOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { useInventoryOverview, useLowStockAlerts, useUpdateStock, useBulkUpdateStock } from '../../hooks/useInventory'

const { Title } = Typography
const { Option } = Select

function InventoryManagement() {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(50) // Higher limit since we group by product
    const [sortBy, setSortBy] = useState('name_asc') // Show all products, sorted by name
    const [lowStockThreshold, setLowStockThreshold] = useState(10)
    const [editingKey, setEditingKey] = useState('')
    const [editingQuantity, setEditingQuantity] = useState(0)
    
    // Fetch inventory data using clean hooks (no need to check admin - backend handles it)
    const {
        data: inventoryResponse,
        isLoading,
        error,
        refetch
    } = useInventoryOverview({
        page: currentPage,
        limit: pageSize,
        sortBy,
        lowStockThreshold
    })
    
    // Fetch alerts
    const { data: alertsResponse } = useLowStockAlerts({
        threshold: lowStockThreshold
    })
    
    // Mutations
    const updateStockMutation = useUpdateStock()
    const bulkUpdateMutation = useBulkUpdateStock()
    
    // Handlers
    const handleEdit = (productId, sku, currentQuantity) => {
        setEditingKey(`${productId}-${sku}`)
        setEditingQuantity(currentQuantity)
    }
    
    const handleSave = async (productId, sku) => {
        try {
            await updateStockMutation.mutateAsync({
                productId: productId,
                sku: sku,
                quantity: editingQuantity
            })
            message.success('Cập nhật tồn kho thành công!')
            setEditingKey('')
        } catch (error) {
            message.error('Cập nhật thất bại!')
        }
    }
    
    const handleCancel = () => {
        setEditingKey('')
    }
    
    const getStockStatus = (quantity) => {
        if (quantity === 0) return { color: 'red', text: 'Hết hàng' }
        if (quantity <= 5) return { color: 'orange', text: 'Sắp hết' }
        if (quantity <= 10) return { color: 'yellow', text: 'Ít hàng' }
        return { color: 'green', text: 'Còn hàng' }
    }
    
    // Table columns for grouped products
    const columns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            width: '40%',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{text}</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                        {record.variants?.length} phiên bản • Tổng: {record.variants?.reduce((sum, v) => sum + v.stock_quantity, 0)} sp
                    </div>
                </div>
            )
        },
        {
            title: 'Phiên bản (SKU)',
            key: 'variants',
            width: '60%',
            render: (_, record) => (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {record.variants?.map((variant, index) => {
                        const status = getStockStatus(variant.stock_quantity)
                        const isEditing = editingKey === `${record._id}-${variant.sku}`
                        
                        return (
                            <div 
                                key={variant.sku} 
                                style={{ 
                                    padding: '8px 12px',
                                    margin: '4px 0',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '6px',
                                    background: '#fafafa'
                                }}
                            >
                                <Row align="middle" justify="space-between">
                                    <Col span={8}>
                                        <div style={{ fontSize: '13px' }}>
                                            <strong>{variant.color}</strong> / <strong>{variant.size}</strong>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                            {variant.sku}
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <Space>
                                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                                {variant.stock_quantity}
                                            </span>
                                            <Tag color={status.color} style={{ fontSize: '10px' }}>
                                                {status.text}
                                            </Tag>
                                        </Space>
                                    </Col>
                                    <Col span={10}>
                                        {isEditing ? (
                                            <Space size="small">
                                                <InputNumber
                                                    value={editingQuantity}
                                                    onChange={setEditingQuantity}
                                                    min={0}
                                                    size="small"
                                                    style={{ width: 70 }}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<SaveOutlined />}
                                                    onClick={() => handleSave(record._id, variant.sku)}
                                                    loading={updateStockMutation.isPending}
                                                    size="small"
                                                />
                                                <Button
                                                    icon={<CloseOutlined />}
                                                    onClick={handleCancel}
                                                    size="small"
                                                />
                                            </Space>
                                        ) : (
                                            <Button
                                                type="link"
                                                icon={<EditOutlined />}
                                                onClick={() => handleEdit(record._id, variant.sku, variant.stock_quantity)}
                                                size="small"
                                                style={{ fontSize: '12px' }}
                                            >
                                                Sửa
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            </div>
                        )
                    })}
                </div>
            )
        }
    ]
    
    // Extract and group data by product
    const { variants = [], summary = {}, pagination = {} } = inventoryResponse?.metadata || {}
    
    // Group variants by product
    const groupedProducts = variants.reduce((acc, variant) => {
        const productId = variant._id
        if (!acc[productId]) {
            acc[productId] = {
                key: productId,
                _id: variant._id,
                name: variant.name,
                slug: variant.slug,
                variants: []
            }
        }
        acc[productId].variants.push(variant.variant)
        return acc
    }, {})
    
    const productsData = Object.values(groupedProducts)
    
    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                <Col>
                    <Title level={2}>📦 Quản lý Tồn kho</Title>
                </Col>
                <Col>
                    <Space>
                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            style={{ width: 180 }}
                            placeholder="Sắp xếp theo"
                        >
                            <Option value="name_asc">Tên A-Z</Option>
                            <Option value="name_desc">Tên Z-A</Option>
                            <Option value="stock_asc">Tồn kho tăng</Option>
                            <Option value="stock_desc">Tồn kho giảm</Option>
                        </Select>
                        <Button 
                            type="primary" 
                            icon={<ReloadOutlined />}
                            onClick={() => refetch()}
                            loading={isLoading}
                        >
                            Làm mới
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* Summary Cards */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Tổng SKU" 
                            value={summary.totalVariants || 0}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Tổng tồn kho" 
                            value={summary.totalStock || 0}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Hết hàng" 
                            value={summary.outOfStockCount || 0}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic 
                            title="Sắp hết hàng" 
                            value={summary.lowStockCount || 0}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Inventory Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={productsData}
                    rowKey="key"
                    loading={isLoading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: pagination.total || variants.length,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${productsData.length} sản phẩm (${variants.length} SKU)`,
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                        },
                        pageSizeOptions: ['10', '20', '50', '100']
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    )
}

export default InventoryManagement