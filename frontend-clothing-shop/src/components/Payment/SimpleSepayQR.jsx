import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Typography,
    Space,
    Divider,
    Tag,
    Modal,
    Tooltip,
    Image,
    Alert,
    Progress,
    message,
} from 'antd'
import {
    QrcodeOutlined,
    BankOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

// Thông tin ngân hàng Sepay (có thể config trong env)
const SEPAY_INFO = {
    account_code: 'VQRQAGBEN4802',
    bank: 'MBBank',
    account_name: 'TRAN QUANG PHUC', // Tên hiển thị cho user
}

const SimpleSepayQR = ({
    order_id,
    amount,
    order_info,
    onPaymentSuccess,
    onPaymentCancel,
    visible,
    onClose,
}) => {
    const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
    const [paymentStatus, setPaymentStatus] = useState('pending')

    // Format tiền VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    // Copy text to clipboard
    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            message.success(`Đã copy ${label}!`)
        })
    }

    // Tạo nội dung chuyển khoản
    const transferContent = `DH ${order_id}`

    // Tạo QR code URL (sử dụng Sepay QR API)
    const generateQRUrl = () => {
        const { account_code, bank } = SEPAY_INFO
        const description = encodeURIComponent(transferContent)

        // Sử dụng Sepay QR API
        return `https://qr.sepay.vn/img?acc=${account_code}&bank=${bank}&amount=${amount}&des=${description}`
    }

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`
    }

    // Timer đếm ngược
    useEffect(() => {
        if (!visible) return

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setPaymentStatus('expired')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [visible])

    // Reset khi mở modal
    useEffect(() => {
        if (visible) {
            setTimeLeft(15 * 60)
            setPaymentStatus('pending')
        }
    }, [visible])

    const renderQRSection = () => (
        <div style={{ textAlign: 'center' }}>
            <Title level={4}>
                <QrcodeOutlined /> Quét mã QR để thanh toán
            </Title>

            <div
                style={{
                    padding: 20,
                    backgroundColor: '#fff',
                    border: '2px solid #1890ff',
                    borderRadius: 12,
                    display: 'inline-block',
                    margin: '20px 0',
                }}
            >
                <Image
                    src={generateQRUrl()}
                    alt="QR Code Thanh toán"
                    width={200}
                    height={200}
                    style={{ borderRadius: 8 }}
                    fallback="/placeholder-qr.png"
                />
            </div>

            <div
                style={{
                    padding: '16px',
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 8,
                    margin: '16px 0',
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                    Số tiền: {formatPrice(amount)}
                </Text>
            </div>

            {paymentStatus === 'pending' && (
                <div style={{ margin: '16px 0' }}>
                    <div style={{ marginBottom: 8 }}>
                        <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                        <Text style={{ marginLeft: 8 }}>
                            Thời gian còn lại:{' '}
                            <strong style={{ color: '#fa8c16' }}>
                                {formatTime(timeLeft)}
                            </strong>
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
            title={
                <>
                    <BankOutlined /> Thông tin chuyển khoản
                </>
            }
            size="small"
            style={{ marginTop: 16 }}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Text>Ngân hàng:</Text>
                    <Text strong>{SEPAY_INFO.bank}</Text>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
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
                                onClick={() =>
                                    copyToClipboard(
                                        SEPAY_INFO.account_code,
                                        'mã tài khoản'
                                    )
                                }
                            />
                        </Tooltip>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Text>Chủ tài khoản:</Text>
                    <Text strong>{SEPAY_INFO.account_name}</Text>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                    <Text>Nội dung chuyển khoản:</Text>
                    <div
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#fff7e6',
                            border: '1px solid #ffd591',
                            borderRadius: 4,
                            marginTop: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Text strong style={{ color: '#d48806' }}>
                            {transferContent}
                        </Text>
                        <Tooltip title="Copy nội dung">
                            <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() =>
                                    copyToClipboard(
                                        transferContent,
                                        'nội dung chuyển khoản'
                                    )
                                }
                            />
                        </Tooltip>
                    </div>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                        ⚠️ Vui lòng chuyển khoản đúng nội dung để được xử lý tự
                        động
                    </Text>
                </div>
            </Space>
        </Card>
    )

    const renderStatusAlert = () => {
        if (paymentStatus === 'expired') {
            return (
                <Alert
                    type="error"
                    message="Mã QR đã hết hạn"
                    description="Vui lòng tạo mã QR mới để tiếp tục thanh toán"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )
        }

        return (
            <Alert
                type="info"
                message="Đang chờ thanh toán"
                description="Vui lòng quét mã QR hoặc chuyển khoản theo thông tin trên. Sau khi chuyển khoản, nhấn 'Đã thanh toán' để xác nhận."
                showIcon
                style={{ marginBottom: 16 }}
            />
        )
    }

    const handlePaymentConfirm = () => {
        Modal.confirm({
            title: 'Xác nhận thanh toán',
            content: 'Bạn đã hoàn tất việc chuyển khoản chưa?',
            okText: 'Đã thanh toán',
            cancelText: 'Chưa',
            onOk: () => {
                setPaymentStatus('completed')
                message.success(
                    'Cảm ơn bạn! Đơn hàng sẽ được xử lý sau khi shop xác nhận thanh toán.'
                )
                setTimeout(() => {
                    onPaymentSuccess &&
                        onPaymentSuccess({
                            payment_method: 'bank_transfer',
                            transfer_content: transferContent,
                            amount: amount,
                        })
                }, 1000)
            },
        })
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

                {renderQRSection()}
                {renderBankInfo()}

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Space size="middle">
                        {paymentStatus === 'pending' && (
                            <>
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={handlePaymentConfirm}
                                >
                                    Đã thanh toán
                                </Button>
                                <Button onClick={onPaymentCancel}>
                                    Hủy thanh toán
                                </Button>
                            </>
                        )}

                        {paymentStatus === 'expired' && (
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    setTimeLeft(15 * 60)
                                    setPaymentStatus('pending')
                                }}
                            >
                                Tạo mã QR mới
                            </Button>
                        )}

                        {paymentStatus === 'completed' && (
                            <Button type="primary" onClick={onClose}>
                                Đóng
                            </Button>
                        )}
                    </Space>
                </div>
            </div>
        </Modal>
    )
}

export default SimpleSepayQR
