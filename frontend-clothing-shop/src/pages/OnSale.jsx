import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useSearchParams, Link } from 'react-router-dom'
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
    FireOutlined,
} from '@ant-design/icons'
import { useProductsOnSale } from '../hooks/useProducts'
import { useCategories, useActiveCategories } from '../hooks/useCategories'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import ProductCard from '../components/Product/ProductCard'
import SmoothTransition from '../components/Common/SmoothTransition'

const { Title, Paragraph } = Typography
const { Option } = Select

const OnSale = () => {
    const [searchParams, setSearchParams] = useSearchParams()

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
    const [viewMode, setViewMode] = useState('grid')

    // Use general products hook and filter client-side for better control
    const {
        data: productsData,
        isLoading: productsLoading,
        error: productsError,
    } = useProductsOnSale({
        page: currentPage,
        limit: pageSize, // Get more products to filter from
        search: debouncedSearchTerm,
        category: selectedCategory || undefined,
        gender: selectedGender,
        min_price: priceRange[0],
        max_price: priceRange[1],
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
        setPriceRange(value)
        setCurrentPage(1)
    }, [])

    const handlePriceRangeAfterChange = useCallback((value) => {
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

    // Client-side filter for products with discount > 0
    const saleProducts =
        productsData?.metadata?.products || productsData?.products || []

    // Apply additional category filter if selected
    let products = saleProducts
    if (selectedCategory) {
        products = saleProducts.filter((product) => {
            if (!product.category_ids || !Array.isArray(product.category_ids))
                return false

            return product.category_ids.some((cat) => {
                const catId = cat._id || cat
                return catId === selectedCategory
            })
        })
    }

    // Pagination on filtered results
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedProducts = products.slice(startIndex, endIndex)
    const totalProducts = products.length

    // console.log(
    //     '🔍 [OnSale] Sale products (discount > 0):',
    //     saleProducts?.length
    // )

    // Use paginated products for display
    const displayProducts = paginatedProducts

    if (productsLoading) {
        return <LoadingSpinner />
    }

    if (productsError) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <Title level={3}>Có lỗi xảy ra</Title>
                <Paragraph>
                    Không thể tải danh sách sản phẩm khuyến mãi. Vui lòng thử
                    lại.
                </Paragraph>
            </div>
        )
    }

    return (
        <SmoothTransition loading={productsLoading}>
            <div className="onsale-page">
                <div
                    className="container"
                    style={{
                        maxWidth: 1200,
                        margin: '0 auto',
                        padding: '20px',
                    }}
                >
                    {/* Breadcrumb */}
                    <Breadcrumb
                        style={{ marginBottom: 24 }}
                        items={[
                            {
                                href: '/',
                                title: (
                                    <span>
                                        <HomeOutlined />
                                        <span style={{ marginLeft: 4 }}>
                                            Trang chủ
                                        </span>
                                    </span>
                                ),
                            },
                            {
                                href: '/shop',
                                title: 'Cửa hàng',
                            },
                            {
                                title: 'Khuyến mãi',
                            },
                        ]}
                    />

                    {/* Header */}
                    <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <Title
                            level={2}
                            style={{
                                background:
                                    'linear-gradient(45deg, #ff4d4f, #ff7a45)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <FireOutlined style={{ color: '#ff4d4f' }} />
                            Sản phẩm khuyến mãi
                        </Title>
                        <Paragraph>
                            Những sản phẩm đang có giá ưu đãi đặc biệt
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
                                    onChange={(e) =>
                                        setSearchInput(e.target.value)
                                    }
                                    onPressEnter={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    allowClear
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
                                    <Option value="price">
                                        Giá thấp đến cao
                                    </Option>
                                    <Option value="-price">
                                        Giá cao đến thấp
                                    </Option>
                                    <Option value="discount_percent">
                                        % giảm cao nhất
                                    </Option>
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
                                        onClose={() => setSearchInput('')}
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
                                                      (c.category_id ||
                                                          c._id) ===
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
                                {(priceRange[0] > 0 ||
                                    priceRange[1] < 2000000) && (
                                    <Tag
                                        closable
                                        onClose={() =>
                                            setPriceRange([0, 2000000])
                                        }
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
                            Hiển thị {displayProducts.length} trong tổng số{' '}
                            {totalProducts} sản phẩm khuyến mãi
                        </Paragraph>
                    </div>

                    {/* Products Grid */}
                    {displayProducts.length > 0 ? (
                        <>
                            <Row gutter={[12, 16]}>
                                {displayProducts.map((product) => (
                                    <Col
                                        xs={viewMode === 'list' ? 24 : 12}
                                        sm={viewMode === 'list' ? 24 : 12}
                                        md={viewMode === 'list' ? 24 : 8}
                                        lg={viewMode === 'list' ? 24 : 6}
                                        key={product._id}
                                    >
                                        <ProductCard product={product} />
                                    </Col>
                                ))}
                            </Row>

                            {/* Pagination - Always visible */}
                            {totalProducts > 0 && (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        marginTop: 32,
                                    }}
                                >
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={totalProducts}
                                        onChange={setCurrentPage}
                                        showSizeChanger={false}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} trong ${total} sản phẩm khuyến mãi`
                                        }
                                        hideOnSinglePage={false}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <Empty
                            description="Hiện tại không có sản phẩm khuyến mãi nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="primary">
                                <Link to="/shop">Xem tất cả sản phẩm</Link>
                            </Button>
                        </Empty>
                    )}
                </div>
            </div>
        </SmoothTransition>
    )
}

export default OnSale
