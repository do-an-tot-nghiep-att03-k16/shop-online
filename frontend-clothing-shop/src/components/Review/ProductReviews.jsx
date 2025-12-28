import React, { useState } from 'react'
import { Button, Typography, Space, Divider, message } from 'antd'
import { EditOutlined, StarOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import {
    useProductReviews,
    useProductRatingStats,
} from '../../hooks/useReviews'
import RatingStats from './RatingStats'
import ReviewList from './ReviewList'
import ReviewForm from './ReviewForm'
import LoadingSpinner from '../Common/LoadingSpinner'

const { Title, Text } = Typography

const ProductReviews = ({ productId, productName, productVariants = [] }) => {
    const { user } = useAuth()
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [reviewParams, setReviewParams] = useState({
        page: 1,
        limit: 10,
        sort: '-createdAt',
        rating: null,
    })

    // Fetch rating stats
    const {
        data: ratingStatsData,
        isLoading: statsLoading,
        error: statsError,
    } = useProductRatingStats(productId)

    // Fetch reviews
    const {
        data: reviewsData,
        isLoading: reviewsLoading,
        error: reviewsError,
    } = useProductReviews(productId, reviewParams)

    // Debug data structure

    // DEBUG: Try both possible paths

    const ratingStats = ratingStatsData
    const reviews = reviewsData?.metadata?.reviews || reviewsData?.reviews || []
    const pagination =
        reviewsData?.metadata?.pagination || reviewsData?.pagination

    // FORCE CHECK WHY UI NOT UPDATE

    const handleWriteReview = () => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để viết đánh giá')
            return
        }
        setShowReviewForm(true)
    }

    const handlePageChange = (page) => {
        setReviewParams((prev) => ({ ...prev, page }))
    }

    const handleSortChange = (sort) => {
        setReviewParams((prev) => ({ ...prev, sort, page: 1 }))
    }

    const handleRatingFilter = (rating) => {
        setReviewParams((prev) => ({ ...prev, rating, page: 1 }))
    }

    if (statsLoading) {
        return <LoadingSpinner />
    }

    return (
        <div className="product-reviews">
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    <StarOutlined
                        style={{ marginRight: 8, color: '#faad14' }}
                    />
                    Đánh giá sản phẩm ({ratingStats?.total_reviews || 0} đánh
                    giá)
                </Title>

                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleWriteReview}
                    disabled={!user}
                >
                    Viết đánh giá
                </Button>
            </div>

            {/* Rating Statistics */}
            <RatingStats stats={ratingStats} />

            <Divider />

            {/* Reviews List */}
            <div>
                <Title level={4} style={{ marginBottom: 16 }}>
                    Tất cả đánh giá ({ratingStats?.total_reviews || 0} đánh giá)
                </Title>

                <ReviewList
                    reviews={reviews}
                    loading={reviewsLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                    onRatingFilter={handleRatingFilter}
                />
            </div>

            {/* Review Form Modal */}
            <ReviewForm
                visible={showReviewForm}
                onClose={() => setShowReviewForm(false)}
                productId={productId}
                productName={productName}
                availableVariants={productVariants}
            />

            {/* No login message */}
            {!user && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 16,
                        backgroundColor: '#f6f6f6',
                        borderRadius: 8,
                        marginTop: 16,
                    }}
                >
                    <Text type="secondary">
                        Vui lòng đăng nhập để viết đánh giá và tương tác với các
                        đánh giá khác
                    </Text>
                </div>
            )}
        </div>
    )
}

export default ProductReviews
