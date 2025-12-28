// Enhanced Chat Hook - Simplified working version
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useEnhancedChat = (options = {}) => {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState(null)
    const [isTyping, setIsTyping] = useState(false)
    const [error, setError] = useState(null)
    const [isConnected, setIsConnected] = useState(true) // Simplified - always connected

    const { user } = useAuth()
    const messagesEndRef = useRef(null)

    const {
        autoScroll = true,
        saveHistory = true,
        pollInterval = 2000,
        enableOfflineQueue = true,
    } = options

    // N8N Configuration
    const N8N_WEBHOOK_URL =
        import.meta.env.VITE_N8N_WEBHOOK_URL ||
        'http://localhost:5678/webhook/chatbot'

    // Generate session ID
    const generateSessionId = useCallback(() => {
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        return `chat_${timestamp}_${randomString}`
    }, [])

    // Build user context
    const buildUserContext = useCallback(() => {
        const currentPage = window.location.pathname

        return {
            isLoggedIn: !!user,
            userId: user?.id || null,
            authToken: localStorage.getItem('accessToken') || null,
            userAgent: navigator.userAgent,
            currentPage,
            cart: {
                itemCount: 0,
                totalValue: 0,
            },
            pageContext: {
                page: currentPage,
                type: currentPage.includes('/product/')
                    ? 'product'
                    : currentPage.includes('/orders')
                    ? 'orders'
                    : currentPage === '/cart'
                    ? 'cart'
                    : 'shop',
            },
        }
    }, [user])

    // Auto scroll khi có message mới
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, autoScroll])

    // Send to N8N
    const sendToN8N = useCallback(
        async (messageText) => {
            const sessionId = currentSessionId || generateSessionId()
            if (!currentSessionId) {
                setCurrentSessionId(sessionId)
            }

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

                return result
            } catch (error) {
                console.error('❌ N8N webhook error:', error)
                throw error
            }
        },
        [currentSessionId, generateSessionId, buildUserContext, N8N_WEBHOOK_URL]
    )

    // Send message function
    const sendMessage = useCallback(
        async (messageText) => {
            if (!messageText.trim() || isLoading) return

            setIsLoading(true)
            setIsTyping(true)
            setError(null)

            // Add user message tới UI ngay lập tức
            const userMessage = {
                id: Date.now(),
                text: messageText,
                sender: 'user',
                timestamp: new Date().toISOString(),
                sessionId: currentSessionId,
            }

            setMessages((prev) => [...prev, userMessage])

            try {
                // Send tới N8N
                const result = await sendToN8N(messageText)

                // Simulate AI response (replace với real response từ N8N)
                setTimeout(() => {
                    setIsTyping(false)
                    setIsLoading(false)

                    const botMessage = {
                        id: Date.now() + 1,
                        text:
                            result?.response ||
                            'Cảm ơn bạn! Tôi đã nhận được yêu cầu và đang xử lý.',
                        sender: 'bot',
                        timestamp: new Date().toISOString(),
                        sessionId: currentSessionId,
                    }
                    setMessages((prev) => [...prev, botMessage])
                }, 2000)
            } catch (error) {
                console.error('Send message error:', error)
                setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
                setIsLoading(false)
                setIsTyping(false)

                // Add error message
                const errorMessage = {
                    id: Date.now() + 1,
                    text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    isError: true,
                }
                setMessages((prev) => [...prev, errorMessage])
            }
        },
        [currentSessionId, isLoading, sendToN8N]
    )

    // Start new conversation
    const startNewConversation = useCallback(() => {
        setMessages([])
        setCurrentSessionId(null)
        setError(null)
        setIsLoading(false)
        setIsTyping(false)
    }, [])

    // Load chat history (simplified - no external service)
    const loadChatHistory = useCallback(async (sessionId) => {
        // Simplified - không load từ external service
        // Có thể implement sau nếu cần
    }, [])

    // Resume conversation với session ID cũ
    const resumeConversation = useCallback(
        async (sessionId) => {
            setCurrentSessionId(sessionId)
            await loadChatHistory(sessionId)
        },
        [loadChatHistory]
    )

    // Get current user context (useful for debugging)
    const getCurrentContext = useCallback(async () => {
        return await enhancedChatService.buildUserContext()
    }, [])

    // Send quick action message (pre-defined messages)
    const sendQuickAction = useCallback(
        async (actionType, data = {}) => {
            let message = ''

            switch (actionType) {
                case 'order_return':
                    message = `Tôi muốn trả đơn hàng ${
                        data.orderId || 'abcxyz'
                    }`
                    break
                case 'track_order':
                    message = `Tôi muốn theo dõi đơn hàng ${data.orderId || ''}`
                    break
                case 'product_info':
                    message = `Cho tôi biết thông tin về sản phẩm này`
                    break
                case 'size_guide':
                    message = 'Tôi cần hướng dẫn chọn size'
                    break
                case 'support':
                    message = 'Tôi cần hỗ trợ'
                    break
                default:
                    message = data.message || 'Xin chào'
            }

            await sendMessage(message)
        },
        [sendMessage]
    )

    return {
        // State
        messages,
        isLoading,
        isTyping,
        error,
        isConnected,
        currentSessionId,

        // Actions
        sendMessage,
        sendQuickAction,
        startNewConversation,
        resumeConversation,
        getCurrentContext,

        // Utils
        messagesEndRef,

        // Stats
        messageCount: messages.length,
        userMessageCount: messages.filter((m) => m.sender === 'user').length,
        botMessageCount: messages.filter((m) => m.sender === 'bot').length,
    }
}
