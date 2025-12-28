// Production Chat Widget - Full N8N Integration
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

const ProductionChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputMessage, setInputMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState(null)
    const [placeholderInputs, setPlaceholderInputs] = useState({})
    const messagesEndRef = useRef(null)

    const { user, isAuthenticated } = useAuth()

    // N8N Configuration
    const N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chatbot'

    // 7 templates của bạn
    const userTemplates = [
        {
            id: 'search_shirt_women',
            text: 'Tìm áo sơ mi nữ',
            message: 'Tôi muốn tìm áo sơ mi nữ',
            icon: '👚'
        },
        {
            id: 'track_all_orders_week',
            text: 'Theo dõi tất cả đơn hàng tuần này',
            message: 'Tôi muốn theo dõi tất cả đơn hàng trong tuần này',
            icon: '📦',
            requireAuth: true
        },
        {
            id: 'track_specific_order',
            text: 'Theo dõi đơn hàng cụ thể',
            message: 'Tôi muốn theo dõi đơn hàng ORD{orderNumber}',
            icon: '🔍',
            hasPlaceholder: true,
            placeholder: 'orderNumber',
            placeholderExample: '123456',
            requireAuth: true
        },
        {
            id: 'cancel_all_orders_week',
            text: 'Hủy tất cả đơn hàng tuần này',
            message: 'Tôi muốn hủy tất cả đơn hàng trong tuần này',
            icon: '❌',
            requireAuth: true,
            isDestructive: true
        },
        {
            id: 'cancel_specific_order',
            text: 'Hủy đơn hàng cụ thể',
            message: 'Tôi muốn hủy đơn hàng ORD{orderNumber}',
            icon: '🗑️',
            hasPlaceholder: true,
            placeholder: 'orderNumber',
            placeholderExample: '123456',
            requireAuth: true,
            isDestructive: true
        },
        {
            id: 'available_coupons',
            text: 'Xem mã giảm giá',
            message: 'Shop có những mã giảm giá gì',
            icon: '🎟️'
        },
        {
            id: 'return_specific_order',
            text: 'Trả đơn hàng',
            message: 'Tôi muốn trả đơn hàng ORD{orderNumber}',
            icon: '🔄',
            hasPlaceholder: true,
            placeholder: 'orderNumber',
            placeholderExample: '123456',
            requireAuth: true
        }
    ]

    // Auto scroll to bottom
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
        const currentPage = window.location.pathname
        
        return {
            isLoggedIn: isAuthenticated,
            userId: user?.id || null,
            authToken: localStorage.getItem('accessToken') || null,
            userAgent: navigator.userAgent,
            currentPage,
            cart: {
                itemCount: 0, // Get from Redux/localStorage if available
                totalValue: 0
            },
            pageContext: {
                page: currentPage,
                type: currentPage.includes('/product/') ? 'product' : 
                      currentPage.includes('/orders') ? 'orders' : 
                      currentPage === '/cart' ? 'cart' : 'shop'
            }
        }
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
                body: JSON.stringify([payload]) // Array format như bạn yêu cầu
            })

            if (!response.ok) {
                throw new Error(`N8N webhook failed: ${response.status}`)
            }

            const result = await response.json()
            
            // Simulate AI response (replace với real response từ N8N)
            setIsTyping(true)
            setTimeout(() => {
                setIsTyping(false)
                addMessage(
                    result?.response || 'Cảm ơn bạn! Tôi đã nhận được yêu cầu và đang xử lý.',
                    'bot'
                )
            }, 2000)
            
            return result

        } catch (error) {
            console.error('❌ N8N webhook error:', error)
            setIsTyping(false)
            addMessage(
                'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
                'bot',
                true
            )
        }
    }

    // Add message to chat
    const addMessage = (text, sender, isError = false) => {
        const newMessage = {
            id: Date.now(),
            text,
            sender,
            timestamp: new Date().toISOString(),
            isError
        }
        setMessages(prev => [...prev, newMessage])
    }

    // Send message
    const sendMessage = async (messageText) => {
        if (!messageText.trim() || isLoading) return

        setIsLoading(true)
        setShowTemplates(false)

        // Add user message
        addMessage(messageText, 'user')

        // Send to N8N
        await sendToN8N(messageText)

        setIsLoading(false)
    }

    // Handle template click
    const handleTemplateClick = async (template) => {
        if (template.hasPlaceholder) {
            const inputValue = placeholderInputs[template.id]
            if (!inputValue) {
                setPlaceholderInputs(prev => ({ ...prev, [template.id]: '' }))
                return
            }
            
            const processedMessage = template.message.replace(
                `{${template.placeholder}}`, 
                inputValue
            )
            await sendMessage(processedMessage)
            
            // Reset input
            setPlaceholderInputs(prev => {
                const newInputs = { ...prev }
                delete newInputs[template.id]
                return newInputs
            })
        } else {
            await sendMessage(template.message)
        }
    }

    // Get available templates
    const getAvailableTemplates = () => {
        return userTemplates.filter(template => 
            !template.requireAuth || isAuthenticated
        )
    }

    const availableTemplates = getAvailableTemplates()

    // Handle input submit
    const handleSubmit = (e) => {
        e.preventDefault()
        if (inputMessage.trim()) {
            sendMessage(inputMessage.trim())
            setInputMessage('')
        }
    }

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                title="AI Shopping Assistant"
            >
                <span className="text-xl">🤖</span>
                {messages.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {messages.length > 9 ? '9+' : messages.length}
                    </div>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[9998] w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                🤖
                            </div>
                            <div>
                                <h3 className="font-medium">AI Shopping Assistant</h3>
                                <p className="text-xs opacity-90">
                                    {isAuthenticated ? 'Đã đăng nhập' : 'Chưa đăng nhập'} • N8N Ready
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    setMessages([])
                                    setCurrentSessionId(null)
                                    setShowTemplates(false)
                                }}
                                className="p-1 hover:bg-blue-500 rounded"
                                title="Cuộc trò chuyện mới"
                            >
                                <span>🔄</span>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-blue-500 rounded"
                                title="Đóng chat"
                            >
                                <span>✖️</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <div className="text-4xl mb-4">👋</div>
                                <p className="text-sm">Xin chào! Tôi là AI Shopping Assistant.</p>
                                <p className="text-xs mt-1">Tích hợp N8N • Click ✨ để xem templates!</p>
                            </div>
                        ) : (
                            messages.map(message => (
                                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-lg break-words ${
                                        message.sender === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-sm' 
                                            : message.isError
                                                ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-sm'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                    }`}>
                                        <div className="text-sm leading-relaxed">{message.text}</div>
                                        <div className={`text-xs mt-1 opacity-70 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start mb-3">
                                <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-sm">
                                    <div className="flex items-center space-x-1">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-2">AI đang phản hồi...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Templates Panel */}
                    {showTemplates && (
                        <div className="border-t border-gray-200 bg-gray-50">
                            <div className="p-3 bg-blue-50 border-b border-blue-200">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-blue-700">✨ Templates ({availableTemplates.length}/7)</h4>
                                    <span className="text-xs text-blue-600">N8N Integration</span>
                                </div>
                            </div>
                            
                            <div className="p-3 max-h-64 overflow-y-auto">
                                {availableTemplates.length > 0 ? (
                                    <div className="space-y-2">
                                        {availableTemplates.map(template => (
                                            <div key={template.id} className="mb-2">
                                                <button
                                                    onClick={() => handleTemplateClick(template)}
                                                    disabled={isLoading}
                                                    className={`w-full p-2 text-left text-sm rounded-lg border transition-colors font-medium ${
                                                        template.isDestructive 
                                                            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                                                            : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                                                    } disabled:opacity-50`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center">
                                                            <span className="mr-2">{template.icon}</span>
                                                            {template.text}
                                                        </span>
                                                        <div className="flex items-center space-x-1">
                                                            {template.hasPlaceholder && <span className="text-xs text-blue-500">📝</span>}
                                                            {template.requireAuth && <span className="text-xs text-red-500">🔒</span>}
                                                            {template.isDestructive && <span className="text-xs text-red-500">⚠️</span>}
                                                        </div>
                                                    </div>
                                                    {template.isDestructive && (
                                                        <div className="text-xs text-red-600 mt-1">⚠️ Hành động này không thể hoàn tác</div>
                                                    )}
                                                </button>

                                                {/* Placeholder Input */}
                                                {template.hasPlaceholder && placeholderInputs.hasOwnProperty(template.id) && (
                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="text"
                                                                value={placeholderInputs[template.id] || ''}
                                                                onChange={(e) => setPlaceholderInputs(prev => ({ 
                                                                    ...prev, 
                                                                    [template.id]: e.target.value 
                                                                }))}
                                                                placeholder={template.placeholderExample}
                                                                className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                autoFocus
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter' && placeholderInputs[template.id]) {
                                                                        handleTemplateClick(template)
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => handleTemplateClick(template)}
                                                                disabled={!placeholderInputs[template.id]}
                                                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400"
                                                            >
                                                                OK
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        <span className="text-2xl mb-2 block">🔒</span>
                                        <p className="text-xs">Đăng nhập để xem thêm templates</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowTemplates(!showTemplates)}
                                className={`px-3 py-2 rounded-lg transition-colors ${
                                    showTemplates 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                                title="Templates"
                            >
                                <span>✨</span>
                            </button>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Nhập tin nhắn hoặc dùng templates..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputMessage.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <span className="animate-spin">⏳</span> : <span>📤</span>}
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                                Session: {currentSessionId ? currentSessionId.substring(0, 12) + '...' : 'Chưa bắt đầu'}
                            </span>
                            <span className="text-xs text-gray-500">N8N: {N8N_WEBHOOK_URL ? 'Ready' : 'Not configured'}</span>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

export default ProductionChatWidget