import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
    Row,
    Col,
    Card,
    Button,
    Select,
    Input,
    Slider,
    Typography,
    Pagination,
    Space,
    Tag,
    Empty,
    Breadcrumb,
} from 'antd'
import {
    SearchOutlined,
    FilterOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    HomeOutlined,
} from '@ant-design/icons'
import { useProducts, useProductsByCategory, useProductsByGender } from '../hooks/useProducts'
import { useCategories, useActiveCategories } from '../hooks/useCategories'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import ProductCard from '../components/Product/ProductCard'
import { 
    createSlug, 
    slugToName, 
    createCategoryMapping, 
    genderMapping, 
    genderSlugMapping,
    getGenderDisplayName 
} from '../utils/slugUtils'

const { Title, Paragraph } = Typography
const { Option } = Select

const ShopBySlug = () => {
    const { slug } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    // Filter states
    const [searchInput, setSearchInput] = useState(
        searchParams.get('search') || ''
    )
    
    // Debounce search input to prevent excessive API calls
    const debouncedSearchTerm = useDebounce(searchInput, 500)
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedGender, setSelectedGender] = useState('')
    const [priceRange, setPriceRange] = useState([0, 2000000])
    const [sortBy, setSortBy] = useState(
        searchParams.get('sort') || 'created_at'
    )
    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page')) || 1
    )
    const [pageSize] = useState(12)
    const [viewMode, setViewMode] = useState('grid')

    // Get categories for mapping
    const { data: categoriesData } = useActiveCategories()
    const categories = categoriesData?.metadata?.categories || categoriesData?.data || categoriesData || []
    
    // Create slug mappings
    const { slugToId, idToSlug } = useMemo(() => {
        return createCategoryMapping(categories)
    }, [categories])

    // Current filter info
    const [currentFilter, setCurrentFilter] = useState({ type: 'all', value: null, name: 'Tất cả sản phẩm' })

    // Parse slug to determine filter type and value
    useEffect(() => {
        if (!slug) {
            setCurrentFilter({ type: 'all', value: null, name: 'Tất cả sản phẩm' })
            setSelectedCategory('')
            setSelectedGender('')
            return
        }

        // Check if it's a gender slug
        if (['nam', 'nu', 'nữ', 'unisex', 'male', 'female'].includes(slug.toLowerCase())) {
            let genderValue
            switch(slug.toLowerCase()) {
                case 'nam':
                    genderValue = 'male'
                    break
                case 'nu':
                case 'nữ':
                    genderValue = 'female'
                    break
                case 'unisex':
                    genderValue = 'unisex'
                    break
                case 'male':
                    genderValue = 'male'
                    break
                case 'female':
                    genderValue = 'female'
                    break
                default:
                    genderValue = slug.toLowerCase()
            }
            
            setSelectedGender(genderValue)
            setSelectedCategory('')
            setCurrentFilter({
                type: 'gender',
                value: genderValue,
                name: getGenderDisplayName(genderValue)
            })
            return
        }

        // Check if it's a category slug - wait for categories to load
        if (categories.length > 0) {
            if (slugToId[slug]) {
                const categoryId = slugToId[slug]
                const category = categories.find(c => (c._id || c.category_id) === categoryId)
                setSelectedCategory(categoryId)
                setSelectedGender('')
                setCurrentFilter({
                    type: 'category',
                    value: categoryId,
                    name: category ? category.name : slugToName(slug)
                })
                return
            }

            // Try to find category by name if slug mapping fails
            const categoryByName = categories.find(c => {
                const generatedSlug = createSlug(c.name)
                return generatedSlug === slug || c.slug === slug
            })

            if (categoryByName) {
                const categoryId = categoryByName._id || categoryByName.category_id
                setSelectedCategory(categoryId)
                setSelectedGender('')
                setCurrentFilter({
                    type: 'category',
                    value: categoryId,
                    name: categoryByName.name
                })
                return
            }

            // If slug not found in categories, show all products with slug as search term
            setSelectedCategory('')
            setSelectedGender('')
            setSearchInput(slugToName(slug)) // Use slug as search term
            setCurrentFilter({
                type: 'search',
                value: slug,
                name: `Tìm kiếm: "${slugToName(slug)}"`
            })
        }
    }, [slug, slugToId, categories])

    // Build query parameters
    const queryParams = {
        page: currentPage,
        limit: pageSize,
        sort_by: sortBy,
        status: 'active',
    }

    // Add filters only if they have values
    if (debouncedSearchTerm) queryParams.search = debouncedSearchTerm
    if (selectedCategory) queryParams.category = selectedCategory
    if (selectedGender) queryParams.gender = selectedGender
    if (priceRange[0] > 0) queryParams.min_price = priceRange[0]
    if (priceRange[1] < 2000000) queryParams.max_price = priceRange[1]


    // Backend filtering is BROKEN, so always use general products hook with client-side filtering
    const {
        data: productsData,
        isLoading: productsLoading,
        error: productsError,
    } = useProducts({
        page: 1, // Always get from page 1 since we'll filter client-side
        limit: 100, // Get enough products to filter from
        search: debouncedSearchTerm,
        // Don't send category/gender filters to backend - they're broken
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 2000000 ? priceRange[1] : undefined,
        sort_by: sortBy,
        status: 'active',
    })


    // Process products data - PURE CLIENT-SIDE FILTERING since backend is broken
    const allProducts = productsData?.metadata?.products ||
                       productsData?.products || 
                       []
    
    // Apply all filters client-side
    let filteredProducts = allProducts
    
    // Category filter
    if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => {
            if (!product.category_ids || !Array.isArray(product.category_ids)) return false
            
            return product.category_ids.some(cat => {
                const catId = cat._id || cat
                return catId === selectedCategory
            })
        })
    }
    
    // Gender filter
    if (selectedGender) {
        filteredProducts = filteredProducts.filter(product => product.gender === selectedGender)
    }
    
    
    // Pagination on filtered results
    const totalProducts = filteredProducts.length
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const products = filteredProducts.slice(startIndex, endIndex)
    

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
        if (sortBy !== 'created_at') params.set('sort', sortBy)
        if (currentPage > 1) params.set('page', currentPage.toString())

        setSearchParams(params)
    }, [debouncedSearchTerm, sortBy, currentPage, setSearchParams])

    const handleSearch = (value) => {
        setSearchInput(value)
        setCurrentPage(1)
    }

    const handleSortChange = (value) => {
        setSortBy(value)
        setCurrentPage(1)
    }

    const handlePriceRangeChange = useCallback((value) => {
        setPriceRange(value)
        setCurrentPage(1)
    }, [])

    // Use onAfterChange for better performance - only update when user stops dragging
    const handlePriceRangeAfterChange = useCallback((value) => {
        setPriceRange(value)
        setCurrentPage(1)
    }, [])

    const clearFilters = () => {
        setSearchInput('')
        setPriceRange([0, 2000000])
        setSortBy('created_at')
        setCurrentPage(1)
    }

    // Debug logs

    if (productsLoading) {
        return <LoadingSpinner />
    }

    if (productsError) {
        console.error('🚨 [ShopBySlug] Products error:', productsError)
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <Title level={3}>Có lỗi xảy ra</Title>
                <Paragraph>Không thể tải danh sách sản phẩm. Vui lòng thử lại.</Paragraph>
                <Button type="primary" onClick={() => navigate('/shop')}>
                    Về trang cửa hàng
                </Button>
            </div>
        )
    }

    return (
        <div className="shop-page">
            <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
                {/* Breadcrumb */}
                <Breadcrumb 
                    style={{ marginBottom: 24 }}
                    items={[
                        {
                            href: '/',
                            title: (
                                <span>
                                    <HomeOutlined />
                                    <span style={{ marginLeft: 4 }}>Trang chủ</span>
                                </span>
                            ),
                        },
                        {
                            href: '/shop',
                            title: 'Cửa hàng',
                        },
                        {
                            title: currentFilter.name,
                        },
                    ]}
                />

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={2}>{currentFilter.name}</Title>
                    <Paragraph>
                        {currentFilter.type === 'gender' 
                            ? `Khám phá bộ sưu tập ${currentFilter.name.toLowerCase()}`
                            : currentFilter.type === 'category'
                            ? `Sản phẩm thuộc danh mục ${currentFilter.name}`
                            : 'Khám phá bộ sưu tập sản phẩm của chúng tôi'
                        }
                    </Paragraph>
                </div>

                {/* Filters Bar */}
                <Card style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]} align="middle">
                        {/* Search */}
                        <Col xs={24} md={8}>
                            <Input
                                placeholder="Tìm kiếm sản phẩm..."
                                prefix={<SearchOutlined />}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onPressEnter={(e) => handleSearch(e.target.value)}
                                allowClear
                            />
                        </Col>

                        {/* Sort */}
                        <Col xs={12} md={4}>
                            <Select
                                value={sortBy}
                                onChange={handleSortChange}
                                style={{ width: '100%' }}
                            >
                                <Option value="created_at">Mới nhất</Option>
                                <Option value="name">Tên A-Z</Option>
                                <Option value="price">Giá thấp đến cao</Option>
                                <Option value="-price">Giá cao đến thấp</Option>
                            </Select>
                        </Col>

                        {/* View Mode */}
                        <Col xs={12} md={4}>
                            <Space.Compact>
                                <Button
                                    icon={<AppstoreOutlined />}
                                    type={viewMode === 'grid' ? 'primary' : 'default'}
                                    onClick={() => setViewMode('grid')}
                                >
                                    Grid
                                </Button>
                                <Button
                                    icon={<UnorderedListOutlined />}
                                    type={viewMode === 'list' ? 'primary' : 'default'}
                                    onClick={() => setViewMode('list')}
                                >
                                    List
                                </Button>
                            </Space.Compact>
                        </Col>

                        {/* Clear Filters */}
                        <Col xs={24} md={4}>
                            <Button onClick={clearFilters} block>
                                Xóa bộ lọc
                            </Button>
                        </Col>
                    </Row>

                    {/* Price Range */}
                    <Row style={{ marginTop: 16 }}>
                        <Col span={24}>
                            <div style={{ marginBottom: 8 }}>
                                <strong>Khoảng giá: </strong>
                                {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                }).format(priceRange[0])}{' '}
                                -{' '}
                                {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                }).format(priceRange[1])}
                            </div>
                            <Slider
                                range
                                min={0}
                                max={2000000}
                                step={10000}
                                value={priceRange}
                                onChange={handlePriceRangeChange}
                                onAfterChange={handlePriceRangeAfterChange}
                                tooltip={{
                                    formatter: (value) =>
                                        new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                        }).format(value),
                                }}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Active Filters */}
                {(debouncedSearchTerm || priceRange[0] > 0 || priceRange[1] < 2000000) && (
                    <div style={{ marginBottom: 24 }}>
                        <Space wrap>
                            <span><FilterOutlined /> Bộ lọc đang áp dụng:</span>
                            {debouncedSearchTerm && (
                                <Tag closable onClose={() => setSearchInput('')}>
                                    Tìm kiếm: {debouncedSearchTerm}
                                </Tag>
                            )}
                            {(priceRange[0] > 0 || priceRange[1] < 2000000) && (
                                <Tag closable onClose={() => setPriceRange([0, 2000000])}>
                                    Giá: {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(priceRange[0])} - {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(priceRange[1])}
                                </Tag>
                            )}
                        </Space>
                    </div>
                )}

                {/* Results Info */}
                <div style={{ marginBottom: 24 }}>
                    <Paragraph>
                        Hiển thị {products.length} trong tổng số {totalProducts} sản phẩm
                    </Paragraph>
                </div>

                {/* Products Grid */}
                {products.length > 0 ? (
                    <>
                        <Row gutter={[12, 16]}>
                            {products.map((product) => (
                                <Col
                                    xs={viewMode === 'list' ? 24 : 12}
                                    sm={viewMode === 'list' ? 24 : 12}
                                    md={viewMode === 'list' ? 24 : 8}
                                    lg={viewMode === 'list' ? 24 : 6}
                                    key={product._id || product.id}
                                >
                                    <ProductCard product={product} />
                                </Col>
                            ))}
                        </Row>

                        {/* Pagination - Always visible */}
                        {totalProducts > 0 && (
                            <div style={{ textAlign: 'center', marginTop: 32 }}>
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={totalProducts}
                                    onChange={setCurrentPage}
                                    showSizeChanger={false}
                                    showTotal={(total, range) =>
                                        `${range[0]}-${range[1]} trong ${total} sản phẩm`
                                    }
                                    hideOnSinglePage={false}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <Empty
                        description="Không tìm thấy sản phẩm nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate('/shop')}>
                            Xem tất cả sản phẩm
                        </Button>
                    </Empty>
                )}
            </div>
        </div>
    )
}

export default ShopBySlug