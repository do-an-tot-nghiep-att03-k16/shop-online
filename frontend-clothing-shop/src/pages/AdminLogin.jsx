import { useEffect } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../config/permissions'

const AdminLogin = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { login, loading, error, isAuthenticated, user, clearError } = useAuth()

    useEffect(() => {
        if (isAuthenticated && user) {
            // Admin login - only allow admin/shop
            if (isAdmin(user.usr_role)) {
                navigate('/admin', { replace: true })
                message.success('Đăng nhập admin thành công!')
            } else {
                message.error('Bạn không có quyền truy cập trang admin!')
                return
            }
        }
    }, [isAuthenticated, user, navigate])

    useEffect(() => {
        if (error) {
            message.error(error)
            clearError()
        }
    }, [error, clearError])

    const onFinish = async (values) => {
        const result = await login(values.email, values.password)
        
        if (result.type.includes('fulfilled')) {
            const loggedInUser = result.payload.user

            // Check admin access
            if (!isAdmin(loggedInUser?.usr_role)) {
                message.error('Bạn không có quyền truy cập trang admin!')
                return
            }
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                padding: '20px'
            }}
        >
            <Card 
                style={{ 
                    width: 450,
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                        width: 60,
                        height: 60,
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: 'white',
                        fontSize: '24px'
                    }}>
                        🔐
                    </div>
                    <h2 style={{ 
                        color: '#333', 
                        fontSize: 28, 
                        fontWeight: 600,
                        margin: 0 
                    }}>
                        Admin Login
                    </h2>
                    <p style={{ color: '#666', marginTop: 8 }}>
                        Đăng nhập vào hệ thống quản trị
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
                            placeholder="Nhập email admin"
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
                                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                border: 'none',
                                borderRadius: 8
                            }}
                        >
                            Đăng nhập Admin
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
                        Chỉ dành cho quản trị viên
                    </div>
                </Form>
            </Card>
        </div>
    )
}

export default AdminLogin