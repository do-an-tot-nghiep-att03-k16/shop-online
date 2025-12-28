// Test Chat Widget - Cực kỳ đơn giản để debug
import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const TestChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    
    // Connect với auth thật
    const { user, isAuthenticated } = useAuth()
    const isLoggedIn = isAuthenticated // Dùng auth thật thay vì false

    // 7 templates của bạn
    const templates = [
        { id: 1, text: "👚 Tôi muốn tìm áo sơ mi nữ", needsAuth: false },
        { id: 2, text: "📦 Tôi muốn theo dõi tất cả đơn hàng trong tuần này", needsAuth: true },
        { id: 3, text: "🔍 Tôi muốn theo dõi đơn hàng ORD123", needsAuth: true },
        { id: 4, text: "❌ Tôi muốn hủy tất cả đơn hàng trong tuần này", needsAuth: true },
        { id: 5, text: "🗑️ Tôi muốn hủy đơn hàng ORD123", needsAuth: true },
        { id: 6, text: "🎟️ Shop có những mã giảm giá gì", needsAuth: false },
        { id: 7, text: "🔄 Tôi muốn trả đơn hàng ORD123", needsAuth: true }
    ]

    // isLoggedIn đã được lấy từ useAuth ở trên

    const availableTemplates = templates.filter(t => !t.needsAuth || isLoggedIn)

    return (
        <>
            {/* Chat Button - FIXED POSITION */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 9999,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                    fontSize: '24px',
                    color: 'white'
                }}
            >
                💬
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        right: '24px',
                        width: '320px',
                        height: '500px',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '12px',
                        zIndex: 9998,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>🤖 AI Shopping Assistant</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Templates: {availableTemplates.length}/7</div>
                        </div>
                        <div 
                            onClick={() => setIsOpen(false)}
                            style={{ cursor: 'pointer', padding: '4px' }}
                        >
                            ✖️
                        </div>
                    </div>

                    {/* Templates */}
                    <div style={{
                        flex: 1,
                        padding: '16px',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            color: '#3b82f6'
                        }}>
                            ✨ Templates của bạn:
                        </h3>
                        
                        {availableTemplates.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                <div style={{ fontSize: '48px' }}>🔒</div>
                                <div style={{ fontSize: '14px' }}>Đăng nhập để xem templates</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {availableTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => alert(`Clicked: ${template.text}`)}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            backgroundColor: 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#f0f8ff'
                                            e.target.style.borderColor = '#3b82f6'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'white'
                                            e.target.style.borderColor = '#ddd'
                                        }}
                                    >
                                        {template.text}
                                        {template.needsAuth && (
                                            <span style={{ 
                                                fontSize: '10px', 
                                                color: '#ef4444',
                                                marginLeft: '4px'
                                            }}>
                                                🔒
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '12px',
                        borderTop: '1px solid #eee',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '0 0 12px 12px',
                        fontSize: '12px',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        Status: {isLoggedIn ? 'Logged In' : 'Not Logged In'} • Click template để test
                    </div>
                </div>
            )}
        </>
    )
}

export default TestChatWidget