import { useState, useRef, useEffect } from 'react'
import {
    MessageOutlined,
    CloseOutlined,
    SendOutlined,
    RobotOutlined,
    UserOutlined,
    LoadingOutlined,
    QuestionCircleOutlined,
    DeleteOutlined,
    BulbOutlined,
    UpOutlined,
    DownOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Input,
    Space,
    Typography,
    Divider,
    Avatar,
    Spin,
    Tag,
    Tooltip,
} from 'antd'
import { chatService } from '../../services/chatService'
import chatRealtimeService from '../../services/chatRealtimeService'
import MarkdownRenderer from './MarkdownRenderer'
import './ChatWidget.css'
import MetadataDisplay from './MetadataDisplay'
import { hasDisplayableMetadata } from '../../utils/metadataProcessor'
import { parseHumanMessage } from '../../utils/chatParser'

const { Text, Title } = Typography
const { TextArea } = Input

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState(null)
    const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(true) // Toggle cho suggestions
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // 🕐 Timeout tracking for webhook responses
    const timeoutRef = useRef(null)
    const [pendingMessageId, setPendingMessageId] = useState(null)

    // Scroll to bottom khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Focus input khi mở chat
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus()
            }, 100)
        }
    }, [isOpen])

    // Setup realtime connection khi có sessionId
    useEffect(() => {
        if (sessionId && isOpen) {
            // Define callback functions
            const handleNewMessage = (data) => {
                const message = data.message

                // Chỉ hiển thị AI messages từ realtime, bỏ qua human messages
                if (message.sessionId === sessionId && message.type === 'ai') {
                    setMessages((prev) => {
                        const exists = prev.find((m) => m.id === message.id)
                        if (!exists) {
                            // Parse metadata from stringified JSON content
                            let metadata = null
                            let displayContent = message.content || 'No content'

                            // Get metadata and content from realtime message
                            metadata = message.metadata || null
                            displayContent = message.content || 'No content'

                            const newMessage = {
                                id: message.id,
                                type: 'ai', // Only AI type messages show on screen
                                content: displayContent,
                                timestamp: message.timestamp,
                                isMarkdown: true, // Support markdown for reply
                                metadata: metadata, // Include parsed metadata
                            }
                            return [...prev, newMessage]
                        }
                        return prev
                    })
                } else if (message.sessionId === sessionId) {
                }
            }

            const handleMessageUpdate = (data) => {
                const message = data.message
                if (message.sessionId === sessionId) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === message.id
                                ? {
                                      ...m,
                                      content: message.content || m.content,
                                      timestamp: message.timestamp,
                                  }
                                : m
                        )
                    )
                }
            }

            // Register callbacks
            chatRealtimeService.on('onNewMessage', handleNewMessage)
            chatRealtimeService.on('onMessageUpdate', handleMessageUpdate)

            // Subscribe to realtime changes
            chatRealtimeService.subscribe(sessionId).then((success) => {
                setIsRealtimeConnected(success)
            })

            // Cleanup on unmount
            return () => {
                chatRealtimeService.off('onNewMessage', handleNewMessage)
                chatRealtimeService.off('onMessageUpdate', handleMessageUpdate)
                chatRealtimeService.unsubscribe()
                setIsRealtimeConnected(false)
            }
        }
    }, [sessionId, isOpen])

    // Khởi tạo session với persistence khi mở chat lần đầu
    useEffect(() => {
        if (isOpen && !sessionId) {
            // Sử dụng session persistence logic
            const persistentSessionId =
                chatService.getCurrentSession() ||
                chatService.createNewSession()
            setSessionId(persistentSessionId)

            // Load lịch sử chat từ Supabase thay vì localStorage
            chatRealtimeService
                .loadInitialHistory(50, persistentSessionId)
                .then((groupedSessions) => {
                    const sessionData = groupedSessions[persistentSessionId]
                    if (sessionData && sessionData.messages.length > 0) {
                        const formattedMessages = sessionData.messages
                            .map((msg) => {
                                if (msg.type === 'human') {
                                    // Extract userMessage from human content
                                    const userMessage = parseHumanMessage(
                                        msg.content
                                    )
                                    return {
                                        id: msg.id,
                                        type: 'user',
                                        content: userMessage,
                                        timestamp: msg.timestamp,
                                        isMarkdown: false,
                                    }
                                } else if (msg.type === 'ai') {
                                    // Parse metadata from AI messages if available
                                    let metadata = null
                                    let displayContent =
                                        msg.content || 'No content'

                                    // Try to get metadata from history message
                                    if (msg.metadata) {
                                        // Metadata already parsed in database
                                        metadata = msg.metadata
                                    }

                                    // Always try JSON parsing for content - metadata might be there
                                    if (
                                        typeof msg.content === 'string' &&
                                        msg.content.startsWith('{')
                                    ) {
                                        // Parse JSON content - metadata is usually here
                                        try {
                                            const parsed = JSON.parse(
                                                msg.content
                                            )

                                            if (parsed.output) {
                                                displayContent =
                                                    parsed.output.reply ||
                                                    displayContent
                                                if (parsed.output.metadata) {
                                                    metadata =
                                                        typeof parsed.output
                                                            .metadata ===
                                                        'string'
                                                            ? JSON.parse(
                                                                  parsed.output
                                                                      .metadata
                                                              )
                                                            : parsed.output
                                                                  .metadata

                                                    // Debug specific metadata types
                                                    if (metadata.track_orders) {
                                                    }
                                                    if (metadata.track_order) {
                                                    }
                                                } else {
                                                }
                                            } else {
                                                console.log(
                                                    '❌ No output field in parsed JSON for ID:',
                                                    msg.id
                                                )
                                            }
                                        } catch (error) {
                                            console.log(
                                                '❌ JSON parse error for ID',
                                                msg.id,
                                                ':',
                                                error.message
                                            )
                                            displayContent =
                                                msg.content || 'No content'
                                        }
                                    } else {
                                        // Plain text content
                                        displayContent =
                                            msg.content || 'No content'
                                    }

                                    return {
                                        id: msg.id,
                                        type: 'ai',
                                        content: displayContent,
                                        timestamp: msg.timestamp,
                                        isMarkdown: true,
                                        metadata: metadata,
                                    }
                                }
                                return null
                            })
                            .filter(Boolean)
                        setMessages(formattedMessages)
                    } else {
                        // Tin nhắn chào mừng
                        const welcomeMessage = {
                            id: 'welcome',
                            type: 'ai', // Use 'ai' not 'bot'
                            content:
                                'Xin chào! Tôi là trợ lý AI của cửa hàng. Tôi có thể giúp bạn tìm sản phẩm, tư vấn size, hướng dẫn đặt hàng và trả lời các câu hỏi khác. Bạn cần hỗ trợ gì?',
                            timestamp: new Date().toISOString(),
                            isMarkdown: true,
                        }
                        setMessages([welcomeMessage])
                    }
                })
                .catch((error) => {
                    console.error('Error loading chat history:', error)
                    // Fallback to welcome message
                    const welcomeMessage = {
                        id: 'welcome',
                        type: 'ai', // Use 'ai' not 'bot'
                        content:
                            'Xin chào! Tôi là trợ lý AI của cửa hàng. Bạn cần hỗ trợ gì?',
                        timestamp: new Date().toISOString(),
                        isMarkdown: true,
                    }
                    setMessages([welcomeMessage])
                })
        }
    }, [isOpen, sessionId])

    // 🕐 Monitor for new AI responses to clear timeout
    useEffect(() => {
        if (pendingMessageId && messages.length > 0) {
            // Check if we got a new AI response
            const latestMessage = messages[messages.length - 1]
            if (
                latestMessage &&
                latestMessage.type === 'ai' &&
                latestMessage.id !== 'welcome'
            ) {
                // Clear timeout - we got a response!
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                    timeoutRef.current = null
                }
                setPendingMessageId(null)
                setIsLoading(false) // Clear loading when we get response
            }
        }
    }, [messages, pendingMessageId])

    // 🧹 Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
        }
    }, [])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return

        const userMessageId = `user_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 5)}`
        const userMessage = {
            id: userMessageId,
            type: 'user',
            content: inputValue.trim(),
            timestamp: new Date().toISOString(),
        }

        // Hiển thị tin nhắn user ngay trong UI
        setMessages((prev) => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)

        try {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            // Set pending message ID for timeout tracking
            setPendingMessageId(userMessageId)

            // 🕐 Start 3-minute timeout
            timeoutRef.current = setTimeout(() => {
                // Add timeout error message
                const timeoutMessage = {
                    id: `timeout_${Date.now()}`,
                    type: 'ai',
                    content:
                        '⏰ Xin lỗi, chúng tôi không thể xử lý yêu cầu của bạn lúc này. Hệ thống có thể đang quá tải hoặc gặp sự cố tạm thời. Vui lòng thử lại sau ít phút hoặc liên hệ bộ phận hỗ trợ nếu vấn đề vẫn tiếp tục.',
                    timestamp: new Date().toISOString(),
                    isMarkdown: true,
                    isTimeout: true,
                }

                setMessages((prev) => [...prev, timeoutMessage])
                setPendingMessageId(null)
                timeoutRef.current = null
                setIsLoading(false)
            }, 3 * 60 * 1000) // 3 minutes = 180,000 milliseconds

            // Chỉ call N8N webhook - không cần response data
            // Để chatService tự build userContext đầy đủ
            await chatService.sendMessage(userMessage.content, sessionId)

            // Không cần xử lý response - chờ realtime update từ database
        } catch (error) {
            console.error('Send message error:', error)

            // Clear timeout on immediate error
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            setPendingMessageId(null)

            // Hiển thị error message trực tiếp (không qua Supabase)
            const errorMessage = {
                id: `error_${Date.now()}`,
                type: 'ai', // Use 'ai' not 'bot'
                content:
                    'Xin lỗi, có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.',
                timestamp: new Date().toISOString(),
                success: false,
                isMarkdown: true,
            }

            setMessages((prev) => [...prev, errorMessage])
        } finally {
            // Only clear loading if there was an immediate error
            // Otherwise, keep loading until we get response or timeout
            if (!pendingMessageId) {
                setIsLoading(false)
            }
        }
    }

    const handleSuggestedQuestion = (question) => {
        setInputValue(question)
        setTimeout(() => {
            handleSendMessage()
        }, 100)
    }

    const handleClearChat = () => {
        setMessages([])
        if (sessionId) {
            chatService.clearChatHistory(sessionId)
        }

        // Tin nhắn chào mừng mới
        const welcomeMessage = {
            id: 'welcome_new',
            type: 'ai', // Use 'ai' not 'bot'
            content: 'Cuộc trò chuyện đã được xóa. Bạn cần hỗ trợ gì?',
            timestamp: new Date().toISOString(),
            isMarkdown: true,
        }
        setMessages([welcomeMessage])
        chatService.saveChatMessage(sessionId, welcomeMessage)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <>
            {/* AI Chat Widget Button */}
            <div className="chat-widget">
                {!isOpen && (
                    <div
                        className="chat-button ai-chat-button"
                        onClick={() => setIsOpen(true)}
                    >
                        <div className="chat-icon">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22H2L4.92893 19.0711C3.11929 17.2614 2 14.7614 2 12C2 6.47715 6.47715 2 12 2Z"
                                    fill="currentColor"
                                />
                                <circle cx="8.5" cy="12" r="1.5" fill="white" />
                                <circle
                                    cx="15.5"
                                    cy="12"
                                    r="1.5"
                                    fill="white"
                                />
                                <path
                                    d="M8 15C9 16 10.5 16.5 12 16.5C13.5 16.5 15 16 16 15"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="chat-pulse-ring"></div>
                    </div>
                )}

                {/* Simple AI Chat Panel */}
                {isOpen && (
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '80px',
                            right: '24px',
                            width: '350px',
                            height: '500px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            border: '1px solid #d9d9d9',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 1001,
                        }}
                    >
                        {/* Header với core colors */}
                        <div
                            style={{
                                padding: '16px',
                                background:
                                    'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: 'white',
                                borderRadius: '8px 8px 0 0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <RobotOutlined
                                    style={{
                                        fontSize: '18px',
                                        marginRight: '8px',
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: '500',
                                        fontSize: '14px',
                                    }}
                                >
                                    AI Trợ lý
                                </span>
                                <span
                                    style={{
                                        marginLeft: '8px',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: isRealtimeConnected
                                            ? '#22c55e'
                                            : '#ef4444',
                                        display: 'inline-block',
                                        boxShadow: isRealtimeConnected
                                            ? '0 0 6px rgba(34, 197, 94, 0.6)'
                                            : '0 0 6px rgba(239, 68, 68, 0.6)',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <Tooltip
                                    title={
                                        showSuggestions
                                            ? 'Ẩn gợi ý'
                                            : 'Hiện gợi ý'
                                    }
                                >
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={
                                            showSuggestions ? (
                                                <UpOutlined />
                                            ) : (
                                                <BulbOutlined />
                                            )
                                        }
                                        onClick={() =>
                                            setShowSuggestions(!showSuggestions)
                                        }
                                        style={{ color: 'white' }}
                                    />
                                </Tooltip>
                                <Tooltip title="Xóa cuộc trò chuyện">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={handleClearChat}
                                        style={{ color: 'white' }}
                                    />
                                </Tooltip>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => setIsOpen(false)}
                                    style={{ color: 'white' }}
                                />
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px',
                                backgroundColor: '#eff6ff',
                            }}
                        >
                            {messages.map((message, index) => (
                                <div
                                    key={message.id || index}
                                    className={`message ${message.type}`}
                                >
                                    <div className="message-avatar">
                                        <Avatar
                                            size="small"
                                            icon={
                                                message.type === 'user' ? (
                                                    <UserOutlined />
                                                ) : (
                                                    <RobotOutlined />
                                                )
                                            }
                                            style={{
                                                backgroundColor:
                                                    message.type === 'user'
                                                        ? '#1890ff'
                                                        : '#52c41a',
                                            }}
                                        />
                                    </div>
                                    <div className="message-content">
                                        <div
                                            className={`message-bubble ${message.type}`}
                                        >
                                            {message.type === 'ai' &&
                                            message.isMarkdown ? (
                                                <MarkdownRenderer
                                                    content={message.content}
                                                />
                                            ) : (
                                                message.content
                                            )}
                                            {message.success === false && (
                                                <Tag
                                                    color="red"
                                                    size="small"
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    Lỗi
                                                </Tag>
                                            )}

                                            {/* Clean Metadata Display for AI messages */}
                                            {message.type === 'ai' &&
                                                message.metadata &&
                                                hasDisplayableMetadata(
                                                    message.metadata
                                                ) && (
                                                    <div
                                                        style={{
                                                            marginTop: '12px',
                                                        }}
                                                    >
                                                        <MetadataDisplay
                                                            metadata={
                                                                message.metadata
                                                            }
                                                            onProductClick={(
                                                                slug
                                                            ) => {
                                                                // Navigate to product detail by slug
                                                                window.location.href = `/product/${slug}`
                                                            }}
                                                            onCouponApply={(
                                                                code
                                                            ) => {
                                                                navigator.clipboard.writeText(
                                                                    code
                                                                )
                                                                alert(
                                                                    `Đã copy mã "${code}" vào clipboard!`
                                                                )
                                                            }}
                                                            onViewMore={(
                                                                type
                                                            ) => {
                                                                if (
                                                                    type ===
                                                                    'products'
                                                                ) {
                                                                    window.location.href =
                                                                        '/shop'
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                        </div>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: '10px' }}
                                        >
                                            {new Date(
                                                message.timestamp
                                            ).toLocaleTimeString('vi-VN')}
                                        </Text>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="message ai">
                                    <div className="message-avatar">
                                        <Avatar
                                            size="small"
                                            icon={<LoadingOutlined />}
                                            style={{
                                                backgroundColor: '#52c41a',
                                            }}
                                        />
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble ai">
                                            <Spin size="small" /> Đang suy
                                            nghĩ...
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Improved Suggestions Panel */}
                        {showSuggestions && (
                            <div
                                style={{
                                    borderTop: '1px solid #e2e8f0',
                                    padding: '12px',
                                    backgroundColor: '#f8fafc',
                                    maxHeight: '120px',
                                    overflowY: 'auto',
                                    animation: 'slideDown 0.2s ease-out',
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#475569',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <BulbOutlined
                                        style={{
                                            fontSize: '12px',
                                            color: '#f59e0b',
                                        }}
                                    />
                                    Gợi ý cho bạn:
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                    }}
                                >
                                    {chatService
                                        .getSuggestedQuestions()
                                        .map((question, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    handleSuggestedQuestion(
                                                        question
                                                    )
                                                }
                                                style={{
                                                    padding: '8px 12px',
                                                    fontSize: '11px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'white',
                                                    color: '#374151',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    minHeight: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow:
                                                        '0 1px 2px rgba(0, 0, 0, 0.05)',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor =
                                                        '#f1f5f9'
                                                    e.target.style.borderColor =
                                                        '#2563eb'
                                                    e.target.style.transform =
                                                        'translateY(-1px)'
                                                    e.target.style.boxShadow =
                                                        '0 2px 4px rgba(0, 0, 0, 0.1)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor =
                                                        'white'
                                                    e.target.style.borderColor =
                                                        '#cbd5e1'
                                                    e.target.style.transform =
                                                        'translateY(0px)'
                                                    e.target.style.boxShadow =
                                                        '0 1px 2px rgba(0, 0, 0, 0.05)'
                                                }}
                                            >
                                                {question}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div
                            style={{
                                padding: '16px',
                                borderTop: '1px solid #bfdbfe',
                                backgroundColor: 'white',
                            }}
                        >
                            <Space.Compact style={{ width: '100%' }}>
                                <TextArea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) =>
                                        setInputValue(e.target.value)
                                    }
                                    onPressEnter={handleKeyPress}
                                    placeholder="Nhập tin nhắn..."
                                    autoSize={{ minRows: 1, maxRows: 2 }}
                                    style={{ resize: 'none' }}
                                />
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSendMessage}
                                    loading={isLoading}
                                    disabled={!inputValue.trim()}
                                />
                            </Space.Compact>

                            <div
                                style={{
                                    marginTop: '8px',
                                    fontSize: '10px',
                                    color: '#9ca3af',
                                    textAlign: 'center',
                                    lineHeight: '1.4',
                                }}
                            >
                                <div style={{ marginBottom: '2px' }}>
                                    Nhấn Enter để gửi
                                </div>
                                <div
                                    style={{
                                        fontSize: '9px',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    AI responses may contain errors. Please
                                    verify important information.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default AIChatWidget
