import { Card, Button, Tooltip, message } from 'antd'
import { ShoppingCartOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { createProductSlug } from '../../utils/slugUtils'
import { useAddToCart } from '../../hooks/useCart'
import { useState } from 'react'

const ProductCard = ({ product, showAddToCart = true }) => {
    const navigate = useNavigate()
    const addToCart = useAddToCart()
    const [selectedColor, setSelectedColor] = useState(null)
    const [isHovered, setIsHovered] = useState(false)
    const [currentImage, setCurrentImage] = useState(null)

    const handleCardClick = () => {
        const productSlug = createProductSlug(product)
        navigate(`/p/${productSlug}`)
    }

    // Get available colors from variants
    const getAvailableColors = () => {
        if (!product.variants || !Array.isArray(product.variants)) return []
        
        const colorsMap = new Map()
        product.variants.forEach(variant => {
            if (variant.stock_quantity > 0) {
                const colorKey = variant.color.toLowerCase()
                if (!colorsMap.has(colorKey)) {
                    colorsMap.set(colorKey, {
                        name: variant.color,
                        stock: variant.stock_quantity,
                        colorCode: getColorCode(variant.color),
                        image: getColorImage(variant.color)
                    })
                } else {
                    // Add stock if same color
                    const existing = colorsMap.get(colorKey)
                    existing.stock += variant.stock_quantity
                }
            }
        })
        
        return Array.from(colorsMap.values())
    }

    // Convert color name to color code
    const getColorCode = (colorName) => {
        const colorMap = {
            'đỏ': '#dc3545',
            'red': '#dc3545',
            'xanh': '#007bff', 
            'blue': '#007bff',
            'xanh lá': '#28a745',
            'green': '#28a745',
            'vàng': '#ffc107',
            'yellow': '#ffc107',
            'đen': '#343a40',
            'black': '#343a40',
            'trắng': '#ffffff',
            'white': '#ffffff',
            'xám': '#6c757d',
            'gray': '#6c757d',
            'grey': '#6c757d',
            'hồng': '#e91e63',
            'pink': '#e91e63',
            'tím': '#9c27b0',
            'purple': '#9c27b0',
            'cam': '#ff9800',
            'orange': '#ff9800',
            'nâu': '#795548',
            'brown': '#795548',
            'xanh navy': '#001f3f',
            'navy': '#001f3f',
            'xanh dương': '#17a2b8',
            'cyan': '#17a2b8'
        }
        
        return colorMap[colorName.toLowerCase()] || '#f0f0f0'
    }

    const getColorImage = (color) => {
        const colorImage = product.color_images?.find(ci => 
            ci.color.toLowerCase() === color.toLowerCase()
        )
        return colorImage?.images?.[0]?.medium || 
               colorImage?.images?.[0]?.large || 
               getProductImage()
    }

    const handleColorSelect = (colorName, e) => {
        e.stopPropagation()
        setSelectedColor(colorName)
        setCurrentImage(getColorImage(colorName))
    }

    const handleAddToCart = (e) => {
        e.stopPropagation()
        
        const targetColor = selectedColor || getAvailableColors()[0]?.name
        if (!targetColor) {
            message.warning('Sản phẩm hiện tại hết hàng')
            return
        }

        // Find variant for selected color (prefer first available size)
        const targetVariant = product.variants?.find(v => 
            v.color.toLowerCase() === targetColor.toLowerCase() && v.stock_quantity > 0
        )
        
        if (!targetVariant) {
            message.warning(`Màu ${targetColor} hiện tại hết hàng`)
            return
        }

        addToCart.mutate({
            product_id: product._id,
            variant_sku: targetVariant.sku,
            quantity: 1,
            productData: {
                product_name: product.name,
                product_image: currentImage || getProductImage(),
                variant_color: targetVariant.color,
                variant_size: targetVariant.size,
                price: targetVariant.sale_price || targetVariant.price || product.base_price || product.price
            }
        })
    }

    const getProductImage = () => {
        // Backend structure: color_images[0].images[0] has {large, medium, thumbnail}
        return (
            product.color_images?.[0]?.images?.[0]?.medium ||
            product.color_images?.[0]?.images?.[0]?.large ||
            product.color_images?.[0]?.images?.[0]?.thumbnail ||
            product.images?.[0]?.image_url || // Fallback for old structure
            'https://via.placeholder.com/200x200'
        )
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0)
    }

    const renderPriceSection = () => {
        const hasDiscount = product.discount_percent > 0
        const originalPrice = product.base_price || product.price || 0
        const discountedPrice = hasDiscount ? originalPrice * (1 - product.discount_percent / 100) : originalPrice

        return (
            <div style={{ 
                minHeight: 50, // Fixed height để tất cả cards đều nhau
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-end' 
            }}>
                {hasDiscount ? (
                    <>
                        <div style={{
                            fontSize: 12,
                            color: '#999',
                            textDecoration: 'line-through',
                            lineHeight: 1.2,
                            marginBottom: 2
                        }}>
                            {formatPrice(originalPrice)}
                        </div>
                        <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap'
                        }}>
                            <span style={{ 
                                fontSize: 14, 
                                fontWeight: 600, 
                                color: '#f5222d'
                            }}>
                                {formatPrice(discountedPrice)}
                            </span>
                            <span style={{
                                fontSize: 10,
                                backgroundColor: '#ff4d4f',
                                color: 'white',
                                padding: '1px 4px',
                                borderRadius: 3
                            }}>
                                -{product.discount_percent}%
                            </span>
                        </div>
                    </>
                ) : (
                    <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#f5222d',
                        marginTop: 'auto' // Push to bottom
                    }}>
                        {formatPrice(originalPrice)}
                    </div>
                )}
            </div>
        )
    }

    const availableColors = getAvailableColors()
    const hasStock = availableColors.length > 0

    return (
        <Card
            hoverable
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { padding: 12, flex: 1, display: 'flex', flexDirection: 'column' } }}
            cover={
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                    <img
                        alt={product.name}
                        src={currentImage || getProductImage()}
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            transition: 'all 0.3s ease'
                        }}
                    />
                    {product.discount_percent > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            backgroundColor: '#ff4d4f',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600
                        }}>
                            -{product.discount_percent}%
                        </div>
                    )}
                    
                    {/* Floating Cart Button */}
                    {showAddToCart && hasStock && (
                        <div style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'all 0.3s ease'
                        }}>
                            <Tooltip title={selectedColor ? `Thêm màu ${selectedColor} vào giỏ` : 'Thêm vào giỏ hàng'}>
                                <Button
                                    type="primary"
                                    shape="circle"
                                    icon={<PlusOutlined />}
                                    size="large"
                                    onClick={handleAddToCart}
                                    loading={addToCart.isPending}
                                    style={{
                                        backgroundColor: '#ff4d4f',
                                        borderColor: '#ff4d4f',
                                        boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                />
                            </Tooltip>
                        </div>
                    )}
                    
                    {/* Out of Stock Overlay */}
                    {!hasStock && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 16,
                            fontWeight: 600
                        }}>
                            Hết hàng
                        </div>
                    )}
                </div>
            }
            actions={[]}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div style={{ 
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#333',
                    lineHeight: 1.3,
                    marginBottom: 8,
                    minHeight: 36,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {product.name}
                </div>
                
                {renderPriceSection()}
                
                {/* Color Variants */}
                {availableColors.length > 0 && (
                    <div style={{ 
                        marginTop: 8, 
                        paddingTop: 8,
                        borderTop: '1px solid #f0f0f0'
                    }}>
                        <div style={{ 
                            fontSize: 12, 
                            color: '#666', 
                            marginBottom: 6,
                            fontWeight: 500
                        }}>
                            Màu sắc ({availableColors.length})
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            gap: 6, 
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }}>
                            {availableColors.slice(0, 4).map((color, index) => (
                                <Tooltip 
                                    key={index} 
                                    title={`${color.name} (Còn ${color.stock})`}
                                    placement="top"
                                >
                                    <div
                                        onClick={(e) => handleColorSelect(color.name, e)}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            border: selectedColor === color.name 
                                                ? '3px solid #ff4d4f' 
                                                : color.colorCode === '#ffffff' 
                                                    ? '2px solid #d9d9d9'  // Special border for white
                                                    : '1px solid rgba(0,0,0,0.1)',
                                            backgroundColor: color.colorCode,
                                            transition: 'all 0.2s ease',
                                            transform: selectedColor === color.name ? 'scale(1.15)' : 'scale(1)',
                                            boxShadow: selectedColor === color.name 
                                                ? '0 3px 12px rgba(255, 77, 79, 0.4)' 
                                                : '0 1px 3px rgba(0,0,0,0.1)',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Inner dot for white color visibility */}
                                        {color.colorCode === '#ffffff' && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: 4,
                                                height: 4,
                                                borderRadius: '50%',
                                                backgroundColor: '#ccc'
                                            }} />
                                        )}
                                    </div>
                                </Tooltip>
                            ))}
                            {availableColors.length > 4 && (
                                <div style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: '#f5f5f5',
                                    border: '1px solid #d9d9d9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 10,
                                    color: '#666',
                                    fontWeight: 600
                                }}>
                                    +{availableColors.length - 4}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default ProductCard