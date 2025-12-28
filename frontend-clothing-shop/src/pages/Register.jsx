import { useEffect, useState } from 'react'
import { Form, Input, Button, Card, message, Result } from 'antd'
import { MailOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'

const Register = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [sentEmail, setSentEmail] = useState('')

    const onFinish = async (values) => {
        setLoading(true)
        try {
            await authService.register(values.email)
            setSentEmail(values.email)
            setEmailSent(true)
            message.success('Email xác thực đã được gửi!')
            form.resetFields()
        } catch (error) {
            message.error(error.message || 'Gửi email thất bại')
        } finally {
            setLoading(false)
        }
    }

    const handleResendEmail = async () => {
        if (!sentEmail) return
        
        setLoading(true)
        try {
            await authService.register(sentEmail)
            message.success('Email xác thực đã được gửi lại!')
        } catch (error) {
            message.error(error.message || 'Gửi lại email thất bại')
        } finally {
            setLoading(false)
        }
    }

    if (emailSent) {
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
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Kiểm tra email của bạn"
                        subTitle={
                            <div>
                                <p style={{ marginBottom: 8 }}>
                                    Chúng tôi đã gửi liên kết xác thực đến:
                                </p>
                                <p style={{ fontWeight: 600, color: '#667eea', marginBottom: 16 }}>
                                    {sentEmail}
                                </p>
                                <p style={{ color: '#666', fontSize: 14 }}>
                                    Vui lòng kiểm tra hộp thư đến (và thư mục spam) để hoàn tất đăng ký.
                                </p>
                            </div>
                        }
                        extra={[
                            <Button 
                                key="resend"
                                type="default" 
                                onClick={handleResendEmail}
                                loading={loading}
                                style={{ marginRight: 8 }}
                            >
                                Gửi lại email
                            </Button>,
                            <Button 
                                key="back" 
                                type="primary"
                                onClick={() => setEmailSent(false)}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none'
                                }}
                            >
                                Nhập email khác
                            </Button>,
                        ]}
                    />
                    
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <span style={{ color: '#666' }}>
                            Đã có tài khoản?{' '}
                            <Link 
                                to="/login" 
                                style={{ 
                                    color: '#667eea',
                                    fontWeight: 500,
                                    textDecoration: 'none'
                                }}
                            >
                                Đăng nhập ngay
                            </Link>
                        </span>
                    </div>
                </Card>
            </div>
        )
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
                        Đăng ký tài khoản
                    </h2>
                    <p style={{ color: '#666', marginTop: 8 }}>
                        Nhập email để nhận liên kết xác thực
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
                            Gửi email xác thực
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ color: '#666' }}>
                            Đã có tài khoản?{' '}
                            <Link 
                                to="/login" 
                                style={{ 
                                    color: '#667eea',
                                    fontWeight: 500,
                                    textDecoration: 'none'
                                }}
                            >
                                Đăng nhập ngay
                            </Link>
                        </span>
                    </div>
                </Form>
            </Card>
        </div>
    )
}

export default Register