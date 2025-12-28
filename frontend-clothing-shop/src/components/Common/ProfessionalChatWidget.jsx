// Professional Chat Widget - Clean Design, Full N8N Integration
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import MetadataDisplay from './MetadataDisplay'
import { hasDisplayableMetadata } from '../../utils/metadataProcessor'

const ProfessionalChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputMessage, setInputMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState(null)
    const messagesEndRef = useRef(null)

    const { user, isAuthenticated } = useAuth()

    // N8N Configuration
    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chatbot'

    // Templates - Clean text only
    const templates = [
        {
            id: 'search_shirt_women',
            text: 'Tìm áo sơ mi nữ',
            message: 'Tôi muốn tìm áo sơ mi nữ'
        },
        {
            id: 'track_all_orders_week',
            text: 'Theo dõi tất cả đơn hàng trong tuần này',
            message: 'Tôi muốn theo dõi tất cả đơn hàng trong tuần này',
            requireAuth: true
        },
        {
            id: 'track_specific_order',
            text: 'Theo dõi đơn hàng cụ thể',
            message: 'Tôi muốn theo dõi đơn hàng ORD{orderNumber}',
            hasPlaceholder: true,
            placeholder: 'orderNumber',
            requireAuth: true
        },
        {
            id: 'cancel_all_orders_week',
            text: 'Hủy tất cả đơn hàng trong tuần này',
            message: 'Tôi muốn hủy tất cả đơn hàng trong tuần này',
            requireAuth: true,
            isDestructive: true
        },
        {
            id: 'cancel_specific_order',
            text: 'Hủy đơn hàng cụ thể',
            message: 'Tôi muốn hủy đơn hàng ORD{orderNumber}',
            hasPlaceholder: true,
            placeholder: 'orderNumber',
            requireAuth: true,
            isDestructive: true
        },
        {
            id: 'available_coupons',
            text: 'Xem mã giảm giá hiện có',
            message: 'Shop có những mã giảm giá gì'
        },
        {
            id: 'return_specific_order',
            text: 'Trả đơn hàng',
            message: 'Tôi muốn trả đơn hàng ORD{orderNumber}',
            hasPlaceholder: true,
            placeholder: 'orderNumber',
            requireAuth: true
        }
    ]

    const availableTemplates = templates.filter(template => 
        !template.requireAuth || isAuthenticated
    )

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Generate session ID
    const generateSessionId = () => {
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        return `chat_${timestamp}_${randomString}`
    }

    // Build user context
    const buildUserContext = () => {
        return {
            isLoggedIn: isAuthenticated,
            userId: user?.id || null,
            authToken: localStorage.getItem('accessToken') || null,
            userAgent: navigator.userAgent,
            currentPage: window.location.pathname,
            cart: {
                itemCount: 0,
                totalValue: 0
            },
            pageContext: {
                page: window.location.pathname,
                type: window.location.pathname.includes('/product/') ? 'product' : 
                      window.location.pathname.includes('/orders') ? 'orders' : 
                      window.location.pathname === '/cart' ? 'cart' : 'shop'
            }
        }
    }

    // Add message
    const addMessage = (text, sender) => {
        const message = {
            id: Date.now(),
            text,
            sender,
            timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, message])
    }

    // Send to N8N
    const sendToN8N = async (messageText) => {
        const sessionId = currentSessionId || generateSessionId()
        if (!currentSessionId) {
            setCurrentSessionId(sessionId)
        }

        const payload = {
            message: messageText,
            sessionId,
            timestamp: new Date().toISOString(),
            userContext: buildUserContext()
        }

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([payload])
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const result = await response.json()
            
            // Add AI response
            setTimeout(() => {
                addMessage(
                    result?.response || 'Cảm ơn bạn. Tôi đã nhận được yêu cầu và sẽ xử lý ngay.',
                    'assistant'
                )
                setIsLoading(false)
            }, 1500)

            return result

        } catch (error) {
            console.error('N8N error:', error)
            addMessage('Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại.', 'assistant')
            setIsLoading(false)
        }
    }

    // Handle send message
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isLoading) return

        setIsLoading(true)
        setShowTemplates(false)

        // Add user message
        addMessage(messageText, 'user')

        // Send to N8N
        await sendToN8N(messageText)
    }

    // Handle template click
    const handleTemplateClick = (template) => {
        handleSendMessage(template.message)
    }

    // Handle form submit
    const handleSubmit = (e) => {
        e.preventDefault()
        if (inputMessage.trim()) {
            handleSendMessage(inputMessage.trim())
            setInputMessage('')
        }
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999
        }}>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#1f2937'}
                aria-label="Chat Support"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12H16M8 8H16M8 16H13M6 20C4.89543 20 4 19.1046 4 18V7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V18C20 19.1046 19.1046 20 18 20H8.5L6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                
                {messages.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: '12px',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {messages.length > 9 ? '9+' : messages.length}
                    </div>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '70px',
                    right: '0px',
                    width: '384px',
                    height: '600px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
                        <div>
                            <h3 className="font-semibold text-gray-800">Customer Support</h3>
                            <p className="text-sm text-gray-500">
                                {isAuthenticated ? 'Signed in' : 'Guest'} • Online
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    setMessages([])
                                    setCurrentSessionId(null)
                                    setShowTemplates(false)
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                title="New conversation"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 4V6H2V4H4ZM22 4V6H6V4H22ZM4 11V13H2V11H4ZM22 11V13H6V11H22ZM4 18V20H2V18H4ZM22 18V20H6V18H22Z" fill="currentColor"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                title="Close chat"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center py-8">
                                <h4 className="text-lg font-medium text-gray-800 mb-2">Welcome to Customer Support</h4>
                                <p className="text-gray-600 text-sm mb-4">How can we help you today?</p>
                                <button
                                    onClick={() => setShowTemplates(true)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    View common questions
                                </button>
                            </div>
                        ) : (
                            messages.map(message => (
                                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                                        message.sender === 'user' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        <p className="text-sm">{message.text}</p>
                                        
                                        {/* Metadata Display for bot messages */}
                                        {message.sender === 'bot' && message.metadata && hasDisplayableMetadata(message.metadata) && (
                                            <div className="mt-2">
                                                <MetadataDisplay 
                                                    metadata={message.metadata}
                                                    onProductClick={(slug) => {
                                                        // Navigate to product detail page
                                                        window.location.href = `/product/${slug}`;
                                                    }}
                                                    onCouponApply={(code) => {
                                                        // Copy coupon code to clipboard
                                                        navigator.clipboard.writeText(code)
                                                        alert(`Đã copy mã "${code}" vào clipboard!`)
                                                    }}
                                                    onViewMore={(type) => {
                                                        // Handle view more actions
                                                        if (type === 'products') {
                                                            window.open('/shop', '_blank')
                                                        } else if (type === 'coupons') {
                                                            window.open('/coupons', '_blank')
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                        
                                        <p className={`text-xs mt-1 ${
                                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-pulse">Typing...</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Templates Panel */}
                    {showTemplates && (
                        <div className="border-t border-gray-200 bg-gray-50">
                            <div className="p-3 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-gray-800">Common Questions</h4>
                                    <button
                                        onClick={() => setShowTemplates(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-3 max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {availableTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleTemplateClick(template)}
                                            disabled={isLoading}
                                            className={`w-full p-3 text-left text-sm border rounded-lg transition-colors ${
                                                template.isDestructive 
                                                    ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700' 
                                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                                            } disabled:opacity-50`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{template.text}</span>
                                                {template.requireAuth && !isAuthenticated && (
                                                    <span className="text-xs text-gray-400">Login required</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                
                                {!isAuthenticated && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            Sign in to access order management features
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            {!showTemplates && (
                                <button
                                    type="button"
                                    onClick={() => setShowTemplates(true)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                    title="Show templates"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            )}
                            
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                            
                            <button
                                type="submit"
                                disabled={isLoading || !inputMessage.trim()}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

export default ProfessionalChatWidget