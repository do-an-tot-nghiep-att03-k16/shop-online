// Utility functions for slug handling

export const createSlug = (text) => {
    if (!text) return ''
    
    return text
        .toLowerCase()
        .normalize('NFD') // Normalize unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
}

export const slugToName = (slug) => {
    if (!slug) return ''
    
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

// Create category slug-to-id mapping
export const createCategoryMapping = (categories) => {
    const slugToId = {}
    const idToSlug = {}
    
    if (Array.isArray(categories)) {
        categories.forEach(category => {
            const slug = category.slug || createSlug(category.name)
            const id = category._id || category.category_id
            
            slugToId[slug] = id
            idToSlug[id] = slug
        })
    }
    
    return { slugToId, idToSlug }
}

// Gender mapping
export const genderMapping = {
    'nam': 'male',
    'nu': 'female', 
    'nữ': 'female',
    'unisex': 'unisex',
    'male': 'male',
    'female': 'female'
}

export const genderSlugMapping = {
    'male': 'nam',
    'female': 'nu',
    'unisex': 'unisex'
}

// Convert gender slug to backend value
export const mapGenderSlugToValue = (slug) => {
    const mapping = {
        'nam': 'male',
        'nu': 'female',
        'nữ': 'female', 
        'unisex': 'unisex',
        'male': 'male',
        'female': 'female'
    }
    return mapping[slug.toLowerCase()] || slug
}

export const getGenderDisplayName = (gender) => {
    switch(gender) {
        case 'male':
        case 'nam':
            return 'Nam'
        case 'female': 
        case 'nu':
        case 'nữ':
            return 'Nữ'
        case 'unisex':
            return 'Unisex'
        default:
            return gender
    }
}

// Create product slug from name and optional ID
export const createProductSlug = (product) => {
    if (product.slug) return product.slug
    
    const nameSlug = createSlug(product.name)
    const id = product._id || product.id
    
    // Add ID suffix to ensure uniqueness: ao-thun-123abc
    return id ? `${nameSlug}-${id.slice(-6)}` : nameSlug
}