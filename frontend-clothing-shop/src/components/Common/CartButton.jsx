import { useState } from 'react'
import { Button, Select, Space, InputNumber, Modal, Row, Col, Typography, Image } from 'antd'
import { ShoppingCartOutlined, PlusOutlined } from '@ant-design/icons'
import { useAddToCart } from '../../hooks/useCart'

const { Text, Title } = Typography
const { Option } = Select

const CartButton = ({ 
    product, 
    buttonText = "Thêm vào giỏ",
    type = "primary",
    size = "middle",
    block = false,
    showModal = false,
    defaultQuantity = 1
}) => {
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [quantity, setQuantity] = useState(defaultQuantity)
    const addToCart = useAddToCart()

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0)
    }

    const getProductImage = () => {
        return (
            product.color_images?.[0]?.images?.[0]?.medium ||
            product.color_images?.[0]?.images?.[0]?.large ||
            product.color_images?.[0]?.images?.[0]?.thumbnail ||
            product.images?.[0]?.image_url ||
            'https://via.placeholder.com/200x200'
        )
    }

    const handleAddToCart = (variant = null, qty = 1) => {
        const targetVariant = variant || product.variants?.[0]
        
        if (!targetVariant) {
            console.error('No variants available for product:', product._id)
            return
        }

        addToCart.mutate({
            product_id: product._id,
            variant_sku: targetVariant.sku,
            quantity: qty,
            productData: {
                product_name: product.name,
                product_image: getProductImage(),
                variant_color: targetVariant.color,
                variant_size: targetVariant.size,
                price: targetVariant.sale_price || targetVariant.price || product.base_price || product.price
            }
        })

        if (isModalVisible) {
            setIsModalVisible(false)
            setQuantity(defaultQuantity)
            setSelectedVariant(null)
        }
    }

    const handleButtonClick = () => {
        if (showModal && product.variants && product.variants.length > 1) {
            setIsModalVisible(true)
            setSelectedVariant(product.variants[0])
        } else {
            handleAddToCart()
        }
    }

    const handleModalOk = () => {
        if (selectedVariant) {
            handleAddToCart(selectedVariant, quantity)
        }
    }

    const handleModalCancel = () => {
        setIsModalVisible(false)
        setQuantity(defaultQuantity)
        setSelectedVariant(null)
    }

    // Group variants by color
    const variantsByColor = product.variants?.reduce((acc, variant) => {
        if (!acc[variant.color]) {
            acc[variant.color] = []
        }
        acc[variant.color].push(variant)
        return acc
    }, {}) || {}

    const availableColors = Object.keys(variantsByColor)
    const selectedColor = selectedVariant?.color
    const availableSizes = selectedColor ? variantsByColor[selectedColor] : []

    return (
        <>
            <Button
                type={type}
                size={size}
                block={block}
                icon={<ShoppingCartOutlined />}
                loading={addToCart.isPending}
                disabled={!product.variants?.length || product.variants.every(v => v.stock_quantity === 0)}
                onClick={handleButtonClick}
            >
                {!product.variants?.length ? 'Hết hàng' : buttonText}
            </Button>

            <Modal
                title={
                    <Space>
                        <ShoppingCartOutlined />
                        <span>Thêm vào giỏ hàng</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="Thêm vào giỏ"
                cancelText="Hủy"
                confirmLoading={addToCart.isPending}
                okButtonProps={{
                    disabled: !selectedVariant || selectedVariant.stock_quantity === 0
                }}
                width={600}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={10}>
                        <Image
                            src={getProductImage()}
                            alt={product.name}
                            style={{ width: '100%', borderRadius: 8 }}
                            placeholder={
                                <div style={{ 
                                    height: 200, 
                                    backgroundColor: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8
                                }}>
                                    <ShoppingCartOutlined style={{ fontSize: 48, color: '#ccc' }} />
                                </div>
                            }
                        />
                    </Col>
                    
                    <Col xs={24} sm={14}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div>
                                <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                                    {product.name}
                                </Title>
                                <Text type="secondary">SKU: {product.sku || 'N/A'}</Text>
                            </div>

                            {/* Color Selection */}
                            {availableColors.length > 1 && (
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        Màu sắc:
                                    </Text>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={selectedColor}
                                        onChange={(color) => {
                                            const firstVariantOfColor = variantsByColor[color][0]
                                            setSelectedVariant(firstVariantOfColor)
                                        }}
                                        placeholder="Chọn màu sắc"
                                    >
                                        {availableColors.map(color => (
                                            <Option key={color} value={color}>
                                                {color}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                            )}

                            {/* Size Selection */}
                            {selectedColor && availableSizes.length > 1 && (
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        Kích thước:
                                    </Text>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={selectedVariant?.size}
                                        onChange={(size) => {
                                            const variant = availableSizes.find(v => v.size === size)
                                            setSelectedVariant(variant)
                                        }}
                                        placeholder="Chọn kích thước"
                                    >
                                        {availableSizes.map(variant => (
                                            <Option 
                                                key={variant.sku} 
                                                value={variant.size}
                                                disabled={variant.stock_quantity === 0}
                                            >
                                                {variant.size} {variant.stock_quantity === 0 && '(Hết hàng)'}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                            )}

                            {/* Price Display */}
                            {selectedVariant && (
                                <div>
                                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                                        {formatPrice(
                                            selectedVariant.sale_price || 
                                            selectedVariant.price || 
                                            product.base_price || 
                                            product.price
                                        )}
                                    </Text>
                                    {selectedVariant.sale_price && selectedVariant.price > selectedVariant.sale_price && (
                                        <Text 
                                            delete 
                                            style={{ marginLeft: 8, color: '#999', fontSize: 14 }}
                                        >
                                            {formatPrice(selectedVariant.price)}
                                        </Text>
                                    )}
                                </div>
                            )}

                            {/* Stock Status */}
                            {selectedVariant && (
                                <div>
                                    <Text type={selectedVariant.stock_quantity > 0 ? 'success' : 'danger'}>
                                        {selectedVariant.stock_quantity > 0 
                                            ? `Còn ${selectedVariant.stock_quantity} sản phẩm`
                                            : 'Hết hàng'
                                        }
                                    </Text>
                                </div>
                            )}

                            {/* Quantity Selection */}
                            {selectedVariant && selectedVariant.stock_quantity > 0 && (
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        Số lượng:
                                    </Text>
                                    <InputNumber
                                        min={1}
                                        max={selectedVariant.stock_quantity}
                                        value={quantity}
                                        onChange={setQuantity}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            )}
                        </Space>
                    </Col>
                </Row>
            </Modal>
        </>
    )
}

export default CartButton