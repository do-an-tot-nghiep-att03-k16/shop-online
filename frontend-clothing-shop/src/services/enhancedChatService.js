// Enhanced Hybrid Flow ChatBot Service
// Tích hợp template data structure và real-time processing

import { envConfig } from '../config/env'
import authUtils from '../utils/authUtils'

class EnhancedChatService {
    constructor() {
        this.n8nWebhookUrl =
            envConfig.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chatbot'
        this.activeSessions = new Map()
        this.messageQueue = new Map()
        this.isInitialized = false
    }

    /**
     * Initialize service với Supabase client
     */
    initialize(supabaseClient) {
        this.supabase = supabaseClient
        this.isInitialized = true
    }

    /**
     * Generate unique session ID theo format của template
     */
    generateSessionId() {
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        return `chat_${timestamp}_${randomString}`
    }

    /**
     * Build user context từ current state
     */
    async buildUserContext() {
        try {
            // Get auth info
            const authData = authUtils.getAuthData()
            const user = authData?.user

            // Get cart info từ Redux store (nếu có)
            const cart = this.getCartInfo()

            // Get current page
            const currentPage = window.location.pathname

            return {
                isLoggedIn: !!user,
                userId: user?.id || null,
                authToken: authData?.accessToken || null,
                userAgent: navigator.userAgent,
                currentPage,
                cart: cart || { itemCount: 0, totalValue: 0 },
                // Thêm context từ page hiện tại
                pageContext: this.getPageContext(),
            }
        } catch (error) {
            console.error('Error building user context:', error)
            return {
                isLoggedIn: false,
                userId: null,
                authToken: null,
                userAgent: navigator.userAgent,
                currentPage: '/',
                cart: { itemCount: 0, totalValue: 0 },
            }
        }
    }

    /**
     * Get cart info từ localStorage hoặc Redux
     */
    getCartInfo() {
        try {
            // Attempt từ localStorage trước
            const cartData = localStorage.getItem('cart')
            if (cartData) {
                const cart = JSON.parse(cartData)
                return {
                    itemCount: cart.items?.length || 0,
                    totalValue: cart.total || 0,
                    items: cart.items || [],
                }
            }
            return null
        } catch (error) {
            console.error('Error getting cart info:', error)
            return null
        }
    }

    /**
     * Get context dựa trên page hiện tại
     */
    getPageContext() {
        const path = window.location.pathname
        const search = window.location.search

        const context = { page: path }

        // Detect page type và extract relevant info
        if (path.includes('/product/')) {
            context.type = 'product'
            context.productId = path.split('/product/')[1]
        } else if (path.includes('/category/')) {
            context.type = 'category'
            context.categorySlug = path.split('/category/')[1]
        } else if (path === '/cart') {
            context.type = 'cart'
        } else if (path === '/checkout') {
            context.type = 'checkout'
        } else if (path.includes('/order')) {
            context.type = 'order'
        }

        // Extract query params
        if (search) {
            const params = new URLSearchParams(search)
            context.queryParams = Object.fromEntries(params)
        }

        return context
    }

    /**
     * Build complete message payload theo template
     */
    async buildMessagePayload(userMessage, sessionId = null) {
        if (!sessionId) {
            sessionId = this.generateSessionId()
        }

        const userContext = await this.buildUserContext()

        return {
            message: userMessage,
            sessionId,
            timestamp: new Date().toISOString(),
            userContext,
        }
    }

    /**
     * Send message tới N8N webhook
     */
    async sendToN8N(messagePayload) {
        try {
            const response = await fetch(this.n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([messagePayload]), // Wrap trong array như template
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
    }

    /**
     * Save message tới Supabase để tracking
     */
    async saveMessageToSupabase(messagePayload, type = 'user') {
        if (!this.isInitialized || !this.supabase) {
            console.warn('Supabase not initialized, skipping save')
            return null
        }

        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .insert([
                    {
                        session_id: messagePayload.sessionId,
                        content: JSON.stringify({
                            message: messagePayload.message,
                            userContext: messagePayload.userContext,
                        }),
                        message_type: type,
                        timestamp: messagePayload.timestamp,
                        created_at: new Date().toISOString(),
                    },
                ])

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error saving to Supabase:', error)
            return null
        }
    }

    /**
     * Main method: Send message với complete hybrid flow
     */
    async sendMessage(userMessage, sessionId = null, options = {}) {
        try {
            // Build payload
            const messagePayload = await this.buildMessagePayload(
                userMessage,
                sessionId
            )

            // Save user message tới Supabase (optional)
            if (options.saveToSupabase !== false) {
                await this.saveMessageToSupabase(messagePayload, 'user')
            }

            // Send tới N8N
            const n8nResponse = await this.sendToN8N(messagePayload)

            // Start polling cho response từ Supabase
            if (this.isInitialized && options.pollResponse !== false) {
                this.startResponsePolling(
                    messagePayload.sessionId,
                    options.onResponse
                )
            }

            return {
                success: true,
                sessionId: messagePayload.sessionId,
                timestamp: messagePayload.timestamp,
                n8nResponse,
            }
        } catch (error) {
            console.error('❌ Send message error:', error)
            return {
                success: false,
                error: error.message,
                fallbackResponse:
                    'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
            }
        }
    }

    /**
     * Start polling cho AI response từ Supabase
     */
    startResponsePolling(sessionId, onResponse, interval = 2000) {
        if (!this.isInitialized) return null

        // Stop existing polling
        this.stopResponsePolling(sessionId)

        let lastTimestamp = new Date().toISOString()

        const pollInterval = setInterval(async () => {
            try {
                const { data, error } = await this.supabase
                    .from('chat_responses')
                    .select('*')
                    .eq('session_id', sessionId)
                    .gt('created_at', lastTimestamp)
                    .order('created_at', { ascending: true })

                if (error) throw error

                if (data && data.length > 0) {
                    // Update timestamp
                    lastTimestamp = data[data.length - 1].created_at

                    // Parse responses
                    const responses = data.map((response) => ({
                        ...response,
                        content: this.parseResponse(response.content),
                        metadata: this.parseResponse(response.metadata || '{}'),
                    }))

                    // Call callback
                    if (onResponse) {
                        onResponse(responses)
                    }

                    // Stop polling after receiving response (optional)
                    if (responses.some((r) => r.is_final)) {
                        this.stopResponsePolling(sessionId)
                    }
                }
            } catch (error) {
                console.error('Polling error:', error)
                // Continue polling on error, don't stop
            }
        }, interval)

        this.activeSessions.set(sessionId, pollInterval)
        return pollInterval
    }

    /**
     * Stop response polling
     */
    stopResponsePolling(sessionId) {
        const interval = this.activeSessions.get(sessionId)
        if (interval) {
            clearInterval(interval)
            this.activeSessions.delete(sessionId)
        }
    }

    /**
     * Parse JSON response safely
     */
    parseResponse(rawResponse) {
        try {
            if (typeof rawResponse === 'string') {
                return JSON.parse(rawResponse)
            }
            return rawResponse
        } catch (error) {
            console.error('Error parsing response:', error)
            return { message: rawResponse, error: true }
        }
    }

    /**
     * Get chat history
     */
    async getChatHistory(sessionId, limit = 50) {
        if (!this.isInitialized) return []

        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(limit)

            if (error) throw error

            return data.map((message) => ({
                ...message,
                content: this.parseResponse(message.content),
            }))
        } catch (error) {
            console.error('Error getting chat history:', error)
            return []
        }
    }

    /**
     * Cleanup khi unmount
     */
    cleanup() {
        this.activeSessions.forEach((interval, sessionId) => {
            this.stopResponsePolling(sessionId)
        })
        this.messageQueue.clear()
    }
}

// Export singleton instance
const enhancedChatService = new EnhancedChatService()
export default enhancedChatService
