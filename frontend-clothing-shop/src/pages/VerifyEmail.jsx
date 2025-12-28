import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Result, Button, Spin, message, Alert } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { authService } from '../services/authService'
import authUtils from '../utils/authUtils'

const VerifyEmail = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState('loading') // loading, success, error
    const [errorMessage, setErrorMessage] = useState('')
    const [verifiedUser, setVerifiedUser] = useState(null)
    const [timeRemaining, setTimeRemaining] = useState(5 * 60) // 5 phút = 300 giây

    useEffect(() => {
        const token = searchParams.get('token')
        
        if (!token) {
            setStatus('error')
            setErrorMessage('Token xác thực không hợp lệ')
            return
        }

        verifyEmailToken(token)
    }, [searchParams])

    // Đếm ngược thời gian
    useEffect(() => {
        if (status === 'loading' && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setStatus('error')
                        setErrorMessage('Token đã hết hạn. Vui lòng đăng ký lại để nhận token mới.')
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [status, timeRemaining])

    const verifyEmailToken = async (token) => {
        try {
            setStatus('loading')
            
            // Gọi API verify email
            const result = await authService.verifyEmail(token)
            
            // Lưu thông tin auth
            if (result.tokens && result.user) {
                authUtils.saveTokens(result.tokens)
                authUtils.saveUser(result.user)
                
                setVerifiedUser(result.user)
                setStatus('success')
                
                // Redirect đến trang đổi mật khẩu sau 2 giây
                setTimeout(() => {
                    navigate('/change-password', { 
                        replace: true,
                        state: { fromVerification: true }
                    })
                }, 2000)
            }
        } catch (error) {
            console.error('Verify email error:', error)
            setStatus('error')
            setErrorMessage(error.message || 'Xác thực email thất bại')
        }
    }

    const handleRetry = () => {
        const token = searchParams.get('token')
        if (token) {
            verifyEmailToken(token)
        }
    }

    // Format thời gian hiển thị
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div>
                        <Alert
                            message={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ClockCircleOutlined />
                                    <span>Token sẽ hết hạn sau: <strong style={{ color: '#ff4d4f' }}>{formatTime(timeRemaining)}</strong></span>
                                </div>
                            }
                            type="warning"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                        <Result
                            icon={<Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} />} />}
                            title="Đang xác thực email..."
                            subTitle="Vui lòng đợi trong giây lát"
                        />
                    </div>
                )
            
            case 'success':
                return (
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Xác thực email thành công!"
                        subTitle={
                            <div>
                                <p style={{ marginBottom: 8 }}>
                                    Chào mừng {verifiedUser?.usr_name || 'bạn'}!
                                </p>
                                <p style={{ color: '#666', fontSize: 14 }}>
                                    Bạn sẽ được chuyển đến trang đặt mật khẩu trong giây lát...
                                </p>
                            </div>
                        }
                        extra={[
                            <Button 
                                key="continue"
                                type="primary"
                                onClick={() => navigate('/change-password', { 
                                    replace: true,
                                    state: { fromVerification: true }
                                })}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none'
                                }}
                            >
                                Tiếp tục đặt mật khẩu
                            </Button>
                        ]}
                    />
                )
            
            case 'error':
                const isExpired = timeRemaining <= 0
                return (
                    <div>
                        {isExpired && (
                            <Alert
                                message={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ClockCircleOutlined />
                                        <span>Token đã hết hạn sau 5 phút</span>
                                    </div>
                                }
                                type="error"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}
                        <Result
                            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            title={isExpired ? "Token đã hết hạn" : "Xác thực email thất bại"}
                            subTitle={errorMessage}
                            extra={[
                                !isExpired && (
                                    <Button 
                                        key="retry"
                                        type="default"
                                        onClick={handleRetry}
                                        style={{ marginRight: 8 }}
                                    >
                                        Thử lại
                                    </Button>
                                ),
                                <Button 
                                    key="register"
                                    type="primary"
                                    onClick={() => navigate('/register')}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none'
                                    }}
                                >
                                    {isExpired ? 'Đăng ký để nhận token mới' : 'Đăng ký lại'}
                                </Button>
                            ].filter(Boolean)}
                        />
                    </div>
                )
            
            default:
                return null
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px'
            }}
        >
            <Card 
                style={{ 
                    width: 450,
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
            >
                {renderContent()}
            </Card>
        </div>
    )
}

export default VerifyEmail