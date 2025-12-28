import { useState, useEffect } from 'react'
import {
    Table,
    Button,
    Input,
    Select,
    Space,
    Card,
    Typography,
    Tag,
    message,
    InputNumber,
    Checkbox,
    Row,
    Col,
    Tooltip,
} from 'antd'
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    EditOutlined,
    ReloadOutlined,
} from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

// Mapping màu sang 3 ký tự
const COLOR_SKU_MAP = {
    Đen: 'BLK',
    Trắng: 'WHT',
    Xám: 'GRY',
    'Xám đậm': 'DGR',
    Đỏ: 'RED',
    'Đỏ đậm': 'DRD',
    'Xanh navy': 'NVY',
    'Xanh dương': 'BLU',
    'Xanh lá': 'GRN',
    'Xanh lá đậm': 'DGN',
    Vàng: 'YEL',
    Cam: 'ORG',
    Hồng: 'PNK',
    Tím: 'PUR',
    Nâu: 'BRN',
    Be: 'BGE',
    Kem: 'CRM',
}

export default function ProductVariantManager({
    value = [],
    onChange,
    colorImages = [],
    productData = {},
}) {
    const [variants, setVariants] = useState([...value])
    const [editingKey, setEditingKey] = useState('')
    const [selectedSizesByColor, setSelectedSizesByColor] = useState({})

    // ⭐ STATE MỚI: Lưu mã product code chung
    const [productCode, setProductCode] = useState('')
    const [isEditingProductCode, setIsEditingProductCode] = useState(false)

    useEffect(() => {
        setVariants([...value])
    }, [value])

    // ⭐ Auto-generate product code khi component mount (nếu chưa có)
    useEffect(() => {
        if (!productCode && variants.length === 0) {
            const newCode = generateProductCode()
            setProductCode(newCode)
        }
    }, [])

    // ⭐ Hàm tạo mã product code (4 ký tự ngẫu nhiên)
    const generateProductCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    // ⭐ Regenerate product code mới
    const handleRegenerateProductCode = () => {
        const newCode = generateProductCode()
        setProductCode(newCode)
        message.success(`✅ Đã tạo mã mới: ${newCode}`)

        // Cập nhật lại SKU cho tất cả variants hiện có
        if (variants.length > 0) {
            const updated = variants.map((v) => ({
                ...v,
                sku: generateSKU(v.color, v.size, v.color_code, newCode),
            }))
            setVariants(updated)
            onChange?.(updated)
        }
    }

    // ⭐ Hàm tạo SKU: PROD-[product_code]-[màu]-[size]
    const generateSKU = (color, size, colorHex, customProductCode = null) => {
        const prefix = 'PROD'
        const code = customProductCode || productCode || generateProductCode()

        // Lấy mã màu
        let colorCode = COLOR_SKU_MAP[color]
        if (!colorCode && colorHex) {
            colorCode = colorHex.replace('#', '').substring(0, 3).toUpperCase()
        }
        if (!colorCode) {
            colorCode = color.substring(0, 3).toUpperCase()
        }

        return `${prefix}-${code}-${colorCode}-${size}`
    }

    // ⭐ Lấy danh sách size đã được tạo variant cho màu cụ thể
    const getUsedSizesForColor = (color) => {
        return variants.filter((v) => v.color === color).map((v) => v.size)
    }

    // ⭐ Toggle chọn size cho màu
    const handleSizeToggle = (color, size) => {
        const usedSizes = getUsedSizesForColor(color)
        if (usedSizes.includes(size)) {
            message.warning(`Size ${size} đã có variant cho màu ${color}!`)
            return
        }

        const currentSizes = selectedSizesByColor[color] || []
        const newSizes = currentSizes.includes(size)
            ? currentSizes.filter((s) => s !== size)
            : [...currentSizes, size]

        setSelectedSizesByColor({
            ...selectedSizesByColor,
            [color]: newSizes,
        })
    }

    // ⭐ Chọn tất cả size cho màu
    const handleSelectAllSizes = (color) => {
        const usedSizes = getUsedSizesForColor(color)
        const availableSizes = SIZES.filter((s) => !usedSizes.includes(s))

        setSelectedSizesByColor({
            ...selectedSizesByColor,
            [color]: availableSizes,
        })
    }

    // ⭐ Bỏ chọn tất cả size cho màu
    const handleClearSizes = (color) => {
        setSelectedSizesByColor({
            ...selectedSizesByColor,
            [color]: [],
        })
    }

    // ⭐ Tạo variants cho màu - SỬ DỤNG PRODUCT CODE CHUNG
    const handleGenerateByColor = (colorItem) => {
        const selectedSizes = selectedSizesByColor[colorItem.color] || []

        if (selectedSizes.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 size!')
            return
        }

        // ⭐ Tạo product code nếu chưa có
        if (!productCode) {
            const newCode = generateProductCode()
            setProductCode(newCode)
        }

        const newVariants = selectedSizes.map((size) => ({
            _id: `temp-${Date.now()}-${size}-${Math.random()}`,
            sku: generateSKU(colorItem.color, size, colorItem.color_code),
            size,
            color: colorItem.color,
            color_code: colorItem.color_code,
            stock_quantity: 0,
        }))

        const updated = [...variants, ...newVariants]
        setVariants(updated)
        onChange?.(updated)

        // Clear selection sau khi tạo
        setSelectedSizesByColor({
            ...selectedSizesByColor,
            [colorItem.color]: [],
        })

        message.success(
            `✅ Đã tạo ${newVariants.length} biến thể cho màu "${colorItem.color}"`
        )
    }

    const handleAddVariant = () => {
        const newVariant = {
            _id: `temp-${Date.now()}`,
            sku: '',
            size: '',
            color: '',
            color_code: '',
            stock_quantity: 0,
        }
        setVariants([...variants, newVariant])
        setEditingKey(newVariant._id)
    }

    const handleDelete = (id) => {
        const updated = variants.filter((v) => v._id !== id)
        setVariants(updated)
        onChange?.(updated)
        message.success('Đã xóa biến thể')
    }

    const startEdit = (id) => {
        setEditingKey(id)
    }

    const cancelEdit = () => {
        setEditingKey('')
    }

    const saveEdit = (id) => {
        const variant = variants.find((v) => v._id === id)
        if (!variant.size || !variant.color) {
            message.error('Vui lòng chọn đầy đủ màu sắc và kích thước')
            return
        }

        // Kiểm tra trùng lặp
        const isDuplicate = variants.some(
            (v) =>
                v._id !== id &&
                v.color === variant.color &&
                v.size === variant.size
        )

        if (isDuplicate) {
            message.error(
                `Đã tồn tại variant cho màu "${variant.color}" size "${variant.size}"!`
            )
            return
        }

        // ⭐ Tạo product code nếu chưa có
        if (!productCode) {
            const newCode = generateProductCode()
            setProductCode(newCode)
        }

        // Auto-generate SKU khi lưu
        const updated = variants.map((v) => {
            if (v._id === id) {
                return {
                    ...v,
                    sku: generateSKU(v.color, v.size, v.color_code),
                }
            }
            return v
        })

        setVariants(updated)
        setEditingKey('')
        onChange?.(updated)
        message.success('Đã lưu biến thể')
    }

    const handleFieldChange = (id, field, value) => {
        const updated = variants.map((v) => {
            if (v._id === id) {
                return { ...v, [field]: value }
            }
            return v
        })
        setVariants(updated)
    }

    const columns = [
        {
            title: 'Mã SKU',
            dataIndex: 'sku',
            key: 'sku',
            width: 250,
            render: (text, record) => {
                if (editingKey === record._id) {
                    return (
                        <Input
                            value={text}
                            disabled
                            placeholder="Tự động tạo khi lưu"
                            style={{ background: '#f5f5f5' }}
                        />
                    )
                }
                return (
                    <Text code style={{ fontSize: 12 }}>
                        {text || <Text type="secondary">Chưa có SKU</Text>}
                    </Text>
                )
            },
        },
        {
            title: 'Màu sắc',
            dataIndex: 'color',
            key: 'color',
            width: 180,
            render: (text, record) => {
                if (editingKey === record._id) {
                    return (
                        <Select
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Chọn màu sắc"
                            value={text}
                            onChange={(value) => {
                                const color = colorImages.find(
                                    (c) => c.color === value
                                )
                                handleFieldChange(record._id, 'color', value)
                                if (color) {
                                    handleFieldChange(
                                        record._id,
                                        'color_code',
                                        color.color_code
                                    )
                                }
                            }}
                        >
                            {colorImages.map((color) => (
                                <Option key={color.color} value={color.color}>
                                    <Space>
                                        <div
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                backgroundColor:
                                                    color.color_code,
                                                border: '1px solid #d9d9d9',
                                            }}
                                        />
                                        {color.color}
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    )
                }
                return (
                    <Space>
                        {record.color_code && (
                            <div
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: record.color_code,
                                    border: '2px solid #fff',
                                    boxShadow: '0 0 0 1px #d9d9d9',
                                }}
                            />
                        )}
                        <span>{text}</span>
                    </Space>
                )
            },
        },
        {
            title: 'Kích thước',
            dataIndex: 'size',
            key: 'size',
            width: 120,
            render: (text, record) => {
                if (editingKey === record._id) {
                    return (
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Chọn size"
                            value={text}
                            onChange={(value) =>
                                handleFieldChange(record._id, 'size', value)
                            }
                        >
                            {SIZES.map((size) => {
                                const isDisabled = variants.some(
                                    (v) =>
                                        v.size === size &&
                                        v.color === record.color &&
                                        v._id !== record._id
                                )
                                return (
                                    <Option
                                        key={size}
                                        value={size}
                                        disabled={isDisabled}
                                    >
                                        {size} {isDisabled && '(Đã tồn tại)'}
                                    </Option>
                                )
                            })}
                        </Select>
                    )
                }
                return <Tag color="blue">{text}</Tag>
            },
        },
        {
            title: 'Tồn kho',
            dataIndex: 'stock_quantity',
            key: 'stock_quantity',
            width: 120,
            align: 'center',
            render: (text, record) => {
                if (editingKey === record._id) {
                    return (
                        <InputNumber
                            min={0}
                            value={text}
                            onChange={(value) =>
                                handleFieldChange(
                                    record._id,
                                    'stock_quantity',
                                    value || 0
                                )
                            }
                            style={{ width: '100%' }}
                            placeholder="Số lượng"
                        />
                    )
                }
                return (
                    <Tag color={text > 0 ? 'success' : 'default'}>{text}</Tag>
                )
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            fixed: 'right',
            render: (_, record) => {
                const isEditing = editingKey === record._id

                if (isEditing) {
                    return (
                        <Space>
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => saveEdit(record._id)}
                                icon={<SaveOutlined />}
                            >
                                Lưu
                            </Button>
                            <Button size="small" onClick={cancelEdit}>
                                Hủy
                            </Button>
                        </Space>
                    )
                }

                return (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => startEdit(record._id)}
                        >
                            Sửa
                        </Button>
                        <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record._id)}
                        />
                    </Space>
                )
            },
        },
    ]

    return (
        <Card
            title={
                <Space>
                    <Text strong style={{ fontSize: 16 }}>
                        📦 Quản lý biến thể
                    </Text>
                    <Tag color="blue">{variants.length} biến thể</Tag>
                </Space>
            }
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddVariant}
                >
                    Thêm biến thể
                </Button>
            }
        >
            {/* ⭐ PHẦN MỚI: HIỂN THỊ VÀ CHỈNH SỬA PRODUCT CODE */}
            <Card
                size="small"
                style={{
                    marginBottom: 16,
                    background: '#fff7e6',
                    borderColor: '#ffd666',
                }}
            >
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 14 }}>
                        🔑 Mã sản phẩm (Product Code)
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Mã này sẽ được dùng chung cho tất cả variants. Format
                        SKU: PROD-<strong>{productCode || 'XXXX'}</strong>
                        -[MÀU]-[SIZE]
                    </Text>

                    <Space style={{ width: '100%' }}>
                        {isEditingProductCode ? (
                            <>
                                <Input
                                    value={productCode}
                                    onChange={(e) =>
                                        setProductCode(
                                            e.target.value.toUpperCase()
                                        )
                                    }
                                    placeholder="Nhập mã 4 ký tự"
                                    maxLength={4}
                                    style={{ width: 150, fontWeight: 'bold' }}
                                />
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => {
                                        if (productCode.length !== 4) {
                                            message.error(
                                                'Mã phải có đúng 4 ký tự!'
                                            )
                                            return
                                        }
                                        setIsEditingProductCode(false)

                                        // Cập nhật SKU cho tất cả variants
                                        if (variants.length > 0) {
                                            const updated = variants.map(
                                                (v) => ({
                                                    ...v,
                                                    sku: generateSKU(
                                                        v.color,
                                                        v.size,
                                                        v.color_code,
                                                        productCode
                                                    ),
                                                })
                                            )
                                            setVariants(updated)
                                            onChange?.(updated)
                                        }
                                        message.success(
                                            '✅ Đã cập nhật mã sản phẩm!'
                                        )
                                    }}
                                >
                                    Lưu
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() =>
                                        setIsEditingProductCode(false)
                                    }
                                >
                                    Hủy
                                </Button>
                            </>
                        ) : (
                            <>
                                <Tag
                                    color="orange"
                                    style={{
                                        fontSize: 16,
                                        padding: '4px 12px',
                                    }}
                                >
                                    {productCode || 'Chưa có mã'}
                                </Tag>
                                <Tooltip title="Chỉnh sửa mã">
                                    <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() =>
                                            setIsEditingProductCode(true)
                                        }
                                    >
                                        Sửa
                                    </Button>
                                </Tooltip>
                                <Tooltip title="Tạo mã ngẫu nhiên mới">
                                    <Button
                                        size="small"
                                        icon={<ReloadOutlined />}
                                        onClick={handleRegenerateProductCode}
                                    >
                                        Tạo mới
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                    </Space>

                    {variants.length > 0 && (
                        <Text type="warning" style={{ fontSize: 11 }}>
                            ⚠️ Thay đổi mã sẽ cập nhật lại SKU của tất cả{' '}
                            {variants.length} variants
                        </Text>
                    )}
                </Space>
            </Card>

            {/* Tạo nhanh theo màu */}
            {colorImages.length > 0 && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 16,
                        background: '#f0f9ff',
                        borderRadius: 8,
                    }}
                >
                    <Text
                        strong
                        style={{
                            display: 'block',
                            marginBottom: 12,
                            fontSize: 15,
                        }}
                    >
                        ⚡ Tạo nhanh biến thể theo màu
                    </Text>

                    {colorImages.map((colorItem) => {
                        const usedSizes = getUsedSizesForColor(colorItem.color)
                        const selectedSizes =
                            selectedSizesByColor[colorItem.color] || []
                        const existingCount = variants.filter(
                            (v) => v.color === colorItem.color
                        ).length

                        return (
                            <Card
                                key={colorItem.color}
                                size="small"
                                style={{ marginBottom: 12 }}
                                title={
                                    <Space>
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                backgroundColor:
                                                    colorItem.color_code,
                                                border: '2px solid #fff',
                                                boxShadow: '0 0 0 1px #d9d9d9',
                                            }}
                                        />
                                        <Text strong>{colorItem.color}</Text>
                                        {existingCount > 0 && (
                                            <Tag color="success">
                                                {existingCount} variants
                                            </Tag>
                                        )}
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Button
                                            size="small"
                                            type="link"
                                            onClick={() =>
                                                handleSelectAllSizes(
                                                    colorItem.color
                                                )
                                            }
                                            disabled={
                                                usedSizes.length ===
                                                SIZES.length
                                            }
                                        >
                                            Chọn tất cả
                                        </Button>
                                        <Button
                                            size="small"
                                            type="link"
                                            danger
                                            onClick={() =>
                                                handleClearSizes(
                                                    colorItem.color
                                                )
                                            }
                                            disabled={
                                                selectedSizes.length === 0
                                            }
                                        >
                                            Bỏ chọn
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="small"
                                            onClick={() =>
                                                handleGenerateByColor(colorItem)
                                            }
                                            disabled={
                                                selectedSizes.length === 0
                                            }
                                        >
                                            Tạo ({selectedSizes.length})
                                        </Button>
                                    </Space>
                                }
                            >
                                <Checkbox.Group
                                    value={selectedSizes}
                                    style={{ width: '100%' }}
                                >
                                    <Row gutter={[8, 8]}>
                                        {SIZES.map((size) => {
                                            const isUsed =
                                                usedSizes.includes(size)
                                            return (
                                                <Col
                                                    key={size}
                                                    span={6}
                                                    md={4}
                                                    lg={3}
                                                >
                                                    <Checkbox
                                                        value={size}
                                                        disabled={isUsed}
                                                        onChange={() =>
                                                            handleSizeToggle(
                                                                colorItem.color,
                                                                size
                                                            )
                                                        }
                                                    >
                                                        <Tag
                                                            color={
                                                                isUsed
                                                                    ? 'default'
                                                                    : 'blue'
                                                            }
                                                            style={{
                                                                cursor: isUsed
                                                                    ? 'not-allowed'
                                                                    : 'pointer',
                                                            }}
                                                        >
                                                            {size}
                                                        </Tag>
                                                    </Checkbox>
                                                </Col>
                                            )
                                        })}
                                    </Row>
                                </Checkbox.Group>
                                {usedSizes.length > 0 && (
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 11,
                                            display: 'block',
                                            marginTop: 8,
                                        }}
                                    >
                                        ⚠️ Size có màu xám đã được tạo variant
                                    </Text>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Table */}
            <Table
                columns={columns}
                dataSource={variants}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 900 }}
                size="small"
                locale={{
                    emptyText:
                        'Chưa có biến thể nào. Chọn size ở trên và nhấn "Tạo" hoặc thêm thủ công.',
                }}
            />

            {/* Summary */}
            {variants.length > 0 && (
                <div
                    style={{
                        marginTop: 16,
                        padding: 12,
                        background: '#e6f7ff',
                        borderRadius: 8,
                    }}
                >
                    <Space orientation="vertical" size={4}>
                        <Text strong>📊 Thống kê:</Text>
                        <Text>• Tổng số biến thể: {variants.length}</Text>
                        <Text>
                            • Số biến thể có SKU:{' '}
                            {variants.filter((v) => v.sku).length}
                        </Text>
                        <Text>
                            • Tổng tồn kho:{' '}
                            {variants.reduce(
                                (sum, v) => sum + (v.stock_quantity || 0),
                                0
                            )}
                        </Text>
                    </Space>
                </div>
            )}
        </Card>
    )
}
