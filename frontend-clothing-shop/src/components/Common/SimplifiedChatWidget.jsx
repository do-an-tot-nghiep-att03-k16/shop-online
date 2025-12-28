// Simplified Chat Widget - Production version với N8N
import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const SimplifiedChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)

    // Real auth check
    const { user, isAuthenticated } = useAuth()
    const isLoggedIn = isAuthenticated

    // 7 templates của bạn
    const templates = [
        {
            id: 1,
            icon: '👚',
            text: 'Tìm áo sơ mi nữ',
            message: 'Tôi muốn tìm áo sơ mi nữ',
        },
        {
            id: 2,
            icon: '📦',
            text: 'Theo dõi đơn hàng tuần này',
            message: 'Tôi muốn theo dõi tất cả đơn hàng trong tuần này',
            requireAuth: true,
        },
        {
            id: 3,
            icon: '🔍',
            text: 'Theo dõi đơn hàng ORD123',
            message: 'Tôi muốn theo dõi đơn hàng ORD123',
            requireAuth: true,
        },
        {
            id: 4,
            icon: '❌',
            text: 'Hủy đơn hàng tuần này',
            message: 'Tôi muốn hủy tất cả đơn hàng trong tuần này',
            requireAuth: true,
        },
        {
            id: 5,
            icon: '🗑️',
            text: 'Hủy đơn hàng ORD123',
            message: 'Tôi muốn hủy đơn hàng ORD123',
            requireAuth: true,
        },
        {
            id: 6,
            icon: '🎟️',
            text: 'Xem mã giảm giá',
            message: 'Shop có những mã giảm giá gì',
        },
        {
            id: 7,
            icon: '🔄',
            text: 'Trả đơn hàng ORD123',
            message: 'Tôi muốn trả đơn hàng ORD123',
            requireAuth: true,
        },
    ]

    const availableTemplates = templates.filter(
        (t) => !t.requireAuth || isLoggedIn
    )

    // N8N Configuration
    const N8N_WEBHOOK_URL =
        import.meta.env.VITE_N8N_WEBHOOK_URL ||
        'http://localhost:5678/webhook/chatbot'

    // Generate session ID
    const generateSessionId = () => {
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        return `chat_${timestamp}_${randomString}`
    }

    // Build user context
    const buildUserContext = () => {
        return {
            isLoggedIn,
            userId: user?.id || null,
            authToken: localStorage.getItem('accessToken') || null,
            userAgent: navigator.userAgent,
            currentPage: window.location.pathname,
            cart: {
                itemCount: 0,
                totalValue: 0,
            },
            pageContext: {
                page: window.location.pathname,
                type: window.location.pathname.includes('/product/')
                    ? 'product'
                    : window.location.pathname.includes('/orders')
                    ? 'orders'
                    : window.location.pathname === '/cart'
                    ? 'cart'
                    : 'shop',
            },
        }
    }

    // Send to N8N
    const sendToN8N = async (messageText) => {
        const sessionId = generateSessionId()
        const payload = {
            message: messageText,
            sessionId,
            timestamp: new Date().toISOString(),
            userContext: buildUserContext(),
        }

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([payload]), // Array format như bạn yêu cầu
            })

            if (!response.ok) {
                throw new Error(`N8N webhook failed: ${response.status}`)
            }

            const result = await response.json()

            alert(
                `Đã gửi thành công! Response: ${JSON.stringify(
                    result,
                    null,
                    2
                )}`
            )
            return result
        } catch (error) {
            console.error('❌ N8N webhook error:', error)
            alert(`Lỗi kết nối N8N: ${error.message}`)
        }
    }

    const handleTemplateClick = async (template) => {
        await sendToN8N(template.message)
        setShowTemplates(false) // Close templates after sending
    }

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
            >
                🤖
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '90px',
                        right: '20px',
                        width: '350px',
                        height: '500px',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        zIndex: 9998,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '12px 12px 0 0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 'bold' }}>
                                🤖 AI Shopping Assistant
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {isLoggedIn ? 'Đã đăng nhập' : 'Chưa đăng nhập'}{' '}
                                • N8N Ready
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowTemplates(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                }}
                            >
                                🔄
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                }}
                            >
                                ✖️
                            </button>
                        </div>
                    </div>

                    {/* Welcome Message */}
                    <div
                        style={{
                            flex: 1,
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            color: '#666',
                        }}
                    >
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                            👋
                        </div>
                        <p style={{ marginBottom: '8px' }}>
                            Xin chào! Tôi là AI Shopping Assistant.
                        </p>
                        <p style={{ fontSize: '14px' }}>
                            Click ✨ để xem {availableTemplates.length}/7
                            templates!
                        </p>
                    </div>

                    {/* Templates Panel */}
                    {showTemplates && (
                        <div
                            style={{
                                borderTop: '1px solid #eee',
                                backgroundColor: '#f9f9f9',
                                maxHeight: '300px',
                                overflow: 'auto',
                            }}
                        >
                            <div
                                style={{
                                    padding: '12px',
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: '#e3f2fd',
                                }}
                            >
                                <strong style={{ color: '#1976d2' }}>
                                    ✨ Templates ({availableTemplates.length}/7)
                                </strong>
                            </div>
                            <div style={{ padding: '12px' }}>
                                {availableTemplates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() =>
                                            handleTemplateClick(template)
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            marginBottom: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            backgroundColor: 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <span style={{ fontSize: '16px' }}>
                                            {template.icon}
                                        </span>
                                        <span>{template.text}</span>
                                        {template.requireAuth && (
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#f44336',
                                                }}
                                            >
                                                🔒
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div
                        style={{
                            padding: '16px',
                            borderTop: '1px solid #eee',
                            backgroundColor: '#fafafa',
                            borderRadius: '0 0 12px 12px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                            }}
                        >
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    backgroundColor: showTemplates
                                        ? '#3b82f6'
                                        : 'white',
                                    color: showTemplates ? 'white' : '#666',
                                    cursor: 'pointer',
                                }}
                            >
                                ✨
                            </button>
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn hoặc dùng templates..."
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    outline: 'none',
                                }}
                            />
                            <button
                                style={{
                                    padding: '8px 12px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    cursor: 'pointer',
                                }}
                            >
                                📤
                            </button>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '8px',
                                fontSize: '12px',
                                color: '#999',
                            }}
                        >
                            <span>Templates: {availableTemplates.length}</span>
                            <span>N8N: Ready</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default SimplifiedChatWidget
