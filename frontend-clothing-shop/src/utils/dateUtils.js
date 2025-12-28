// utils/dateUtils.js
export const formatDate = (dateString) => {
    if (!dateString) return ''
    
    try {
        const date = new Date(dateString)
        
        // Check if date is valid
        if (isNaN(date.getTime())) return ''
        
        // Format to Vietnamese locale
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch (error) {
        console.error('Error formatting date:', error)
        return ''
    }
}

export const formatDateTime = (dateString) => {
    if (!dateString) return ''
    
    try {
        const date = new Date(dateString)
        
        // Check if date is valid
        if (isNaN(date.getTime())) return ''
        
        // Format to Vietnamese locale with time
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        console.error('Error formatting datetime:', error)
        return ''
    }
}

export const getTimeAgo = (dateString) => {
    if (!dateString) return ''
    
    try {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        
        const diffSeconds = Math.floor(diffMs / 1000)
        const diffMinutes = Math.floor(diffSeconds / 60)
        const diffHours = Math.floor(diffMinutes / 60)
        const diffDays = Math.floor(diffHours / 24)
        const diffWeeks = Math.floor(diffDays / 7)
        const diffMonths = Math.floor(diffDays / 30)
        const diffYears = Math.floor(diffDays / 365)
        
        if (diffSeconds < 60) return 'Vừa xong'
        if (diffMinutes < 60) return `${diffMinutes} phút trước`
        if (diffHours < 24) return `${diffHours} giờ trước`
        if (diffDays < 7) return `${diffDays} ngày trước`
        if (diffWeeks < 4) return `${diffWeeks} tuần trước`
        if (diffMonths < 12) return `${diffMonths} tháng trước`
        return `${diffYears} năm trước`
    } catch (error) {
        console.error('Error calculating time ago:', error)
        return ''
    }
}