import envConfig from '../config/env'

// URL của n8n webhook - sử dụng từ env config
const N8N_WEBHOOK_URL = envConfig.N8N_WEBHOOK_URL

class ChatService {
    // 🔐 Helper methods để lấy user info an toàn
    getCurrentUser() {
        try {
            // Thử Redux persist store trước
            const persistedState = localStorage.getItem('persist:root');
            if (persistedState) {
                const parsed = JSON.parse(persistedState);
                const authState = JSON.parse(parsed.auth);
                if (authState.user) {
                    return authState.user;
                }
            }
            
            // Fallback: Thử authUtils localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
                return JSON.parse(userStr);
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }
        return null;
    }

    getCurrentCart() {
        try {
            const persistedState = localStorage.getItem('persist:root');
            if (persistedState) {
                const parsed = JSON.parse(persistedState);
                const cartState = JSON.parse(parsed.cart);
                return cartState;
            }
        } catch (error) {
            console.error('Error getting cart data:', error);
        }
        return { items: [], total: 0 };
    }

    getAuthToken() {
        // Use authUtils to get the correct token key ('token')
        return localStorage.getItem('token') ||           // authUtils saves here
               localStorage.getItem('accessToken') ||     // fallback
               localStorage.getItem('authToken') ||       // fallback
               localStorage.getItem('auth_token');        // fallback
    }

    /**
     * Gửi tin nhắn đến chatbot qua n8n webhook
     * @param {string} message - Tin nhắn của user
     * @param {string} sessionId - ID phiên chat (để maintain context)
     * @param {Object} context - Context bổ sung (user info, current page, etc.)
     * @returns {Promise<Object>} - Response từ chatbot
     */
    async sendMessage(message, sessionId = null, context = {}) {
        try {
            // Sử dụng session persistence logic
            if (!sessionId) {
                sessionId = this.getCurrentSession() || this.createNewSession()
            }
            
            // Update session activity mỗi khi send message
            this.updateSessionActivity(sessionId)

            // 🔐 Lấy user info từ store an toàn
            const user = this.getCurrentUser();
            const cart = this.getCurrentCart();

            const payload = {
                message: message.trim(),
                sessionId,
                timestamp: new Date().toISOString(),
                
                // 🔒 USER CONTEXT với thông tin cần thiết cho phân quyền
                userContext: {
                    // Basic info (always safe)
                    isLoggedIn: !!user,
                    userAgent: navigator.userAgent,
                    currentPage: window.location.pathname,
                    referrer: document.referrer,
                    
                    // User info (chỉ khi đã login)
                    ...(user && {
                        userId: user.id,
                        userRole: user.role || 'customer',
                        email: user.email,
                        membershipLevel: user.membershipLevel || 'regular'
                    }),

                    // Cart info  
                    cart: {
                        itemCount: cart?.items?.length || 0,
                        totalValue: cart?.total || 0,
                        cartId: cart?.id
                    },

                    // Auth token cho API calls (nếu đã login)
                    ...(user && {
                        authToken: this.getAuthToken()
                    }),

                    // Additional context
                    ...context
                }
            }


            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            // Chỉ cần webhook success - không cần parse response
            
            return {
                success: true,
                response: 'Message sent to N8N', // Không quan trọng vì không dùng
                sessionId,
                timestamp: new Date().toISOString()
            }

        } catch (error) {
            console.error('Chat service error:', error)
            
            return {
                success: false,
                error: error.message,
                response: 'Xin lỗi, hệ thống chatbot tạm thời gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
                sessionId,
                timestamp: new Date().toISOString()
            }
        }
    }

    /**
     * Quản lý session với persistence và expiration
     */
    getCurrentSession() {
        try {
            const sessionData = localStorage.getItem('current_chat_session')
            if (!sessionData) return null

            const { sessionId, created, lastUsed } = JSON.parse(sessionData)
            const now = Date.now()
            const FIFTEEN_MINUTES = 15 * 60 * 1000

            // Check if session expired (15 minutes)
            if (now - lastUsed > FIFTEEN_MINUTES) {
                this.clearCurrentSession()
                return null
            }

            // Update last used time
            this.updateSessionActivity(sessionId)
            return sessionId
        } catch (error) {
            console.error('Error getting current session:', error)
            return null
        }
    }

    createNewSession() {
        const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const sessionData = {
            sessionId,
            created: Date.now(),
            lastUsed: Date.now()
        }
        
        localStorage.setItem('current_chat_session', JSON.stringify(sessionData))
        return sessionId
    }

    updateSessionActivity(sessionId) {
        try {
            const sessionData = localStorage.getItem('current_chat_session')
            if (sessionData) {
                const data = JSON.parse(sessionData)
                data.lastUsed = Date.now()
                localStorage.setItem('current_chat_session', JSON.stringify(data))
            }
        } catch (error) {
            console.error('Error updating session activity:', error)
        }
    }

    clearCurrentSession() {
        try {
            const sessionData = localStorage.getItem('current_chat_session')
            if (sessionData) {
                const { sessionId } = JSON.parse(sessionData)
                // Clear chat history của session hiện tại
                this.clearChatHistory(sessionId)
            }
            // Clear session data
            localStorage.removeItem('current_chat_session')
        } catch (error) {
            console.error('Error clearing current session:', error)
        }
    }

    /**
     * Lấy lịch sử chat từ localStorage
     * @param {string} sessionId 
     * @returns {Array} - Mảng các tin nhắn
     */
    getChatHistory(sessionId) {
        try {
            const history = localStorage.getItem(`chat_history_${sessionId}`)
            return history ? JSON.parse(history) : []
        } catch (error) {
            console.error('Error getting chat history:', error)
            return []
        }
    }

    /**
     * Lưu tin nhắn vào localStorage
     * @param {string} sessionId 
     * @param {Object} message 
     */
    saveChatMessage(sessionId, message) {
        try {
            const history = this.getChatHistory(sessionId)
            history.push({
                ...message,
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            })
            
            // Giới hạn lịch sử 50 tin nhắn gần nhất
            if (history.length > 50) {
                history.splice(0, history.length - 50)
            }
            
            localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(history))
        } catch (error) {
            console.error('Error saving chat message:', error)
        }
    }

    /**
     * Xóa lịch sử chat
     * @param {string} sessionId 
     */
    clearChatHistory(sessionId) {
        try {
            localStorage.removeItem(`chat_history_${sessionId}`)
        } catch (error) {
            console.error('Error clearing chat history:', error)
        }
    }

    /**
     * Thực hiện bulk cancel orders từ AI chatbot - Simple version
     * @param {Array} orderIds - Mảng các order IDs cần hủy (string array)
     * @param {string} reason - Lý do hủy đơn
     * @returns {Promise<Object>} - Kết quả bulk cancel
     */
    async bulkCancelOrders(orderIds, reason = "Yêu cầu hủy từ AI chatbot") {
        try {
            const token = this.getAuthToken()
            if (!token) {
                throw new Error('User not authenticated')
            }

            const response = await fetch(`${envConfig.API_BASE_URL}/v1/api/order/bulk/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderIds,
                    reason
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Bulk cancel failed')
            }

            const data = await response.json()

            return {
                success: true,
                data: data.metadata,
                message: `Đã hủy thành công ${data.metadata.successfully_cancelled}/${data.metadata.total_requested} đơn hàng`
            }

        } catch (error) {
            console.error('❌ Bulk cancel error:', error)
            return {
                success: false,
                error: error.message,
                message: 'Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại.'
            }
        }
    }

    /**
     * Lấy danh sách orders của user để AI có thể hiển thị và xử lý
     * @param {Object} filters - Bộ lọc (status, page, limit)
     * @returns {Promise<Object>} - Danh sách orders
     */
    async getUserOrders(filters = {}) {
        try {
            const token = this.getAuthToken()
            if (!token) {
                throw new Error('User not authenticated')
            }

            const queryParams = new URLSearchParams({
                page: filters.page || 1,
                limit: filters.limit || 20,
                ...(filters.status && { status: filters.status })
            })

            const response = await fetch(`${envConfig.API_BASE_URL}/v1/api/order/my-orders?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch orders')
            }

            const data = await response.json()
            return {
                success: true,
                data: data.metadata,
                message: `Tìm thấy ${data.metadata.orders.length} đơn hàng`
            }

        } catch (error) {
            console.error('❌ Get orders error:', error)
            return {
                success: false,
                error: error.message,
                message: 'Không thể lấy danh sách đơn hàng'
            }
        }
    }

    /**
     * Format order info cho AI chatbot hiển thị
     * @param {Object} order - Order object
     * @returns {string} - Formatted order info
     */
    formatOrderForAI(order) {
        const statusMap = {
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận', 
            'processing': 'Đang chuẩn bị',
            'shipping': 'Đang giao hàng',
            'delivered': 'Đã giao hàng',
            'cancelled': 'Đã hủy',
            'returned': 'Đã trả hàng'
        }

        return `📦 Đơn hàng #${order.order_number}
💰 Tổng tiền: ${order.total?.toLocaleString()}đ
📊 Trạng thái: ${statusMap[order.status] || order.status}
📅 Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}
🛍️ ${order.items?.length || 0} sản phẩm`
    }

    /**
     * Lấy các suggested questions
     * @returns {Array} - Mảng câu hỏi gợi ý
     */
    getSuggestedQuestions() {
        // 7 templates theo yêu cầu của bạn
        const user = this.getCurrentUser()
        const authToken = this.getAuthToken()
        
        // Debug auth status - removed for production
        
        // Simplified auth check - multiple fallbacks
        const isAuthenticated = !!(
            user || 
            authToken || 
            localStorage.getItem('accessToken') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('token')
        )
        
        const allTemplates = [
            "Tôi muốn tìm áo sơ mi nữ",
            "Tôi muốn theo dõi tất cả đơn hàng trong tuần này",
            "Tôi muốn theo dõi đơn hàng ORD123456", 
            "Tôi muốn hủy tất cả đơn hàng trong tuần này",
            "Tôi muốn hủy đơn hàng ORD123456",
            "Shop có những mã giảm giá gì",
            "Tôi muốn trả đơn hàng ORD123456"
        ]
        
        const publicTemplates = [
            "Tôi muốn tìm áo sơ mi nữ",
            "Shop có những mã giảm giá gì"
        ]
        
        
        // Return theo auth status
        return isAuthenticated ? allTemplates : publicTemplates
    }
}

export const chatService = new ChatService()
export default chatService