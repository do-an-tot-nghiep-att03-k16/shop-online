import React, { useState, useEffect, useRef } from 'react'
import { 
    Card, 
    Button, 
    Typography, 
    Space, 
    Divider, 
    Tag, 
    Spin, 
    message,
    Modal,
    Steps,
    Tooltip,
    Image,
    Alert,
    Progress
} from 'antd'
import { 
    QrcodeOutlined,
    BankOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    CloseCircleOutlined
} from '@ant-design/icons'
import { paymentAPI } from '../../services/api'

const { Title, Text, Paragraph } = Typography

const SepayQRPayment = ({ 
    order_id, 
    amount, 
    order_info, 
    onPaymentSuccess, 
    onPaymentCancel,
    visible,
    onClose 
}) => {
    const [loading, setLoading] = useState(false)
    const [qrData, setQrData] = useState(null)
    const [paymentStatus, setPaymentStatus] = useState('pending') // pending, checking, completed, failed, expired
    const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
    const [checkingPayment, setCheckingPayment] = useState(false)
    
    const intervalRef = useRef(null)
    const timeoutRef = useRef(null)

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

    // Tạo QR code thanh toán
    const createQRPayment = async () => {
        try {
            setLoading(true)
            const response = await paymentAPI.createSepayQR({
                order_id, // Này là order_number từ đơn hàng đã tạo
                amount,
                order_info: order_info || `Thanh toán đơn hàng ${order_id}`
            })

            setQrData(response.metadata)
            setPaymentStatus('pending')
            startPaymentMonitoring()
            
        } catch (error) {
            console.error('Create QR error:', error)
            message.error('Không thể tạo mã QR thanh toán')
            setPaymentStatus('failed')
        } finally {
            setLoading(false)
        }
    }

    // Bắt đầu theo dõi thanh toán
    const startPaymentMonitoring = () => {
        // Timer đếm ngược
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setPaymentStatus('expired')
                    stopPaymentMonitoring()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Auto check payment status
        timeoutRef.current = setInterval(async () => {
            if (paymentStatus === 'pending') {
                await checkPaymentStatus()
            }
        }, 5000) // Check mỗi 5 giây
    }

    // Dừng theo dõi
    const stopPaymentMonitoring = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        if (timeoutRef.current) {
            clearInterval(timeoutRef.current)
            timeoutRef.current = null
        }
    }

    // Kiểm tra trạng thái thanh toán
    const checkPaymentStatus = async () => {
        if (checkingPayment) return
        
        try {
            setCheckingPayment(true)
            const response = await paymentAPI.checkSepayStatus(order_id)
            const { status } = response.metadata

            if (status === 'completed') {
                setPaymentStatus('completed')
                stopPaymentMonitoring()
                // ✅ REMOVED: Duplicate success message (Payment.jsx SSE already shows this)
                // message.success('Thanh toán thành công!')
                
                // Gọi callback
                setTimeout(() => {
                    onPaymentSuccess && onPaymentSuccess(response.metadata)
                }, 1000)
            }

        } catch (error) {
            // Không hiển thị error vì có thể là do chưa có payment
            console.log('Check payment status:', error.message)
        } finally {
            setCheckingPayment(false)
        }
    }

    // Hủy thanh toán
    const cancelPayment = async () => {
        try {
            await paymentAPI.cancelSepayPayment({ order_id })
            setPaymentStatus('cancelled')
            stopPaymentMonitoring()
            message.info('Đã hủy thanh toán')
            onPaymentCancel && onPaymentCancel()
        } catch (error) {
            message.error('Không thể hủy thanh toán')
        }
    }

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Cleanup khi unmount
    useEffect(() => {
        return () => {
            stopPaymentMonitoring()
        }
    }, [])

    // Tự động tạo QR khi modal mở
    useEffect(() => {
        if (visible && !qrData) {
            createQRPayment()
        }
    }, [visible])

    const renderQRSection = () => (
        <div style={{ textAlign: 'center' }}>
            <Title level={4}>
                <QrcodeOutlined /> Quét mã QR để thanh toán
            </Title>
            
            {qrData?.qr_url && (
                <div style={{ 
                    padding: 20, 
                    backgroundColor: '#fff',
                    border: '2px solid #1890ff',
                    borderRadius: 12,
                    display: 'inline-block',
                    margin: '20px 0'
                }}>
                    <Image
                        src={qrData.qr_url}
                        alt="QR Code Thanh toán"
                        width={200}
                        height={200}
                        style={{ borderRadius: 8 }}
                    />
                </div>
            )}

            <div style={{ 
                padding: '16px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 8,
                margin: '16px 0'
            }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                    Số tiền: {formatPrice(amount)}
                </Text>
            </div>

            {paymentStatus === 'pending' && (
                <div style={{ margin: '16px 0' }}>
                    <div style={{ marginBottom: 8 }}>
                        <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                        <Text style={{ marginLeft: 8 }}>
                            Thời gian còn lại: <strong style={{ color: '#fa8c16' }}>{formatTime(timeLeft)}</strong>
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
        </div>
    )

    const renderBankInfo = () => (
        <Card 
            title={<><BankOutlined /> Thông tin chuyển khoản</>}
            size="small"
            style={{ marginTop: 16 }}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Ngân hàng:</Text>
                    <Text strong>{qrData?.bank_info?.bank_name}</Text>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Số tài khoản:</Text>
                    <div>
                        <Text strong style={{ marginRight: 8 }}>
                            {qrData?.bank_info?.account_number}
                        </Text>
                        <Tooltip title="Copy số tài khoản">
                            <Button 
                                type="text" 
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(qrData.bank_info.account_number, 'số tài khoản')}
                            />
                        </Tooltip>
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Chủ tài khoản:</Text>
                    <Text strong>{qrData?.bank_info?.account_name}</Text>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                    <Text>Nội dung chuyển khoản:</Text>
                    <div style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#fff7e6',
                        border: '1px solid #ffd591',
                        borderRadius: 4,
                        marginTop: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text strong style={{ color: '#d48806' }}>
                            {qrData?.transfer_content}
                        </Text>
                        <Tooltip title="Copy nội dung">
                            <Button 
                                type="text" 
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(qrData.transfer_content, 'nội dung chuyển khoản')}
                            />
                        </Tooltip>
                    </div>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                        ⚠️ Vui lòng chuyển khoản đúng nội dung để được xử lý tự động
                    </Text>
                </div>
            </Space>
        </Card>
    )

    const renderStatusAlert = () => {
        const statusConfig = {
            pending: {
                type: 'info',
                message: 'Đang chờ thanh toán',
                description: 'Vui lòng quét mã QR hoặc chuyển khoản theo thông tin trên',
                icon: <ClockCircleOutlined />
            },
            completed: {
                type: 'success',
                message: 'Thanh toán thành công!',
                description: 'Đơn hàng của bạn đã được xác nhận và sẽ được xử lý sớm nhất',
                icon: <CheckCircleOutlined />
            },
            expired: {
                type: 'error',
                message: 'Mã QR đã hết hạn',
                description: 'Vui lòng tạo mã QR mới để tiếp tục thanh toán',
                icon: <CloseCircleOutlined />
            },
            failed: {
                type: 'error',
                message: 'Có lỗi xảy ra',
                description: 'Không thể tạo mã thanh toán, vui lòng thử lại',
                icon: <CloseCircleOutlined />
            }
        }

        const config = statusConfig[paymentStatus] || statusConfig.pending

        return (
            <Alert
                type={config.type}
                message={config.message}
                description={config.description}
                icon={config.icon}
                showIcon
                style={{ marginBottom: 16 }}
            />
        )
    }

    return (
        <Modal
            title="Thanh toán bằng QR Code"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={500}
            destroyOnClose
        >
            <div style={{ padding: '16px 0' }}>
                {renderStatusAlert()}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>Đang tạo mã QR thanh toán...</div>
                    </div>
                ) : (
                    <>
                        {qrData && paymentStatus !== 'failed' && (
                            <>
                                {renderQRSection()}
                                {renderBankInfo()}
                            </>
                        )}

                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                            <Space size="middle">
                                {paymentStatus === 'pending' && (
                                    <>
                                        <Button 
                                            icon={<ReloadOutlined />}
                                            onClick={checkPaymentStatus}
                                            loading={checkingPayment}
                                        >
                                            Kiểm tra thanh toán
                                        </Button>
                                        <Button onClick={cancelPayment}>
                                            Hủy thanh toán
                                        </Button>
                                    </>
                                )}

                                {paymentStatus === 'expired' && (
                                    <Button 
                                        type="primary"
                                        icon={<ReloadOutlined />}
                                        onClick={createQRPayment}
                                        loading={loading}
                                    >
                                        Tạo mã QR mới
                                    </Button>
                                )}

                                {paymentStatus === 'failed' && (
                                    <Button 
                                        type="primary"
                                        icon={<ReloadOutlined />}
                                        onClick={createQRPayment}
                                        loading={loading}
                                    >
                                        Thử lại
                                    </Button>
                                )}

                                {paymentStatus === 'completed' && (
                                    <Button type="primary" onClick={onClose}>
                                        Đóng
                                    </Button>
                                )}
                            </Space>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}

export default SepayQRPayment