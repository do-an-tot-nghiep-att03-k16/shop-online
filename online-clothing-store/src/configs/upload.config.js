'use strict'

const uploadRules = {
    avatar: {
        allowedMime: ['image/jpeg', 'image/png'],
        maxSize: 10 * 1024 * 1024,
    },
    category: {
        allowedMime: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 10 * 1024 * 1024,
    },
    product: {
        allowedMime: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 10 * 1024 * 1024, // 5MB
        maxCount: 10, // Tối đa 10 ảnh mỗi lần upload
    },
}

module.exports = uploadRules
