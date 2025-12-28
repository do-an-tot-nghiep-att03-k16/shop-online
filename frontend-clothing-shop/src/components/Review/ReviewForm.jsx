import React, { useState, useEffect } from 'react'
import {
    Modal,
    Form,
    Rate,
    Input,
    Upload,
    Button,
    Space,
    Typography,
    Select,
    message,
} from 'antd'
import {
    PlusOutlined,
    CameraOutlined,
    DeleteOutlined,
    CloudUploadOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useCreateReview, useUploadReviewImages } from '../../hooks/useReviews'
import { reviewAPI, orderAPI } from '../../services/api'

const { TextArea } = Input
const { Text, Title } = Typography
const { Option } = Select

const ReviewForm = ({
    visible,
    onClose,
    productId,
    productName,
    orderId = null,
    availableVariants = [],
}) => {
    const [form] = Form.useForm()
    const { user } = useAuth()
    const createReviewMutation = useCreateReview()
    const uploadImagesMutation = useUploadReviewImages()

    const [uploadedImages, setUploadedImages] = useState([])
    const [imageIds, setImageIds] = useState([])
    const [userOrders, setUserOrders] = useState([])
    const [selectedOrderId, setSelectedOrderId] = useState(orderId || null)

    // Fetch user orders containing this product
    useEffect(() => {
        const fetchUserOrders = async () => {
            if (!user || !visible || orderId) return // Skip if already has orderId
            
            try {
                const response = await orderAPI.getMyOrders({ limit: 1000 })
                const responseData = response.data || response
                const metadata = responseData.metadata || responseData
                
                // Handle different response structures like MyOrders page
                let allOrders = []
                if (Array.isArray(metadata)) {
                    allOrders = metadata
                } else if (metadata && typeof metadata === 'object') {
                    allOrders = metadata.orders || metadata.data || []
                }
                
                // Filter orders that contain this product and are completed
                const relevantOrders = allOrders.filter(order => {
                    const hasProduct = order.items?.some(item => 
                        item.product_id === productId || 
                        item.product_id?._id === productId
                    )
                    const isCompleted = order.status === 'delivered' || order.status === 'completed'
                    return hasProduct && isCompleted
                })
                
                setUserOrders(relevantOrders)
                
                // Auto-select if only one relevant order
                if (relevantOrders.length === 1) {
                    setSelectedOrderId(relevantOrders[0]._id)
                }
            } catch (error) {
                console.error('Error fetching user orders:', error)
                message.error('Không thể tải danh sách đơn hàng')
            }
        }
        
        fetchUserOrders()
    }, [user, visible, productId, orderId])

    const handleSubmit = async (values) => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để viết đánh giá')
            return
        }

        // Validate order selection
        const finalOrderId = selectedOrderId || orderId
        if (!finalOrderId) {
            message.error('Vui lòng chọn đơn hàng để đánh giá sản phẩm')
            return
        }

        try {
            const reviewData = {
                product_id:
                    typeof productId === 'object'
                        ? productId._id || productId.id
                        : productId,
                order_id: finalOrderId,
                rating: values.rating,
                comment: values.comment?.trim() || '',
                variant_info: {
                    color: values.color,
                    size: values.size,
                },
            }

            // Add image_ids if there are uploaded images
            if (imageIds.length > 0) {
                reviewData.image_ids = imageIds
            }

            await createReviewMutation.mutateAsync(reviewData)

            // Reset form và đóng modal
            form.resetFields()
            setUploadedImages([])
            setImageIds([])
            onClose()
        } catch (error) {
            console.error('Error creating review:', error)
        }
    }

    const beforeUpload = (file) => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(
            file.type
        )
        if (!isValidType) {
            message.error('Chỉ được tải lên file JPG/PNG/WEBP!')
            return false
        }

        const isLt10M = file.size / 1024 / 1024 < 10
        if (!isLt10M) {
            message.error('Ảnh phải nhỏ hơn 10MB!')
            return false
        }

        if (uploadedImages.length >= 5) {
            message.error('Tối đa 5 ảnh!')
            return false
        }

        return true
    }

    const handleImageUpload = async (file) => {
        if (!beforeUpload(file)) return

        try {
            const result = await uploadImagesMutation.mutateAsync([file])

            if (result?.images?.length > 0) {
                const newImage = result.images[0]
                // Use image_url from upload response for immediate display
                setUploadedImages((prev) => [...prev, newImage.image_url])
                setImageIds((prev) => [...prev, newImage.image_id])
                message.success('Tải ảnh thành công!')
            } else {
                message.error('Không nhận được dữ liệu ảnh từ server!')
            }
        } catch (error) {
            console.error('Upload error:', error)
            message.error('Tải ảnh thất bại!')
        }
    }

    // Handle multiple files upload
    const handleMultipleImageUpload = async (files) => {
        const validFiles = []

        // Validate all files first
        for (const file of files) {
            if (beforeUpload(file)) {
                validFiles.push(file)
            }
        }

        if (validFiles.length === 0) return

        // Check total count limit
        if (uploadedImages.length + validFiles.length > 5) {
            message.warning(
                `Chỉ có thể thêm ${5 - uploadedImages.length} ảnh nữa!`
            )
            return
        }

        try {
            const result = await uploadImagesMutation.mutateAsync(validFiles)

            if (result?.images?.length > 0) {
                const newImageUrls = result.images.map((img) => img.image_url)
                const newImageIds = result.images.map((img) => img.image_id)

                setUploadedImages((prev) => [...prev, ...newImageUrls])
                setImageIds((prev) => [...prev, ...newImageIds])

                message.success(`Tải thành công ${result.images.length} ảnh!`)
            } else {
                message.error('Không nhận được dữ liệu ảnh từ server!')
            }
        } catch (error) {
            console.error('Upload error:', error)
            message.error('Tải ảnh thất bại!')
        }
    }

    const removeImage = (index) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index))
        setImageIds((prev) => prev.filter((_, i) => i !== index))
    }

    const customUpload = ({ file }) => {
        handleImageUpload(file)
    }

    // Get unique colors and sizes
    const availableColors = [
        ...new Set(availableVariants.map((v) => v.color)),
    ].filter(Boolean)
    const availableSizes = [
        ...new Set(availableVariants.map((v) => v.size)),
    ].filter(Boolean)

    return (
        <Modal
            title={<Title level={4}>Đánh giá sản phẩm</Title>}
            open={visible}
            onCancel={() => {
                form.resetFields()
                setUploadedImages([])
                setImageIds([])
                onClose()
            }}
            footer={null}
            width={600}
            destroyOnClose
        >
            <div style={{ marginBottom: 16 }}>
                <Text strong>{productName}</Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    rating: 5,
                }}
            >
                {/* Order Selection - Only show if user has multiple orders */}
                {!orderId && userOrders.length > 1 && (
                    <Form.Item
                        label="Chọn đơn hàng"
                        required
                        style={{ marginBottom: 24 }}
                    >
                        <Select
                            placeholder="Chọn đơn hàng đã mua sản phẩm này"
                            value={selectedOrderId}
                            onChange={setSelectedOrderId}
                            style={{ width: '100%' }}
                        >
                            {userOrders.map(order => (
                                <Option key={order._id} value={order._id}>
                                    <div>
                                        <Text strong>#{order._id.slice(-6)}</Text>
                                        <Text type="secondary" style={{ marginLeft: 8 }}>
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {order.status === 'delivered' ? 'Đã giao hàng' : 'Đã hoàn thành'}
                                        </Text>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                {/* Show message if no eligible orders */}
                {!orderId && userOrders.length === 0 && (
                    <div style={{ 
                        padding: 16, 
                        backgroundColor: '#fff7e6', 
                        border: '1px solid #ffd591',
                        borderRadius: 6,
                        marginBottom: 16
                    }}>
                        <Text type="warning">
                            🛒 Bạn cần mua và nhận sản phẩm này trước khi có thể đánh giá.
                        </Text>
                    </div>
                )}

                {/* Multi Image Upload - MOVED TO TOP */}
                <Form.Item
                    label="📸 Thêm ảnh đánh giá (tối đa 5 ảnh)"
                    style={{ marginBottom: 32 }}
                >
                    <div>
                        {/* Main Upload Area */}
                        <Upload.Dragger
                            multiple
                            accept="image/*"
                            beforeUpload={beforeUpload}
                            customRequest={({
                                file,
                                fileList,
                                onSuccess,
                                onError,
                            }) => {
                                // Handle single file or multiple files
                                if (fileList && fileList.length > 1) {
                                    // Multiple files selected
                                    const files = fileList.map(
                                        (f) => f.originFileObj || f
                                    )
                                    handleMultipleImageUpload(files)
                                        .then(() => onSuccess())
                                        .catch((error) => onError(error))
                                } else {
                                    // Single file
                                    handleImageUpload(file)
                                        .then(() => onSuccess())
                                        .catch((error) => onError(error))
                                }
                            }}
                            showUploadList={false}
                            disabled={
                                uploadedImages.length >= 5 ||
                                uploadImagesMutation.isLoading
                            }
                            style={{
                                background:
                                    uploadedImages.length >= 5
                                        ? '#f5f5f5'
                                        : '#fafafa',
                                borderColor:
                                    uploadedImages.length >= 5
                                        ? '#d9d9d9'
                                        : '#d9d9d9',
                                borderStyle: 'dashed',
                                borderRadius: 6,
                                padding: '20px',
                                textAlign: 'center',
                            }}
                        >
                            {uploadImagesMutation.isLoading ? (
                                <div>
                                    <CloudUploadOutlined
                                        style={{
                                            fontSize: 48,
                                            color: '#1890ff',
                                        }}
                                    />
                                    <div
                                        style={{
                                            marginTop: 16,
                                            fontSize: 16,
                                            fontWeight: 500,
                                        }}
                                    >
                                        Đang upload ảnh...
                                    </div>
                                    <div
                                        style={{ color: '#666', fontSize: 14 }}
                                    >
                                        Vui lòng chờ trong giây lát
                                    </div>
                                </div>
                            ) : uploadedImages.length >= 5 ? (
                                <div>
                                    <CameraOutlined
                                        style={{
                                            fontSize: 48,
                                            color: '#d9d9d9',
                                        }}
                                    />
                                    <div
                                        style={{
                                            marginTop: 16,
                                            fontSize: 16,
                                            color: '#666',
                                        }}
                                    >
                                        Đã đạt giới hạn 5 ảnh
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <PlusOutlined
                                        style={{
                                            fontSize: 48,
                                            color: '#1890ff',
                                        }}
                                    />
                                    <div
                                        style={{
                                            marginTop: 16,
                                            fontSize: 16,
                                            fontWeight: 500,
                                        }}
                                    >
                                        Kéo thả ảnh vào đây
                                    </div>
                                    <div
                                        style={{ color: '#666', fontSize: 14 }}
                                    >
                                        hoặc click để chọn nhiều ảnh cùng lúc
                                    </div>
                                </div>
                            )}
                        </Upload.Dragger>

                        {/* Uploaded Images Grid */}
                        {uploadedImages.length > 0 && (
                            <div
                                style={{
                                    marginTop: 16,
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: 12,
                                }}
                            >
                                {uploadedImages.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            position: 'relative',
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                            border: '2px solid #f0f0f0',
                                        }}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`Review ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: 100,
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                        <Button
                                            type="primary"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => removeImage(index)}
                                            style={{
                                                position: 'absolute',
                                                top: 6,
                                                right: 6,
                                                borderRadius: '50%',
                                                width: 24,
                                                height: 24,
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow:
                                                    '0 2px 4px rgba(0,0,0,0.2)',
                                            }}
                                        />
                                        {/* Image number overlay */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: 4,
                                                left: 4,
                                                backgroundColor:
                                                    'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                borderRadius: 4,
                                                padding: '2px 6px',
                                                fontSize: 10,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Info */}
                        <div
                            style={{
                                marginTop: 12,
                                padding: '8px 12px',
                                backgroundColor: '#f6ffed',
                                border: '1px solid #b7eb8f',
                                borderRadius: 4,
                                fontSize: 12,
                                color: '#52c41a',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span>
                                    📄 JPG, PNG, WEBP • Tối đa 10MB mỗi ảnh
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {uploadedImages.length}/5 ảnh
                                </span>
                            </div>
                        </div>
                    </div>
                </Form.Item>

                {/* Rating */}
                <Form.Item
                    name="rating"
                    label="Đánh giá của bạn"
                    rules={[
                        { required: true, message: 'Vui lòng chọn số sao!' },
                    ]}
                >
                    <div>
                        <Rate style={{ fontSize: 32, marginBottom: 8 }} />
                        <div>
                            <Text type="secondary" style={{ fontSize: 14 }}>
                                Nhấp vào sao để đánh giá
                            </Text>
                        </div>
                    </div>
                </Form.Item>

                {/* Variant Selection */}
                {(availableColors.length > 0 || availableSizes.length > 0) && (
                    <div style={{ marginBottom: 24 }}>
                        <Text
                            strong
                            style={{ display: 'block', marginBottom: 12 }}
                        >
                            Phiên bản đã mua (không bắt buộc)
                        </Text>

                        <Space>
                            {availableColors.length > 0 && (
                                <Form.Item name="color" style={{ margin: 0 }}>
                                    <Select
                                        placeholder="Chọn màu"
                                        style={{ width: 120 }}
                                        allowClear
                                    >
                                        {availableColors.map((color) => (
                                            <Option key={color} value={color}>
                                                {color}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}

                            {availableSizes.length > 0 && (
                                <Form.Item name="size" style={{ margin: 0 }}>
                                    <Select
                                        placeholder="Chọn size"
                                        style={{ width: 100 }}
                                        allowClear
                                    >
                                        {availableSizes.map((size) => (
                                            <Option key={size} value={size}>
                                                {size}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}
                        </Space>
                    </div>
                )}

                {/* Comment */}
                <Form.Item name="comment" label="Nhận xét của bạn">
                    <TextArea
                        rows={4}
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                        maxLength={1000}
                        showCount
                    />
                </Form.Item>

                {/* Submit Buttons */}
                <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={createReviewMutation.isLoading}
                            disabled={!user}
                        >
                            Gửi đánh giá
                        </Button>
                        <Button
                            onClick={() => {
                                form.resetFields()
                                setUploadedImages([])
                                setImageIds([])
                                onClose()
                            }}
                        >
                            Hủy
                        </Button>
                    </Space>
                </Form.Item>

                {!user && (
                    <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Vui lòng đăng nhập để viết đánh giá
                        </Text>
                    </div>
                )}
            </Form>
        </Modal>
    )
}

export default ReviewForm
