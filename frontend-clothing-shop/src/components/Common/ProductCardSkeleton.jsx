import { Card } from 'antd'
import './SmoothTransition.css'

/**
 * ProductCardSkeleton - Skeleton loading cho ProductCard
 */
const ProductCardSkeleton = () => {
    return (
        <Card 
            className="product-skeleton"
            bodyStyle={{ padding: 0 }}
            bordered={false}
        >
            <div className="product-skeleton-image"></div>
            <div style={{ padding: '16px' }}>
                <div className="product-skeleton-title"></div>
                <div className="product-skeleton-title" style={{ width: '70%', marginBottom: '12px' }}></div>
                <div className="product-skeleton-price"></div>
            </div>
        </Card>
    )
}

export default ProductCardSkeleton