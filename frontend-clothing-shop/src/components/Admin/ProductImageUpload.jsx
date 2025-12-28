import { useState, useEffect } from 'react'
import {
    Upload,
    Button,
    Space,
    Card,
    Input,
    Row,
    Col,
    Image,
    message,
    Typography,
    Tag,
    Divider,
    Popconfirm,
    Select,
} from 'antd'
import {
    PlusOutlined,
    DeleteOutlined,
    CloudUploadOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { useUploadProductImages } from '../../hooks/useProducts'
import './ProductImageUpload.css'

const { Text } = Typography
const { Option } = Select

// Predefined colors cho shop quần áo
const PREDEFINED_COLORS = [
    { name: 'Đen', code: '#000000' },
    { name: 'Trắng', code: '#FFFFFF' },
    { name: 'Xám', code: '#808080' },
    { name: 'Xám đậm', code: '#404040' },
    { name: 'Đỏ', code: '#FF0000' },
    { name: 'Đỏ đậm', code: '#8B0000' },
    { name: 'Xanh navy', code: '#000080' },
    { name: 'Xanh dương', code: '#0000FF' },
    { name: 'Xanh lá', code: '#008000' },
    { name: 'Xanh lá đậm', code: '#006400' },
    { name: 'Vàng', code: '#FFFF00' },
    { name: 'Cam', code: '#FFA500' },
    { name: 'Hồng', code: '#FFC0CB' },
    { name: 'Tím', code: '#800080' },
    { name: 'Nâu', code: '#964B00' },
    { name: 'Be', code: '#F5F5DC' },
    { name: 'Kem', code: '#FFFDD0' },
]

/**
 * ProductImageUpload Component - Lưu image_id
 *
 * Structure mới:
 * color_images: [
 *   {
 *     color: "Đen",
 *     color_code: "#000000",
 *     images: [
 *       {
 *         image_id: "products/1764778428739_fh1wrw.jpg",
 *         thumbnail: "https://res.cloudinary.com/.../thumbnail.jpg",
 *         medium: "https://res.cloudinary.com/.../medium.jpg",
 *         large: "https://res.cloudinary.com/.../large.jpg"
 *       }
 *     ]
 *   }
 * ]
 */
const ProductImageUpload = ({ value = [], onChange }) => {
    const [colorImages, setColorImages] = useState(value || [])
    const [uploadingColorIndex, setUploadingColorIndex] = useState(null)
    const [isAutoUploading, setIsAutoUploading] = useState(false)
    const [uploadedFileUIDs, setUploadedFileUIDs] = useState(new Set()) // Track uploaded files
    const uploadMutation = useUploadProductImages()

    // 🔄 Sync dữ liệu từ props khi update product
    useEffect(() => {
        if (value && value.length > 0) {
            setColorImages(value)
        }
    }, [value])

    // Thêm màu mới
    const handleAddColor = () => {
        const newColor = {
            color: '',
            color_code: '#000000',
            images: [],
            _tempImages: [],
        }
        const updated = [...colorImages, newColor]
        setColorImages(updated)
        onChange?.(updated)
    }

    // Xóa màu
    const handleRemoveColor = (colorIndex) => {
        const updated = colorImages.filter((_, idx) => idx !== colorIndex)
        setColorImages(updated)
        onChange?.(updated)
        message.success('Đã xóa màu')
    }

    // Update thông tin màu (tên, mã màu)
    const handleColorChange = (colorIndex, field, value) => {
        const updated = colorImages.map((item, idx) => {
            if (idx === colorIndex) {
                return { ...item, [field]: value }
            }
            return item
        })
        setColorImages(updated)
        onChange?.(updated)
    }

    // Chọn màu từ predefined list
    const handlePredefinedColorSelect = (colorIndex, colorName) => {
        if (colorName === 'custom') {
            // Reset để user nhập manual
            const updated = colorImages.map((item, idx) => {
                if (idx === colorIndex) {
                    return {
                        ...item,
                        color: '',
                        color_code: '#000000',
                        _isCustomColor: true,
                    }
                }
                return item
            })
            setColorImages(updated)
            onChange?.(updated)
            return
        }

        const selectedColor = PREDEFINED_COLORS.find(
            (c) => c.name === colorName
        )
        if (selectedColor) {
            const updated = colorImages.map((item, idx) => {
                if (idx === colorIndex) {
                    return {
                        ...item,
                        color: selectedColor.name,
                        color_code: selectedColor.code,
                        _isCustomColor: false,
                    }
                }
                return item
            })
            setColorImages(updated)
            onChange?.(updated)
        }
    }

    // 🚀 AUTO UPLOAD FILE SELECT - SỬA DUPLICATE LOGIC
    const handleFileSelect = async (colorIndex, fileList) => {
        const colorItem = colorImages[colorIndex]

        // Debug info removed for production

        // Cập nhật UI ngay lập tức
        const updated = colorImages.map((item, idx) => {
            if (idx === colorIndex) {
                return { ...item, _tempImages: fileList }
            }
            return item
        })
        setColorImages(updated)
        onChange?.(updated)

        // CHỈ auto-upload những files MỚI chưa được upload
        const newFiles = fileList.filter((file) => {
            const hasOriginFile = !!file.originFileObj
            const notUploaded = !uploadedFileUIDs.has(file.uid)
            const notDone = file.status !== 'done'

            // File upload debug info removed for production

            return hasOriginFile && notUploaded && notDone
        })

        // Auto-upload nếu có color info và có files mới
        if (
            newFiles.length > 0 &&
            colorItem.color &&
            colorItem.color_code &&
            !isAutoUploading
        ) {
            setIsAutoUploading(true)

            try {
                await handleUploadImages(colorIndex, newFiles)
            } catch (error) {
                console.error('Auto-upload error:', error)
            } finally {
                setIsAutoUploading(false)
            }
        } else {
            console.log('❌ Auto-upload skipped:', {
                newFilesCount: newFiles.length,
                hasColor: !!colorItem.color,
                hasColorCode: !!colorItem.color_code,
                isAutoUploading,
            })
        }
    }

    // ⭐ UPLOAD LIST ẢNH - SUPPORT CẢ MANUAL & AUTO UPLOAD
    const handleUploadImages = async (colorIndex, specificFiles = null) => {
        const colorItem = colorImages[colorIndex]

        // Lấy files cần upload: specificFiles (auto) hoặc tất cả tempImages (manual)
        const filesToUpload =
            specificFiles ||
            (colorItem._tempImages || []).filter(
                (file) =>
                    file.originFileObj &&
                    file.status !== 'done' &&
                    !uploadedFileUIDs.has(file.uid)
            )

        if (filesToUpload.length === 0) {
            if (!specificFiles) {
                // Chỉ warning khi manual upload
                message.warning('Không có file nào để upload!')
            }
            return
        }

        if (!colorItem.color || !colorItem.color_code) {
            message.warning('Vui lòng nhập tên màu và mã màu trước khi upload!')
            return
        }

        try {
            setUploadingColorIndex(colorIndex)

            // Extract actual File objects
            const files = filesToUpload
                .map((file) => file.originFileObj)
                .filter((f) => f instanceof File)

            // Upload to server
            const response = await uploadMutation.mutateAsync(files)

            // Extract images from response
            let uploadedImages =
                response?.images || response?.metadata?.images || []

            // Transform format if needed
            uploadedImages = uploadedImages.map((img) => ({
                image_id: img.image_id,
                thumbnail: img.thumbnail || img.image_url,
                medium: img.medium || img.image_url,
                large: img.large || img.image_url,
            }))

            if (uploadedImages.length === 0) {
                throw new Error('Không nhận được dữ liệu ảnh từ server')
            }

            // Track uploaded file UIDs để tránh duplicate
            const uploadedUIDs = filesToUpload.map((f) => f.uid)
            setUploadedFileUIDs((prev) => new Set([...prev, ...uploadedUIDs]))

            // Update state - CHỈ xóa những file đã upload
            const updated = colorImages.map((item, idx) => {
                if (idx === colorIndex) {
                    // Giữ lại temp files chưa upload
                    const remainingTempImages = (item._tempImages || []).filter(
                        (tempFile) => !uploadedUIDs.includes(tempFile.uid)
                    )

                    return {
                        ...item,
                        images: [...(item.images || []), ...uploadedImages],
                        _tempImages: remainingTempImages,
                    }
                }
                return item
            })

            setColorImages(updated)
            onChange?.(updated)

            message.success(
                `✅ Upload thành công ${uploadedImages.length} ảnh!`
            )
        } catch (error) {
            console.error('Upload error:', error)
            message.error(error.message || 'Upload ảnh thất bại!')
        } finally {
            setUploadingColorIndex(null)
        }
    }

    // Xóa 1 ảnh đã upload
    const handleRemoveImage = (colorIndex, imageId) => {
        const updated = colorImages.map((item, idx) => {
            if (idx === colorIndex) {
                return {
                    ...item,
                    images: item.images.filter(
                        (img) => img.image_id !== imageId
                    ),
                }
            }
            return item
        })
        setColorImages(updated)
        onChange?.(updated)
        message.success('Đã xóa ảnh')
    }

    // Custom upload request (không tự động upload)
    // KHÔNG gọi onSuccess để tránh set status='done' ngay lập tức
    const dummyRequest = ({ file }) => {
        // Do nothing - chỉ để Upload component không tự upload
        // Không gọi onSuccess/onError để file.status vẫn là undefined/uploading
    }

    // Validate file trước khi thêm
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/')
        if (!isImage) {
            message.error(`${file.name} không phải file ảnh!`)
            return false
        }

        const isLt5M = file.size / 1024 / 1024 < 5
        if (!isLt5M) {
            message.error(`${file.name} quá lớn! Vui lòng chọn ảnh < 5MB`)
            return false
        }

        return true
    }

    return (
        <div>
            <Space
                orientation="vertical"
                style={{ width: '100%' }}
                size="large"
            >
                {/* Danh sách màu */}
                {colorImages.map((colorItem, colorIndex) => (
                    <Card
                        key={colorIndex}
                        size="small"
                        title={
                            <Space>
                                <span>Màu {colorIndex + 1}</span>
                                {colorItem.color && (
                                    <Tag
                                        color={colorItem.color_code}
                                        style={{
                                            color:
                                                colorItem.color_code ===
                                                '#FFFFFF'
                                                    ? '#000'
                                                    : '#fff',
                                            borderColor: '#d9d9d9',
                                        }}
                                    >
                                        {colorItem.color}
                                    </Tag>
                                )}
                                {colorItem.images &&
                                    colorItem.images.length > 0 && (
                                        <Tag color="success">
                                            ✓ {colorItem.images.length} ảnh
                                        </Tag>
                                    )}
                            </Space>
                        }
                        extra={
                            <Popconfirm
                                title="Xóa màu này?"
                                description={`Sẽ xóa ${
                                    colorItem.images?.length || 0
                                } ảnh đã upload`}
                                onConfirm={() => handleRemoveColor(colorIndex)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okType="danger"
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                />
                            </Popconfirm>
                        }
                    >
                        {/* Chọn màu từ predefined list */}
                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col span={24}>
                                <Text strong>Chọn màu sắc:</Text>
                                <Select
                                    placeholder="Chọn màu sắc cho sản phẩm..."
                                    value={
                                        colorItem._isCustomColor
                                            ? 'custom'
                                            : colorItem.color
                                    }
                                    onChange={(value) =>
                                        handlePredefinedColorSelect(
                                            colorIndex,
                                            value
                                        )
                                    }
                                    style={{ width: '100%', marginTop: 4 }}
                                    size="large"
                                    showSearch
                                    filterOption={(input, option) =>
                                        option.value
                                            .toLowerCase()
                                            .indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {PREDEFINED_COLORS.map((color) => (
                                        <Option
                                            key={color.name}
                                            value={color.name}
                                        >
                                            <Space>
                                                <div
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        background: color.code,
                                                        borderRadius: 4,
                                                        border:
                                                            color.code ===
                                                            '#FFFFFF'
                                                                ? '1px solid #ddd'
                                                                : '1px solid #ccc',
                                                        display: 'inline-block',
                                                    }}
                                                />
                                                <span>{color.name}</span>
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {color.code}
                                                </Text>
                                            </Space>
                                        </Option>
                                    ))}
                                    <Option key="custom" value="custom">
                                        <Space>
                                            <div
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    background:
                                                        'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)',
                                                    borderRadius: 4,
                                                    border: '1px solid #ccc',
                                                    display: 'inline-block',
                                                }}
                                            />
                                            <span
                                                style={{ fontStyle: 'italic' }}
                                            >
                                                Màu khác (tự nhập)
                                            </span>
                                        </Space>
                                    </Option>
                                </Select>
                            </Col>
                        </Row>

                        {/* Custom color inputs (hiện khi chọn "Màu khác") */}
                        {colorItem._isCustomColor && (
                            <Row gutter={16} style={{ marginBottom: 16 }}>
                                <Col span={16}>
                                    <Text strong>Tên màu:</Text>
                                    <Input
                                        placeholder="VD: Xanh mint, Tím lavender..."
                                        value={colorItem.color}
                                        onChange={(e) =>
                                            handleColorChange(
                                                colorIndex,
                                                'color',
                                                e.target.value
                                            )
                                        }
                                        style={{ marginTop: 4 }}
                                        size="large"
                                    />
                                </Col>
                                <Col span={8}>
                                    <Text strong>Mã màu:</Text>
                                    <Input
                                        type="color"
                                        value={colorItem.color_code}
                                        onChange={(e) =>
                                            handleColorChange(
                                                colorIndex,
                                                'color_code',
                                                e.target.value
                                            )
                                        }
                                        style={{
                                            marginTop: 4,
                                            height: 46,
                                            cursor: 'pointer',
                                        }}
                                    />
                                </Col>
                            </Row>
                        )}

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Upload ảnh */}
                        <Space orientation="vertical" style={{ width: '100%' }}>
                            <div
                                className={
                                    colorItem.color && colorItem.color_code
                                        ? 'auto-upload-hint'
                                        : 'manual-upload-hint'
                                }
                            >
                                {colorItem.color && colorItem.color_code ? (
                                    <Text
                                        type="success"
                                        style={{ fontSize: 12 }}
                                    >
                                        🚀 <strong>Auto-Upload Enabled:</strong>{' '}
                                        Thả ảnh vào khung để tự động upload lên
                                        server!
                                    </Text>
                                ) : (
                                    <Text
                                        type="warning"
                                        style={{ fontSize: 12 }}
                                    >
                                        ⚠️ Nhập tên màu và mã màu để kích hoạt
                                        auto-upload, hoặc upload manual sau
                                    </Text>
                                )}
                            </div>

                            <Upload
                                listType="picture-card"
                                fileList={colorItem._tempImages || []}
                                onChange={({ fileList }) =>
                                    handleFileSelect(colorIndex, fileList)
                                }
                                customRequest={dummyRequest}
                                multiple
                                accept="image/*"
                                beforeUpload={beforeUpload}
                                maxCount={10}
                                disabled={uploadingColorIndex === colorIndex}
                                className={
                                    uploadingColorIndex === colorIndex
                                        ? 'uploading'
                                        : ''
                                }
                            >
                                {(!colorItem._tempImages ||
                                    colorItem._tempImages.length < 10) && (
                                    <div>
                                        {uploadingColorIndex === colorIndex ? (
                                            <>
                                                <CloudUploadOutlined
                                                    style={{ fontSize: 16 }}
                                                />
                                                <div
                                                    style={{
                                                        marginTop: 4,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Đang upload...
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>
                                                    Thả ảnh vào đây
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#999',
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    hoặc click để chọn
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </Upload>

                            {/* Manual Upload Button - HIỆN KHI CÓ TEMP IMAGES */}
                            {colorItem._tempImages &&
                                colorItem._tempImages.length > 0 && (
                                    <Button
                                        type="primary"
                                        icon={<CloudUploadOutlined />}
                                        onClick={() =>
                                            handleUploadImages(colorIndex)
                                        }
                                        loading={
                                            uploadingColorIndex === colorIndex
                                        }
                                        disabled={
                                            !colorItem.color ||
                                            !colorItem.color_code
                                        }
                                        block
                                        size="large"
                                        style={{ background: '#ff7a00' }}
                                    >
                                        {uploadingColorIndex === colorIndex
                                            ? `Đang upload ${colorItem._tempImages.length} ảnh...`
                                            : `🚀 Upload ${
                                                  colorItem._tempImages.length
                                              } ảnh cho màu "${
                                                  colorItem.color || '...'
                                              }"`}
                                    </Button>
                                )}
                        </Space>

                        {/* Ảnh đã upload */}
                        {colorItem.images && colorItem.images.length > 0 && (
                            <>
                                <Divider style={{ margin: '12px 0' }} />
                                <div style={{ marginBottom: 8 }}>
                                    <Text strong>
                                        ✅ Ảnh đã upload (
                                        {colorItem.images.length}):
                                    </Text>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fill, minmax(100px, 1fr))',
                                        gap: 8,
                                    }}
                                >
                                    <Image.PreviewGroup>
                                        {colorItem.images.map((img, imgIdx) => (
                                            <div
                                                key={img.image_id}
                                                style={{ position: 'relative' }}
                                            >
                                                <Image
                                                    src={
                                                        img.thumbnail ||
                                                        img.medium ||
                                                        img.large
                                                    }
                                                    width="100%"
                                                    height={100}
                                                    style={{
                                                        objectFit: 'cover',
                                                        borderRadius: 4,
                                                    }}
                                                    preview={{
                                                        src:
                                                            img.large ||
                                                            img.medium ||
                                                            img.thumbnail,
                                                        mask: (
                                                            <Space
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    flexDirection:
                                                                        'column',
                                                                }}
                                                                size={4}
                                                            >
                                                                <EyeOutlined
                                                                    style={{
                                                                        fontSize: 20,
                                                                    }}
                                                                />
                                                                <Text
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: '#fff',
                                                                    }}
                                                                >
                                                                    Xem
                                                                </Text>
                                                            </Space>
                                                        ),
                                                    }}
                                                />
                                                <Popconfirm
                                                    title="Xóa ảnh này?"
                                                    onConfirm={() =>
                                                        handleRemoveImage(
                                                            colorIndex,
                                                            img.image_id
                                                        )
                                                    }
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                    okType="danger"
                                                >
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        size="small"
                                                        icon={
                                                            <DeleteOutlined />
                                                        }
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            top: 4,
                                                            right: 4,
                                                        }}
                                                    />
                                                </Popconfirm>
                                                {/* Debug: Show image_id */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 4,
                                                        left: 4,
                                                        background:
                                                            'rgba(0,0,0,0.7)',
                                                        color: '#fff',
                                                        fontSize: 8,
                                                        padding: '2px 4px',
                                                        borderRadius: 2,
                                                        maxWidth: '90%',
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                    title={img.image_id}
                                                >
                                                    ID:{' '}
                                                    {img.image_id
                                                        ? img.image_id
                                                              .split('/')
                                                              .pop()
                                                        : 'No ID'}
                                                </div>
                                            </div>
                                        ))}
                                    </Image.PreviewGroup>
                                </div>
                            </>
                        )}
                    </Card>
                ))}

                {/* Button thêm màu */}
                <Button
                    type="dashed"
                    onClick={handleAddColor}
                    icon={<PlusOutlined />}
                    block
                    size="large"
                >
                    Thêm màu sắc mới
                </Button>
            </Space>

            {/* Summary */}
            {colorImages.length > 0 && (
                <Card
                    size="small"
                    style={{
                        marginTop: 16,
                        background: '#f0f9ff',
                        borderColor: '#91d5ff',
                    }}
                >
                    <Space orientation="vertical" size={4}>
                        <Text strong>📊 Tổng kết:</Text>
                        <Text>• {colorImages.length} màu sắc</Text>
                        <Text>
                            •{' '}
                            {colorImages.reduce(
                                (total, item) =>
                                    total + (item.images?.length || 0),
                                0
                            )}{' '}
                            ảnh đã upload (có image_id)
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            💡 Mỗi ảnh có image_id để gửi lên backend (+ 3 size:
                            thumbnail/medium/large)!
                        </Text>
                    </Space>
                </Card>
            )}
        </div>
    )
}

export default ProductImageUpload
