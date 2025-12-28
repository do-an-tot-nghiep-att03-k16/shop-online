import { useEffect, useRef } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../config/permissions'

const Login = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { login, logout, loading, error, isAuthenticated, user, clearError } = useAuth()
    const loginSuccessShown = useRef(false)

    useEffect(() => {
        if (isAuthenticated && user && !loginSuccessShown.current) {
            // This is ONLY for regular users - block admin access completely
            if (isAdmin(user.usr_role)) {
                message.warning('Tài khoản admin vui lòng đăng nhập tại trang quản trị')
                // Force logout admin trying to use user login
                logout()
                return
            }
            
            // Regular user login flow
            message.success('Đăng nhập thành công!')
            loginSuccessShown.current = true
            navigate('/', { replace: true })
        }
    }, [isAuthenticated, user, navigate, logout])

    useEffect(() => {
        if (error) {
            message.error(error)
            clearError()
        }
    }, [error, clearError])

    const onFinish = async (values) => {
        await login(values.email, values.password)
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
                    <h2 style={{ 
                        color: '#333', 
                        fontSize: 28, 
                        fontWeight: 600,
                        margin: 0 
                    }}>
                        Đăng nhập
                    </h2>
                    <p style={{ color: '#666', marginTop: 8 }}>
                        Đăng nhập để tiếp tục mua sắm tại Aristia
                    </p>
                </div>

                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Nhập địa chỉ email"
                            disabled={loading}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập mật khẩu!',
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu"
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
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ color: '#666' }}>
                            Chưa có tài khoản?{' '}
                            <Link 
                                to="/register" 
                                style={{ 
                                    color: '#667eea',
                                    fontWeight: 500,
                                    textDecoration: 'none'
                                }}
                            >
                                Đăng ký ngay
                            </Link>
                        </span>
                    </div>
                </Form>
            </Card>
        </div>
    )
}

export default Login
