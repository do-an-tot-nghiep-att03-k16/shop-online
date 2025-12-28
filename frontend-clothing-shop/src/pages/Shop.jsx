import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import {
    Row,
    Col,
    Card,
    Button,
    Select,
    Input,
    Typography,
    Pagination,
    Space,
    Tag,
    Empty,
} from 'antd'
import {
    SearchOutlined,
    FilterOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons'
import { useProducts } from '../hooks/useProducts'
import { useCategories, useActiveCategories } from '../hooks/useCategories'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import SmoothTransition from '../components/Common/SmoothTransition'
import ProductCard from '../components/Product/ProductCard'
import ProductCardSkeleton from '../components/Common/ProductCardSkeleton'
import SafeSlider from '../components/Common/SafeSlider'
import '../components/Common/SmoothTransition.css'
import { suppressDragErrors } from '../utils/errorSuppression'

const { Title, Paragraph } = Typography
const { Option } = Select

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    // Removed heavy error suppression to improve performance

    // Filter states
    const [searchInput, setSearchInput] = useState(
        searchParams.get('search') || ''
    )

    // Debounce search input to prevent excessive API calls
    const debouncedSearchTerm = useDebounce(searchInput, 500)
    const [selectedCategory, setSelectedCategory] = useState(
        searchParams.get('category') || ''
    )
    const [selectedGender, setSelectedGender] = useState(
        searchParams.get('gender') || ''
    )
    const [priceRange, setPriceRange] = useState([0, 2000000])
    const [sortBy, setSortBy] = useState(
        searchParams.get('sort') || 'created_at'
    )
    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page')) || 1
    )
    const [pageSize] = useState(8)
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

    // Use search endpoint when searching, regular endpoint otherwise
    const isSearching = debouncedSearchTerm && debouncedSearchTerm.trim() !== ''

    const {
        data: productsResponse,
        isLoading: productsLoading,
        error: productsError,
        isFetching,
    } = useProducts({
        page: currentPage,
        limit: pageSize,
        ...(isSearching
            ? { search: debouncedSearchTerm } // Uses /product/search endpoint
            : {
                  // Uses /product endpoint with filters
                  category: selectedCategory
                      ? [selectedCategory]
                      : undefined,
                  gender: selectedGender,
                  min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
                  max_price:
                      priceRange[1] < 2000000 ? priceRange[1] : undefined,
              }),
        sort_by: sortBy,
        status: 'active',
    })

    // Use active categories for website display
    const { data: categoriesData } = useActiveCategories()
    const categories =
        categoriesData?.metadata?.categories ||
        categoriesData?.data ||
        categoriesData ||
        []


    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
        if (selectedCategory) params.set('category', selectedCategory)
        if (selectedGender) params.set('gender', selectedGender)
        if (sortBy !== 'created_at') params.set('sort', sortBy)
        if (currentPage > 1) params.set('page', currentPage.toString())

        setSearchParams(params)
    }, [
        debouncedSearchTerm,
        selectedCategory,
        selectedGender,
        sortBy,
        currentPage,
        setSearchParams,
    ])

    const handleSearch = (value) => {
        setSearchInput(value)
        setCurrentPage(1)
    }

    const handleCategoryChange = (value) => {
        setSelectedCategory(value)
        setCurrentPage(1)
    }

    const handleGenderChange = (value) => {
        setSelectedGender(value)
        setCurrentPage(1)
    }

    const handleSortChange = (value) => {
        setSortBy(value)
        setCurrentPage(1)
    }

    const handlePriceRangeChange = useCallback((value) => {
        // Simple, fast update without filtering
        setPriceRange(value)
    }, [])

    // Use onChangeComplete for better performance - only filter when user stops dragging
    const handlePriceRangeComplete = useCallback((value) => {
        setPriceRange(value)
        setCurrentPage(1)
    }, [])

    const clearFilters = () => {
        setSearchInput('')
        setSelectedCategory('')
        setSelectedGender('')
        setPriceRange([0, 2000000])
        setSortBy('created_at')
        setCurrentPage(1)
    }

    // Use standard response structure
    const products = productsResponse?.products || []
    const totalProducts = productsResponse?.pagination?.total || 0
    const pagination = productsResponse?.pagination || {}


    // Debug logs removed

    // Remove the old loading check - let SmoothTransition handle it

    if (productsError) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <Title level={3}>Có lỗi xảy ra</Title>
                <Paragraph>
                    Không thể tải danh sách sản phẩm. Vui lòng thử lại.
                </Paragraph>
            </div>
        )
    }

    return (
        <div className="shop-page">
            <div
                className="container"
                style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}
            >
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={2}>Cửa hàng</Title>
                    <Paragraph>
                        Khám phá bộ sưu tập sản phẩm của chúng tôi
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
                                onPressEnter={(e) => {
                                    setSearchInput(e.target.value)
                                    setCurrentPage(1)
                                }}
                                allowClear
                                onClear={() => {
                                    setSearchInput('')
                                }}
                            />
                        </Col>

                        {/* Category Filter */}
                        <Col xs={12} md={3}>
                            <Select
                                placeholder="Danh mục"
                                style={{ width: '100%' }}
                                value={selectedCategory || undefined}
                                onChange={handleCategoryChange}
                                allowClear
                            >
                                {Array.isArray(categories) &&
                                    categories.map((category) => (
                                        <Option
                                            key={
                                                category.category_id ||
                                                category._id
                                            }
                                            value={
                                                category.category_id ||
                                                category._id
                                            }
                                        >
                                            {category.name}
                                        </Option>
                                    ))}
                            </Select>
                        </Col>

                        {/* Gender Filter */}
                        <Col xs={12} md={3}>
                            <Select
                                placeholder="Giới tính"
                                style={{ width: '100%' }}
                                value={selectedGender || undefined}
                                onChange={handleGenderChange}
                                allowClear
                            >
                                <Option value="male">Nam</Option>
                                <Option value="female">Nữ</Option>
                                <Option value="unisex">Unisex</Option>
                            </Select>
                        </Col>

                        {/* Sort */}
                        <Col xs={12} md={3}>
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
                        <Col xs={12} md={3}>
                            <Space.Compact>
                                <Button
                                    icon={<AppstoreOutlined />}
                                    type={
                                        viewMode === 'grid'
                                            ? 'primary'
                                            : 'default'
                                    }
                                    onClick={() => setViewMode('grid')}
                                >
                                    Grid
                                </Button>
                                <Button
                                    icon={<UnorderedListOutlined />}
                                    type={
                                        viewMode === 'list'
                                            ? 'primary'
                                            : 'default'
                                    }
                                    onClick={() => setViewMode('list')}
                                >
                                    List
                                </Button>
                            </Space.Compact>
                        </Col>

                        {/* Clear Filters */}
                        <Col xs={24} md={3}>
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
                            <SafeSlider
                                range
                                min={0}
                                max={2000000}
                                step={10000}
                                value={priceRange}
                                onChange={handlePriceRangeChange}
                                onChangeComplete={handlePriceRangeComplete}
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
                {(debouncedSearchTerm ||
                    selectedCategory ||
                    selectedGender ||
                    priceRange[0] > 0 ||
                    priceRange[1] < 2000000) && (
                    <div style={{ marginBottom: 24 }}>
                        <Space wrap>
                            <span>
                                <FilterOutlined /> Bộ lọc đang áp dụng:
                            </span>
                            {debouncedSearchTerm && (
                                <Tag
                                    closable
                                    onClose={() => {
                                        setSearchInput('')
                                    }}
                                >
                                    Tìm kiếm: {debouncedSearchTerm}
                                </Tag>
                            )}
                            {selectedCategory && (
                                <Tag
                                    closable
                                    onClose={() => setSelectedCategory('')}
                                >
                                    Danh mục:{' '}
                                    {Array.isArray(categories)
                                        ? categories.find(
                                              (c) =>
                                                  (c.category_id || c._id) ===
                                                  selectedCategory
                                          )?.name
                                        : 'N/A'}
                                </Tag>
                            )}
                            {selectedGender && (
                                <Tag
                                    closable
                                    onClose={() => setSelectedGender('')}
                                >
                                    Giới tính:{' '}
                                    {selectedGender === 'male'
                                        ? 'Nam'
                                        : selectedGender === 'female'
                                        ? 'Nữ'
                                        : 'Unisex'}
                                </Tag>
                            )}
                            {(priceRange[0] > 0 || priceRange[1] < 2000000) && (
                                <Tag
                                    closable
                                    onClose={() => setPriceRange([0, 2000000])}
                                >
                                    Giá:{' '}
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(priceRange[0])}{' '}
                                    -{' '}
                                    {new Intl.NumberFormat('vi-VN', {
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
                        Hiển thị {products.length} trong tổng số {totalProducts}{' '}
                        sản phẩm
                    </Paragraph>
                </div>

                {/* Products Grid with Enhanced Smooth Loading */}
                <div style={{ minHeight: '400px', position: 'relative' }}>
                    {/* Enhanced loading overlay when fetching new data */}
                    {isFetching && products.length > 0 && (
                        <div className="loading-overlay">
                            <LoadingSpinner />
                        </div>
                    )}

                    <SmoothTransition
                        loading={productsLoading && !products.length}
                        showSkeletons={true}
                        skeletonCount={pageSize}
                        preserveHeight={true}
                    >
                        {products.length > 0 ? (
                            <div className="search-results-enter search-results-enter-active">
                                <Row gutter={[12, 16]} className="fade-in-list">
                                    {products.map((product, index) => (
                                        <Col
                                            xs={viewMode === 'list' ? 24 : 24}
                                            sm={viewMode === 'list' ? 24 : 12}
                                            md={viewMode === 'list' ? 24 : 8}
                                            lg={viewMode === 'list' ? 24 : 6}
                                            key={`${product._id}-${currentPage}`} // Add page to key for better re-rendering
                                            className="fade-in-item"
                                            style={{
                                                animationDelay: `${
                                                    index * 0.05
                                                }s`,
                                                opacity: isFetching ? 0.7 : 1,
                                                transform: isFetching
                                                    ? 'scale(0.98)'
                                                    : 'scale(1)',
                                                transition:
                                                    'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            }}
                                        >
                                            <ProductCard product={product} />
                                        </Col>
                                    ))}
                                </Row>

                                {/* Enhanced Pagination - Always visible */}
                                {totalProducts > 0 && (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            marginTop: 32,
                                            opacity: isFetching ? 0.6 : 1,
                                            transition: 'opacity 0.3s ease',
                                        }}
                                    >
                                        <Pagination
                                            current={currentPage}
                                            pageSize={pageSize}
                                            total={totalProducts}
                                            onChange={setCurrentPage}
                                            showSizeChanger={false}
                                            showTotal={(total, range) =>
                                                `${range[0]}-${range[1]} trong ${total} sản phẩm`
                                            }
                                            disabled={isFetching}
                                            hideOnSinglePage={false}
                                            style={{
                                                filter: isFetching
                                                    ? 'blur(2px)'
                                                    : 'none',
                                                transition: 'filter 0.3s ease',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="search-results-enter search-results-enter-active">
                                <Empty
                                    description={
                                        isSearching
                                            ? `Không tìm thấy sản phẩm nào cho "${debouncedSearchTerm}"`
                                            : 'Không tìm thấy sản phẩm nào'
                                    }
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    style={{
                                        padding: '60px 20px',
                                        background:
                                            'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                                        borderRadius: '12px',
                                        margin: '40px 0',
                                    }}
                                >
                                    <Button
                                        type="primary"
                                        onClick={clearFilters}
                                        size="large"
                                        style={{
                                            borderRadius: '8px',
                                            height: '44px',
                                            padding: '0 24px',
                                        }}
                                    >
                                        {isSearching
                                            ? 'Xóa tìm kiếm'
                                            : 'Xóa bộ lọc'}
                                    </Button>
                                </Empty>
                            </div>
                        )}
                    </SmoothTransition>
                </div>
            </div>
        </div>
    )
}

export default Shop
