import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    Row,
    Col,
    Card,
    Button,
    Typography,
    Image,
    Select,
    InputNumber,
    Tag,
    Divider,
    Space,
    Tabs,
    Rate,
    message,
} from 'antd'
import {
    ShoppingCartOutlined,
    HeartOutlined,
    ShareAltOutlined,
    LeftOutlined,
    PlusOutlined,
    MinusOutlined,
} from '@ant-design/icons'
import { useProducts } from '../hooks/useProducts'
import { useAddToCart } from '../hooks/useCart'
import { useProductRatingStats } from '../hooks/useReviews'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import SmoothTransition from '../components/Common/SmoothTransition'
import { ProductReviews } from '../components/Review'
import { extractData } from '../utils/apiUtils'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [selectedColor, setSelectedColor] = useState('')
    const [selectedSize, setSelectedSize] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [isBuyingNow, setIsBuyingNow] = useState(false)

    // Cart functionality - sử dụng silent mode để tránh duplicate message
    const addToCartMutation = useAddToCart({ silent: true })

    // Fetch product detail
    const {
        data: productData,
        isLoading,
        error,
    } = useProducts({ productId: id })

    // Fetch rating stats for dynamic display
    const { data: stats } = useProductRatingStats(id)
    

    // Process single product data
    const product = productData?.metadata || productData

    useEffect(() => {
        if (product?.color_images?.length > 0) {
            setSelectedColor(product.color_images[0].color)
        }
    }, [product])

    // Scroll to top when component mounts or product changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [id]) // Re-scroll when product ID changes

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
        const selectedVariant = product.variants?.find(
            (v) => v.color === selectedColor && v.size === selectedSize
        )

        if (!selectedVariant) {
            message.error('Không tìm thấy variant phù hợp')
            return
        }

        const basePrice = product.base_price || product.price || 0
        const currentPrice =
            product.discount_percent > 0
                ? basePrice * (1 - product.discount_percent / 100)
                : basePrice

        const currentImages =
            product.color_images?.find((c) => c.color === selectedColor)
                ?.images || []
        const mainImage =
            currentImages[0]?.large ||
            currentImages[0]?.medium ||
            currentImages[0]?.thumbnail ||
            '/placeholder-product.jpg'

        // Gọi API thêm vào giỏ hàng
        addToCartMutation.mutate({
            product_id: product._id,
            variant_sku:
                selectedVariant.sku ||
                `${product._id}-${selectedColor}-${selectedSize}`,
            quantity: quantity,
            productData: {
                product_name: product.name,
                product_image: mainImage,
                variant_color: selectedColor,
                variant_size: selectedSize,
                price: currentPrice,
            },
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

            // Thêm sản phẩm vào giỏ hàng cho Buy Now - chỉ 1 message
            await new Promise((resolve, reject) => {
                addToCartMutation.mutate(cartItem, {
                    onSuccess: async (data) => {
                        // Đợi React Query invalidate cache xong
                        await new Promise(resolve => setTimeout(resolve, 300))
                        resolve()
                    },
                    onError: (error) => {
                        message.error(error?.message || 'Không thể thêm sản phẩm vào giỏ')
                        reject(error)
                    }
                })
            })

            // Navigate sau khi đã chắc chắn cart được update
            navigate('/checkout')
            
        } catch (error) {
            console.error('Error buying now:', error)
        } finally {
            setIsBuyingNow(false)
        }
    }

    if (isLoading) {
        return <LoadingSpinner />
    }

    if (error || !product) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <Title level={3}>Sản phẩm không tồn tại</Title>
                <Paragraph>
                    Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
                </Paragraph>
                <Button type="primary">
                    <Link to="/shop">Quay lại cửa hàng</Link>
                </Button>
            </div>
        )
    }

    // Get current color data
    const currentColorData =
        product.color_images?.find((c) => c.color === selectedColor) ||
        product.color_images?.[0]
    const currentImages = currentColorData?.images || []

    // Get available sizes and stock for current color
    const currentColorVariants =
        product.variants?.filter((v) => v.color === selectedColor) || []
    const availableSizes = [
        ...new Set(product.variants?.map((v) => v.size) || []),
    ]

    // Get stock for current selection
    const currentVariant = product.variants?.find(
        (v) => v.color === selectedColor && v.size === selectedSize
    )
    const currentStock =
        currentVariant?.stock_quantity || currentVariant?.stock || 0

    // Check if color has any stock
    const getColorStock = (color) => {
        // If no variants, assume product has stock
        if (!product.variants || product.variants.length === 0) {
            return product.stock || product.total_stock || 100 // Default fallback
        }

        const colorVariants =
            product.variants.filter((v) => v.color === color) || []
        const totalStock = colorVariants.reduce(
            (total, variant) =>
                total + (variant.stock_quantity || variant.stock || 0),
            0
        )

        // console.log(
        //     '🔍 [ProductDetail] Color stock for',
        //     color,
        //     ':',
        //     totalStock,
        //     'variants:',
        //     colorVariants
        // )
        return totalStock
    }

    // Check if size has stock in current color
    const getSizeStock = (size) => {
        // If no variants, assume product has stock
        if (!product.variants || product.variants.length === 0) {
            return product.stock || product.total_stock || 100 // Default fallback
        }

        const sizeVariant = product.variants.find(
            (v) => v.color === selectedColor && v.size === size
        )
        const sizeStock = sizeVariant?.stock_quantity || sizeVariant?.stock || 0

        // console.log(
        //     '🔍 [ProductDetail] Size stock for',
        //     size,
        //     'in color',
        //     selectedColor,
        //     ':',
        //     sizeStock,
        //     'variant:',
        //     sizeVariant
        // )
        return sizeStock
    }

    return (
        <SmoothTransition loading={isLoading}>
            <div className="product-detail-page">
                <div
                    className="container"
                    style={{
                        maxWidth: 1200,
                        margin: '0 auto',
                        padding: '20px',
                    }}
                >
                    {/* Breadcrumb */}
                    <div style={{ marginBottom: 24 }}>
                        <Button icon={<LeftOutlined />} type="link">
                            <Link to="/shop">Quay lại cửa hàng</Link>
                        </Button>
                    </div>

                    <Row gutter={[32, 32]}>
                        {/* Product Images */}
                        <Col xs={24} md={12}>
                            <div className="product-images">
                                {/* Main Image */}
                                <div style={{ marginBottom: 16 }}>
                                    <Image
                                        width="100%"
                                        height={400}
                                        style={{
                                            objectFit: 'cover',
                                            borderRadius: 8,
                                        }}
                                        src={
                                            currentImages[selectedImageIndex]
                                                ?.large ||
                                            currentImages[selectedImageIndex]
                                                ?.medium ||
                                            currentImages[selectedImageIndex]
                                                ?.thumbnail ||
                                            'https://via.placeholder.com/400x400'
                                        }
                                        alt={product.name}
                                    />
                                </div>

                                {/* Thumbnail Images */}
                                {currentImages.length > 1 && (
                                    <Row gutter={[8, 8]}>
                                        {currentImages.map((image, index) => (
                                            <Col span={6} key={index}>
                                                <div
                                                    style={{
                                                        border:
                                                            selectedImageIndex ===
                                                            index
                                                                ? '2px solid #1890ff'
                                                                : '1px solid #d9d9d9',
                                                        borderRadius: 4,
                                                        padding: 2,
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() =>
                                                        setSelectedImageIndex(
                                                            index
                                                        )
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            image?.thumbnail ||
                                                            image?.medium ||
                                                            image?.large ||
                                                            'https://via.placeholder.com/60x60'
                                                        }
                                                        alt={`${product.name} ${
                                                            index + 1
                                                        }`}
                                                        style={{
                                                            width: '100%',
                                                            height: 60,
                                                            objectFit: 'cover',
                                                            borderRadius: 2,
                                                        }}
                                                    />
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </div>
                        </Col>

                        {/* Product Info */}
                        <Col xs={24} md={12}>
                            <div className="product-info">
                                {/* Product Name */}
                                <Title level={2} style={{ marginBottom: 8 }}>
                                    {product.name}
                                </Title>

                                {/* Category */}
                                {product.category_name && (
                                    <div style={{ marginBottom: 16 }}>
                                        <Link
                                            to={`/shop?category=${product.category_id}`}
                                        >
                                            <Tag color="blue">
                                                {product.category_name}
                                            </Tag>
                                        </Link>
                                    </div>
                                )}

                                {/* Rating */}
                                <div style={{ marginBottom: 16 }}>
                                    <Space>
                                        <Rate
                                            disabled
                                            value={stats?.average_rating || 0}
                                            allowHalf
                                        />
                                        <Text>
                                            (
                                            {stats?.total_reviews ||
                                                product.ratings_count ||
                                                0}{' '}
                                            đánh giá)
                                        </Text>
                                    </Space>
                                </div>

                                {/* Price - Always show original + current */}
                                <div style={{ marginBottom: 24 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            marginBottom: 8,
                                        }}
                                    >
                                        {product.discount_percent > 0 ? (
                                            <>
                                                <Title
                                                    level={2}
                                                    style={{
                                                        color: '#ff4d4f',
                                                        margin: 0,
                                                        fontSize: 28,
                                                    }}
                                                >
                                                    {new Intl.NumberFormat(
                                                        'vi-VN',
                                                        {
                                                            style: 'currency',
                                                            currency: 'VND',
                                                        }
                                                    ).format(
                                                        product.base_price *
                                                            (1 -
                                                                product.discount_percent /
                                                                    100)
                                                    )}
                                                </Title>
                                                <div
                                                    style={{
                                                        fontSize: 18,
                                                        color: '#999',
                                                        textDecoration:
                                                            'line-through',
                                                    }}
                                                >
                                                    {new Intl.NumberFormat(
                                                        'vi-VN',
                                                        {
                                                            style: 'currency',
                                                            currency: 'VND',
                                                        }
                                                    ).format(
                                                        product.base_price
                                                    )}
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 16,
                                                        backgroundColor:
                                                            '#ff4d4f',
                                                        color: 'white',
                                                        padding: '6px 12px',
                                                        borderRadius: 8,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Tiết kiệm{' '}
                                                    {product.discount_percent}%
                                                </span>
                                            </>
                                        ) : (
                                            <Title
                                                level={2}
                                                style={{
                                                    color: '#ff4d4f',
                                                    margin: 0,
                                                    fontSize: 28,
                                                }}
                                            >
                                                {new Intl.NumberFormat(
                                                    'vi-VN',
                                                    {
                                                        style: 'currency',
                                                        currency: 'VND',
                                                    }
                                                ).format(
                                                    product.base_price || 0
                                                )}
                                            </Title>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            color: '#52c41a',
                                            fontWeight: 500,
                                        }}
                                    >
                                        ✓ Miễn phí vận chuyển toàn quốc
                                    </div>
                                </div>

                                {/* Short Description Only */}
                                {product.description && (
                                    <div style={{ marginBottom: 24 }}>
                                        <div
                                            style={{
                                                color: '#666',
                                                lineHeight: 1.5,
                                                fontSize: 14,
                                            }}
                                        >
                                            {product.description.split('\n')[0]}
                                            ...
                                        </div>
                                    </div>
                                )}

                                {/* Color Selection */}
                                {product.color_images?.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                        <Text
                                            strong
                                            style={{
                                                display: 'block',
                                                marginBottom: 12,
                                                fontSize: 16,
                                            }}
                                        >
                                            Màu sắc:{' '}
                                            <span style={{ color: '#1890ff' }}>
                                                {selectedColor}
                                            </span>
                                        </Text>
                                        <Space wrap size={[12, 12]}>
                                            {product.color_images.map(
                                                (colorItem) => {
                                                    const colorStock =
                                                        getColorStock(
                                                            colorItem.color
                                                        )
                                                    const isColorAvailable =
                                                        colorStock > 0

                                                    return (
                                                        <div
                                                            key={
                                                                colorItem.color
                                                            }
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection:
                                                                    'column',
                                                                alignItems:
                                                                    'center',
                                                                cursor: isColorAvailable
                                                                    ? 'pointer'
                                                                    : 'not-allowed',
                                                                padding: 8,
                                                                borderRadius: 8,
                                                                border:
                                                                    selectedColor ===
                                                                    colorItem.color
                                                                        ? '2px solid #1890ff'
                                                                        : '1px solid #f0f0f0',
                                                                backgroundColor:
                                                                    selectedColor ===
                                                                    colorItem.color
                                                                        ? '#f6ffed'
                                                                        : !isColorAvailable
                                                                        ? '#f5f5f5'
                                                                        : 'white',
                                                                opacity:
                                                                    !isColorAvailable
                                                                        ? 0.5
                                                                        : 1,
                                                                position:
                                                                    'relative',
                                                            }}
                                                            onClick={() => {
                                                                if (
                                                                    isColorAvailable
                                                                ) {
                                                                    setSelectedColor(
                                                                        colorItem.color
                                                                    )
                                                                    setSelectedImageIndex(
                                                                        0
                                                                    )
                                                                    setSelectedSize(
                                                                        ''
                                                                    ) // Reset size when changing color
                                                                }
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius:
                                                                        '50%',
                                                                    backgroundColor:
                                                                        colorItem.color_code,
                                                                    border: '2px solid #fff',
                                                                    boxShadow:
                                                                        '0 2px 4px rgba(0,0,0,0.1)',
                                                                    marginBottom: 4,
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                    color:
                                                                        selectedColor ===
                                                                        colorItem.color
                                                                            ? '#1890ff'
                                                                            : !isColorAvailable
                                                                            ? '#999'
                                                                            : '#666',
                                                                    fontWeight:
                                                                        selectedColor ===
                                                                        colorItem.color
                                                                            ? 600
                                                                            : 400,
                                                                }}
                                                            >
                                                                {
                                                                    colorItem.color
                                                                }
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    color:
                                                                        colorStock >
                                                                        0
                                                                            ? '#52c41a'
                                                                            : '#ff4d4f',
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {colorStock > 0
                                                                    ? `Còn ${colorStock}`
                                                                    : 'Hết hàng'}
                                                            </span>
                                                            {!isColorAvailable && (
                                                                <div
                                                                    style={{
                                                                        position:
                                                                            'absolute',
                                                                        top: '50%',
                                                                        left: '50%',
                                                                        transform:
                                                                            'translate(-50%, -50%)',
                                                                        width: '100%',
                                                                        height: 2,
                                                                        backgroundColor:
                                                                            '#ff4d4f',
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    )
                                                }
                                            )}
                                        </Space>
                                    </div>
                                )}

                                {/* Size Selection */}
                                {availableSizes?.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                        <Text
                                            strong
                                            style={{
                                                display: 'block',
                                                marginBottom: 12,
                                                fontSize: 16,
                                            }}
                                        >
                                            Kích thước:{' '}
                                            {selectedSize && (
                                                <span
                                                    style={{ color: '#1890ff' }}
                                                >
                                                    {selectedSize}
                                                </span>
                                            )}
                                        </Text>
                                        <Space wrap>
                                            {availableSizes.map((size) => {
                                                const sizeStock =
                                                    getSizeStock(size)
                                                const isSizeAvailable =
                                                    sizeStock > 0

                                                return (
                                                    <div
                                                        key={size}
                                                        style={{
                                                            position:
                                                                'relative',
                                                        }}
                                                    >
                                                        <Button
                                                            type={
                                                                selectedSize ===
                                                                size
                                                                    ? 'primary'
                                                                    : 'default'
                                                            }
                                                            disabled={
                                                                !isSizeAvailable
                                                            }
                                                            style={{
                                                                minWidth: 60,
                                                                height: 40,
                                                                fontWeight:
                                                                    selectedSize ===
                                                                    size
                                                                        ? 600
                                                                        : 400,
                                                                opacity:
                                                                    !isSizeAvailable
                                                                        ? 0.5
                                                                        : 1,
                                                            }}
                                                            onClick={() =>
                                                                setSelectedSize(
                                                                    size
                                                                )
                                                            }
                                                        >
                                                            <div
                                                                style={{
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                <div>
                                                                    {size}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color:
                                                                            selectedSize ===
                                                                            size
                                                                                ? 'white'
                                                                                : sizeStock >
                                                                                  0
                                                                                ? '#52c41a'
                                                                                : '#ff4d4f',
                                                                    }}
                                                                >
                                                                    {sizeStock >
                                                                    0
                                                                        ? `SL: ${sizeStock}`
                                                                        : 'Hết'}
                                                                </div>
                                                            </div>
                                                        </Button>
                                                        {!isSizeAvailable && (
                                                            <div
                                                                style={{
                                                                    position:
                                                                        'absolute',
                                                                    top: '50%',
                                                                    left: '50%',
                                                                    transform:
                                                                        'translate(-50%, -50%) rotate(45deg)',
                                                                    width: '100%',
                                                                    height: 2,
                                                                    backgroundColor:
                                                                        '#ff4d4f',
                                                                    pointerEvents:
                                                                        'none',
                                                                }}
                                                            />
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
                                        <div
                                            style={{
                                                padding: 12,
                                                backgroundColor:
                                                    currentStock > 0
                                                        ? '#f6ffed'
                                                        : '#fff2f0',
                                                border: `1px solid ${
                                                    currentStock > 0
                                                        ? '#b7eb8f'
                                                        : '#ffccc7'
                                                }`,
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color:
                                                        currentStock > 0
                                                            ? '#52c41a'
                                                            : '#ff4d4f',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {currentStock > 0 ? '✓' : '✗'}
                                            </span>
                                            <Text
                                                style={{
                                                    color:
                                                        currentStock > 0
                                                            ? '#52c41a'
                                                            : '#ff4d4f',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {currentStock > 0
                                                    ? `Còn ${currentStock} sản phẩm`
                                                    : 'Hết hàng'}
                                            </Text>
                                            {currentStock > 0 &&
                                                currentStock <= 5 && (
                                                    <Text
                                                        style={{
                                                            color: '#faad14',
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        (Sắp hết!)
                                                    </Text>
                                                )}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity */}
                                <div style={{ marginBottom: 32 }}>
                                    <Text
                                        strong
                                        style={{
                                            display: 'block',
                                            marginBottom: 12,
                                            fontSize: 16,
                                        }}
                                    >
                                        Số lượng:
                                    </Text>
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Button
                                            icon={<MinusOutlined />}
                                            onClick={() =>
                                                setQuantity(
                                                    Math.max(1, quantity - 1)
                                                )
                                            }
                                            disabled={quantity <= 1}
                                            style={{
                                                border: 'none',
                                                borderRadius: 0,
                                                height: 40,
                                                width: 40,
                                            }}
                                        />
                                        <div
                                            style={{
                                                width: 60,
                                                height: 40,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 16,
                                                fontWeight: 600,
                                                backgroundColor: '#fafafa',
                                            }}
                                        >
                                            {quantity}
                                        </div>
                                        <Button
                                            icon={<PlusOutlined />}
                                            onClick={() =>
                                                setQuantity(quantity + 1)
                                            }
                                            disabled={quantity >= currentStock}
                                            style={{
                                                border: 'none',
                                                borderRadius: 0,
                                                height: 40,
                                                width: 40,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ marginBottom: 24 }}>
                                    <Space
                                        orientation="vertical"
                                        style={{ width: '100%' }}
                                        size={16}
                                    >
                                        <Space
                                            style={{ width: '100%' }}
                                            size={12}
                                        >
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<ShoppingCartOutlined />}
                                                onClick={handleAddToCart}
                                                loading={
                                                    addToCartMutation.isPending
                                                }
                                                disabled={
                                                    !selectedColor ||
                                                    !selectedSize ||
                                                    currentStock === 0 ||
                                                    addToCartMutation.isPending
                                                }
                                                style={{
                                                    flex: 1,
                                                    height: 48,
                                                    fontSize: 16,
                                                    fontWeight: 600,
                                                    borderRadius: 8,
                                                }}
                                            >
                                                {!selectedColor || !selectedSize
                                                    ? 'Chọn màu & size'
                                                    : currentStock === 0
                                                    ? 'Hết hàng'
                                                    : 'Thêm vào giỏ'}
                                            </Button>
                                            <Button
                                                size="large"
                                                onClick={handleBuyNow}
                                                loading={isBuyingNow}
                                                disabled={
                                                    !selectedColor ||
                                                    !selectedSize ||
                                                    currentStock === 0 ||
                                                    isBuyingNow
                                                }
                                                style={{
                                                    flex: 1,
                                                    height: 48,
                                                    fontSize: 16,
                                                    fontWeight: 600,
                                                    borderRadius: 8,
                                                    backgroundColor:
                                                        !selectedColor ||
                                                        !selectedSize ||
                                                        currentStock === 0
                                                            ? undefined
                                                            : '#ff7875',
                                                    borderColor:
                                                        !selectedColor ||
                                                        !selectedSize ||
                                                        currentStock === 0
                                                            ? undefined
                                                            : '#ff7875',
                                                    color:
                                                        !selectedColor ||
                                                        !selectedSize ||
                                                        currentStock === 0
                                                            ? undefined
                                                            : 'white',
                                                }}
                                            >
                                                {!selectedColor || !selectedSize
                                                    ? 'Chọn màu & size'
                                                    : currentStock === 0
                                                    ? 'Hết hàng'
                                                    : 'Mua ngay'}
                                            </Button>
                                        </Space>

                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                gap: 24,
                                                paddingTop: 16,
                                                borderTop: '1px solid #f0f0f0',
                                            }}
                                        >
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

                    {/* Product Details Tabs */}
                    <div style={{ marginTop: 48 }}>
                        <Tabs defaultActiveKey="description">
                            <TabPane tab="Mô tả sản phẩm" key="description">
                                <Card>
                                    <div
                                        style={{
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {product.description ||
                                            'Chưa có mô tả chi tiết cho sản phẩm này.'}
                                    </div>

                                    {/* Product Specifications */}
                                    <Title level={4}>Thông số kỹ thuật</Title>
                                    <Row gutter={[16, 8]}>
                                        <Col span={8}>
                                            <Text strong>Danh mục:</Text>
                                        </Col>
                                        <Col span={16}>
                                            {Array.isArray(product.category_ids)
                                                ? product.category_ids
                                                      .map(
                                                          (cat) =>
                                                              cat.name || cat
                                                      )
                                                      .join(', ')
                                                : 'N/A'}
                                        </Col>

                                        <Col span={8}>
                                            <Text strong>Màu sắc:</Text>
                                        </Col>
                                        <Col span={16}>
                                            {Array.isArray(
                                                product.color_images
                                            ) && product.color_images.length > 0
                                                ? product.color_images
                                                      .map((c) => c.color)
                                                      .join(', ')
                                                : 'N/A'}
                                        </Col>

                                        <Col span={8}>
                                            <Text strong>Chất liệu:</Text>
                                        </Col>
                                        <Col span={16}>
                                            {product.material ||
                                                'Chưa cập nhật'}
                                        </Col>

                                        <Col span={8}>
                                            <Text strong>Giới tính:</Text>
                                        </Col>
                                        <Col span={16}>
                                            {product.gender === 'male' && 'Nam'}
                                            {product.gender === 'female' &&
                                                'Nữ'}
                                            {product.gender === 'unisex' &&
                                                'Unisex'}
                                            {!product.gender && 'N/A'}
                                        </Col>

                                        {availableSizes.length > 0 && (
                                            <>
                                                <Col span={8}>
                                                    <Text strong>
                                                        Kích thước:
                                                    </Text>
                                                </Col>
                                                <Col span={16}>
                                                    {availableSizes.join(', ')}
                                                </Col>
                                            </>
                                        )}
                                    </Row>
                                </Card>
                            </TabPane>

                            <TabPane
                                tab={`Đánh giá (${
                                    stats?.total_reviews ||
                                    product.ratings_count ||
                                    0
                                })`}
                                key="reviews"
                            >
                                <ProductReviews
                                    productId={product._id}
                                    productName={product.name}
                                    productVariants={product.variants || []}
                                />
                            </TabPane>

                            <TabPane tab="Chính sách đổi trả" key="policy">
                                <Card>
                                    <Title level={4}>Chính sách đổi trả</Title>
                                    <ul>
                                        <li>
                                            Đổi trả trong vòng 30 ngày kể từ
                                            ngày mua
                                        </li>
                                        <li>
                                            Sản phẩm còn nguyên nhãn mác, chưa
                                            qua sử dụng
                                        </li>
                                        <li>Có hóa đơn mua hàng</li>
                                        <li>Miễn phí đổi trả tại cửa hàng</li>
                                        <li>
                                            Hỗ trợ đổi trả online với phí ship 2
                                            chiều
                                        </li>
                                    </ul>
                                </Card>
                            </TabPane>
                        </Tabs>
                    </div>

                    {/* Related Products */}
                    <div style={{ marginTop: 48 }}>
                        <Title level={3}>Sản phẩm liên quan</Title>
                        <div
                            style={{
                                textAlign: 'center',
                                padding: 48,
                                border: '1px dashed #d9d9d9',
                                borderRadius: 8,
                            }}
                        >
                            <Paragraph>
                                Sản phẩm liên quan sẽ được hiển thị ở đây.
                            </Paragraph>
                        </div>
                    </div>
                </div>
            </div>
        </SmoothTransition>
    )
}

export default ProductDetail
