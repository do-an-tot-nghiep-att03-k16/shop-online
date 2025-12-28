import React, { useState } from 'react'
import { 
    List, 
    Rate, 
    Avatar, 
    Button, 
    Image, 
    Typography, 
    Space, 
    Pagination,
    Select,
    Empty,
    Tag,
    Tooltip
} from 'antd'
import { 
    LikeOutlined, 
    LikeFilled, 
    UserOutlined,
    VerifiedOutlined,
    CalendarOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useToggleReviewLike } from '../../hooks/useReviews'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Text, Paragraph } = Typography
const { Option } = Select

const ReviewList = ({ 
    reviews = [], 
    loading = false, 
    pagination = {}, 
    onPageChange,
    onSortChange,
    onRatingFilter 
}) => {
    const { user } = useAuth()
    const toggleLikeMutation = useToggleReviewLike()
    const [currentSort, setCurrentSort] = useState('-createdAt')
    const [ratingFilter, setRatingFilter] = useState(null)

    const handleLike = (reviewId) => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để thích đánh giá')
            return
        }
        toggleLikeMutation.mutate(reviewId)
    }

    const handleSortChange = (value) => {
        setCurrentSort(value)
        onSortChange?.(value)
    }

    const handleRatingFilterChange = (value) => {
        setRatingFilter(value)
        onRatingFilter?.(value)
    }

    const formatDate = (dateString) => {
        return dayjs(dateString).fromNow()
    }

    const sortOptions = [
        { value: '-createdAt', label: 'Mới nhất' },
        { value: 'createdAt', label: 'Cũ nhất' },
        { value: '-rating', label: 'Rating cao nhất' },
        { value: 'rating', label: 'Rating thấp nhất' },
        { value: '-helpful_count', label: 'Hữu ích nhất' }
    ]

    const ratingOptions = [
        { value: null, label: 'Tất cả rating' },
        { value: 5, label: '5 sao' },
        { value: 4, label: '4 sao' },
        { value: 3, label: '3 sao' },
        { value: 2, label: '2 sao' },
        { value: 1, label: '1 sao' }
    ]

    return (
        <div className="review-list">
            {/* Filter Controls - Always show */}
            <div style={{ 
                marginBottom: 16, 
                display: 'flex', 
                gap: 16, 
                flexWrap: 'wrap',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
            }}>
                <Space>
                    <Text strong>Sắp xếp:</Text>
                    <Select
                        value={currentSort}
                        onChange={handleSortChange}
                        style={{ width: 150 }}
                        size="small"
                    >
                        {sortOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Space>
                
                <Space>
                    <Text strong>Lọc rating:</Text>
                    <Select
                        value={ratingFilter}
                        onChange={handleRatingFilterChange}
                        style={{ width: 120 }}
                        size="small"
                        placeholder="Tất cả rating"
                    >
                        {ratingOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Space>
            </div>

            {/* Show empty state or reviews list */}
            {!loading && (!reviews || reviews.length === 0) ? (
                <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        ratingFilter ? 
                        `Không có đánh giá ${ratingFilter} sao nào` : 
                        "Chưa có đánh giá nào"
                    }
                    style={{ 
                        padding: '40px 20px',
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        border: '1px solid #f0f0f0'
                    }}
                />
            ) : (
                <List
                loading={loading}
                dataSource={reviews}
                renderItem={(review) => (
                    <List.Item
                        key={review._id}
                        style={{
                            padding: '20px',
                            backgroundColor: '#fafafa',
                            borderRadius: 8,
                            marginBottom: 12,
                            border: '1px solid #f0f0f0'
                        }}
                    >
                        <div style={{ width: '100%' }}>
                            {/* Review Header */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start',
                                marginBottom: 16
                            }}>
                                <Avatar 
                                    src={review.user?.avatar?.thumbnail || '/default-avatar.jpg'}
                                    icon={<UserOutlined />}
                                    size={44}
                                    style={{ 
                                        marginRight: 12, 
                                        flexShrink: 0,
                                        border: '2px solid #fff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                />
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 6
                                    }}>
                                        <Text strong style={{ 
                                            fontSize: 15, 
                                            color: '#333',
                                            fontWeight: 600
                                        }}>
                                            {review.user?.usr_name || 'Ẩn danh'}
                                        </Text>
                                        
                                        {review.is_verified_purchase && (
                                            <Tag 
                                                icon={<VerifiedOutlined />} 
                                                color="success" 
                                                size="small"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    borderRadius: 4,
                                                    padding: '2px 8px',
                                                    border: 'none'
                                                }}
                                            >
                                                ✓ Đã mua hàng
                                            </Tag>
                                        )}
                                    </div>
                                    
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        gap: 16,
                                        marginBottom: 4
                                    }}>
                                        <Rate 
                                            disabled 
                                            value={review.rating} 
                                            style={{ 
                                                fontSize: 16,
                                                color: '#ffb400'
                                            }}
                                        />
                                        
                                        <Text type="secondary" style={{ 
                                            fontSize: 13,
                                            color: '#666'
                                        }}>
                                            <CalendarOutlined style={{ marginRight: 4 }} />
                                            {formatDate(review.createdAt)}
                                        </Text>
                                    </div>

                                    {/* Variant Info */}
                                    {(review.variant_info?.color || review.variant_info?.size) && (
                                        <div style={{ marginTop: 8 }}>
                                            <Space size={6}>
                                                {review.variant_info?.color && (
                                                    <Tag 
                                                        size="small"
                                                        style={{
                                                            backgroundColor: '#f0f0f0',
                                                            border: '1px solid #d9d9d9',
                                                            borderRadius: 4,
                                                            fontSize: 11,
                                                            padding: '2px 6px',
                                                            color: '#666'
                                                        }}
                                                    >
                                                        Màu: {review.variant_info.color}
                                                    </Tag>
                                                )}
                                                {review.variant_info?.size && (
                                                    <Tag 
                                                        size="small"
                                                        style={{
                                                            backgroundColor: '#f0f0f0',
                                                            border: '1px solid #d9d9d9',
                                                            borderRadius: 4,
                                                            fontSize: 11,
                                                            padding: '2px 6px',
                                                            color: '#666'
                                                        }}
                                                    >
                                                        Size: {review.variant_info.size}
                                                    </Tag>
                                                )}
                                            </Space>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Review Content */}
                            {review.comment && (
                                <div style={{ 
                                    marginBottom: 16,
                                    marginTop: 12,
                                    padding: '12px 16px',
                                    backgroundColor: '#fff',
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0',
                                    textAlign: 'left' // Align comment text to left
                                }}>
                                    <Paragraph 
                                        style={{ 
                                            margin: 0,
                                            lineHeight: 1.6,
                                            fontSize: 14,
                                            color: '#333',
                                            textAlign: 'left' // Ensure text aligns left
                                        }}
                                    >
                                        {review.comment}
                                    </Paragraph>
                                </div>
                            )}

                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                                <div style={{ 
                                    marginBottom: 12,
                                    textAlign: 'left' // Align images container to left
                                }}>
                                    <Image.PreviewGroup>
                                        <div style={{ 
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                            justifyContent: 'flex-start' // Images start from left
                                        }}>
                                            {review.images.map((image, index) => {
                                                // Handle both old format (string URLs) and new format (image objects)
                                                const imageUrl = typeof image === 'string' ? image : image?.url || image?.medium || image?.thumbnail
                                                const previewUrl = typeof image === 'string' ? image : image?.large || image?.url || image?.medium
                                                
                                                return (
                                                    <Image
                                                        key={index}
                                                        src={imageUrl}
                                                        preview={{ src: previewUrl }}
                                                        alt={`Review image ${index + 1}`}
                                                        width={80}
                                                        height={80}
                                                        style={{
                                                            objectFit: 'cover',
                                                            borderRadius: 4,
                                                            border: '1px solid #f0f0f0'
                                                        }}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </Image.PreviewGroup>
                                </div>
                            )}

                            {/* Review Actions */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingTop: 12,
                                borderTop: '1px solid #f0f0f0'
                            }}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={
                                        review.likes?.includes(user?._id) ? 
                                        <LikeFilled style={{ color: '#ff6b35' }} /> : 
                                        <LikeOutlined style={{ color: '#666' }} />
                                    }
                                    onClick={() => handleLike(review._id)}
                                    disabled={!user || toggleLikeMutation.isLoading}
                                    style={{ 
                                        padding: '6px 12px',
                                        height: 'auto',
                                        fontSize: 12,
                                        color: review.likes?.includes(user?._id) ? '#ff6b35' : '#666',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 16,
                                        backgroundColor: review.likes?.includes(user?._id) ? '#fff2f0' : '#fafafa'
                                    }}
                                >
                                    {review.likes?.includes(user?._id) ? 'Đã thích' : 'Hữu ích'} 
                                    {review.likes?.length > 0 && ` (${review.likes.length})`}
                                </Button>
                            </div>
                        </div>
                    </List.Item>
                )}
                />
            )}

            {/* Pagination */}
            {!loading && reviews && reviews.length > 0 && pagination && pagination.pages > 1 && (
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <Pagination
                        current={pagination.page}
                        total={pagination.total}
                        pageSize={pagination.limit}
                        onChange={onPageChange}
                        showSizeChanger={false}
                        showQuickJumper
                        showTotal={(total, range) =>
                            `${range[0]}-${range[1]} của ${total} đánh giá`
                        }
                    />
                </div>
            )}
        </div>
    )
}

export default ReviewList