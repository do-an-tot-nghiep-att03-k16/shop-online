import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createSlug } from '../utils/slugUtils'
import { Row, Col, Card, Button, Carousel, Typography, Pagination } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import {
    useProducts,
    useProductsByCategory,
    useProductsByGender,
    useProductsOnSale,
} from '../hooks/useProducts'
import { useActiveCategories } from '../hooks/useCategories'
import { useHomeConfig } from '../hooks/useHomeConfig'
import { useHomeData } from '../hooks/useHomeData'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import SmoothTransition from '../components/Common/SmoothTransition'
import ProductCard from '../components/Product/ProductCard'
import ProductCardSkeleton from '../components/Common/ProductCardSkeleton'
import { BlogCard } from '../components/Blog'
import { useBlogs } from '../hooks/useBlog'
import { FeaturedCouponsSection } from '../components/Home'
import HeroBanner from '../components/Home/HeroBanner'
import '../components/Common/SmoothTransition.css'

const { Title, Paragraph } = Typography

// Category Section Component
const CategorySection = ({ category }) => {
    const categoryId = category._id || category.category_id

    // Use standard hook - same as Home backup
    const { data: categoryResponse, isLoading: loading } = useProducts({
        category: categoryId, // ✅ FIX - backend expects 'category' parameter
        limit: 4,
        status: 'active',
    })

    // Use optimized response - should be properly filtered by backend
    const products = categoryResponse?.products || []

    // Debug logs removed

    if (!products || products.length === 0) {
        return null
    }

    return (
        <section style={{ marginBottom: 48 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={3}>{category.name}</Title>
                <Button type="link">
                    <Link
                        to={`/shop/${
                            category.slug || createSlug(category.name)
                        }`}
                    >
                        Xem thêm →
                    </Link>
                </Button>
            </div>
            <Row gutter={[16, 16]} className="fade-in-list">
                {products.map((product, index) => (
                    <Col
                        xs={12}
                        sm={6}
                        md={6}
                        lg={6}
                        key={product._id}
                        className="fade-in-item"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <ProductCard product={product} />
                    </Col>
                ))}
            </Row>
        </section>
    )
}

// Sale Section Component
const SaleSection = () => {
    // Use backend filtering for sale products with on_sale parameter
    const { data: saleResponse, isLoading: loading } = useProductsOnSale({
        limit: 8,
        status: 'active',
    })

    // Products are already filtered by backend
    const products = saleResponse?.products || []

    if (loading) {
        return (
            <div style={{ marginBottom: 48 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Typography.Title level={2}>
                        🔥 Sản phẩm khuyến mãi
                    </Typography.Title>
                </div>
                <Row gutter={[16, 16]}>
                    {[...Array(8)].map((_, index) => (
                        <Col key={index} xs={12} sm={12} md={8} lg={6} xl={6}>
                            <ProductCardSkeleton />
                        </Col>
                    ))}
                </Row>
            </div>
        )
    }

    if (!products || products.length === 0) {
        return null // Don't show section if no sale products
    }

    return (
        <div style={{ marginBottom: '48px' }}>
            <Typography.Title
                level={2}
                style={{
                    textAlign: 'center',
                    marginBottom: '32px',
                    background: 'linear-gradient(45deg, #b77574, #c48783)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                🔥 Sản phẩm khuyến mãi
            </Typography.Title>

            {/* Products Grid */}
            <Row gutter={[16, 16]} justify="center">
                {products.slice(0, 8).map((product) => (
                    <Col key={product._id} xs={12} sm={12} md={8} lg={6} xl={6}>
                        <ProductCard product={product} />
                    </Col>
                ))}
            </Row>

            {/* View More Button */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Button
                    type="primary"
                    size="large"
                    style={{
                        background: 'linear-gradient(45deg, #b77574, #c48783)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        height: '48px',
                        paddingLeft: '32px',
                        paddingRight: '32px',
                    }}
                >
                    <Link
                        to="/shop/sale"
                        style={{ color: 'white', textDecoration: 'none' }}
                    >
                        Xem tất cả khuyến mãi <RightOutlined />
                    </Link>
                </Button>
            </div>
        </div>
    )
}

// Blog Section Component
const BlogSection = () => {
    const { blogs, loading } = useBlogs({
        limit: 3,
        sort: 'createdAt:desc',
    })

    if (loading) {
        return (
            <div style={{ marginBottom: 48 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Title level={2}>📖 Blog thời trang</Title>
                </div>
                <Row gutter={[24, 24]}>
                    {[...Array(3)].map((_, index) => (
                        <Col key={index} xs={24} sm={12} md={8}>
                            <Card loading style={{ height: '300px' }} />
                        </Col>
                    ))}
                </Row>
            </div>
        )
    }

    if (!blogs || blogs.length === 0) {
        return null // Don't show section if no blogs
    }

    return (
        <div style={{ marginBottom: '48px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Title level={2} style={{ marginBottom: '16px' }}>
                    📖 Blog Thời Trang
                </Title>
                <Paragraph
                    style={{
                        fontSize: '16px',
                        color: '#666',
                        maxWidth: '600px',
                        margin: '0 auto',
                    }}
                >
                    Khám phá những xu hướng mới nhất, tips phối đồ và cẩm nang
                    chăm sóc trang phục
                </Paragraph>
            </div>

            {/* Blog Grid */}
            <Row gutter={[24, 24]} className="fade-in-list">
                {blogs.slice(0, 3).map((blog, index) => (
                    <Col
                        key={blog.id}
                        xs={24}
                        sm={12}
                        md={8}
                        className="fade-in-item"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <BlogCard blog={blog} />
                    </Col>
                ))}
            </Row>

            {/* View More Button */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Button
                    type="primary"
                    size="large"
                    style={{
                        background: 'linear-gradient(45deg, #1677ff, #40a9ff)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        height: '48px',
                        paddingLeft: '32px',
                        paddingRight: '32px',
                    }}
                >
                    <Link
                        to="/blog"
                        style={{ color: 'white', textDecoration: 'none' }}
                    >
                        Xem tất cả bài viết <RightOutlined />
                    </Link>
                </Button>
            </div>
        </div>
    )
}

// Gender Section Component
const GenderSection = ({ gender, title }) => {
    const { data: genderProductsData, isLoading: loading } =
        useProductsByGender(gender, {
            limit: 4,
            status: 'active',
        })

    // Extract products from response
    const products =
        genderProductsData?.metadata?.products || // Backend consistently returns 'products' array
        genderProductsData?.metadata ||
        []

    if (!products || products.length === 0) return null

    return (
        <section style={{ marginBottom: 48 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={3}>{title}</Title>
                <Button type="link">
                    <Link
                        to={`/shop/${
                            gender === 'male'
                                ? 'nam'
                                : gender === 'female'
                                ? 'nu'
                                : 'unisex'
                        }`}
                    >
                        Xem thêm →
                    </Link>
                </Button>
            </div>
            <Row gutter={[12, 16]}>
                {products.map((product) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
                        <ProductCard product={product} />
                    </Col>
                ))}
            </Row>
        </section>
    )
}

// ProductCard component is now imported from '../components/Product/ProductCard'

const Home = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(12)

    // CMS integrated home config
    const {
        homeData,
        loading: cmsLoading,
        sections,
        heroConfig,
        featuredCategories: cmsFeaturedCategories,
        featuredCoupons: cmsFeaturedCoupons,
        newProducts: cmsNewProducts,
        saleProducts: cmsSaleProducts,
        settings: cmsSettings,
    } = useHomeData()

    // Backup: Original Strapi home config
    const {
        homeConfig,
        heroSection,
        productSections,
        isLoading: homeConfigLoading,
        getFeaturedCoupons,
        getFeaturedCategories,
        shouldShowNewProducts,
        shouldShowSaleProducts,
        shouldShowFeaturedProducts,
        getNewProductsLimit,
        getSaleProductsLimit,
    } = useHomeConfig()

    // Use CMS data if available, fallback to original
    const activeHeroTitle =
        heroConfig?.title || heroSection?.title || 'Chào mừng đến với Aristia'
    const activeHeroSubtitle =
        heroConfig?.subtitle ||
        heroSection?.subtitle ||
        'Khám phá bộ sưu tập thời trang cao cấp'

    // Use CMS featured categories for CategorySection components
    const cmsCategories = homeData?.config?.featured_categories || []
    const cmsCouponsData = homeData?.config?.featured_coupons || []

    // Convert CMS categories to format CategorySection expects
    const activeFeaturedCategories =
        cmsCategories.length > 0
            ? cmsCategories.map((cat) => ({
                  _id: cat.backend_id,
                  name: cat.name,
                  slug: cat.slug,
                  category_id: cat.backend_id,
              }))
            : getFeaturedCategories()

    // Use CMS coupons if available
    const activeFeaturedCoupons =
        cmsCouponsData.length > 0 ? cmsCouponsData : getFeaturedCoupons()

    // Move this after categories is defined

    // Section visibility from CMS with fallbacks
    const showNewProducts =
        sections?.newProducts !== false && shouldShowNewProducts()
    const showSaleProducts =
        sections?.onsale !== false && shouldShowSaleProducts()
    const showCategoriesSection = sections?.categories !== false
    const showCouponsSection = sections?.coupons !== false

    const {
        data: products,
        isLoading: productsLoading,
        error: productsError,
    } = useProducts({
        page: currentPage,
        limit: pageSize,
        // featured: true,  // Remove featured filter to show all products
        status: 'active', // Only active products
        // Don't filter by stock to show all published products
    })

    // Process products data from API response
    const processedProducts = Array.isArray(products)
        ? products
        : products?.data || products?.metadata?.products || []
    const totalProducts =
        products?.metadata?.total ||
        (Array.isArray(products) ? products.length : 0)

    // Debug logging
    // Use active categories for website display
    const { data: categoriesData, error: categoriesError } =
        useActiveCategories()
    const categories =
        categoriesData?.metadata?.categories ||
        categoriesData?.data ||
        categoriesData ||
        []

    // Debug logging - So sánh CMS vs Code cũ

    // Hero banner data
    const banners = [
        {
            id: 1,
            title: 'Bộ sưu tập mới 2024',
            subtitle: 'Khám phá những xu hướng thời trang mới nhất',
            image: '/api/placeholder/1200/400',
            cta: 'Xem ngay',
            link: '/shop',
        },
        {
            id: 2,
            title: 'Giảm giá đến 50%',
            subtitle: 'Cơ hội sở hữu những món đồ yêu thích với giá tốt nhất',
            image: '/api/placeholder/1200/400',
            cta: 'Mua ngay',
            link: '/shop?sale=true',
        },
        {
            id: 3,
            title: 'Miễn phí vận chuyển',
            subtitle: 'Áp dụng cho đơn hàng từ 500.000đ',
            image: '/api/placeholder/1200/400',
            cta: 'Tìm hiểu',
            link: '/shop',
        },
    ]

    if (productsLoading) {
        return <LoadingSpinner />
    }

    return (
        <div className="home-page" style={{ margin: 0, padding: 0 }}>
            {/* Hero Banner Carousel */}
            <HeroBanner
                banners={heroSection?.banners || []}
                settings={heroSection?.settings || {}}
                content={{
                    title: activeHeroTitle,
                    subtitle: activeHeroSubtitle,
                }}
                cmsUrl={import.meta.env.VITE_CMS_URL || 'http://localhost:1337'}
            />

            {/* Featured Coupons Section - Moved to top */}
            {showCouponsSection && cmsFeaturedCoupons?.length > 0 && (
                <FeaturedCouponsSection
                    featuredCoupons={cmsFeaturedCoupons}
                    loading={cmsLoading}
                />
            )}

            <div
                className="container"
                style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}
            >
                {/* Sale Products Section - Show only if enabled in CMS */}
                {showSaleProducts && <SaleSection />}

                {/* Categories Section - Show all categories from backend */}
                {showCategoriesSection &&
                    (() => {
                        const displayCategories = categories.slice(0, 6)

                        return (
                            Array.isArray(displayCategories) &&
                            displayCategories.length > 0 && (
                                <section style={{ marginBottom: 48 }}>
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            marginBottom: 32,
                                        }}
                                    >
                                        <Title level={2}>
                                            Danh mục sản phẩm
                                        </Title>
                                        <Paragraph>
                                            Khám phá các danh mục sản phẩm của
                                            chúng tôi
                                        </Paragraph>
                                    </div>
                                    <Row gutter={[12, 16]}>
                                        {displayCategories.map((category) => (
                                            <Col
                                                xs={12}
                                                sm={8}
                                                md={6}
                                                lg={4}
                                                key={
                                                    category._id ||
                                                    category.category_id
                                                }
                                            >
                                                <Link
                                                    to={`/shop/${
                                                        category.slug ||
                                                        createSlug(
                                                            category.name
                                                        )
                                                    }`}
                                                >
                                                    <Card
                                                        hoverable
                                                        cover={
                                                            <div
                                                                style={{
                                                                    height: 120,
                                                                    overflow:
                                                                        'hidden',
                                                                }}
                                                            >
                                                                {category.images
                                                                    ?.medium ||
                                                                category.images
                                                                    ?.large ||
                                                                category.images
                                                                    ?.thumbnail ||
                                                                category.image
                                                                    ?.medium ||
                                                                category.image
                                                                    ?.large ||
                                                                category.image
                                                                    ?.thumbnail ||
                                                                category.image_id ? (
                                                                    <img
                                                                        src={
                                                                            category
                                                                                .images
                                                                                ?.medium ||
                                                                            category
                                                                                .images
                                                                                ?.large ||
                                                                            category
                                                                                .images
                                                                                ?.thumbnail ||
                                                                            category
                                                                                .image
                                                                                ?.medium ||
                                                                            category
                                                                                .image
                                                                                ?.large ||
                                                                            category
                                                                                .image
                                                                                ?.thumbnail ||
                                                                            `https://res.cloudinary.com/dt2eofiqv/image/upload/c_fill,h_120,w_200/v1/${category.image_id}`
                                                                        }
                                                                        alt={
                                                                            category.name
                                                                        }
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit:
                                                                                'cover',
                                                                        }}
                                                                        onError={(
                                                                            e
                                                                        ) => {
                                                                            e.target.style.display =
                                                                                'none'
                                                                            e.target.nextElementSibling.style.display =
                                                                                'flex'
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div
                                                                    style={{
                                                                        height: '100%',
                                                                        background:
                                                                            'linear-gradient(45deg, #f0f2f5, #e6f7ff)',
                                                                        display:
                                                                            category
                                                                                .images
                                                                                ?.medium ||
                                                                            category
                                                                                .images
                                                                                ?.large ||
                                                                            category
                                                                                .images
                                                                                ?.thumbnail ||
                                                                            category
                                                                                .image
                                                                                ?.medium ||
                                                                            category
                                                                                .image
                                                                                ?.large ||
                                                                            category
                                                                                .image
                                                                                ?.thumbnail ||
                                                                            category.image_id
                                                                                ? 'none'
                                                                                : 'flex',
                                                                        alignItems:
                                                                            'center',
                                                                        justifyContent:
                                                                            'center',
                                                                        fontSize: 24,
                                                                        color: '#1890ff',
                                                                    }}
                                                                >
                                                                    {category.name
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}
                                                                </div>
                                                            </div>
                                                        }
                                                        styles={{
                                                            body: {
                                                                padding: 12,
                                                                textAlign:
                                                                    'center',
                                                            },
                                                        }}
                                                    >
                                                        <Card.Meta
                                                            title={
                                                                category.name
                                                            }
                                                            style={{
                                                                fontSize: 14,
                                                            }}
                                                        />
                                                    </Card>
                                                </Link>
                                            </Col>
                                        ))}
                                    </Row>
                                </section>
                            )
                        )
                    })()}

                {/* Category Sections - Show only CMS selected categories */}
                {Array.isArray(cmsCategories) && cmsCategories.length > 0
                    ? // Filter backend categories to only show CMS selected ones
                      categories
                          .filter((category) =>
                              cmsCategories.some(
                                  (cmsCAT) =>
                                      cmsCAT.backend_id === category._id ||
                                      cmsCAT.backend_id === category.category_id
                              )
                          )
                          .map((category) => (
                              <CategorySection
                                  key={category._id || category.category_id}
                                  category={category}
                              />
                          ))
                    : // Fallback: Show all categories if CMS not configured
                      Array.isArray(categories) &&
                      categories
                          .slice(0, 3)
                          .map((category) => (
                              <CategorySection
                                  key={category._id || category.category_id}
                                  category={category}
                              />
                          ))}

                {/* Old coupon section - backup */}
                {false &&
                    showCouponsSection &&
                    activeFeaturedCoupons.length > 0 && (
                        <section style={{ marginBottom: 48 }}>
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginBottom: 32,
                                }}
                            >
                                <Title
                                    level={2}
                                    style={{
                                        background:
                                            'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    🎟️ Mã Giảm Giá Đặc Biệt
                                </Title>
                                <Paragraph>
                                    Những ưu đãi được chọn lọc đặc biệt từ CMS
                                </Paragraph>
                            </div>

                            <Row gutter={[24, 24]} justify="center">
                                {activeFeaturedCoupons.map((coupon) => (
                                    <Col
                                        key={coupon._id || coupon.code}
                                        xs={24}
                                        sm={12}
                                        lg={8}
                                    >
                                        <Card
                                            style={{
                                                background:
                                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: 'white',
                                            }}
                                            bodyStyle={{ padding: '24px' }}
                                        >
                                            <div
                                                style={{ textAlign: 'center' }}
                                            >
                                                <Title
                                                    level={4}
                                                    style={{
                                                        color: 'white',
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    {coupon.name ||
                                                        coupon.description}
                                                </Title>

                                                <div
                                                    style={{
                                                        background:
                                                            'rgba(255,255,255,0.2)',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        marginBottom: 16,
                                                        border: '2px dashed rgba(255,255,255,0.5)',
                                                    }}
                                                >
                                                    <Title
                                                        level={3}
                                                        style={{
                                                            color: 'white',
                                                            margin: 0,
                                                            fontFamily:
                                                                'monospace',
                                                        }}
                                                    >
                                                        {coupon.code}
                                                    </Title>
                                                </div>

                                                <div
                                                    style={{ marginBottom: 16 }}
                                                >
                                                    <Paragraph
                                                        style={{
                                                            color: 'rgba(255,255,255,0.8)',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Giảm{' '}
                                                        {coupon.discount_type ===
                                                        'percentage'
                                                            ? `${coupon.discount_value}%`
                                                            : `${coupon.discount_value?.toLocaleString()}đ`}
                                                    </Paragraph>
                                                    {coupon.min_order_value >
                                                        0 && (
                                                        <Paragraph
                                                            style={{
                                                                color: 'rgba(255,255,255,0.8)',
                                                                margin: 0,
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            Đơn tối thiểu:{' '}
                                                            {coupon.min_order_value.toLocaleString()}
                                                            đ
                                                        </Paragraph>
                                                    )}
                                                </div>

                                                <Button
                                                    style={{
                                                        background: 'white',
                                                        color: '#667eea',
                                                        border: 'none',
                                                        fontWeight: 'bold',
                                                    }}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            coupon.code
                                                        )
                                                        // You can add toast notification here
                                                    }}
                                                >
                                                    Sao chép mã
                                                </Button>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                <Paragraph style={{ color: '#666' }}>
                                    💡 Áp dụng mã khi thanh toán để nhận ưu đãi
                                </Paragraph>
                            </div>
                        </section>
                    )}

                {/* Blog Section */}
                <BlogSection />

                {/* Gender Sections */}
                <GenderSection gender="female" title="Thời trang nữ" />
                <GenderSection gender="male" title="Thời trang nam" />

                {/* Featured Products Section */}
                <section style={{ marginBottom: 48 }}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <Title level={2}>Sản phẩm nổi bật</Title>
                        <Paragraph>
                            Những sản phẩm được yêu thích nhất
                        </Paragraph>
                    </div>

                    {Array.isArray(processedProducts) &&
                    processedProducts.length > 0 ? (
                        <Row gutter={[12, 16]}>
                            {processedProducts.slice(0, 8).map((product) => (
                                <Col
                                    xs={24}
                                    sm={12}
                                    md={8}
                                    lg={6}
                                    key={product._id}
                                >
                                    <ProductCard product={product} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <Paragraph>Chưa có sản phẩm nào.</Paragraph>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalProducts > pageSize && (
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
                            />
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <Button type="primary" size="large">
                            <Link to="/shop" style={{ color: 'inherit' }}>
                                Xem tất cả sản phẩm
                            </Link>
                        </Button>
                    </div>
                </section>

                {/* Features Section */}
                <section style={{ marginBottom: 48 }}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={8}>
                            <div style={{ textAlign: 'center', padding: 24 }}>
                                <div
                                    style={{
                                        fontSize: 32,
                                        marginBottom: 16,
                                        color: '#1890ff',
                                    }}
                                >
                                    🚚
                                </div>
                                <Title level={4}>Miễn phí vận chuyển</Title>
                                <Paragraph>
                                    Miễn phí giao hàng cho đơn hàng từ 500.000đ
                                </Paragraph>
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <div style={{ textAlign: 'center', padding: 24 }}>
                                <div
                                    style={{
                                        fontSize: 32,
                                        marginBottom: 16,
                                        color: '#52c41a',
                                    }}
                                >
                                    ↩️
                                </div>
                                <Title level={4}>Đổi trả 30 ngày</Title>
                                <Paragraph>
                                    Hỗ trợ đổi trả trong vòng 30 ngày nếu không
                                    hài lòng
                                </Paragraph>
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <div style={{ textAlign: 'center', padding: 24 }}>
                                <div
                                    style={{
                                        fontSize: 32,
                                        marginBottom: 16,
                                        color: '#faad14',
                                    }}
                                >
                                    🔒
                                </div>
                                <Title level={4}>Thanh toán an toàn</Title>
                                <Paragraph>
                                    Đảm bảo thông tin thanh toán được bảo mật
                                    100%
                                </Paragraph>
                            </div>
                        </Col>
                    </Row>
                </section>
            </div>
        </div>
    )
}

export default Home
