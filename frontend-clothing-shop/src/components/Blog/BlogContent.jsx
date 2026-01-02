// components/Blog/BlogContent.jsx
import React from 'react'
import { Typography, Image } from 'antd'
import envConfig from '../../config/env'

const { Title, Paragraph, Text } = Typography

// Đảm bảo URL không có /api ở cuối
const CMS_BASE_URL = envConfig.API_STRAPI_URL.replace(/\/api$/, '');

const BlogContent = ({ content }) => {
    if (!content || !Array.isArray(content)) {
        return null
    }

    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'paragraph':
                return (
                    <Paragraph 
                        key={index}
                        style={{
                            fontSize: '16px',
                            lineHeight: '1.8',
                            marginBottom: '20px',
                            color: '#333'
                        }}
                    >
                        {renderChildren(block.children)}
                    </Paragraph>
                )

            case 'heading':
                const level = block.level || 2
                return (
                    <Title 
                        key={index}
                        level={level}
                        style={{
                            marginTop: level === 1 ? '0' : '40px',
                            marginBottom: '20px',
                            color: '#1a1a1a'
                        }}
                    >
                        {renderChildren(block.children)}
                    </Title>
                )

            case 'image':
                const image = block.image
                if (!image) return null
                
                const imageUrl = image.url?.startsWith('http') 
                    ? image.url 
                    : `${CMS_BASE_URL}${image.url}`
                
                return (
                    <div key={index} style={{ margin: '32px 0', textAlign: 'center' }}>
                        <Image
                            src={imageUrl}
                            alt={image.alternativeText || 'Blog image'}
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                            }}
                            placeholder={
                                <div style={{
                                    width: '100%',
                                    height: '200px',
                                    background: '#f0f0f0',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    Đang tải...
                                </div>
                            }
                        />
                        {image.caption && (
                            <Text 
                                type="secondary" 
                                style={{ 
                                    display: 'block',
                                    marginTop: '12px',
                                    fontStyle: 'italic',
                                    fontSize: '14px'
                                }}
                            >
                                {image.caption}
                            </Text>
                        )}
                    </div>
                )

            case 'list':
                const ListComponent = block.format === 'ordered' ? 'ol' : 'ul'
                return (
                    <ListComponent 
                        key={index}
                        style={{
                            margin: '20px 0',
                            paddingLeft: '24px'
                        }}
                    >
                        {block.children?.map((item, itemIndex) => (
                            <li 
                                key={itemIndex}
                                style={{
                                    margin: '8px 0',
                                    lineHeight: '1.6',
                                    fontSize: '16px'
                                }}
                            >
                                {renderChildren(item.children)}
                            </li>
                        ))}
                    </ListComponent>
                )

            case 'quote':
                return (
                    <blockquote 
                        key={index}
                        style={{
                            margin: '32px 0',
                            padding: '24px',
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            borderLeft: '4px solid #1677ff',
                            borderRadius: '0 12px 12px 0',
                            fontStyle: 'italic',
                            fontSize: '18px',
                            lineHeight: '1.6'
                        }}
                    >
                        {renderChildren(block.children)}
                    </blockquote>
                )

            case 'code':
                return (
                    <pre 
                        key={index}
                        style={{
                            background: '#1f1f1f',
                            color: '#f8f8f2',
                            padding: '20px',
                            borderRadius: '12px',
                            overflow: 'auto',
                            margin: '24px 0',
                            fontSize: '14px',
                            lineHeight: '1.4'
                        }}
                    >
                        <code>{renderChildren(block.children)}</code>
                    </pre>
                )

            default:
                return (
                    <div key={index}>
                        {renderChildren(block.children)}
                    </div>
                )
        }
    }

    const renderChildren = (children) => {
        if (!Array.isArray(children)) return null
        
        return children.map((child, index) => {
            if (child.type === 'text') {
                let text = child.text
                
                // Apply text formatting
                if (child.bold) {
                    text = <strong key={index}>{text}</strong>
                }
                if (child.italic) {
                    text = <em key={index}>{text}</em>
                }
                if (child.code) {
                    text = (
                        <code 
                            key={index}
                            style={{
                                background: '#f5f5f5',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                color: '#d4351c'
                            }}
                        >
                            {text}
                        </code>
                    )
                }
                
                return text
            }
            
            return child
        })
    }

    return (
        <div className="blog-content">
            {content.map((block, index) => renderBlock(block, index))}
        </div>
    )
}

export default BlogContent