import React from 'react'
import { Rate, Progress, Typography, Space, Row, Col } from 'antd'

const { Title, Text } = Typography

const RatingStats = ({ stats }) => {
    if (!stats) {
        return (
            <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">Chưa có đánh giá</Text>
            </div>
        )
    }

    const { 
        average_rating = 0, 
        total_reviews = 0, 
        rating_distribution = {} 
    } = stats

    // Tính phần trăm cho mỗi rating
    const getRatingPercentage = (rating) => {
        if (total_reviews === 0) return 0
        return Math.round((rating_distribution[rating] || 0) / total_reviews * 100)
    }

    return (
        <div className="rating-stats">
            <Row gutter={[24, 16]}>
                {/* Overall Rating */}
                <Col xs={24} md={8}>
                    <div style={{ 
                        textAlign: 'center',
                        padding: '24px 16px',
                        backgroundColor: '#fafafa',
                        borderRadius: 8,
                        border: '1px solid #f0f0f0'
                    }}>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ 
                                fontSize: 48, 
                                fontWeight: 700,
                                color: '#1890ff',
                                lineHeight: 1
                            }}>
                                {average_rating.toFixed(1)}
                            </span>
                            <span style={{ 
                                fontSize: 16,
                                color: '#999',
                                marginLeft: 4
                            }}>
                                /5
                            </span>
                        </div>
                        
                        <div style={{ marginBottom: 8 }}>
                            <Rate 
                                disabled 
                                allowHalf 
                                value={average_rating} 
                                style={{ fontSize: 20 }}
                            />
                        </div>
                        
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            {total_reviews} đánh giá
                        </Text>
                    </div>
                </Col>

                {/* Rating Breakdown */}
                <Col xs={24} md={16}>
                    <div style={{ padding: '8px 0' }}>
                        <Title level={5} style={{ marginBottom: 16 }}>
                            Chi tiết đánh giá
                        </Title>
                        
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {[5, 4, 3, 2, 1].map(star => {
                                const count = rating_distribution[star] || 0
                                const percentage = getRatingPercentage(star)
                                
                                return (
                                    <div 
                                        key={star}
                                        style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            width: '100%'
                                        }}
                                    >
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            minWidth: 80
                                        }}>
                                            <Rate 
                                                disabled 
                                                count={1} 
                                                value={1}
                                                style={{ fontSize: 16, marginRight: 4 }}
                                            />
                                            <Text style={{ fontSize: 14, minWidth: 20 }}>
                                                {star}
                                            </Text>
                                        </div>
                                        
                                        <div style={{ flex: 1, minWidth: 100 }}>
                                            <Progress
                                                percent={percentage}
                                                size="small"
                                                showInfo={false}
                                                strokeColor={
                                                    star >= 4 ? '#52c41a' : 
                                                    star >= 3 ? '#faad14' : '#ff4d4f'
                                                }
                                                trailColor="#f0f0f0"
                                            />
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            minWidth: 60,
                                            justifyContent: 'flex-end'
                                        }}>
                                            <Text 
                                                style={{ 
                                                    fontSize: 13,
                                                    color: '#666',
                                                    minWidth: 30,
                                                    textAlign: 'right'
                                                }}
                                            >
                                                {count}
                                            </Text>
                                            <Text 
                                                type="secondary" 
                                                style={{ 
                                                    fontSize: 12,
                                                    minWidth: 35,
                                                    textAlign: 'right'
                                                }}
                                            >
                                                ({percentage}%)
                                            </Text>
                                        </div>
                                    </div>
                                )
                            })}
                        </Space>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default RatingStats