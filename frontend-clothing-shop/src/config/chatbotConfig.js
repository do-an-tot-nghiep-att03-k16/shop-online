// Chatbot Configuration - Enhanced Hybrid Flow
export const chatbotConfig = {
    // N8N Webhook Configuration
    n8n: {
        webhookUrl: process.env.REACT_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chatbot',
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 2000 // 2 seconds
    },

    // Supabase Configuration
    supabase: {
        pollInterval: 2000, // Poll every 2 seconds
        maxPollDuration: 60000, // Stop polling after 60 seconds
        tables: {
            messages: 'chat_messages',
            responses: 'chat_responses'
        }
    },

    // UI Configuration
    ui: {
        autoScroll: true,
        showTypingIndicator: true,
        maxMessageHistory: 100,
        quickActionsEnabled: true,
        sessionPersistence: true
    },

    // Message Configuration
    messages: {
        welcomeMessage: 'Xin chào! Tôi là AI Shopping Assistant. Tôi có thể giúp bạn mua sắm, theo dõi đơn hàng và nhiều hơn nữa!',
        errorMessage: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        offlineMessage: 'Bạn đang offline. Tin nhắn sẽ được gửi khi có kết nối.',
        typingMessage: 'AI đang soạn tin...'
    },

    // Quick Actions Configuration
    quickActions: [
        {
            id: 'order_return',
            text: 'Trả hàng / Hoàn tiền',
            icon: '🔄',
            message: 'Tôi muốn trả đơn hàng'
        },
        {
            id: 'track_order',
            text: 'Theo dõi đơn hàng',
            icon: '📦',
            message: 'Tôi muốn theo dõi đơn hàng'
        },
        {
            id: 'product_info',
            text: 'Thông tin sản phẩm',
            icon: '👕',
            message: 'Cho tôi biết thông tin về sản phẩm này'
        },
        {
            id: 'size_guide',
            text: 'Hướng dẫn chọn size',
            icon: '📏',
            message: 'Tôi cần hướng dẫn chọn size'
        },
        {
            id: 'support',
            text: 'Hỗ trợ khách hàng',
            icon: '💬',
            message: 'Tôi cần hỗ trợ'
        }
    ],

    // Analytics Configuration
    analytics: {
        trackSessions: true,
        trackMessages: true,
        trackQuickActions: true,
        trackErrors: true
    }
}