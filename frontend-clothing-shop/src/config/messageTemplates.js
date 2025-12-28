// User Message Templates - Theo yêu cầu ban đầu của bạn
export const quickTemplates = {
    // Templates chính theo yêu cầu của bạn
    userTemplates: [
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
    ],

    // Helper functions
    getTemplatesByContext(context, isLoggedIn = false) {
        return quickTemplates.userTemplates.filter(template => {
            // Filter by auth requirement
            if (template.requireAuth && !isLoggedIn) {
                return false
            }
            return true
        })
    },

    getAllTemplates() {
        return quickTemplates.userTemplates
    }
}

// Helper functions for template management
export const templateHelpers = {
    // Get templates by context (current page)
    getTemplatesByContext(context) {
        const relevantTemplates = []
        
        Object.keys(messageTemplates).forEach(categoryKey => {
            const category = messageTemplates[categoryKey]
            const filtered = category.templates.filter(template => 
                template.context.includes(context) || template.context.includes('any')
            )
            if (filtered.length > 0) {
                relevantTemplates.push({
                    ...category,
                    templates: filtered
                })
            }
        })
        
        return relevantTemplates
    },

    // Get templates by keyword search
    searchTemplates(query) {
        const results = []
        const lowerQuery = query.toLowerCase()
        
        Object.keys(messageTemplates).forEach(categoryKey => {
            const category = messageTemplates[categoryKey]
            const matching = category.templates.filter(template => 
                template.keywords.some(keyword => 
                    keyword.toLowerCase().includes(lowerQuery)
                ) || 
                template.text.toLowerCase().includes(lowerQuery) ||
                template.description.toLowerCase().includes(lowerQuery)
            )
            if (matching.length > 0) {
                results.push({
                    ...category,
                    templates: matching
                })
            }
        })
        
        return results
    },

    // Process template with placeholder replacement
    processTemplate(template, replacements = {}) {
        let processedText = template.text
        
        if (template.hasPlaceholder && replacements[template.placeholder]) {
            processedText = processedText.replace(
                `{${template.placeholder}}`, 
                replacements[template.placeholder]
            )
        }
        
        return {
            ...template,
            processedText,
            originalText: template.text
        }
    },

    // Get all templates as flat array
    getAllTemplates() {
        const allTemplates = []
        
        Object.keys(messageTemplates).forEach(categoryKey => {
            const category = messageTemplates[categoryKey]
            category.templates.forEach(template => {
                allTemplates.push({
                    ...template,
                    categoryKey,
                    categoryName: category.category,
                    categoryIcon: category.icon,
                    categoryColor: category.color
                })
            })
        })
        
        return allTemplates
    },

    // Check if user is authorized for template
    canUseTemplate(template, isLoggedIn = false) {
        if (template.requireAuth && !isLoggedIn) {
            return false
        }
        return true
    },

    // Get suggested templates based on current state
    getSuggestedTemplates(context, searchQuery = '', isLoggedIn = false, limit = 6) {
        let suggested = []
        
        if (searchQuery) {
            suggested = this.searchTemplates(searchQuery)
        } else {
            suggested = this.getTemplatesByContext(context)
        }
        
        // Flatten and filter
        const flatTemplates = []
        suggested.forEach(category => {
            category.templates.forEach(template => {
                if (this.canUseTemplate(template, isLoggedIn)) {
                    flatTemplates.push({
                        ...template,
                        categoryName: category.category,
                        categoryIcon: category.icon,
                        categoryColor: category.color
                    })
                }
            })
        })
        
        // Sort by relevance and limit
        return flatTemplates.slice(0, limit)
    }
}