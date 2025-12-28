// Supabase Chat Integration Service
// Xử lý việc tích hợp chatbot AI với Supabase database

class SupabaseChatService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient
        this.activeSessions = new Map() // Track active polling sessions
    }

    /**
     * Giải quyết vấn đề Object → String conversion
     * Supabase thường lưu object dưới dạng JSON string
     */
    parseResponse(rawResponse) {
        try {
            // Nếu response là string, parse thành object
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
     * PHƯƠNG ÁN 1: Real-time Polling
     * Poll responses từ Supabase theo sessionId
     */
    async pollChatResponses(sessionId, lastTimestamp = null) {
        try {
            let query = this.supabase
                .from('chat_responses')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            if (lastTimestamp) {
                query = query.gt('created_at', lastTimestamp)
            }

            const { data, error } = await query

            if (error) throw error

            // Parse tất cả JSON strings về objects
            return data.map(response => ({
                ...response,
                content: this.parseResponse(response.content),
                metadata: this.parseResponse(response.metadata || '{}')
            }))

        } catch (error) {
            console.error('Error polling chat responses:', error)
            return []
        }
    }

    /**
     * Start polling cho một session
     * @param {string} sessionId 
     * @param {Function} onNewResponse - Callback khi có response mới
     * @param {number} interval - Polling interval (ms)
     */
    startPolling(sessionId, onNewResponse, interval = 2000) {
        // Dừng polling cũ nếu có
        this.stopPolling(sessionId)

        let lastTimestamp = new Date().toISOString()

        const pollInterval = setInterval(async () => {
            const newResponses = await this.pollChatResponses(sessionId, lastTimestamp)
            
            if (newResponses.length > 0) {
                // Update timestamp
                lastTimestamp = newResponses[newResponses.length - 1].created_at
                
                // Gọi callback với responses mới
                onNewResponse(newResponses)
            }
        }, interval)

        // Lưu interval ID để có thể dừng sau
        this.activeSessions.set(sessionId, pollInterval)

        return pollInterval
    }

    /**
     * Dừng polling cho một session
     */
    stopPolling(sessionId) {
        const interval = this.activeSessions.get(sessionId)
        if (interval) {
            clearInterval(interval)
            this.activeSessions.delete(sessionId)
        }
    }

    /**
     * PHƯƠNG ÁN 2: Webhook Callback
     * Setup webhook endpoint để nhận responses
     */
    async setupWebhookEndpoint() {
        // Tạo endpoint để nhận callback từ Supabase
        // Có thể dùng Express middleware hoặc Vercel Edge Functions
        
        return {
            endpoint: '/api/chat/webhook',
            handler: this.handleWebhookCallback.bind(this)
        }
    }

    /**
     * Handle webhook callback từ Supabase
     */
    handleWebhookCallback(payload) {
        try {
            const { session_id, response_data } = payload
            
            // Parse response data
            const parsedResponse = this.parseResponse(response_data)
            
            // Emit event để frontend có thể lắng nghe
            window.dispatchEvent(new CustomEvent('chatResponseReceived', {
                detail: {
                    sessionId: session_id,
                    response: parsedResponse
                }
            }))

        } catch (error) {
            console.error('Webhook callback error:', error)
        }
    }

    /**
     * Lấy chat history từ Supabase
     */
    async getChatHistory(sessionId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(limit)

            if (error) throw error

            return data.map(message => ({
                ...message,
                content: this.parseResponse(message.content)
            }))

        } catch (error) {
            console.error('Error getting chat history:', error)
            return []
        }
    }

    /**
     * Lưu message vào Supabase
     */
    async saveMessage(sessionId, message, type = 'user') {
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .insert([{
                    session_id: sessionId,
                    content: JSON.stringify(message), // Convert object to string
                    message_type: type,
                    created_at: new Date().toISOString()
                }])

            if (error) throw error
            return data

        } catch (error) {
            console.error('Error saving message:', error)
            return null
        }
    }

    /**
     * Cleanup khi component unmount
     */
    cleanup() {
        // Dừng tất cả polling sessions
        this.activeSessions.forEach((interval, sessionId) => {
            this.stopPolling(sessionId)
        })
    }
}

export default SupabaseChatService