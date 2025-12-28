
import dayjs from 'dayjs'
import { DATE_FORMATS } from '../constants'

/**
 * Transform data từ form format (usr_*) sang API format (no prefix)
 * Backend expects: { name, email, password, phone, sex, dateOfBirth, role, status, addresses, avatar }
 */
export const transformToApiFormat = (formData, prefix) => {
    const transformed = {}
    
    Object.keys(formData).forEach(key => {
        // Loại bỏ prefix usr_ 
        const apiKey = key.startsWith(prefix) ? key.replace(prefix, '') : key
        
        let value = formData[key]
        
        // Transform date thành ISO string
        if (value && dayjs.isDayjs(value)) {
            value = value.toISOString()
        }
        
        // Transform field names theo backend
        // usr_date_of_birth → dateOfBirth (camelCase)
        const camelCaseKey = apiKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        
        // Chỉ thêm vào nếu value không undefined
        if (value !== undefined) {
            transformed[camelCaseKey] = value
        }
    })
    
    return transformed
}

/**
 * Transform data từ API format sang form format (thêm usr_ prefix)
 */
export const transformToFormFormat = (apiData, prefix) => {
    if (!apiData) return null
    
    const transformed = {}
    
    Object.keys(apiData).forEach(key => {
        // Thêm prefix usr_ nếu chưa có
        const formKey = key.startsWith(prefix) ? key : `${prefix}${key}`
        
        let value = apiData[key]
        
        // Transform date string thành dayjs object
        if (key.includes('date') || key.includes('Date') || key.includes('birth')) {
            value = value ? dayjs(value) : null
        }
        
        transformed[formKey] = value
    })
    
    return transformed
}

/**
 * Format date cho hiển thị
 */
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
    if (!date) return '-'
    return dayjs(date).format(format)
}