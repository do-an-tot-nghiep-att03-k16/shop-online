import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
    Card, 
    Typography, 
    Space, 
    Divider, 
    Button, 
    Spin, 
    Alert,
    Row,
    Col,
    Tag,
    Image,
    Progress,
    Tooltip,
    Modal,
    message
} from 'antd'
import { 
    QrcodeOutlined,
    BankOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    ArrowLeftOutlined,
    HomeOutlined
} from '@ant-design/icons'
import { orderAPI, paymentAPI } from '../services/api'
import { useRealtimeSubscription } from '../services/supabaseRealtimeService'
import { paymentSSEService } from '../services/paymentSSEService'

const { Title, Text } = Typography

// Thông tin ngân hàng Sepay
const SEPAY_INFO = {
    account_code: 'VQRQAGBEN4802',
    bank: 'MBBank',
    account_name: 'NGUYEN VAN A'
}

const Payment = () => {
    const { orderNumber } = useParams()
    const navigate = useNavigate()
    
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState(null)
    const [error, setError] = useState(null)
    const [timeLeft, setTimeLeft] = useState(() => {
        // Khôi phục timer từ localStorage nếu có
        const saved = localStorage.getItem(`timer_${orderNumber}`)
        if (saved) {
            const { endTime } = JSON.parse(saved)
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
            return remaining
        }
        return 15 * 60 // 15 minutes default
    })
    const [paymentStatus, setPaymentStatus] = useState('pending')
    const [checkingPayment, setCheckingPayment] = useState(false)
    const [realtimeSubscription, setRealtimeSubscription] = useState(null)
    const [isSSEConnected, setIsSSEConnected] = useState(false)

    // Load order data
    useEffect(() => {
        const loadOrderData = async () => {
            try {
                setLoading(true)
                const response = await orderAPI.getOrderByNumber(orderNumber)
                const orderData = response.metadata
                
                // Kiểm tra order có tồn tại và là QR payment
                if (!orderData) {
                    setError('Đơn hàng không tồn tại')
                    return
                }
                
                if (orderData.payment_method !== 'sepay_qr') {
                    setError('Đơn hàng này không sử dụng thanh toán QR')
                    return
                }
                
                // Nếu đã thanh toán rồi → redirect order success
                if (orderData.payment_status === 'paid') {
                    message.success('Đơn hàng đã được thanh toán!')
                    navigate(`/order-success/${orderNumber}`)
                    return
                }
                
                setOrder(orderData)
                setPaymentStatus(orderData.payment_status || 'pending')
                
            } catch (err) {
                console.error('Load order error:', err)
                setError(err.message || 'Không thể tải thông tin đơn hàng')
            } finally {
                setLoading(false)
            }
        }
        
        if (orderNumber) {
            loadOrderData()
        }
    }, [orderNumber, navigate])

    // Timer đếm ngược với localStorage persistence
    useEffect(() => {
        if (paymentStatus !== 'pending') return

        // Lưu endTime vào localStorage khi bắt đầu timer
        const endTime = Date.now() + (timeLeft * 1000)
        localStorage.setItem(`timer_${orderNumber}`, JSON.stringify({ endTime }))

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
            setTimeLeft(remaining)
            
            if (remaining <= 0) {
                setPaymentStatus('expired')
                localStorage.removeItem(`timer_${orderNumber}`)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [paymentStatus, orderNumber])

    // Setup Payment SSE subscription - ✅ NEW SSE PAYMENT SYSTEM
    useEffect(() => {
        if (!order || paymentStatus !== 'pending') return

        // console.log('📡 Setting up payment SSE subscription for order:', order.order_number)

        // Subscribe tới SSE endpoint từ backend
        const subscription = paymentSSEService.subscribeToPaymentEvents(
            order.order_number,
            {
                onPaymentCompleted: (paymentData) => {
                    // console.log('✅ Payment completed via SSE!', paymentData)
                    setPaymentStatus('completed')
                    
                    // Clear timer từ localStorage
                    localStorage.removeItem(`timer_${orderNumber}`)
                    
                    // Update order with payment info
                    setOrder(prev => ({
                        ...prev,
                        payment_status: 'paid',
                        payment_details: {
                            ...prev.payment_details,
                            transaction_id: paymentData.transaction_id || paymentData.sepay_transaction_id,
                            transaction_code: paymentData.transaction_code,
                            amount: paymentData.amount || paymentData.received_amount,
                            paid_at: paymentData.transaction_date || paymentData.timestamp
                        }
                    }))
                    
                    // Show success message và redirect
                    message.success('🎉 Thanh toán thành công! Đang chuyển hướng...', 3)
                    
                    setTimeout(() => {
                        navigate(`/order-success/${order.order_number}`)
                    }, 2000)
                },
                
                onPaymentFailed: (paymentData) => {
                    console.log('❌ Payment failed via SSE:', paymentData)
                    message.error(`Thanh toán thất bại: ${paymentData.webhook_data?.reason || 'Lỗi không xác định'}`)
                    setPaymentStatus('failed')
                },
                
                onPaymentUpdate: (paymentData) => {
                    // console.log('🔄 Payment update via SSE:', paymentData)
                    // Có thể hiển thị thông tin update nếu cần
                    message.info(`Đang xử lý thanh toán: ${paymentData.payment_status}`, 2)
                },
                
                onConnected: () => {
                    // ✅ REMOVED: Duplicate connection success messages
                    setIsSSEConnected(true)
                },
                
                onError: (error) => {
                    console.error('❌ Payment SSE error:', error)
                    message.warning('Kết nối realtime gặp sự cố. Kiểm tra thủ công nếu cần...', 3)
                },
                
                onConnectionLost: () => {
                    // console.warn('⚠️ SSE connection lost, attempting to reconnect...')
                    message.warning('Mất kết nối realtime, đang thử kết nối lại...', 2)
                }
            }
        )

        setRealtimeSubscription(subscription)

        // Cleanup function
        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                // console.log('🧹 Cleaning up payment SSE subscription for order:', order.order_number)
                subscription.unsubscribe()
            }
        }
    }, [order, paymentStatus, navigate])

    // ✅ REMOVED: Fallback polling - Không cần thiết vì đã có Payment WebSocket
    // Payment realtime WebSocket sẽ tự động nhận thông báo ngay lập tức khi backend confirm
    // Chỉ giữ manual check button cho trường hợp emergency

    // Cleanup realtime subscription khi component unmount
    useEffect(() => {
        return () => {
            if (realtimeSubscription && typeof realtimeSubscription.unsubscribe === 'function') {
                // console.log('🧹 Component unmounting, cleaning up realtime subscription...')
                realtimeSubscription.unsubscribe()
            }
        }
    }, [realtimeSubscription])

    // Kiểm tra trạng thái thanh toán (fallback method)
    const checkPaymentStatus = async () => {
        if (checkingPayment || !order) return
        
        try {
            setCheckingPayment(true)
            const response = await paymentAPI.checkSepayStatus(order.order_number)
            
            if (response.metadata.status === 'completed') {
                // console.log('✅ Payment confirmed via API fallback!')
                setPaymentStatus('completed')
                // ✅ REMOVED: Duplicate success message (SSE already shows this)
                // message.success('Thanh toán thành công!')
                
                // Redirect sau 2 giây
                setTimeout(() => {
                    navigate(`/order-success/${order.order_number}`)
                }, 2000)
            }
            
        } catch (error) {
            // Không hiển thị error vì có thể là do chưa có payment
        } finally {
            setCheckingPayment(false)
        }
    }

    // Format tiền VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price)
    }

    // Copy text to clipboard
    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            message.success(`Đã copy ${label}!`)
        })
    }

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Tạo nội dung chuyển khoản
    const transferContent = `DH ${orderNumber}`

    // Tạo QR URL
    const generateQRUrl = () => {
        if (!order) return ''
        
        const { account_code, bank } = SEPAY_INFO
        const description = encodeURIComponent(transferContent)
        
        return `https://qr.sepay.vn/img?acc=${account_code}&bank=${bank}&amount=${order.total}&des=${description}`
    }

    // Xác nhận thanh toán thủ công
    const handleManualConfirm = () => {
        Modal.confirm({
            title: 'Xác nhận thanh toán',
            content: 'Bạn đã hoàn tất việc chuyển khoản chưa? Shop sẽ xác minh và xử lý đơn hàng của bạn.',
            okText: 'Đã thanh toán',
            cancelText: 'Chưa',
            onOk: () => {
                message.success('Cảm ơn bạn! Đơn hàng sẽ được xử lý sau khi shop xác nhận thanh toán.')
                navigate(`/order-success/${order.order_number}`)
            }
        })
    }

    // Hủy thanh toán
    const handleCancelPayment = () => {
        Modal.confirm({
            title: 'Hủy thanh toán?',
            content: 'Bạn có chắc muốn hủy thanh toán? Đơn hàng vẫn sẽ được giữ để bạn thanh toán sau.',
            okText: 'Hủy thanh toán',
            cancelText: 'Tiếp tục',
            onOk: () => {
                navigate(`/my-orders`)
            }
        })
    }

    // Reset timer
    const resetTimer = () => {
        setTimeLeft(15 * 60)
        setPaymentStatus('pending')
    }

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '50vh',
                flexDirection: 'column'
            }}>
                <Spin size="large" />
                <Text style={{ marginTop: 16 }}>Đang tải thông tin thanh toán...</Text>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
                <Alert
                    message="Có lỗi xảy ra"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                    <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
                        Về trang chủ
                    </Button>
                </Space>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: 800, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/my-orders')}
                    style={{ marginBottom: 16 }}
                >
                    Quay lại đơn hàng
                </Button>
                
                <Title level={2}>
                    <QrcodeOutlined /> Thanh toán đơn hàng {orderNumber}
                </Title>
            </div>

            <Row gutter={[24, 24]}>
                {/* Main Payment Area */}
                <Col xs={24} md={14}>
                    {/* Status Alert */}
                    {paymentStatus === 'pending' && (
                        <Alert
                            type="info"
                            message={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    Đang chờ thanh toán
                                    {realtimeSubscription && (
                                        <Tag color="blue" size="small">
                                            {/* ✅ REMOVED: SSE indicator from QR page */}
                                        </Tag>
                                    )}
                                </div>
                            }
                            description="Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới. Thanh toán sẽ được xác nhận tự động."
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}
                    
                    {paymentStatus === 'expired' && (
                        <Alert
                            type="warning"
                            message="Phiên thanh toán đã hết hạn"
                            description="Bạn vẫn có thể thanh toán, nhưng nên tạo mã QR mới"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}
                    
                    {paymentStatus === 'completed' && (
                        <Alert
                            type="success"
                            message="Thanh toán thành công!"
                            description="Đơn hàng của bạn đã được xác nhận và sẽ được xử lý"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    {/* QR Code Section */}
                    <Card title="Mã QR thanh toán" style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ 
                            padding: 20, 
                            backgroundColor: '#fff',
                            border: '2px solid #1890ff',
                            borderRadius: 12,
                            display: 'inline-block',
                            margin: '0 0 20px 0'
                        }}>
                            <Image
                                src={generateQRUrl()}
                                alt="QR Code Thanh toán"
                                width={240}
                                height={240}
                                style={{ borderRadius: 8 }}
                                fallback="/placeholder-qr.png"
                            />
                        </div>

                        <div style={{ 
                            padding: '16px',
                            backgroundColor: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: 8,
                            margin: '16px 0'
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                                Số tiền: {formatPrice(order?.total || 0)}
                            </Text>
                        </div>

                        {/* Timer */}
                        {paymentStatus === 'pending' && (
                            <div style={{ margin: '16px 0' }}>
                                <div style={{ marginBottom: 8 }}>
                                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                                    <Text style={{ marginLeft: 8 }}>
                                        Thời gian: <strong style={{ color: '#fa8c16' }}>{formatTime(timeLeft)}</strong>
                                    </Text>
                                </div>
                                <Progress 
                                    percent={(timeLeft / (15 * 60)) * 100} 
                                    showInfo={false}
                                    strokeColor="#1890ff"
                                    size="small"
                                />
                            </div>
                        )}
                    </Card>

                    {/* Bank Info */}
                    <Card 
                        title={<><BankOutlined /> Thông tin chuyển khoản</>}
                        style={{ marginBottom: 24 }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text>Ngân hàng:</Text>
                                <Text strong>{SEPAY_INFO.bank}</Text>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text>Mã tài khoản:</Text>
                                <div>
                                    <Text strong style={{ marginRight: 8 }}>
                                        {SEPAY_INFO.account_code}
                                    </Text>
                                    <Tooltip title="Copy mã tài khoản">
                                        <Button 
                                            type="text" 
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => copyToClipboard(SEPAY_INFO.account_code, 'mã tài khoản')}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text>Chủ tài khoản:</Text>
                                <Text strong>{SEPAY_INFO.account_name}</Text>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            <div>
                                <Text>Nội dung chuyển khoản:</Text>
                                <div style={{ 
                                    padding: '12px', 
                                    backgroundColor: '#fff7e6',
                                    border: '1px solid #ffd591',
                                    borderRadius: 6,
                                    marginTop: 8,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Text strong style={{ color: '#d48806' }}>
                                        {transferContent}
                                    </Text>
                                    <Tooltip title="Copy nội dung">
                                        <Button 
                                            type="text" 
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => copyToClipboard(transferContent, 'nội dung chuyển khoản')}
                                        />
                                    </Tooltip>
                                </div>
                                <Text style={{ fontSize: 12, color: '#666', marginTop: 8, display: 'block' }}>
                                    ⚠️ Vui lòng chuyển khoản đúng nội dung để được xử lý tự động
                                </Text>
                            </div>
                        </Space>
                    </Card>

                    {/* Action Buttons */}
                    <div style={{ textAlign: 'center' }}>
                        <Space size="middle">
                            {paymentStatus === 'pending' && (
                                <>
                                    <Button 
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        onClick={handleManualConfirm}
                                        size="large"
                                    >
                                        Đã thanh toán
                                    </Button>
                                    <Button 
                                        icon={<ReloadOutlined />}
                                        onClick={checkPaymentStatus}
                                        loading={checkingPayment}
                                        title="Emergency backup - WebSocket sẽ tự động cập nhật khi thanh toán thành công"
                                    >
                                        Kiểm tra thủ công
                                    </Button>
                                    <Button onClick={handleCancelPayment}>
                                        Hủy thanh toán
                                    </Button>
                                </>
                            )}

                            {paymentStatus === 'expired' && (
                                <Button 
                                    type="primary"
                                    icon={<ReloadOutlined />}
                                    onClick={resetTimer}
                                    size="large"
                                >
                                    Tạo mã QR mới
                                </Button>
                            )}

                            {paymentStatus === 'completed' && (
                                <Button 
                                    type="primary" 
                                    size="large"
                                    onClick={() => navigate(`/order-success/${order.order_number}`)}
                                >
                                    Xem đơn hàng
                                </Button>
                            )}
                        </Space>
                    </div>
                </Col>

                {/* Order Summary Sidebar */}
                <Col xs={24} md={10}>
                    <Card title="Thông tin đơn hàng" style={{ position: 'sticky', top: 20 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <Text strong>Mã đơn hàng:</Text>
                                <br />
                                <Text>{order?.order_number}</Text>
                            </div>
                            
                            <div>
                                <Text strong>Ngày tạo:</Text>
                                <br />
                                <Text>{new Date(order?.createdAt).toLocaleString('vi-VN')}</Text>
                            </div>

                            <div>
                                <Text strong>Phương thức thanh toán:</Text>
                                <br />
                                <Tag color="blue">Chuyển khoản QR</Tag>
                            </div>

                            <div>
                                <Text strong>Trạng thái thanh toán:</Text>
                                <br />
                                <Tag color={paymentStatus === 'pending' ? 'orange' : paymentStatus === 'completed' ? 'green' : 'red'}>
                                    {paymentStatus === 'pending' ? 'Chờ thanh toán' : 
                                     paymentStatus === 'completed' ? 'Đã thanh toán' : 'Hết hạn'}
                                </Tag>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Tạm tính:</Text>
                                <Text>{formatPrice(order?.subtotal || 0)}</Text>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Phí vận chuyển:</Text>
                                <Text>{formatPrice(order?.shipping_fee || 0)}</Text>
                            </div>
                            
                            {order?.discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Giảm giá:</Text>
                                    <Text style={{ color: '#52c41a' }}>
                                        -{formatPrice(order.discount)}
                                    </Text>
                                </div>
                            )}
                            
                            <Divider style={{ margin: '12px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Title level={5}>Tổng cộng:</Title>
                                <Title level={5} style={{ color: '#1890ff' }}>
                                    {formatPrice(order?.total || 0)}
                                </Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Payment