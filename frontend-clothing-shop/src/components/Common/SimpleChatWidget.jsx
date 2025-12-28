// Simple Chat Widget - Just show templates, no complex logic
import React, { useState } from 'react'
import { quickTemplates } from '../../config/messageTemplates'

const SimpleChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    const [messages, setMessages] = useState([])
    
    // Mock auth - change this to true/false to test
    const isLoggedIn = false

    const toggleWidget = () => {
        setIsOpen(!isOpen)
        if (!isOpen) {
            setShowTemplates(false)
        }
    }

    const toggleTemplates = () => {
        setShowTemplates(!showTemplates)
    }

    const sendTemplate = (template, orderNumber = '') => {
        let message = template.message
        if (template.hasPlaceholder && orderNumber) {
            message = message.replace(`{${template.placeholder}}`, orderNumber)
        }
        
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: message,
            sender: 'user',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }])
        
        setShowTemplates(false)
        
        // Mock AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: 'Cảm ơn bạn! Tôi đã nhận được yêu cầu và sẽ xử lý ngay.',
                sender: 'bot',
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            }])
        }, 1000)
    }

    const getAvailableTemplates = () => {
        if (!quickTemplates || !quickTemplates.userTemplates) {
            return []
        }
        return quickTemplates.userTemplates.filter(template => 
            !template.requireAuth || isLoggedIn
        )
    }

    const templates = getAvailableTemplates()

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={toggleWidget}
                className="fixed bottom-6 right-6 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                title="Mở chat AI"
            >
                <span className="text-xl">💬</span>
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
                                <p className="text-xs opacity-90">Sẵn sàng hỗ trợ</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setMessages([])}
                                className="p-1 hover:bg-blue-500 rounded"
                                title="Xóa chat"
                            >
                                <span>🔄</span>
                            </button>
                            <button
                                onClick={toggleWidget}
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
                                <p className="text-xs mt-1">Click ✨ để xem template gợi ý!</p>
                            </div>
                        ) : (
                            messages.map(message => (
                                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-lg break-words ${
                                        message.sender === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-sm' 
                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                    }`}>
                                        <div className="text-sm leading-relaxed">{message.text}</div>
                                        <div className={`text-xs mt-1 opacity-70 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {message.time}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Templates Panel */}
                    {showTemplates && (
                        <div className="border-t border-gray-200 bg-gray-50">
                            <div className="p-3 bg-blue-50 border-b border-blue-200">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-blue-700">✨ Gợi ý tin nhắn</h4>
                                    <span className="text-xs text-blue-600">
                                        {isLoggedIn ? '🔓 Đã đăng nhập' : '🔒 Chưa đăng nhập'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-3 max-h-64 overflow-y-auto">
                                {templates.length > 0 ? (
                                    <div className="space-y-2">
                                        {templates.map(template => (
                                            <TemplateButton 
                                                key={template.id} 
                                                template={template} 
                                                onSend={sendTemplate} 
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        <span className="text-2xl mb-2 block">💬</span>
                                        <p className="text-xs">Không có template khả dụng</p>
                                        <p className="text-xs mt-1">Đăng nhập để xem thêm tùy chọn</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleTemplates}
                                className={`px-3 py-2 rounded-lg transition-colors ${
                                    showTemplates 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                                title="Template tin nhắn"
                            >
                                <span>✨</span>
                            </button>
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn của bạn..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <span>📤</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">Templates: {templates.length}</span>
                            <span className="text-xs text-gray-500">Press Enter để gửi</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Template Button Component
const TemplateButton = ({ template, onSend }) => {
    const [showInput, setShowInput] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')

    const handleClick = () => {
        if (template.hasPlaceholder) {
            if (!showInput) {
                setShowInput(true)
                return
            }
            if (orderNumber.trim()) {
                onSend(template, orderNumber.trim())
                setShowInput(false)
                setOrderNumber('')
            }
        } else {
            onSend(template)
        }
    }

    return (
        <div className="mb-2">
            <button
                onClick={handleClick}
                className={`w-full p-2 text-left text-sm rounded-lg border transition-colors font-medium ${
                    template.isDestructive 
                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                        : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                }`}
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

            {showInput && template.hasPlaceholder && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            placeholder={template.placeholderExample}
                            className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && orderNumber.trim()) {
                                    handleClick()
                                }
                            }}
                        />
                        <button
                            onClick={handleClick}
                            disabled={!orderNumber.trim()}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SimpleChatWidget