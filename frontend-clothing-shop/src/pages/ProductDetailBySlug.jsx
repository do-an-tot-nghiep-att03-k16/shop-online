import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProductBySlug } from '../hooks/useProducts'
import { useAddToCart } from '../hooks/useCart'
import {
    Row,
    Col,
    Card,
    Button,
    Typography,
    Image,
    InputNumber,
    Select,
    Tag,
    Divider,
    Breadcrumb,
    Space,
    Rate,
    Tabs,
    message,
} from 'antd'
import {
    ShoppingCartOutlined,
    HeartOutlined,
    HomeOutlined,
    ShareAltOutlined,
    PlusOutlined,
    MinusOutlined,
} from '@ant-design/icons'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import { createSlug, slugToName } from '../utils/slugUtils'
import { ProductReviews } from '../components/Review'
import { useProductRatingStats } from '../hooks/useReviews'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

const ProductDetailBySlug = () => {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [selectedColor, setSelectedColor] = useState('')
    const [selectedSize, setSelectedSize] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [isBuyingNow, setIsBuyingNow] = useState(false)
    
    // Cart functionality
    const addToCartMutation = useAddToCart()

    // Extract product ID from slug if it has ID suffix (e.g., ao-thun-123abc)
    const extractIdFromSlug = (slug) => {
        const parts = slug.split('-')
        const lastPart = parts[parts.length - 1]
        // Check if last part looks like MongoDB ObjectId (6+ chars, alphanumeric)
        if (lastPart && lastPart.length >= 6 && /^[a-zA-Z0-9]+$/.test(lastPart)) {
            return lastPart
        }
        return null
    }

    const productId = extractIdFromSlug(slug)

    // Try to fetch by slug first, fallback to ID if slug fails
    const {
        data: productData,
        isLoading,
        error,
    } = useProductBySlug(slug, {
        retry: 1,
        onError: (error) => {
            console.error('🚨 Product not found:', slug, error)
        }
    })

    const product = productData?.metadata || productData?.data || productData

    // Fetch rating stats for dynamic display
    const { data: ratingStatsData } = useProductRatingStats(product?._id)
    

    useEffect(() => {
        if (product?.color_images?.length > 0) {
            // Set first available color
            setSelectedColor(product.color_images[0].color || '')
        } else if (product?.variants?.length > 0) {
            const firstVariant = product.variants[0]
            setSelectedColor(firstVariant.color || '')
            setSelectedSize(firstVariant.size || '')
        }
    }, [product])

    // Scroll to top when component mounts or slug changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [slug])

    if (isLoading) {
        return <LoadingSpinner />
    }

    if (error || !product) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <Title level={3}>Không tìm thấy sản phẩm</Title>
                <Paragraph>Sản phẩm không tồn tại hoặc đã bị xóa.</Paragraph>
                <Button type="primary" onClick={() => navigate('/shop')}>
                    Về cửa hàng
                </Button>
            </div>
        )
    }

    // Get images for selected color
    const getCurrentColorImages = () => {
        if (product.color_images && product.color_images.length > 0) {
            // Find images for selected color
            const selectedColorData = product.color_images.find(c => c.color === selectedColor)
            if (selectedColorData && selectedColorData.images && selectedColorData.images.length > 0) {
                return selectedColorData.images
            }
            
            // Fallback to first color if selected color not found
            const firstColorData = product.color_images[0]
            if (firstColorData.images && firstColorData.images.length > 0) {
                return firstColorData.images
            }
        }
        
        // Fallback to old structure
        if (product.images && product.images.length > 0) {
            return product.images
        }
        
        return []
    }

    const currentColorImages = getCurrentColorImages()
    const mainImage = currentColorImages.length > 0 
        ? (currentColorImages[0]?.large || currentColorImages[0]?.medium || currentColorImages[0]?.thumbnail)
        : '/placeholder-product.jpg'
        
    
    // Use base_price and calculate discounted price
    const basePrice = product.base_price || product.price || 0
    const discountPercent = product.discount_percent || 0
    const currentPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice
    
    const category = product.category_ids?.[0] || product.category
    
    // Get available colors from color_images (simple)
    const availableColors = product.color_images?.map(c => c.color) || []
    
    // Get sizes from variants 
    const availableSizes = [...new Set(product.variants?.map(v => v.size) || [])]
    
    // Get stock for color and size
    const getColorStock = (color) => {
        if (!product.variants || product.variants.length === 0) {
            return product.stock || product.total_stock || 100
        }
        
        const colorVariants = product.variants.filter(v => v.color === color) || []
        const totalStock = colorVariants.reduce((total, variant) => total + (variant.stock_quantity || variant.stock || 0), 0)
        return totalStock
    }
    
    const getSizeStock = (size) => {
        if (!product.variants || product.variants.length === 0) {
            return product.stock || product.total_stock || 100
        }
        
        const sizeVariant = product.variants.find(v => v.color === selectedColor && v.size === size)
        const sizeStock = sizeVariant?.stock_quantity || sizeVariant?.stock || 0
        return sizeStock
    }
    
    // Get current stock
    const currentVariant = product.variants?.find(v => 
        v.color === selectedColor && v.size === selectedSize
    )
    const currentStock = currentVariant?.stock_quantity || currentVariant?.stock || 0

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    const handleAddToCart = () => {
        if (!selectedColor) {
            message.error('Vui lòng chọn màu sắc')
            return
        }
        if (!selectedSize) {
            message.error('Vui lòng chọn kích thước')
            return
        }
        
        // Tìm variant SKU dựa trên color và size được chọn
        const selectedVariant = product.variants?.find(v => 
            v.color === selectedColor && v.size === selectedSize
        )
        
        if (!selectedVariant) {
            message.error('Không tìm thấy variant phù hợp')
            return
        }
        
        // Gọi API thêm vào giỏ hàng
        addToCartMutation.mutate({
            product_id: product._id,
            variant_sku: selectedVariant.sku || `${product._id}-${selectedColor}-${selectedSize}`,
            quantity: quantity,
            productData: {
                product_name: product.name,
                product_image: mainImage,
                variant_color: selectedColor,
                variant_size: selectedSize,
                price: currentPrice
            }
        })
        
    }

    const handleBuyNow = async () => {
        if (!selectedColor) {
            message.error('Vui lòng chọn màu sắc')
            return
        }
        if (!selectedSize) {
            message.error('Vui lòng chọn kích thước')
            return
        }

        try {
            setIsBuyingNow(true)
            
            // Tìm variant cho màu và size đã chọn
            const variant = product.variants.find(
                (v) => v.color === selectedColor && v.size === selectedSize
            )

            if (!variant) {
                message.error('Không tìm thấy sản phẩm với màu và size đã chọn')
                return
            }

            const cartItem = {
                product_id: product._id,
                variant_sku: variant.sku,
                quantity
            }

            // Thêm sản phẩm vào giỏ hàng
            await new Promise((resolve, reject) => {
                addToCartMutation.mutate(cartItem, {
                    onSuccess: () => {
                        resolve()
                    },
                    onError: (error) => {
                        message.error(error?.message || 'Không thể thêm sản phẩm vào giỏ')
                        reject(error)
                    }
                })
            })

            // Chuyển đến trang checkout ngay lập tức
            navigate('/checkout')
            
        } catch (error) {
            console.error('Error buying now:', error)
        } finally {
            setIsBuyingNow(false)
        }
    }

    return (
        <div className="product-detail-page">
            <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
                {/* Breadcrumb */}
                <Breadcrumb style={{ marginBottom: 24 }}>
                    <Breadcrumb.Item>
                        <HomeOutlined />
                        <a href="/">Trang chủ</a>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <a href="/shop">Cửa hàng</a>
                    </Breadcrumb.Item>
                    {category && (
                        <Breadcrumb.Item>
                            <a href={`/shop/${category.slug || createSlug(category.name)}`}>
                                {category.name}
                            </a>
                        </Breadcrumb.Item>
                    )}
                    <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
                </Breadcrumb>

                <Row gutter={[32, 32]}>
                    {/* Product Images */}
                    <Col xs={24} md={12}>
                        <Card>
                            <div style={{ 
                                width: '100%', 
                                height: 500,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#fafafa',
                                borderRadius: 8,
                                overflow: 'hidden'
                            }}>
                                <Image
                                    src={mainImage}
                                    alt={product.name}
                                    style={{ 
                                        width: 'auto',
                                        height: '100%',
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                    }}
                                    fallback="/placeholder-product.jpg"
                                />
                            </div>
                            {currentColorImages.length > 1 && (
                                <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
                                    {currentColorImages.slice(1, 5).map((image, index) => (
                                        <Col span={6} key={index}>
                                            <div style={{
                                                width: '100%',
                                                height: 80,
                                                backgroundColor: '#fafafa',
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}>
                                                <Image
                                                    src={image?.large || image?.medium || image?.thumbnail}
                                                    alt={`${product.name} ${index + 2}`}
                                                    style={{ 
                                                        width: 'auto',
                                                        height: '100%',
                                                        maxWidth: '100%',
                                                        objectFit: 'contain'
                                                    }}
                                                    fallback="/placeholder-product.jpg"
                                                />
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Card>
                    </Col>

                    {/* Product Info */}
                    <Col xs={24} md={12}>
                        <div>
                            <Title level={2} style={{ marginBottom: 16 }}>
                                {product.name}
                            </Title>

                            {/* Price */}
                            <div style={{ marginBottom: 24 }}>
                                {discountPercent > 0 ? (
                                    <Space>
                                        <Text delete style={{ fontSize: 18, color: '#999' }}>
                                            {formatPrice(basePrice)}
                                        </Text>
                                        <Title level={3} style={{ color: '#ff4d4f', margin: 0 }}>
                                            {formatPrice(currentPrice)}
                                        </Title>
                                        <Tag color="red">
                                            -{discountPercent}%
                                        </Tag>
                                    </Space>
                                ) : (
                                    <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                                        {formatPrice(currentPrice)}
                                    </Title>
                                )}
                            </div>

                            {/* Category & Tags */}
                            <div style={{ marginBottom: 16 }}>
                                <Space wrap>
                                    {category && (
                                        <Tag color="blue">{category.name}</Tag>
                                    )}
                                    {product.gender && (
                                        <Tag color="green">
                                            {product.gender === 'male' ? 'Nam' : 
                                             product.gender === 'female' ? 'Nữ' : 'Unisex'}
                                        </Tag>
                                    )}
                                    {product.status === 'sale' && <Tag color="red">Giảm giá</Tag>}
                                </Space>
                            </div>

                            {/* Rating */}
                            <div style={{ marginBottom: 16 }}>
                                <Space>
                                    <Rate disabled value={ratingStatsData?.average_rating || 0} allowHalf />
                                    <Text type="secondary">({ratingStatsData?.total_reviews || 0} đánh giá)</Text>
                                </Space>
                            </div>

                            {/* Color Selection */}
                            {product.color_images?.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>
                                        Màu sắc: <span style={{ color: '#1890ff' }}>{selectedColor}</span>
                                    </Text>
                                    <Space wrap size={[12, 12]}>
                                        {product.color_images.map((colorItem) => {
                                            const colorStock = getColorStock(colorItem.color)
                                            const isColorAvailable = colorStock > 0
                                            
                                            return (
                                                <div
                                                    key={colorItem.color}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        cursor: isColorAvailable ? 'pointer' : 'not-allowed',
                                                        padding: 8,
                                                        borderRadius: 8,
                                                        border: selectedColor === colorItem.color 
                                                            ? '2px solid #1890ff' 
                                                            : '1px solid #f0f0f0',
                                                        backgroundColor: selectedColor === colorItem.color ? '#f6ffed' : 
                                                                       !isColorAvailable ? '#f5f5f5' : 'white',
                                                        opacity: !isColorAvailable ? 0.5 : 1,
                                                        position: 'relative'
                                                    }}
                                                    onClick={() => {
                                                        if (isColorAvailable) {
                                                            setSelectedColor(colorItem.color)
                                                            setSelectedSize('') // Reset size when changing color
                                                        }
                                                    }}
                                                >
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    backgroundColor: colorItem.color_code,
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    marginBottom: 4
                                                }} />
                                                <span style={{ 
                                                    fontSize: 12, 
                                                    color: selectedColor === colorItem.color ? '#1890ff' : 
                                                           !isColorAvailable ? '#999' : '#666',
                                                    fontWeight: selectedColor === colorItem.color ? 600 : 400
                                                }}>
                                                    {colorItem.color}
                                                </span>
                                                <span style={{ 
                                                    fontSize: 10, 
                                                    color: colorStock > 0 ? '#52c41a' : '#ff4d4f',
                                                    fontWeight: 500
                                                }}>
                                                    {colorStock > 0 ? `Còn ${colorStock}` : 'Hết hàng'}
                                                </span>
                                                {!isColorAvailable && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        width: '100%',
                                                        height: 2,
                                                        backgroundColor: '#ff4d4f'
                                                    }} />
                                                )}
                                            </div>
                                        )})}
                                    </Space>
                                </div>
                            )}

                            {/* Size Selection */}
                            {availableSizes?.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>
                                        Kích thước: {selectedSize && <span style={{ color: '#1890ff' }}>{selectedSize}</span>}
                                    </Text>
                                    <Space wrap>
                                        {availableSizes.map(size => {
                                            const sizeStock = getSizeStock(size)
                                            const isSizeAvailable = sizeStock > 0
                                            
                                            return (
                                                <div key={size} style={{ position: 'relative' }}>
                                                    <Button
                                                        type={selectedSize === size ? 'primary' : 'default'}
                                                        disabled={!isSizeAvailable}
                                                        style={{
                                                            minWidth: 60,
                                                            height: 40,
                                                            fontWeight: selectedSize === size ? 600 : 400,
                                                            opacity: !isSizeAvailable ? 0.5 : 1
                                                        }}
                                                        onClick={() => setSelectedSize(size)}
                                                    >
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div>{size}</div>
                                                            <div style={{ 
                                                                fontSize: 10, 
                                                                color: selectedSize === size ? 'white' : 
                                                                       sizeStock > 0 ? '#52c41a' : '#ff4d4f'
                                                            }}>
                                                                {sizeStock > 0 ? `SL: ${sizeStock}` : 'Hết'}
                                                            </div>
                                                        </div>
                                                    </Button>
                                                    {!isSizeAvailable && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%) rotate(45deg)',
                                                            width: '100%',
                                                            height: 2,
                                                            backgroundColor: '#ff4d4f',
                                                            pointerEvents: 'none'
                                                        }} />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </Space>
                                </div>
                            )}

                            {/* Stock Display */}
                            {selectedColor && selectedSize && (
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ 
                                        padding: 12,
                                        backgroundColor: currentStock > 0 ? '#f6ffed' : '#fff2f0',
                                        border: `1px solid ${currentStock > 0 ? '#b7eb8f' : '#ffccc7'}`,
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <span style={{ 
                                            color: currentStock > 0 ? '#52c41a' : '#ff4d4f',
                                            fontWeight: 600
                                        }}>
                                            {currentStock > 0 ? '✓' : '✗'}
                                        </span>
                                        <Text style={{ 
                                            color: currentStock > 0 ? '#52c41a' : '#ff4d4f',
                                            fontWeight: 500
                                        }}>
                                            {currentStock > 0 ? 
                                                `Còn ${currentStock} sản phẩm` : 
                                                'Hết hàng'
                                            }
                                        </Text>
                                        {currentStock > 0 && currentStock <= 5 && (
                                            <Text style={{ color: '#faad14', fontSize: 12 }}>
                                                (Sắp hết!)
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div style={{ marginBottom: 32 }}>
                                <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>
                                    Số lượng:
                                </Text>
                                <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 8,
                                    overflow: 'hidden'
                                }}>
                                    <Button
                                        icon={<MinusOutlined />}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                        style={{ 
                                            border: 'none',
                                            borderRadius: 0,
                                            height: 40,
                                            width: 40
                                        }}
                                    />
                                    <div style={{
                                        width: 60,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        backgroundColor: '#fafafa'
                                    }}>
                                        {quantity}
                                    </div>
                                    <Button
                                        icon={<PlusOutlined />}
                                        onClick={() => setQuantity(quantity + 1)}
                                        disabled={quantity >= currentStock}
                                        style={{ 
                                            border: 'none',
                                            borderRadius: 0,
                                            height: 40,
                                            width: 40
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginBottom: 24 }}>
                                <Space orientation="vertical" style={{ width: '100%' }} size={16}>
                                    <Space style={{ width: '100%' }} size={12}>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={handleAddToCart}
                                            loading={addToCartMutation.isPending}
                                            disabled={!selectedColor || !selectedSize || currentStock === 0 || addToCartMutation.isPending}
                                            style={{ 
                                                flex: 1,
                                                height: 48,
                                                fontSize: 16,
                                                fontWeight: 600,
                                                borderRadius: 8
                                            }}
                                        >
                                            {addToCartMutation.isPending ? 'Đang thêm...' :
                                             !selectedColor || !selectedSize ? 'Chọn màu & size' : 
                                             currentStock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                                        </Button>
                                        <Button
                                            size="large"
                                            onClick={() => handleBuyNow()}
                                            loading={isBuyingNow}
                                            disabled={!selectedColor || !selectedSize || currentStock === 0 || isBuyingNow}
                                            style={{ 
                                                flex: 1,
                                                height: 48,
                                                fontSize: 16,
                                                fontWeight: 600,
                                                borderRadius: 8,
                                                backgroundColor: (!selectedColor || !selectedSize || currentStock === 0) ? undefined : '#ff7875',
                                                borderColor: (!selectedColor || !selectedSize || currentStock === 0) ? undefined : '#ff7875',
                                                color: (!selectedColor || !selectedSize || currentStock === 0) ? undefined : 'white'
                                            }}
                                        >
                                            {!selectedColor || !selectedSize ? 'Chọn màu & size' : 
                                             currentStock === 0 ? 'Hết hàng' : 'Mua ngay'}
                                        </Button>
                                    </Space>
                                    
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'center',
                                        gap: 24,
                                        paddingTop: 16,
                                        borderTop: '1px solid #f0f0f0'
                                    }}>
                                        <Button 
                                            type="text" 
                                            icon={<HeartOutlined />}
                                            style={{ color: '#666' }}
                                        >
                                            Yêu thích
                                        </Button>
                                        <Button 
                                            type="text" 
                                            icon={<ShareAltOutlined />}
                                            style={{ color: '#666' }}
                                        >
                                            Chia sẻ
                                        </Button>
                                    </div>
                                </Space>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Divider />

                {/* Product Details Tabs */}
                <Tabs defaultActiveKey="1">
                    <TabPane tab="Chi tiết sản phẩm" key="1">
                        <div style={{ padding: 24 }}>
                            <Paragraph>
                                {product.description || 'Chưa có mô tả chi tiết.'}
                            </Paragraph>
                            {product.details && (
                                <div>
                                    <Title level={4}>Thông số kỹ thuật:</Title>
                                    <ul>
                                        {Object.entries(product.details).map(([key, value]) => (
                                            <li key={key}>
                                                <strong>{key}:</strong> {value}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </TabPane>
                    <TabPane tab={`Đánh giá (${ratingStatsData?.total_reviews || 0})`} key="2">
                        <div style={{ padding: 24, textAlign: 'center' }}>
                            <ProductReviews
                                productId={product._id}
                                productName={product.name}
                                productVariants={product.variants || []}
                            />
                        </div>
                    </TabPane>
                    <TabPane tab="Hướng dẫn bảo quản" key="3">
                        <div style={{ padding: 24 }}>
                            <ul>
                                <li>Giặt bằng nước lạnh</li>
                                <li>Không sử dụng chất tẩy</li>
                                <li>Phơi khô tự nhiên</li>
                                <li>Ủi ở nhiệt độ thấp</li>
                            </ul>
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        </div>
    )
}

export default ProductDetailBySlug