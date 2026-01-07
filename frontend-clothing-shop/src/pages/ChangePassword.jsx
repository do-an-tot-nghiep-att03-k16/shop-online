import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Alert } from 'antd'
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'

const ChangePassword = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const location = useLocation()
    const { isAuthenticated, user, changePassword } = useAuth()
    const [loading, setLoading] = useState(false)
    const [isFromVerification, setIsFromVerification] = useState(false)

    useEffect(() => {
        // Kiểm tra xem có phải từ email verification không
        const fromVerification = location.state?.fromVerification
        setIsFromVerification(fromVerification)

        // Nếu không được auth và không phải từ verification, redirect về login
        if (!isAuthenticated && !fromVerification) {
            message.warning('Vui lòng đăng nhập để thay đổi mật khẩu')
            navigate('/login', { replace: true })
            return
        }
    }, [isAuthenticated, location.state, navigate])

    const onFinish = async (values) => {
        if (values.password !== values.confirmPassword) {
            message.error('Mật khẩu xác nhận không khớp!')
            return
        }

        setLoading(true)
        try {
            // Sử dụng Redux action để đổi password
            await changePassword(values.password)
            
            message.success('Đặt mật khẩu thành công! Đang chuyển hướng...')
            
            // Redirect về trang chủ
            setTimeout(() => {
                navigate('/', { replace: true })
            }, 1500)
            
        } catch (error) {
            console.error('Change password error:', error)
            message.error(error.message || 'Đặt mật khẩu thất bại')
        } finally {
            setLoading(false)
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
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <CheckCircleOutlined 
                        style={{ 
                            fontSize: 48, 
                            color: '#52c41a',
                            marginBottom: 16
                        }} 
                    />
                    <h2 style={{ 
                        color: '#333', 
                        fontSize: 28, 
                        fontWeight: 600,
                        margin: 0 
                    }}>
                        Đặt mật khẩu
                    </h2>
                    <p style={{ color: '#666', marginTop: 8 }}>
                        {isFromVerification 
                            ? `Chào mừng ${user?.usr_name || 'bạn'}! Hãy đặt mật khẩu để hoàn tất đăng ký.`
                            : 'Tạo mật khẩu mới cho tài khoản của bạn'
                        }
                    </p>
                </div>

                {isFromVerification && (
                    <Alert
                        message="Tài khoản đã được xác thực thành công"
                        description="Vui lòng đặt mật khẩu để bảo mật tài khoản và hoàn tất quá trình đăng ký."
                        type="success"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        label="Mật khẩu mới"
                        name="password"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                            { 
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số!'
                            }
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu mới"
                            disabled={loading}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu"
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
                                },
                            }),
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu mới"
                            disabled={loading}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: 48,
                                fontSize: 16,
                                fontWeight: 500,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: 8
                            }}
                        >
                            {isFromVerification ? 'Hoàn tất đăng ký' : 'Đổi mật khẩu'}
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', color: '#666', fontSize: 12 }}>
                        <p>
                            Mật khẩu của bạn phải chứa ít nhất 6 ký tự bao gồm:<br/>
                            • Ít nhất 1 chữ cái viết hoa<br/>
                            • Ít nhất 1 chữ cái viết thường<br/>
                            • Ít nhất 1 chữ số
                        </p>
                    </div>
                </Form>
            </Card>
        </div>
    )
}

export default ChangePassword