// Enhanced AI Chat Widget - Complete Hybrid Flow Implementation
import React, { useState, useEffect, useRef } from 'react'
import { useEnhancedChat } from '../../hooks/useEnhancedChat'
import { useAuth } from '../../hooks/useAuth'
import SimpleTemplatePanel from './SimpleTemplatePanel'
// Using emoji icons instead of lucide-react
const MessageCircle = () => '💬'
const Send = () => '📤' 
const X = () => '✖️'
const RotateCcw = () => '🔄'
const Loader = () => '⏳'
const AlertCircle = () => '⚠️'
const Sparkles = () => '✨'
import './ChatWidget.css'

const EnhancedAIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [inputMessage, setInputMessage] = useState('')
    const [showQuickActions, setShowQuickActions] = useState(true)
    const [showTemplates, setShowTemplates] = useState(false)
    const inputRef = useRef(null)
    
    // Get auth status and current page context
    const { user, isAuthenticated } = useAuth()
    
    // Helper function to get current page context
    const getCurrentPageContext = () => {
        const path = window.location.pathname
        if (path.includes('/product/')) return 'product'
        if (path.includes('/category/')) return 'category'  
        if (path === '/cart') return 'cart'
        if (path === '/checkout') return 'checkout'
        if (path.includes('/order')) return 'orders'
        if (path === '/profile') return 'profile'
        if (path === '/shop') return 'shop'
        return 'shop'
    }
    
    const currentContext = getCurrentPageContext()

    const {
        messages,
        isLoading,
        isTyping,
        error,
        isConnected,
        currentSessionId,
        sendMessage,
        sendQuickAction,
        startNewConversation,
        messagesEndRef,
        messageCount
    } = useEnhancedChat({
        autoScroll: true,
        saveHistory: true,
        pollInterval: 2000
    })

    // Focus input khi widget mở
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    // Hide quick actions after first message
    useEffect(() => {
        if (messageCount > 0) {
            setShowQuickActions(false)
        }
    }, [messageCount])
    
    // Toggle templates when no messages
    useEffect(() => {
        if (messageCount === 0 && !showQuickActions) {
            setShowTemplates(true)
        }
    }, [messageCount, showQuickActions])

    const handleSendMessage = async (e) => {
        e?.preventDefault()
        if (!inputMessage.trim() || isLoading) return

        const message = inputMessage.trim()
        setInputMessage('')
        await sendMessage(message)
    }

    const handleQuickAction = async (actionType, data = {}) => {
        await sendQuickAction(actionType, data)
        setShowQuickActions(false)
        setShowTemplates(false)
    }

    // Handle template selection
    const handleTemplateSelect = async (templateText, template) => {
        setInputMessage('')
        setShowTemplates(false)
        setShowQuickActions(false)
        await sendMessage(templateText)
    }

    // Toggle template panel
    const toggleTemplates = () => {
        setShowTemplates(!showTemplates)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const toggleWidget = () => {
        setIsOpen(!isOpen)
        if (!isOpen) {
            // Reset error khi mở widget
            if (error) {
                startNewConversation()
            }
        }
    }

    const renderMessage = (message) => {
        const isUser = message.sender === 'user'
        const isError = message.isError

        return (
            <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
            >
                <div
                    className={`
                        max-w-[80%] px-4 py-2 rounded-lg break-words
                        ${isUser 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : isError
                                ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-sm'
                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }
                        ${isError ? 'border-l-4 border-red-500' : ''}
                    `}
                >
                    <div className="text-sm leading-relaxed">
                        {message.text}
                    </div>
                    <div className={`text-xs mt-1 opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderQuickActions = () => {
        const quickActions = [
            {
                id: 'order_return',
                text: 'Trả hàng / Hoàn tiền',
                icon: '🔄',
                action: () => handleQuickAction('order_return')
            },
            {
                id: 'track_order',
                text: 'Theo dõi đơn hàng',
                icon: '📦',
                action: () => handleQuickAction('track_order')
            },
            {
                id: 'product_info',
                text: 'Thông tin sản phẩm',
                icon: '👕',
                action: () => handleQuickAction('product_info')
            },
            {
                id: 'size_guide',
                text: 'Hướng dẫn chọn size',
                icon: '📏',
                action: () => handleQuickAction('size_guide')
            },
            {
                id: 'support',
                text: 'Hỗ trợ khách hàng',
                icon: '💬',
                action: () => handleQuickAction('support')
            }
        ]

        return (
            <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Tôi có thể giúp gì cho bạn?
                </h4>
                <div className="grid grid-cols-1 gap-2">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={action.action}
                            className="flex items-center p-2 text-left text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <span className="mr-2 text-base">{action.icon}</span>
                            <span>{action.text}</span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    const renderConnectionStatus = () => {
        if (!isConnected) {
            return (
                <div className="flex items-center justify-center p-3 bg-yellow-50 border-b border-yellow-200">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span className="text-sm text-yellow-700">Đang kết nối...</span>
                </div>
            )
        }
        return null
    }

    const renderTypingIndicator = () => {
        if (!isTyping) return null

        return (
            <div className="flex justify-start mb-3">
                <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-sm">
                    <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">AI đang soạn tin...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Chat Widget Button */}
            <button
                onClick={toggleWidget}
                className="fixed bottom-6 right-6 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Mở chat AI"
            >
                <span className="text-xl">💬</span>
                {messageCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {messageCount > 9 ? '9+' : messageCount}
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
                                    {currentSessionId ? 'Đang trực tuyến' : 'Sẵn sàng hỗ trợ'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {messageCount > 0 && (
                                <button
                                    onClick={startNewConversation}
                                    className="p-1 hover:bg-blue-500 rounded"
                                    title="Cuộc trò chuyện mới"
                                >
                                    <span>🔄</span>
                                </button>
                            )}
                            <button
                                onClick={toggleWidget}
                                className="p-1 hover:bg-blue-500 rounded"
                                title="Đóng chat"
                            >
                                <span>✖️</span>
                            </button>
                        </div>
                    </div>

                    {/* Connection Status */}
                    {renderConnectionStatus()}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <div className="text-4xl mb-4">👋</div>
                                <p className="text-sm">Xin chào! Tôi là AI Shopping Assistant.</p>
                                <p className="text-xs mt-1">Tôi có thể giúp bạn mua sắm, theo dõi đơn hàng và nhiều hơn nữa!</p>
                            </div>
                        ) : (
                            messages.map(renderMessage)
                        )}
                        
                        {renderTypingIndicator()}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    {showQuickActions && messages.length === 0 && renderQuickActions()}

                    {/* Template Panel */}
                    {showTemplates && (
                        <SimpleTemplatePanel
                            onSelectTemplate={handleTemplateSelect}
                            currentContext={currentContext}
                            isLoggedIn={isAuthenticated}
                            onClose={() => setShowTemplates(false)}
                        />
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                            <div className="flex items-center text-red-600">
                                <span className="mr-2">⚠️</span>
                                <span className="text-xs">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
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
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập tin nhắn của bạn..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading || !isConnected}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputMessage.trim() || !isConnected}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                {isLoading ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <span>📤</span>
                                )}
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                                Session: {currentSessionId ? currentSessionId.substring(0, 12) + '...' : 'Chưa bắt đầu'}
                            </span>
                            <span className="text-xs text-gray-500">
                                Press Enter để gửi
                            </span>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

export default EnhancedAIChatWidget