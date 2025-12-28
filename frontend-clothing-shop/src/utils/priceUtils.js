/**
 * Format price to Vietnamese currency
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  const numPrice = typeof price === 'object' ? 0 : (price || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice)
}

/**
 * Parse price string to number
 * @param {string} priceStr - Price string
 * @returns {number} Price number
 */
export const parsePrice = (priceStr) => {
  if (typeof priceStr === 'number') return priceStr
  return parseFloat(priceStr?.replace(/[^\d.-]/g, '') || '0')
}

export default {
  formatPrice,
  parsePrice
}