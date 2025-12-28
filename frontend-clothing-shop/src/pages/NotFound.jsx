import React from 'react'
import { Button, Typography, Space } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                minHeight: '100vh',
                padding: '24px',
                background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
            }}
        >
            <Title
                level={1}
                style={{
                    fontSize: '6rem',
                    margin: 0,
                    color: '#1890ff',
                }}
            >
                404
            </Title>
            <Title level={3} style={{ margin: '16px 0' }}>
                Oops! Không tìm thấy trang
            </Title>
            <Text type="secondary" style={{ fontSize: '1.25rem' }}>
                Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </Text>

            <Space orientation="vertical" size="large" style={{ marginTop: 24 }}>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate('/')}
                >
                    Quay về trang chủ
                </Button>
                <Button onClick={() => navigate(-1)} size="large" ghost>
                    Quay lại trang trước
                </Button>
            </Space>
        </div>
    )
}

export default NotFound
