import { useState, useEffect } from 'react'
import {
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    Button,
    Steps,
    Row,
    Col,
    message,
} from 'antd'
import {
    SaveOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons'
import ProductImageUpload from './ProductImageUpload'
import ProductVariantManager from './ProductVariantManager'

const { TextArea } = Input
const { Option } = Select

/**
 * Modal tạo/sửa sản phẩm với Steps
 * Submit format: color_images có cấu trúc {image_id, image_url}
 */
const ProductFormModal = ({
    open,
    onCancel,
    onSubmit,
    editingProduct = null,
    categories = [],
    loading = false,
}) => {
    const isViewOnly = editingProduct?._viewOnly
    const [form] = Form.useForm()
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        category_ids: [],
        material: '',
        gender: '',
        base_price: 0,
        discount_percent: 0,
        status: 'active',
        color_images: [],
        variants: [],
    })

    // Load editing data
    useEffect(() => {
        if (editingProduct) {
            const data = {
                name: editingProduct.name,
                description: editingProduct.description,
                category_ids: editingProduct.category_ids?.map((cat) =>
                    typeof cat === 'string' ? cat : cat._id || cat
                ),
                material: editingProduct.material,
                gender: editingProduct.gender,
                base_price: editingProduct.base_price,
                discount_percent: editingProduct.discount_percent,
                status: editingProduct.status,
                color_images: editingProduct.color_images || [],
                variants: editingProduct.variants || [],
            }
            setFormData(data)
            form.setFieldsValue(data)
        } else {
            handleReset()
        }
    }, [editingProduct, open, form])

    // Reset form
    const handleReset = () => {
        const initialData = {
            name: '',
            description: '',
            category_ids: [],
            material: '',
            gender: '',
            base_price: 0,
            discount_percent: 0,
            status: 'active',
            color_images: [],
            variants: [],
        }
        setFormData(initialData)
        form.resetFields()
        setCurrentStep(0)
    }

    // Handle step navigation
    const handleNext = async () => {
        try {
            // Validate current step
            if (currentStep === 0) {
                const values = await form.validateFields([
                    'name',
                    'category_ids',
                    'gender',
                    'base_price',
                ])
                setFormData({ ...formData, ...values })
            }

            if (currentStep === 1) {
                if (
                    !formData.color_images ||
                    formData.color_images.length === 0
                ) {
                    message.warning('Vui lòng thêm ít nhất 1 màu!')
                    return
                }
                const hasImages = formData.color_images.some(
                    (c) => c.images && c.images.length > 0
                )
                if (!hasImages) {
                    message.warning('Vui lòng upload ảnh cho ít nhất 1 màu!')
                    return
                }
            }

            setCurrentStep(currentStep + 1)
        } catch (error) {
            console.error('Validation error:', error)
        }
    }

    const handlePrev = () => {
        setCurrentStep(currentStep - 1)
    }

    // ⭐ Handle final submit - TRANSFORM DATA STRUCTURE
    const handleFinish = async () => {
        try {
            // Validate variants
            if (!formData.variants || formData.variants.length === 0) {
                message.error('Vui lòng thêm ít nhất 1 variant!')
                return
            }

            // Clean data (remove temp IDs)
            const cleanedVariants = formData.variants.map((v) => {
                const { _id, ...rest } = v
                return rest
            })

            // ⭐ TRANSFORM color_images: Gửi image_id (string array) lên backend
            // Backend structure: color_images: [{ color, color_code, images: ["image_id1", "image_id2"] }]
            const cleanedColorImages = formData.color_images.map(
                (colorItem) => {
                    const { _tempImages, ...rest } = colorItem
                    return {
                        ...rest,
                        // Transform từ array of objects thành array of image_id strings
                        images: colorItem.images.map((img) =>
                            typeof img === 'string' ? img : img.image_id
                        ),
                    }
                }
            )

            const submitData = {
                ...formData,
                variants: cleanedVariants,
                color_images: cleanedColorImages,
            }

            await onSubmit(submitData)

            handleReset()
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu sản phẩm!')
        }
    }

    // Handle cancel
    const handleModalCancel = () => {
        handleReset()
        onCancel()
    }

    // Steps configuration
    const steps = [
        {
            title: 'Thông tin cơ bản',
            description: 'Tên, giá, danh mục...',
        },
        {
            title: 'Upload ảnh',
            description: 'Ảnh theo màu sắc',
        },
        {
            title: 'Variants',
            description: 'Size, màu, tồn kho',
        },
    ]

    return (
        <Modal
            title={
                isViewOnly
                    ? 'Chi tiết sản phẩm'
                    : editingProduct
                    ? 'Chỉnh sửa sản phẩm'
                    : 'Thêm sản phẩm mới'
            }
            open={open}
            onCancel={handleModalCancel}
            width={1000}
            footer={null}
            destroyOnHidden
        >
            {/* Steps */}
            <Steps
                current={currentStep}
                items={steps}
                style={{ marginBottom: 32 }}
            />

            {/* Form Content */}
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                disabled={isViewOnly}
            >
                {/* STEP 1: Basic Info */}
                {currentStep === 0 && (
                    <div>
                        <Form.Item
                            label="Tên sản phẩm"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập tên sản phẩm!',
                                },
                            ]}
                        >
                            <Input
                                placeholder="VD: Áo thun nam cotton"
                                size="large"
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </Form.Item>

                        <Form.Item label="Mô tả" name="description">
                            <TextArea
                                rows={4}
                                placeholder="Mô tả chi tiết sản phẩm..."
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Danh mục"
                                    name="category_ids"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng chọn danh mục!',
                                        },
                                    ]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Chọn danh mục"
                                        size="large"
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                category_ids: value,
                                            })
                                        }
                                    >
                                        {(categories || []).map((cat) => (
                                            <Option
                                                key={cat._id}
                                                value={cat._id}
                                            >
                                                {cat.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Giới tính"
                                    name="gender"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng chọn giới tính!',
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Chọn giới tính"
                                        size="large"
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                gender: value,
                                            })
                                        }
                                    >
                                        <Option value="male">Nam</Option>
                                        <Option value="female">Nữ</Option>
                                        <Option value="unisex">Unisex</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Chất liệu" name="material">
                            <Input
                                placeholder="VD: Cotton 100%"
                                size="large"
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        material: e.target.value,
                                    })
                                }
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Giá gốc"
                                    name="base_price"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng nhập giá!',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={(value) =>
                                            `${value}`.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ','
                                            )
                                        }
                                        parser={(value) =>
                                            value.replace(/\$\s?|(,*)/g, '')
                                        }
                                        size="large"
                                        addonAfter="VNĐ"
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                base_price: value,
                                            })
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Giảm giá (%)"
                                    name="discount_percent"
                                >
                                    <InputNumber
                                        min={0}
                                        max={100}
                                        style={{ width: '100%' }}
                                        size="large"
                                        addonAfter="%"
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                discount_percent: value || 0,
                                            })
                                        }
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Trạng thái"
                            name="status"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng chọn trạng thái!',
                                },
                            ]}
                        >
                            <Select
                                placeholder="Chọn trạng thái"
                                size="large"
                                onChange={(value) =>
                                    setFormData({ ...formData, status: value })
                                }
                            >
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                                <Option value="out_of_stock">
                                    Out of Stock
                                </Option>
                            </Select>
                        </Form.Item>
                    </div>
                )}

                {/* STEP 2: Images */}
                {currentStep === 1 && (
                    <ProductImageUpload
                        value={formData.color_images}
                        onChange={(value) =>
                            setFormData({ ...formData, color_images: value })
                        }
                    />
                )}

                {/* STEP 3: Variants */}
                {currentStep === 2 && (
                    <ProductVariantManager
                        value={formData.variants}
                        onChange={(value) =>
                            setFormData({ ...formData, variants: value })
                        }
                        colorImages={formData.color_images}
                        productData={{
                            name: formData.name,
                            slug: formData.slug,
                            categories: formData.categories,
                        }}
                    />
                )}
            </Form>

            {/* Footer Actions */}
            <Row
                justify="space-between"
                style={{
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: '1px solid #f0f0f0',
                }}
            >
                <Col>
                    {currentStep > 0 && !isViewOnly && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handlePrev}
                            size="large"
                        >
                            Quay lại
                        </Button>
                    )}
                </Col>
                <Col>
                    {!isViewOnly && (
                        <>
                            {currentStep < steps.length - 1 && (
                                <Button
                                    type="primary"
                                    icon={<ArrowRightOutlined />}
                                    onClick={handleNext}
                                    size="large"
                                >
                                    Tiếp theo
                                </Button>
                            )}
                            {currentStep === steps.length - 1 && (
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleFinish}
                                    loading={loading}
                                    size="large"
                                >
                                    {editingProduct
                                        ? 'Cập nhật'
                                        : 'Tạo sản phẩm'}
                                </Button>
                            )}
                        </>
                    )}
                    {isViewOnly && (
                        <Button onClick={handleModalCancel} size="large">
                            Đóng
                        </Button>
                    )}
                </Col>
            </Row>
        </Modal>
    )
}

export default ProductFormModal
