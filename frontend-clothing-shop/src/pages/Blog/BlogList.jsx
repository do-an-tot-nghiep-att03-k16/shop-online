// pages/Blog/BlogList.jsx
import { useState } from 'react'
import { Row, Col, Pagination, Input, Select, Typography, Breadcrumb } from 'antd'
import { SearchOutlined, HomeOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useBlogs, useBlogCategories } from '../../hooks/useBlog'
import BlogCard from '../../components/Blog/BlogCard'
import SmoothTransition from '../../components/Common/SmoothTransition'
import blogService from '../../services/blogService'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const BlogList = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(9)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [sortBy, setSortBy] = useState('createdAt:desc')
    const [searchResults, setSearchResults] = useState(null)
    const [isSearching, setIsSearching] = useState(false)

    const { blogs, loading, pagination, refetch } = useBlogs({
        page: currentPage,
        pageSize,
        sort: sortBy
    })

    const { categories, loading: categoriesLoading } = useBlogCategories()

    // Handle search
    const handleSearch = async (value) => {
        if (!value.trim()) {
            setSearchResults(null)
            setSearchTerm('')
            setIsSearching(false)
            return
        }

        try {
            setIsSearching(true)
            setSearchTerm(value)
            
            const response = await blogService.searchBlogs(value, {
                page: 1,
                pageSize,
                sort: sortBy
            })
            
            setSearchResults({
                blogs: response.data.data || [],
                pagination: response.data.meta?.pagination || {}
            })
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    // Handle category filter
    const handleCategoryChange = async (categorySlug) => {
        setSelectedCategory(categorySlug)
        setSearchResults(null)
        setSearchTerm('')
        
        if (!categorySlug) {
            refetch({ page: 1, pageSize, sort: sortBy })
            return
        }

        try {
            const response = await blogService.getBlogsByCategory(categorySlug, {
                page: 1,
                pageSize,
                sort: sortBy
            })
            
            setSearchResults({
                blogs: response.data.data || [],
                pagination: response.data.meta?.pagination || {}
            })
        } catch (error) {
            console.error('Category filter error:', error)
        }
    }

    // Handle sort change
    const handleSortChange = (value) => {
        setSortBy(value)
        setCurrentPage(1)
        refetch({ page: 1, pageSize, sort: value })
    }

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page)
        if (searchResults) {
            // Handle search/category pagination
            if (searchTerm) {
                handleSearch(searchTerm)
            } else if (selectedCategory) {
                handleCategoryChange(selectedCategory)
            }
        } else {
            refetch({ page, pageSize, sort: sortBy })
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Get current data to display
    const currentBlogs = searchResults ? searchResults.blogs : blogs
    const currentPagination = searchResults ? searchResults.pagination : pagination
    const isLoading = loading || isSearching

    return (
        <div style={{ 
            maxWidth: 1200, 
            margin: '0 auto', 
            padding: '24px 16px', 
            minHeight: '70vh' 
        }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px' }}>
                <Breadcrumb
                    items={[
                        {
                            href: '/',
                            title: <HomeOutlined />
                        },
                        {
                            title: 'Blog'
                        }
                    ]}
                />
            </div>

            {/* Simple Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Title level={1} style={{ marginBottom: '16px', color: '#1a1a1a' }}>
                    Blog Thời Trang
                </Title>
                <Text style={{ 
                    fontSize: '16px', 
                    color: '#666', 
                    maxWidth: '600px',
                    display: 'block',
                    margin: '0 auto',
                    lineHeight: '24px'
                }}>
                    Khám phá những xu hướng thời trang mới nhất và tips phối đồ từ các chuyên gia
                </Text>
            </div>

            {/* Simple Filters */}
            <Row gutter={[16, 16]} style={{ marginBottom: '40px' }}>
                <Col xs={24} md={8}>
                    <Search
                        placeholder="Tìm kiếm bài viết..."
                        onSearch={handleSearch}
                        enterButton={<SearchOutlined />}
                        size="large"
                        allowClear
                    />
                </Col>
                <Col xs={24} md={8}>
                    <Select
                        placeholder="Chọn danh mục"
                        size="large"
                        style={{ width: '100%' }}
                        onChange={handleCategoryChange}
                        value={selectedCategory}
                        allowClear
                        loading={categoriesLoading}
                    >
                        {categories.map(category => (
                            <Option key={category.slug} value={category.slug}>
                                {category.name}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col xs={24} md={8}>
                    <Select
                        value={sortBy}
                        onChange={handleSortChange}
                        size="large"
                        style={{ width: '100%' }}
                    >
                        <Option value="createdAt:desc">Mới nhất</Option>
                        <Option value="createdAt:asc">Cũ nhất</Option>
                        <Option value="title:asc">Tên A-Z</Option>
                        <Option value="title:desc">Tên Z-A</Option>
                    </Select>
                </Col>
            </Row>

            {/* Search Info */}
            {(searchTerm || selectedCategory) && (
                <div style={{ marginBottom: '24px', padding: '12px', background: '#f0f2f5', borderRadius: '8px' }}>
                    {searchTerm && (
                        <p style={{ margin: 0 }}>
                            🔍 Kết quả tìm kiếm cho: <strong>"{searchTerm}"</strong>
                        </p>
                    )}
                    {selectedCategory && (
                        <p style={{ margin: 0 }}>
                            📂 Danh mục: <strong>{categories.find(c => c.slug === selectedCategory)?.name}</strong>
                        </p>
                    )}
                </div>
            )}

            {/* Simple Blog Grid */}
            <SmoothTransition loading={isLoading && !currentBlogs.length}>
                {currentBlogs.length > 0 ? (
                    <>
                        <Row gutter={[24, 24]} className="fade-in-list">
                            {currentBlogs.map((blog, index) => (
                                <Col 
                                    xs={24} 
                                    sm={12} 
                                    lg={8}
                                    key={blog.id}
                                    className="fade-in-item"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <BlogCard blog={blog} />
                                </Col>
                            ))}
                        </Row>

                        {/* Simple Pagination - Always visible */}
                        {currentPagination.total > 0 && (
                            <div style={{ textAlign: 'center', marginTop: '48px' }}>
                                <Pagination
                                    current={currentPagination.page}
                                    pageSize={currentPagination.pageSize}
                                    total={currentPagination.total}
                                    onChange={handlePageChange}
                                    showSizeChanger={false}
                                    showTotal={(total, range) =>
                                        `${range[0]}-${range[1]} trong ${total} bài viết`
                                    }
                                    disabled={isLoading}
                                    hideOnSinglePage={false}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ 
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#f9f9f9',
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                            {searchTerm || selectedCategory ? '🔍' : '📝'}
                        </div>
                        <Title level={3} style={{ color: '#666', marginBottom: '8px' }}>
                            {searchTerm || selectedCategory 
                                ? "Không tìm thấy bài viết nào"
                                : "Chưa có bài viết nào"
                            }
                        </Title>
                        <Text style={{ color: '#999' }}>
                            {searchTerm || selectedCategory 
                                ? "Thử thay đổi từ khóa tìm kiếm hoặc danh mục"
                                : "Hãy quay lại sau để xem những bài viết mới nhất"
                            }
                        </Text>
                    </div>
                )}
            </SmoothTransition>
        </div>
    )
}

export default BlogList