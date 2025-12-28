// Simple Template Panel - Compact UI for chat widget
import React, { useState } from 'react'

// 7 templates của bạn - inline để tránh import issues
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

const SimpleTemplatePanel = ({ 
    onSelectTemplate, 
    currentContext = 'shop',
    isLoggedIn = false,
    onClose
}) => {
    const [placeholderInputs, setPlaceholderInputs] = useState({})

    // Get relevant templates based on auth
    const getRelevantTemplates = () => {
        return userTemplates.filter(template => 
            !template.requireAuth || isLoggedIn
        )
    }

    const templates = getRelevantTemplates()

    const handleTemplateClick = (template) => {
        if (template.hasPlaceholder) {
            const inputValue = placeholderInputs[template.id]
            if (!inputValue) {
                // Show placeholder input
                setPlaceholderInputs(prev => ({ ...prev, [template.id]: '' }))
                return
            }
            
            // Process template with placeholder
            const processedMessage = template.message.replace(
                `{${template.placeholder}}`, 
                inputValue
            )
            onSelectTemplate(processedMessage, template)
            
            // Reset input
            setPlaceholderInputs(prev => {
                const newInputs = { ...prev }
                delete newInputs[template.id]
                return newInputs
            })
        } else {
            onSelectTemplate(template.message || template.text, template)
        }
        onClose?.()
    }

    const handlePlaceholderChange = (templateId, value) => {
        setPlaceholderInputs(prev => ({ ...prev, [templateId]: value }))
    }

    const renderTemplate = (template, isCommon = false) => {
        const needsInput = template.hasPlaceholder && placeholderInputs.hasOwnProperty(template.id)
        const hasInput = placeholderInputs[template.id]

        return (
            <div key={template.id} className="mb-2">
                {/* Template Button */}
                <button
                    onClick={() => handleTemplateClick(template)}
                    disabled={template.requireAuth && !isLoggedIn}
                    className={`
                        w-full p-2 text-left text-sm rounded-lg border transition-colors
                        ${template.requireAuth && !isLoggedIn
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            : needsInput
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                        }
                        ${isCommon ? 'font-medium' : ''}
                    `}
                >
                    <div className="flex items-center justify-between">
                        <span className="flex items-center">
                            {isCommon && template.icon && (
                                <span className="mr-2">{template.icon}</span>
                            )}
                            {template.text}
                        </span>
                        {template.hasPlaceholder && (
                            <span className="text-xs text-blue-500">📝</span>
                        )}
                        {template.requireAuth && !isLoggedIn && (
                            <span className="text-xs text-gray-400">🔒</span>
                        )}
                    </div>
                </button>

                {/* Placeholder Input */}
                {needsInput && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={placeholderInputs[template.id] || ''}
                                onChange={(e) => handlePlaceholderChange(template.id, e.target.value)}
                                placeholder={template.placeholderExample}
                                className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && hasInput) {
                                        handleTemplateClick(template)
                                    }
                                }}
                                autoFocus
                            />
                            <button
                                onClick={() => handleTemplateClick(template)}
                                disabled={!hasInput}
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

    return (
        <div className="border-t border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="p-3 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-blue-700">
                        ✨ Gợi ý tin nhắn
                    </h4>
                    <span className="text-xs text-blue-600">
                        {currentContext === 'product' ? '👕' : 
                         currentContext === 'orders' ? '📦' : 
                         currentContext === 'cart' ? '🛒' : '🏪'} {currentContext}
                    </span>
                </div>
            </div>

            {/* Templates */}
            <div className="p-3 max-h-64 overflow-y-auto">
                {templates.length > 0 ? (
                    <div className="space-y-2">
                        {templates.map(template => renderTemplate(template, true))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-4">
                        <span className="text-2xl mb-2 block">💬</span>
                        <p className="text-xs">Không có template khả dụng</p>
                        {!isLoggedIn && (
                            <p className="text-xs mt-1">Đăng nhập để xem thêm tùy chọn</p>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-gray-100 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    Nhấn template để gửi tin nhắn nhanh
                </p>
            </div>
        </div>
    )
}

export default SimpleTemplatePanel