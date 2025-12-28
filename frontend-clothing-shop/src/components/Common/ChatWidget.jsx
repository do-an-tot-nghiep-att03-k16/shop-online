import { useState } from 'react'
import { MessageOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Card, Typography, Space, Divider } from 'antd'
import './ChatWidget.css'

const { Text, Title } = Typography

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)

    // Thông tin liên hệ - có thể move vào config
    const contactInfo = {
        messenger: 'https://m.me/your-facebook-page', // Thay bằng link Messenger thật
        phone: '0123456789',
        email: 'support@yourstore.com',
        zalo: 'https://zalo.me/0123456789' // Nếu có Zalo
    }

    const handleMessengerClick = () => {
        window.open(contactInfo.messenger, '_blank', 'width=600,height=600')
    }

    const handlePhoneClick = () => {
        window.open(`tel:${contactInfo.phone}`)
    }

    const handleEmailClick = () => {
        window.open(`mailto:${contactInfo.email}`)
    }

    const handleZaloClick = () => {
        window.open(contactInfo.zalo, '_blank', 'width=600,height=600')
    }

    return (
        <>
            {/* Chat Widget Button */}
            <div className="chat-widget">
                {!isOpen && (
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<MessageOutlined />}
                        className="chat-button"
                        onClick={() => setIsOpen(true)}
                    />
                )}

                {/* Chat Panel */}
                {isOpen && (
                    <Card className="chat-panel" size="small">
                        {/* Header */}
                        <div className="chat-header">
                            <Title level={5} style={{ margin: 0, color: 'white' }}>
                                💬 Hỗ trợ khách hàng
                            </Title>
                            <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => setIsOpen(false)}
                                style={{ color: 'white' }}
                            />
                        </div>

                        {/* Content */}
                        <div className="chat-content">
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Chúng tôi luôn sẵn sàng hỗ trợ bạn! 🌟
                            </Text>

                            <Divider style={{ margin: '12px 0' }} />

                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                {/* Messenger */}
                                <Button
                                    type="default"
                                    block
                                    icon={<span style={{ color: '#0084FF' }}>📱</span>}
                                    onClick={handleMessengerClick}
                                    style={{ 
                                        textAlign: 'left',
                                        height: 'auto',
                                        padding: '8px 12px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Chat qua Messenger</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                            Phản hồi ngay lập tức
                                        </div>
                                    </div>
                                </Button>

                                {/* Zalo */}
                                <Button
                                    type="default"
                                    block
                                    icon={<span style={{ color: '#0068FF' }}>💬</span>}
                                    onClick={handleZaloClick}
                                    style={{ 
                                        textAlign: 'left',
                                        height: 'auto',
                                        padding: '8px 12px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Chat qua Zalo</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                            Hỗ trợ 24/7
                                        </div>
                                    </div>
                                </Button>

                                {/* Phone */}
                                <Button
                                    type="default"
                                    block
                                    icon={<span style={{ color: '#52C41A' }}>📞</span>}
                                    onClick={handlePhoneClick}
                                    style={{ 
                                        textAlign: 'left',
                                        height: 'auto',
                                        padding: '8px 12px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Gọi điện</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                            {contactInfo.phone}
                                        </div>
                                    </div>
                                </Button>

                                {/* Email */}
                                <Button
                                    type="default"
                                    block
                                    icon={<span style={{ color: '#FF4D4F' }}>✉️</span>}
                                    onClick={handleEmailClick}
                                    style={{ 
                                        textAlign: 'left',
                                        height: 'auto',
                                        padding: '8px 12px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Gửi email</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                            {contactInfo.email}
                                        </div>
                                    </div>
                                </Button>
                            </Space>

                            <Divider style={{ margin: '12px 0' }} />

                            <Text style={{ fontSize: '10px', color: '#999', textAlign: 'center', display: 'block' }}>
                                Thời gian hỗ trợ: 8:00 - 22:00 hàng ngày
                            </Text>
                        </div>
                    </Card>
                )}
            </div>
        </>
    )
}

export default ChatWidget