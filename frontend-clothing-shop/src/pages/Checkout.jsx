import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Form,
    Input,
    Button,
    Card,
    Row,
    Col,
    Divider,
    Space,
    Typography,
    message,
    Steps,
    Radio,
    Tag,
    Spin,
    Empty,
    Modal,
} from 'antd'
import {
    ShoppingCartOutlined,
    EnvironmentOutlined,
    CreditCardOutlined,
    CheckCircleOutlined,
    PhoneOutlined,
    HomeOutlined,
    QrcodeOutlined,
} from '@ant-design/icons'
import { useCart, useCartSelectors } from '../hooks/useCart'
import { useAddresses } from '../hooks/useAddresses'
import { useAuth } from '../hooks/useAuth'
import { orderAPI, paymentAPI } from '../services/api'
import AddressSelector from '../components/Common/AddressSelector'
// import ShippingProviderSelector from '../components/Shipping/ShippingProviderSelector' // Removed - admin handles shipping

const { Title, Text } = Typography
const { TextArea } = Input

const Checkout = () => {
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [orderReview, setOrderReview] = useState(null)
    const [cartChecked, setCartChecked] = useState(false)
    const [selectedAddressType, setSelectedAddressType] = useState('custom')
    const [paymentMethod, setPaymentMethod] = useState('cod') // 'cod' or 'sepay_qr'
    const cartEmptyShown = useRef(false)
    const checkoutSuccessShown = useRef(false)
    // const [selectedShipping, setSelectedShipping] = useState(null) // Removed - admin handles shipping

    // Fetch cart data from server
    useCart()

    // Get cart data from Redux store
    const { items, total, subtotal, loading: cartLoading } = useCartSelectors()
    const { data: userAddresses, isLoading: addressLoading } = useAddresses()
    const addresses = userAddresses || [] // Dùng cùng tên với Profile.jsx
    const { user } = useAuth()

    // Auto-fill form with user info and default address
    useEffect(() => {
        if (user && currentStep === 1) {
            // Tìm địa chỉ mặc định, nếu không có thì dùng địa chỉ đầu tiên
            const defaultAddress =
                addresses?.find((addr) => addr.is_default) || addresses?.[0]

            if (defaultAddress) {
                // Có địa chỉ có sẵn - tự động select địa chỉ đó
                setSelectedAddressType(defaultAddress._id)

                const formValues = {
                    shipping_address: {
                        name:
                            defaultAddress?.full_name ||
                            defaultAddress?.name ||
                            user.name ||
                            '',
                        phone: defaultAddress?.phone || user.phone || '',
                        address_line: defaultAddress?.address_line || '',
                        location: {
                            province_id:
                                defaultAddress?.province?.id ||
                                defaultAddress?.province_id,
                            province:
                                typeof defaultAddress?.province === 'object'
                                    ? defaultAddress.province?.name
                                    : defaultAddress?.province || '',
                            ward_id:
                                defaultAddress?.ward?.id ||
                                defaultAddress?.ward_id,
                            ward:
                                typeof defaultAddress?.ward === 'object'
                                    ? defaultAddress.ward?.name
                                    : defaultAddress?.ward || '',
                        },
                    },
                }

                form.setFieldsValue(formValues)
            } else {
                // Không có địa chỉ có sẵn - dùng thông tin user làm base
                setSelectedAddressType('custom')

                const formValues = {
                    shipping_address: {
                        name: user.name || '',
                        phone: user.phone || '',
                        address_line: '',
                        location: {
                            province_id: null,
                            province: '',
                            ward_id: null,
                            ward: '',
                        },
                    },
                }

                form.setFieldsValue(formValues)
            }
        }
    }, [user, addresses, currentStep, form])

    // Sync selectedAddressType với addresses từ profile
    useEffect(() => {
        if (addresses && addresses.length > 0 && currentStep === 1) {
            // Tìm địa chỉ mặc định từ profile
            const defaultAddress = addresses.find(
                (addr) => addr.is_default && addr.is_active !== false
            )
            if (defaultAddress) {
                setSelectedAddressType(defaultAddress._id)
            } else {
                // Nếu không có mặc định, chọn địa chỉ đầu tiên
                const firstAddress = addresses.find(
                    (addr) => addr.is_active !== false
                )
                if (firstAddress) {
                    setSelectedAddressType(firstAddress._id)
                } else {
                    setSelectedAddressType('custom')
                }
            }
        } else if (!addresses || addresses.length === 0) {
            // Không có địa chỉ nào trong profile
            setSelectedAddressType('custom')
        }
    }, [addresses, currentStep])

    useEffect(() => {
        // Mark cart as checked when loading is done
        if (!cartLoading && !cartChecked) {
            setCartChecked(true)
        }

        // Disable empty cart check completely for better UX
        // User can manually navigate away if needed
        // This prevents race conditions with "Buy Now" flow
    }, [cartLoading, cartChecked])

    // Reset flags when cart has items (for "Buy Now" flow)
    useEffect(() => {
        if (items && items.length > 0) {
            cartEmptyShown.current = false
        }
    }, [items])

    const reviewOrder = async () => {
        try {
            setLoading(true)
            const response = await orderAPI.reviewOrder()
            setOrderReview(response.metadata)

            if (!response.metadata.valid) {
                message.error('Giỏ hàng có vấn đề! Vui lòng kiểm tra lại.')
                return
            }

            setCurrentStep(1)
        } catch (error) {
            message.error('Có lỗi xảy ra khi kiểm tra đơn hàng')
            console.error('Review order error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckout = async (values) => {
        try {
            setLoading(true)

            // Transform frontend fields to backend expected format
            let shippingAddressData

            if (selectedAddressType === 'custom') {
                // Custom address - send full data to backend
                shippingAddressData = {
                    full_name: values.shipping_address.name,
                    phone: values.shipping_address.phone,
                    address_line: values.shipping_address.address_line,
                    province_id: values.shipping_address.location.province_id,
                    ward_id: values.shipping_address.location.ward_id,
                }
            } else {
                // Existing address - just send address_id
                shippingAddressData = {
                    address_id: selectedAddressType,
                }
            }

            const checkoutData = {
                shipping_address: shippingAddressData,
                customer_note: values.customer_note || '',
                payment_method: paymentMethod,
                // Note: Shipping provider will be handled by admin
                // Note: Coupon will be processed from cart data in backend
            }

            const response = await orderAPI.checkout(checkoutData)

            // Lấy order data từ response
            const order = response.metadata.order

            if (paymentMethod === 'sepay_qr') {
                // QR Payment: Đơn hàng đã tạo với payment_status = "pending"
                // Redirect đến trang thanh toán chuyên dụng
                message.success(
                    'Đơn hàng đã được tạo! Chuyển đến trang thanh toán...'
                )
                navigate(`/payment/${order.order_number}`)
            } else {
                // COD: Đơn hàng tạo thành công, không cần thanh toán trước
                if (!checkoutSuccessShown.current) {
                    message.success('Đặt hàng thành công!')
                    checkoutSuccessShown.current = true
                }
                navigate(`/order-success/${order.order_number}`)
            }
        } catch (error) {
            console.error('Checkout error:', error)

            if (error.response?.status === 401) {
                message.error(
                    'Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.'
                )
            } else {
                message.error(error.message || 'Có lỗi xảy ra khi đặt hàng')
            }
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price) => {
        const numPrice = typeof price === 'object' ? 0 : price || 0
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(numPrice)
    }

    const steps = [
        {
            title: 'Giỏ hàng',
            icon: <ShoppingCartOutlined />,
        },
        {
            title: 'Thông tin giao hàng',
            icon: <EnvironmentOutlined />,
        },
        {
            title: 'Xác nhận đặt hàng',
            icon: <CreditCardOutlined />,
        },
    ]

    if (cartLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Đang tải giỏ hàng...</div>
            </div>
        )
    }

    if (!items || items.length === 0) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <Empty
                    description="Giỏ hàng trống"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <Button type="primary" onClick={() => navigate('/shop')}>
                    Tiếp tục mua sắm
                </Button>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2}>Thanh toán</Title>

            <Steps
                current={currentStep}
                items={steps}
                style={{ marginBottom: 30 }}
            />

            <Row gutter={[24, 24]}>
                {/* Main Content */}
                <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                    {currentStep === 0 && (
                        <Card
                            title="Kiểm tra giỏ hàng"
                            style={{ marginBottom: 20 }}
                        >
                            <Space
                                direction="vertical"
                                style={{ width: '100%' }}
                            >
                                {items.map((item) => (
                                    <div
                                        key={item.variant_sku}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 16,
                                            border: '1px solid #f0f0f0',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <img
                                            src={
                                                item.product_images
                                                    ?.thumbnail ||
                                                item.product_image ||
                                                '/placeholder.jpg'
                                            }
                                            alt={item.product_name}
                                            style={{
                                                width: 60,
                                                height: 60,
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                marginRight: 16,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>
                                                {item.product_name}
                                            </div>
                                            <div
                                                style={{
                                                    color: '#666',
                                                    fontSize: 14,
                                                }}
                                            >
                                                {item.variant_color} -{' '}
                                                {item.variant_size}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div>Số lượng: {item.quantity}</div>
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    color: '#1890ff',
                                                }}
                                            >
                                                {formatPrice(item.price)}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={reviewOrder}
                                    loading={loading}
                                    style={{ marginTop: 20 }}
                                >
                                    Tiếp tục
                                </Button>
                            </Space>
                        </Card>
                    )}

                    {currentStep === 1 && (
                        <Card title="Thông tin giao hàng">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleCheckout}
                            >
                                {/* Hiển thị địa chỉ từ profile nếu có */}
                                {addresses && addresses.length > 0 ? (
                                    <Form.Item label="Chọn địa chỉ giao hàng">
                                        <div
                                            style={{
                                                padding: '12px',
                                                backgroundColor: '#f0f9ff',
                                                border: '1px solid #bfdbfe',
                                                borderRadius: '8px',
                                                marginBottom: '16px',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#0369a1',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                ✅ Sử dụng địa chỉ có sẵn từ
                                                profile của bạn
                                            </Text>
                                        </div>

                                        <Radio.Group
                                            onChange={(e) => {
                                                const value = e.target.value
                                                setSelectedAddressType(value)

                                                if (value === 'custom') {
                                                    // Clear form when selecting custom
                                                    form.setFieldsValue({
                                                        shipping_address: {
                                                            name:
                                                                user?.name ||
                                                                '',
                                                            phone:
                                                                user?.phone ||
                                                                '',
                                                            address_line: '',
                                                            location: {
                                                                province_id:
                                                                    null,
                                                                province: '',
                                                                ward_id: null,
                                                                ward: '',
                                                            },
                                                        },
                                                    })
                                                } else {
                                                    // Fill form with selected address
                                                    const selectedAddress =
                                                        addresses.find(
                                                            (addr) =>
                                                                addr._id ===
                                                                value
                                                        )
                                                    if (selectedAddress) {
                                                        form.setFieldsValue({
                                                            shipping_address: {
                                                                name:
                                                                    selectedAddress.full_name ||
                                                                    selectedAddress.name,
                                                                phone: selectedAddress.phone,
                                                                address_line:
                                                                    selectedAddress.address_line,
                                                                location: {
                                                                    province_id:
                                                                        selectedAddress
                                                                            .province
                                                                            ?.id,
                                                                    province:
                                                                        selectedAddress
                                                                            .province
                                                                            ?.name,
                                                                    ward_id:
                                                                        selectedAddress
                                                                            .ward
                                                                            ?.id,
                                                                    ward: selectedAddress
                                                                        .ward
                                                                        ?.name,
                                                                },
                                                            },
                                                        })
                                                    }
                                                }
                                            }}
                                            value={selectedAddressType}
                                            style={{ width: '100%' }}
                                        >
                                            {addresses.map((address) => (
                                                <Radio
                                                    key={address._id}
                                                    value={address._id}
                                                    style={{
                                                        display: 'block',
                                                        marginBottom: 12,
                                                        padding: '12px',
                                                        border:
                                                            selectedAddressType ===
                                                            address._id
                                                                ? '2px solid #1890ff'
                                                                : '1px solid #d9d9d9',
                                                        borderRadius: '8px',
                                                        backgroundColor:
                                                            selectedAddressType ===
                                                            address._id
                                                                ? '#f6ffed'
                                                                : 'white',
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            <strong
                                                                style={{
                                                                    marginRight: 8,
                                                                }}
                                                            >
                                                                {address.full_name ||
                                                                    address.name}
                                                            </strong>
                                                            <Text type="secondary">
                                                                -{' '}
                                                                {address.phone}
                                                            </Text>
                                                            {address.is_default && (
                                                                <Tag
                                                                    color="green"
                                                                    style={{
                                                                        marginLeft: 8,
                                                                    }}
                                                                >
                                                                    Mặc định
                                                                </Tag>
                                                            )}
                                                        </div>
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                fontSize: 14,
                                                            }}
                                                        >
                                                            📍{' '}
                                                            {
                                                                address.address_line
                                                            }
                                                            <br />
                                                            {typeof address.ward ===
                                                            'object'
                                                                ? address.ward
                                                                      ?.name
                                                                : address.ward}
                                                            ,{' '}
                                                            {typeof address.province ===
                                                            'object'
                                                                ? address
                                                                      .province
                                                                      ?.name
                                                                : address.province}
                                                        </Text>
                                                    </div>
                                                </Radio>
                                            ))}

                                            <Radio
                                                value="custom"
                                                style={{
                                                    marginTop: 16,
                                                    padding: '12px',
                                                    border:
                                                        selectedAddressType ===
                                                        'custom'
                                                            ? '2px solid #1890ff'
                                                            : '1px solid #d9d9d9',
                                                    borderRadius: '8px',
                                                    backgroundColor:
                                                        selectedAddressType ===
                                                        'custom'
                                                            ? '#f6ffed'
                                                            : 'white',
                                                    display: 'block',
                                                }}
                                            >
                                                <div>
                                                    <strong
                                                        style={{
                                                            color: '#fa8c16',
                                                        }}
                                                    >
                                                        🏠 Nhập địa chỉ mới
                                                    </strong>
                                                    <br />
                                                    <Text
                                                        type="secondary"
                                                        style={{ fontSize: 13 }}
                                                    >
                                                        Nhập thông tin giao hàng
                                                        khác với địa chỉ có sẵn
                                                    </Text>
                                                </div>
                                            </Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                ) : (
                                    /* Nếu user chưa có địa chỉ nào trong profile */
                                    <div
                                        style={{
                                            padding: '16px',
                                            backgroundColor: '#fff7e6',
                                            border: '1px solid #ffd591',
                                            borderRadius: '8px',
                                            marginBottom: '16px',
                                        }}
                                    >
                                        <Text style={{ color: '#d48806' }}>
                                            📍 Bạn chưa có địa chỉ nào được lưu
                                            trong profile. Vui lòng nhập thông
                                            tin giao hàng bên dưới.
                                        </Text>
                                    </div>
                                )}

                                {/* Hiển thị form nhập địa chỉ khi chọn custom hoặc chưa có địa chỉ */}
                                {(selectedAddressType === 'custom' ||
                                    !addresses ||
                                    addresses.length === 0) && (
                                    <div
                                        style={{
                                            marginTop: '20px',
                                            padding: '20px',
                                            backgroundColor: '#fafafa',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <Title
                                            level={5}
                                            style={{
                                                color: '#fa8c16',
                                                marginBottom: 16,
                                            }}
                                        >
                                            📝 Nhập thông tin giao hàng mới
                                        </Title>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Họ và tên"
                                                    name={[
                                                        'shipping_address',
                                                        'name',
                                                    ]}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                'Vui lòng nhập họ tên',
                                                        },
                                                    ]}
                                                >
                                                    <Input placeholder="Nhập họ và tên" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Số điện thoại"
                                                    name={[
                                                        'shipping_address',
                                                        'phone',
                                                    ]}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            pattern:
                                                                /^(0[3|5|7|8|9])+([0-9]{8})$/,
                                                            message:
                                                                'Vui lòng nhập số điện thoại hợp lệ',
                                                        },
                                                    ]}
                                                >
                                                    <Input placeholder="VD: 0912345678" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            label="Địa chỉ cụ thể"
                                            name={[
                                                'shipping_address',
                                                'address_line',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Vui lòng nhập địa chỉ',
                                                },
                                            ]}
                                        >
                                            <Input placeholder="VD: 123 Nguyễn Văn A, Phường B" />
                                        </Form.Item>

                                        <Form.Item
                                            label="Tỉnh/Thành phố và Phường/Xã"
                                            name={[
                                                'shipping_address',
                                                'location',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    validator: (_, value) => {
                                                        if (
                                                            !value?.province_id ||
                                                            !value?.ward_id
                                                        ) {
                                                            return Promise.reject(
                                                                'Vui lòng chọn đầy đủ tỉnh/thành phố và phường/xã'
                                                            )
                                                        }
                                                        return Promise.resolve()
                                                    },
                                                },
                                            ]}
                                        >
                                            <AddressSelector />
                                        </Form.Item>

                                        <div
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#fff7e6',
                                                border: '1px solid #ffd591',
                                                borderRadius: '6px',
                                                marginTop: 12,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: '#d48806',
                                                }}
                                            >
                                                💡 Tip: Bạn có thể lưu địa chỉ
                                                này vào profile để sử dụng cho
                                                lần đặt hàng sau
                                            </Text>
                                        </div>
                                    </div>
                                )}

                                {/* Shipping info note */}
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        backgroundColor: '#f6ffed',
                                        border: '1px solid #b7eb8f',
                                        borderRadius: '6px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: '14px',
                                            color: '#52c41a',
                                        }}
                                    >
                                        📦 Đơn vị vận chuyển và phí ship sẽ được
                                        xác nhận bởi shop sau khi đặt hàng
                                    </Text>
                                </div>

                                {/* Payment Method Selection */}
                                <Form.Item label="Phương thức thanh toán">
                                    <Radio.Group
                                        value={paymentMethod}
                                        onChange={(e) =>
                                            setPaymentMethod(e.target.value)
                                        }
                                        style={{ width: '100%' }}
                                    >
                                        <Radio
                                            value="cod"
                                            style={{
                                                display: 'block',
                                                padding: '12px',
                                                border:
                                                    paymentMethod === 'cod'
                                                        ? '2px solid #52c41a'
                                                        : '1px solid #d9d9d9',
                                                borderRadius: '8px',
                                                backgroundColor:
                                                    paymentMethod === 'cod'
                                                        ? '#f6ffed'
                                                        : 'white',
                                                marginBottom: 12,
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    <CheckCircleOutlined
                                                        style={{
                                                            color: '#52c41a',
                                                            marginRight: 8,
                                                        }}
                                                    />
                                                    <strong>
                                                        Thanh toán khi nhận hàng
                                                        (COD)
                                                    </strong>
                                                    <Tag
                                                        color="green"
                                                        style={{
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        Phổ biến
                                                    </Tag>
                                                </div>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#666',
                                                    }}
                                                >
                                                    Thanh toán khi nhận hàng
                                                </Text>
                                            </div>
                                        </Radio>

                                        <Radio
                                            value="sepay_qr"
                                            style={{
                                                display: 'block',
                                                padding: '12px',
                                                border:
                                                    paymentMethod === 'sepay_qr'
                                                        ? '2px solid #1890ff'
                                                        : '1px solid #d9d9d9',
                                                borderRadius: '8px',
                                                backgroundColor:
                                                    paymentMethod === 'sepay_qr'
                                                        ? '#f0f9ff'
                                                        : 'white',
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    <QrcodeOutlined
                                                        style={{
                                                            color: '#1890ff',
                                                            marginRight: 8,
                                                        }}
                                                    />
                                                    <strong>
                                                        Chuyển khoản qua QR Code
                                                    </strong>
                                                    <Tag
                                                        color="blue"
                                                        style={{
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        Nhanh chóng
                                                    </Tag>
                                                </div>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#666',
                                                    }}
                                                >
                                                    Thanh toán ngay bằng mã QR,
                                                    đơn hàng được xử lý nhanh
                                                    hơn
                                                </Text>
                                            </div>
                                        </Radio>
                                    </Radio.Group>
                                </Form.Item>

                                <Form.Item
                                    label="Ghi chú đơn hàng"
                                    name="customer_note"
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Ghi chú cho người bán (không bắt buộc)"
                                    />
                                </Form.Item>

                                <Space>
                                    <Button onClick={() => setCurrentStep(0)}>
                                        Quay lại
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                    >
                                        Đặt hàng
                                    </Button>
                                </Space>
                            </Form>
                        </Card>
                    )}
                </Col>

                {/* Order Summary Sidebar */}
                <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    {/* Shipping Address Summary */}
                    {user && (
                        <Card
                            title={
                                <>
                                    <EnvironmentOutlined /> Thông tin giao hàng
                                </>
                            }
                            style={{ marginBottom: 20 }}
                        >
                            {addresses && addresses.length > 0 ? (
                                <div>
                                    {(() => {
                                        const defaultAddress =
                                            addresses.find(
                                                (addr) => addr.is_default
                                            ) || addresses[0]
                                        return (
                                            <Space
                                                direction="vertical"
                                                style={{ width: '100%' }}
                                            >
                                                <div>
                                                    <Text strong>
                                                        {defaultAddress.full_name ||
                                                            defaultAddress.name ||
                                                            user.name}
                                                    </Text>
                                                    {defaultAddress.is_default && (
                                                        <Tag
                                                            color="blue"
                                                            style={{
                                                                marginLeft: 8,
                                                            }}
                                                        >
                                                            Mặc định
                                                        </Tag>
                                                    )}
                                                </div>
                                                {defaultAddress.phone && (
                                                    <Text>
                                                        <PhoneOutlined />{' '}
                                                        {defaultAddress.phone}
                                                    </Text>
                                                )}
                                                {defaultAddress.address_line && (
                                                    <Text>
                                                        <HomeOutlined />{' '}
                                                        {
                                                            defaultAddress.address_line
                                                        }
                                                    </Text>
                                                )}
                                                <Text type="secondary">
                                                    <EnvironmentOutlined />{' '}
                                                    {typeof defaultAddress.ward ===
                                                    'object'
                                                        ? defaultAddress.ward
                                                              ?.name
                                                        : defaultAddress.ward}
                                                    ,{' '}
                                                    {typeof defaultAddress.province ===
                                                    'object'
                                                        ? defaultAddress
                                                              .province?.name
                                                        : defaultAddress.province}
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#999',
                                                    }}
                                                >
                                                    💡 Bạn có thể thay đổi địa
                                                    chỉ giao hàng ở bước tiếp
                                                    theo
                                                </Text>
                                            </Space>
                                        )
                                    })()}
                                </div>
                            ) : (
                                <div>
                                    <Text strong>{user.name}</Text>
                                    {user.phone && (
                                        <div>
                                            <Text>
                                                <PhoneOutlined /> {user.phone}
                                            </Text>
                                        </div>
                                    )}
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            marginTop: 8,
                                            display: 'block',
                                        }}
                                    >
                                        Bạn chưa có địa chỉ mặc định. Vui lòng
                                        nhập thông tin giao hàng ở bước tiếp
                                        theo.
                                    </Text>
                                </div>
                            )}
                        </Card>
                    )}

                    <Card
                        title="Tóm tắt đơn hàng"
                        style={{ position: 'sticky', top: 20 }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Text>Tạm tính:</Text>
                                <Text>{formatPrice(subtotal)}</Text>
                            </div>

                            {orderReview && (
                                <>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Text>Phí vận chuyển:</Text>
                                        <Text
                                            style={{
                                                color: '#666',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {orderReview.order_summary
                                                .shipping_fee
                                                ? formatPrice(
                                                      orderReview.order_summary
                                                          .shipping_fee
                                                  )
                                                : 'Sẽ được xác nhận'}
                                        </Text>
                                    </div>

                                    {orderReview.order_summary.discount > 0 && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Text>Giảm giá:</Text>
                                            <Text style={{ color: '#52c41a' }}>
                                                -
                                                {formatPrice(
                                                    orderReview.order_summary
                                                        .discount
                                                )}
                                            </Text>
                                        </div>
                                    )}
                                </>
                            )}

                            <Divider style={{ margin: '12px 0' }} />

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Title level={5}>Tổng cộng:</Title>
                                <Title level={5} style={{ color: '#1890ff' }}>
                                    {formatPrice(
                                        orderReview?.order_summary?.total ||
                                            total
                                    )}
                                </Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Checkout
