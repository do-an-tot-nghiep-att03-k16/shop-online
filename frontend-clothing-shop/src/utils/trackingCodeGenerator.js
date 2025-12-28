import { SHIPPING_PROVIDERS } from '../constants/shipping'

/**
 * Generate tracking code for different shipping providers
 */
export class TrackingCodeGenerator {
  /**
   * Generate tracking code based on provider
   * @param {string} providerId - Shipping provider ID
   * @param {Object} options - Additional options
   * @returns {string} Generated tracking code
   */
  static generate(providerId, options = {}) {
    const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === providerId)
    if (!provider) {
      throw new Error(`Invalid provider ID: ${providerId}`)
    }

    switch (providerId) {
      case 'ghn':
        return this.generateGHNCode(options)
      case 'ghtk':
        return this.generateGHTKCode(options)
      case 'vtp':
        return this.generateVTPCode(options)
      case 'vnpost':
        return this.generateVNPostCode(options)
      case 'jtx':
        return this.generateJTCode(options)
      case 'spx':
        return this.generateSPXCode(options)
      case 'ntx':
        return this.generateNTXCode(options)
      default:
        return this.generateGenericCode(provider.code, options)
    }
  }

  /**
   * Generate GHN (Giao Hang Nhanh) tracking code
   * Format: GHN + 10 digits
   */
  static generateGHNCode(options = {}) {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString().slice(-4)
    return `GHN${timestamp}${random}`
  }

  /**
   * Generate GHTK (Giao Hang Tiet Kiem) tracking code
   * Format: GHTK + 8 digits
   */
  static generateGHTKCode(options = {}) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    return `GHTK${year}${month}${day}${random}`
  }

  /**
   * Generate VTP (Viettel Post) tracking code
   * Format: VT + 12 digits
   */
  static generateVTPCode(options = {}) {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `VT${timestamp}${random}`
  }

  /**
   * Generate VNPost tracking code
   * Format: VN + 13 digits + VN
   */
  static generateVNPostCode(options = {}) {
    const timestamp = Date.now().toString().slice(-9)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `VN${timestamp}${random}VN`
  }

  /**
   * Generate J&T Express tracking code
   * Format: JT + 12 digits
   */
  static generateJTCode(options = {}) {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `JT${timestamp}${random}`
  }

  /**
   * Generate Shopee Express tracking code
   * Format: SPX + 10 digits
   */
  static generateSPXCode(options = {}) {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `SPX${timestamp}${random}`
  }

  /**
   * Generate Nhat Tin Logistics tracking code
   * Format: NTX + YYYYMMDD + 4 digits
   */
  static generateNTXCode(options = {}) {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `NTX${year}${month}${day}${random}`
  }

  /**
   * Generate generic tracking code
   * Format: CODE + timestamp + random
   */
  static generateGenericCode(providerCode, options = {}) {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${providerCode}${timestamp}${random}`
  }

  /**
   * Validate tracking code format
   * @param {string} trackingCode - Tracking code to validate
   * @param {string} providerId - Provider ID to validate against
   * @returns {boolean} Is valid
   */
  static validate(trackingCode, providerId) {
    if (!trackingCode || typeof trackingCode !== 'string') {
      return false
    }

    const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === providerId)
    if (!provider) {
      return false
    }

    switch (providerId) {
      case 'ghn':
        return /^GHN\d{10}$/.test(trackingCode)
      case 'ghtk':
        return /^GHTK\d{8}$/.test(trackingCode)
      case 'vtp':
        return /^VT\d{12}$/.test(trackingCode)
      case 'vnpost':
        return /^VN\d{13}VN$/.test(trackingCode)
      case 'jtx':
        return /^JT\d{12}$/.test(trackingCode)
      case 'spx':
        return /^SPX\d{10}$/.test(trackingCode)
      case 'ntx':
        return /^NTX\d{12}$/.test(trackingCode)
      default:
        return trackingCode.startsWith(provider.code)
    }
  }

  /**
   * Get provider from tracking code
   * @param {string} trackingCode - Tracking code
   * @returns {Object|null} Provider object or null
   */
  static getProviderFromCode(trackingCode) {
    if (!trackingCode || typeof trackingCode !== 'string') {
      return null
    }

    const upperCode = trackingCode.toUpperCase()

    if (upperCode.startsWith('GHN')) return SHIPPING_PROVIDERS.GIAO_HANG_NHANH
    if (upperCode.startsWith('GHTK')) return SHIPPING_PROVIDERS.GIAO_HANG_TIET_KIEM
    if (upperCode.startsWith('VT')) return SHIPPING_PROVIDERS.VIETTEL_POST
    if (upperCode.startsWith('VN') && upperCode.endsWith('VN')) return SHIPPING_PROVIDERS.VNPOST
    if (upperCode.startsWith('JT')) return SHIPPING_PROVIDERS.J_T_EXPRESS
    if (upperCode.startsWith('SPX')) return SHIPPING_PROVIDERS.SHOPEE_EXPRESS
    if (upperCode.startsWith('NTX')) return SHIPPING_PROVIDERS.NHAT_TIN_LOGISTICS

    return null
  }

  /**
   * Generate multiple tracking codes
   * @param {string} providerId - Provider ID
   * @param {number} count - Number of codes to generate
   * @returns {Array<string>} Array of tracking codes
   */
  static generateMultiple(providerId, count = 1) {
    const codes = []
    for (let i = 0; i < count; i++) {
      codes.push(this.generate(providerId))
      // Add small delay to ensure unique timestamps
      if (i < count - 1) {
        const now = Date.now()
        while (Date.now() - now < 1) {
          // Wait 1ms
        }
      }
    }
    return codes
  }
}

export default TrackingCodeGenerator