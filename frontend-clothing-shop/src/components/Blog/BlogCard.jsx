// components/Blog/BlogCard.jsx
import { Card, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { CalendarOutlined, ReadOutlined } from '@ant-design/icons'
import { formatDate } from '../../utils/dateUtils'
import './Blog.css'

const { Paragraph, Text } = Typography

const BlogCard = ({ blog }) => {
    if (!blog) return null

    const {
        slug,
        title,
        description,
        thumbnail,
        category,
        createdAt
    } = blog

    // Get thumbnail URL
    const getThumbnailUrl = () => {
        if (!thumbnail) return '/images/blog-default.jpg'
        
        if (thumbnail.formats?.medium?.url) {
            return `http://localhost:1337${thumbnail.formats.medium.url}`
        }
        return `http://localhost:1337${thumbnail.url}`
    }

    return (
        <article className="simple-blog-card">
            <Link to={`/blog/${slug}`} className="blog-link">
                <div className="blog-image">
                    <img
                        src={getThumbnailUrl()}
                        alt={thumbnail?.alternativeText || title}
                        loading="lazy"
                        onError={(e) => {
                            e.target.src = '/images/blog-default.jpg'
                        }}
                    />
                    {category && (
                        <div className="blog-category">
                            {category.name}
                        </div>
                    )}
                </div>
                
                <div className="blog-content-card">
                    <h3 className="blog-title">
                        {title}
                    </h3>
                    
                    {description && (
                        <p className="blog-description">
                            {description.length > 120 
                                ? `${description.substring(0, 120)}...` 
                                : description
                            }
                        </p>
                    )}
                    
                    <div className="blog-footer">
                        <div className="blog-date">
                            <CalendarOutlined />
                            <span>{formatDate(createdAt)}</span>
                        </div>
                        <div className="read-more">
                            <ReadOutlined />
                            <span>Đọc thêm</span>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    )
}

export default BlogCard