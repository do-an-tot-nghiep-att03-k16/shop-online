// pages/Blog/BlogDetail.jsx
import { useParams, Link } from 'react-router-dom'
import { Typography, Tag, Breadcrumb, Row, Col, Card, Divider, Avatar, Space } from 'antd'
import { HomeOutlined, CalendarOutlined, FolderOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useBlogBySlug, useBlogs } from '../../hooks/useBlog'
import { formatDate, formatDateTime } from '../../utils/dateUtils'
import BlogCard from '../../components/Blog/BlogCard'
import BlogContent from '../../components/Blog/BlogContent'
import SmoothTransition from '../../components/Common/SmoothTransition'
import '../../components/Blog/Blog.css'
import envConfig from '../../config/env'

const { Title, Paragraph, Text } = Typography

// Đảm bảo URL không có /api ở cuối
const CMS_BASE_URL = envConfig.API_STRAPI_URL.replace(/\/api$/, '');

const BlogDetail = () => {
    const { slug } = useParams()
    const { blog, loading, error } = useBlogBySlug(slug)
    
    // Get related blogs (same category, exclude current)
    const { blogs: relatedBlogs, loading: relatedLoading } = useBlogs({
        limit: 3,
        sort: 'createdAt:desc'
    })

    if (error) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Title level={3}>❌ Lỗi</Title>
                <Paragraph>{error}</Paragraph>
                <Link to="/blog">
                    <ArrowLeftOutlined /> Quay lại danh sách blog
                </Link>
            </div>
        )
    }

    const getThumbnailUrl = (thumbnail) => {
        if (!thumbnail) return '/images/blog-default.jpg'
        
        const url = thumbnail.formats?.large?.url || thumbnail.url;
        return url?.startsWith('http') ? url : `${CMS_BASE_URL}${url}`;
    }

    const getRelatedBlogs = () => {
        return relatedBlogs
            .filter(relatedBlog => relatedBlog.slug !== slug)
            .slice(0, 3)
    }

    return (
        <div style={{ 
            maxWidth: 1200, 
            margin: '0 auto', 
            padding: '24px 16px', 
            minHeight: '70vh' 
        }}>
            <SmoothTransition loading={loading}>
                {blog && (
                    <>
                        {/* Breadcrumb */}
                        <div style={{ marginBottom: '24px' }}>
                            <Breadcrumb
                                items={[
                                    {
                                        href: '/',
                                        title: <HomeOutlined />
                                    },
                                    {
                                        href: '/blog',
                                        title: 'Blog'
                                    },
                                    {
                                        title: blog.title
                                    }
                                ]}
                            />
                        </div>

                        <Row gutter={[24, 24]}>
                            {/* Main Content */}
                            <Col xs={24} lg={16}>
                                <Card style={{ border: 'none', boxShadow: 'none' }}>
                                    {/* Back Button */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <Link 
                                            to="/blog"
                                            style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                color: '#1677ff'
                                            }}
                                        >
                                            <ArrowLeftOutlined />
                                            <span>Quay lại danh sách blog</span>
                                        </Link>
                                    </div>

                                    {/* Category Tag */}
                                    {blog.category && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <Link to={`/blog/category/${blog.category.slug}`}>
                                                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                                                    <FolderOutlined style={{ marginRight: '4px' }} />
                                                    {blog.category.name}
                                                </Tag>
                                            </Link>
                                        </div>
                                    )}

                                    {/* Title */}
                                    <Title level={1} style={{ 
                                        fontSize: 'clamp(24px, 4vw, 32px)',
                                        lineHeight: '1.3',
                                        marginBottom: '24px',
                                        color: '#262626'
                                    }}>
                                        {blog.title}
                                    </Title>

                                    {/* Meta Info */}
                                    <div style={{ 
                                        marginBottom: '32px',
                                        padding: 'clamp(12px, 2vw, 16px)',
                                        background: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}>
                                        <Space size="large" wrap>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CalendarOutlined style={{ color: '#666' }} />
                                                <Text type="secondary">
                                                    Đăng ngày: {formatDate(blog.createdAt)}
                                                </Text>
                                            </div>
                                            {blog.updatedAt !== blog.createdAt && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <CalendarOutlined style={{ color: '#666' }} />
                                                    <Text type="secondary">
                                                        Cập nhật: {formatDate(blog.updatedAt)}
                                                    </Text>
                                                </div>
                                            )}
                                        </Space>
                                    </div>

                                    {/* Featured Image */}
                                    {blog.thumbnail && (
                                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                                            <img
                                                src={getThumbnailUrl(blog.thumbnail)}
                                                alt={blog.thumbnail.alternativeText || blog.title}
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '400px',
                                                    objectFit: 'cover',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                                                }}
                                                onError={(e) => {
                                                    e.target.src = '/images/blog-default.jpg'
                                                }}
                                            />
                                            {blog.thumbnail.caption && (
                                                <Text type="secondary" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                                                    {blog.thumbnail.caption}
                                                </Text>
                                            )}
                                        </div>
                                    )}

                                    {/* Description */}
                                    {blog.description && (
                                        <div style={{ marginBottom: '32px' }}>
                                            <Paragraph style={{ 
                                                fontSize: 'clamp(16px, 2.5vw, 18px)',
                                                lineHeight: '1.6',
                                                color: '#595959',
                                                fontWeight: 500,
                                                padding: 'clamp(16px, 3vw, 20px)',
                                                background: '#f0f8ff',
                                                borderLeft: '4px solid #1677ff',
                                                borderRadius: '4px'
                                            }}>
                                                {blog.description}
                                            </Paragraph>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div 
                                        className="blog-content"
                                        style={{
                                            fontSize: 'clamp(14px, 2vw, 16px)',
                                            lineHeight: '1.8',
                                            color: '#262626'
                                        }}
                                    >
                                        <BlogContent content={blog.content} />
                                    </div>
                                </Card>
                            </Col>

                            {/* Sidebar */}
                            <Col xs={24} lg={8}>
                                {/* Related Posts */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ 
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        marginBottom: '16px',
                                        color: '#262626',
                                        wordBreak: 'break-word'
                                    }}>
                                        Bài viết liên quan
                                    </h3>
                                    <Card style={{ width: '100%' }}>
                                    <SmoothTransition loading={relatedLoading}>
                                        {getRelatedBlogs().length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {getRelatedBlogs().map((relatedBlog, index) => (
                                                    <Link 
                                                        key={relatedBlog.id}
                                                        to={`/blog/${relatedBlog.slug}`}
                                                        style={{ textDecoration: 'none' }}
                                                        className="fade-in-item"
                                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                    >
                                                        <Card 
                                                            size="small" 
                                                            hoverable
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                                {relatedBlog.thumbnail && (
                                                                    <img
                                                                        src={(() => {
                                                                            const url = relatedBlog.thumbnail.formats?.small?.url || relatedBlog.thumbnail.url;
                                                                            return url?.startsWith('http') ? url : `${CMS_BASE_URL}${url}`;
                                                                        })()}
                                                                        alt={relatedBlog.title}
                                                                        style={{
                                                                            width: '80px',
                                                                            height: '60px',
                                                                            objectFit: 'cover',
                                                                            borderRadius: '6px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    />
                                                                )}
                                                                <div style={{ 
                                                                    flex: 1, 
                                                                    overflow: 'hidden',
                                                                    minWidth: 0
                                                                }}>
                                                                    <Text 
                                                                        strong 
                                                                        style={{ 
                                                                            display: 'block',
                                                                            fontSize: '14px',
                                                                            lineHeight: '18px',
                                                                            marginBottom: '4px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            width: '100%'
                                                                        }}
                                                                        title={relatedBlog.title}
                                                                    >
                                                                        {relatedBlog.title}
                                                                    </Text>
                                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                        {formatDate(relatedBlog.createdAt)}
                                                                    </Text>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <Text type="secondary">Không có bài viết liên quan</Text>
                                        )}
                                    </SmoothTransition>
                                    </Card>
                                </div>

                                {/* Back to Top */}
                                <Card>
                                    <div style={{ textAlign: 'center' }}>
                                        <Link 
                                            to="/blog"
                                            style={{ 
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 24px',
                                                background: '#1677ff',
                                                color: 'white',
                                                borderRadius: '6px',
                                                textDecoration: 'none',
                                                fontWeight: 500
                                            }}
                                        >
                                            <ArrowLeftOutlined />
                                            Xem thêm bài viết
                                        </Link>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </SmoothTransition>
        </div>
    )
}

export default BlogDetail