// Message Template Panel - UI component for template suggestions
import React, { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { messageTemplates, templateHelpers } from '../../config/messageTemplates'

const MessageTemplatePanel = ({ 
    onSelectTemplate, 
    currentContext = 'shop',
    isLoggedIn = false,
    searchQuery = '',
    onSearchChange,
    isVisible = true 
}) => {
    const [expandedCategories, setExpandedCategories] = useState(new Set(['productSearch', 'orderTracking']))
    const [placeholderValues, setPlaceholderValues] = useState({})

    // Get suggested templates based on context and search
    const suggestedTemplates = useMemo(() => {
        return templateHelpers.getSuggestedTemplates(currentContext, searchQuery, isLoggedIn, 12)
    }, [currentContext, searchQuery, isLoggedIn])

    // Group templates by category
    const groupedTemplates = useMemo(() => {
        const grouped = {}
        
        if (searchQuery) {
            // If searching, show flat results
            return {
                searchResults: {
                    category: 'Kết quả tìm kiếm',
                    icon: '🔍',
                    color: 'bg-gray-50 border-gray-200 text-gray-700',
                    templates: suggestedTemplates
                }
            }
        }

        // Group by category
        Object.keys(messageTemplates).forEach(categoryKey => {
            const category = messageTemplates[categoryKey]
            const relevantTemplates = category.templates.filter(template => 
                templateHelpers.canUseTemplate(template, isLoggedIn) &&
                (template.context.includes(currentContext) || template.context.includes('any'))
            )
            
            if (relevantTemplates.length > 0) {
                grouped[categoryKey] = {
                    ...category,
                    templates: relevantTemplates
                }
            }
        })
        
        return grouped
    }, [currentContext, isLoggedIn, searchQuery, suggestedTemplates])

    const toggleCategory = (categoryKey) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryKey)) {
            newExpanded.delete(categoryKey)
        } else {
            newExpanded.add(categoryKey)
        }
        setExpandedCategories(newExpanded)
    }

    const handleTemplateSelect = (template) => {
        if (template.hasPlaceholder) {
            const placeholderValue = placeholderValues[template.id]
            if (!placeholderValue) {
                // Show placeholder input
                setPlaceholderValues(prev => ({ ...prev, [template.id]: '' }))
                return
            }
            
            // Process template with placeholder
            const processed = templateHelpers.processTemplate(template, {
                [template.placeholder]: placeholderValue
            })
            onSelectTemplate(processed.processedText, template)
            
            // Reset placeholder
            setPlaceholderValues(prev => {
                const newValues = { ...prev }
                delete newValues[template.id]
                return newValues
            })
        } else {
            onSelectTemplate(template.text, template)
        }
    }

    const handlePlaceholderChange = (templateId, value) => {
        setPlaceholderValues(prev => ({ ...prev, [templateId]: value }))
    }

    const renderTemplate = (template) => {
        const needsPlaceholder = template.hasPlaceholder && !placeholderValues[template.id]
        const isDestructive = template.isDestructive
        const requiresAuth = template.requireAuth && !isLoggedIn

        return (
            <div key={template.id} className="mb-2">
                <div
                    className={`
                        p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${requiresAuth 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                            : isDestructive
                                ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }
                        ${needsPlaceholder ? 'border-dashed' : ''}
                    `}
                    onClick={() => !requiresAuth && handleTemplateSelect(template)}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${requiresAuth ? 'text-gray-400' : ''}`}>
                                {template.text}
                                {template.hasPlaceholder && (
                                    <span className="text-xs text-blue-600 ml-1">
                                        (ví dụ: {template.placeholderExample})
                                    </span>
                                )}
                            </p>
                            <p className={`text-xs mt-1 ${requiresAuth ? 'text-gray-300' : 'text-gray-500'}`}>
                                {template.description}
                            </p>
                            
                            {requiresAuth && (
                                <div className="flex items-center mt-2 text-xs text-gray-400">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Yêu cầu đăng nhập
                                </div>
                            )}
                            
                            {isDestructive && !requiresAuth && (
                                <div className="flex items-center mt-2 text-xs text-red-500">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Hành động này không thể hoàn tác
                                </div>
                            )}
                        </div>
                        
                        {template.hasPlaceholder && (
                            <div className="ml-2 text-blue-500">
                                <span className="text-xs">📝</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Placeholder Input */}
                {template.hasPlaceholder && placeholderValues.hasOwnProperty(template.id) && (
                    <div className="mt-2 ml-4 p-2 bg-blue-50 rounded border border-blue-200">
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                            Nhập {template.placeholder} (ví dụ: {template.placeholderExample}):
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={placeholderValues[template.id] || ''}
                                onChange={(e) => handlePlaceholderChange(template.id, e.target.value)}
                                placeholder={template.placeholderExample}
                                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && placeholderValues[template.id]) {
                                        handleTemplateSelect(template)
                                    }
                                }}
                            />
                            <button
                                onClick={() => handleTemplateSelect(template)}
                                disabled={!placeholderValues[template.id]}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const renderCategory = (categoryKey, category) => {
        const isExpanded = expandedCategories.has(categoryKey)
        
        return (
            <div key={categoryKey} className="mb-4">
                <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                    <div className="flex items-center">
                        <span className="mr-2 text-lg">{category.icon}</span>
                        <span className="font-medium text-gray-700">{category.category}</span>
                        <span className="ml-2 text-xs text-gray-500">({category.templates.length})</span>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                
                {isExpanded && (
                    <div className="mt-3 ml-4 space-y-2">
                        {category.templates.map(renderTemplate)}
                    </div>
                )}
            </div>
        )
    }

    if (!isVisible || Object.keys(groupedTemplates).length === 0) {
        return null
    }

    return (
        <div className="p-4 border-t border-gray-200 bg-gray-50 max-h-96 overflow-y-auto">
            {/* Search Input */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Tìm kiếm template..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Header */}
            <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                    {searchQuery ? 'Kết quả tìm kiếm' : 'Gợi ý tin nhắn'}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                    Chọn template để gửi tin nhắn nhanh
                </p>
            </div>

            {/* Templates */}
            <div className="space-y-3">
                {Object.keys(groupedTemplates).map(categoryKey => 
                    renderCategory(categoryKey, groupedTemplates[categoryKey])
                )}
            </div>

            {/* Context Info */}
            <div className="mt-4 pt-3 border-t border-gray-300">
                <p className="text-xs text-gray-500">
                    📍 Trang hiện tại: <span className="font-medium">{currentContext}</span>
                    {!isLoggedIn && (
                        <span className="ml-2 text-yellow-600">• Chưa đăng nhập</span>
                    )}
                </p>
            </div>
        </div>
    )
}

export default MessageTemplatePanel