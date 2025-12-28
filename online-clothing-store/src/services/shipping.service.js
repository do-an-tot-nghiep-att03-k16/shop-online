'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')

// Shipping providers configuration
const SHIPPING_PROVIDERS = {
  GIAO_HANG_NHANH: {
    id: 'ghn',
    name: 'Giao Hàng Nhanh',
    code: 'GHN',
    description: 'Giao hàng nhanh chóng, an toàn',
    tracking_url: 'https://tracking.ghn.vn/tracking/',
    features: ['cod', 'insurance', 'tracking'],
    delivery_time: '1-3 ngày',
    coverage: 'Toàn quốc'
  },
  GIAO_HANG_TIET_KIEM: {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm',
    code: 'GHTK',
    description: 'Tiết kiệm chi phí vận chuyển',
    tracking_url: 'https://khachhang.giaohangtietkiem.vn/khachhang/tra-cuu',
    features: ['cod', 'tracking'],
    delivery_time: '2-5 ngày',
    coverage: 'Toàn quốc'
  },
  VIETTEL_POST: {
    id: 'vtp',
    name: 'Viettel Post',
    code: 'VTP',
    description: 'Dịch vụ bưu chính uy tín',
    tracking_url: 'https://viettelpost.com.vn/tra-cuu',
    features: ['cod', 'insurance', 'tracking'],
    delivery_time: '2-4 ngày',
    coverage: 'Toàn quốc'
  },
  VNPOST: {
    id: 'vnpost',
    name: 'VNPost',
    code: 'VNPOST',
    description: 'Bưu điện Việt Nam',
    tracking_url: 'https://www.vnpost.vn/vi-vn/dinh-vi/buu-pham',
    features: ['cod', 'tracking'],
    delivery_time: '3-7 ngày',
    coverage: 'Toàn quốc'
  },
  J_T_EXPRESS: {
    id: 'jtx',
    name: 'J&T Express',
    code: 'JTX',
    description: 'Vận chuyển nhanh chóng',
    tracking_url: 'https://www.jtexpress.vn/track',
    features: ['cod', 'tracking'],
    delivery_time: '1-3 ngày',
    coverage: 'Toàn quốc'
  },
  SHOPEE_EXPRESS: {
    id: 'spx',
    name: 'Shopee Express',
    code: 'SPX',
    description: 'Giao hàng tiêu chuẩn Shopee',
    tracking_url: 'https://spx.vn/tracking',
    features: ['cod', 'tracking'],
    delivery_time: '2-4 ngày',
    coverage: 'Toàn quốc'
  },
  NHAT_TIN_LOGISTICS: {
    id: 'ntx',
    name: 'Nhật Tín Logistics',
    code: 'NTX',
    description: 'Dịch vụ logistics chuyên nghiệp',
    tracking_url: 'https://www.nhattinlogistics.com/tracking',
    features: ['cod', 'insurance', 'tracking'],
    delivery_time: '1-4 ngày',
    coverage: 'Toàn quốc'
  }
}

// Default shipping fees (VND)
const DEFAULT_SHIPPING_FEES = {
  ghn: {
    base_fee: 25000,
    per_km: 2000,
    insurance_rate: 0.005
  },
  ghtk: {
    base_fee: 20000,
    per_km: 1500,
    insurance_rate: 0.003
  },
  vtp: {
    base_fee: 22000,
    per_km: 1800,
    insurance_rate: 0.004
  },
  vnpost: {
    base_fee: 18000,
    per_km: 1200,
    insurance_rate: 0.002
  },
  jtx: {
    base_fee: 23000,
    per_km: 1700,
    insurance_rate: 0.003
  },
  spx: {
    base_fee: 21000,
    per_km: 1600,
    insurance_rate: 0.003
  },
  ntx: {
    base_fee: 26000,
    per_km: 2200,
    insurance_rate: 0.006
  }
}

class ShippingService {
    // Get all available shipping providers
    static async getProviders() {
        return Object.values(SHIPPING_PROVIDERS)
    }

    // Calculate shipping fee
    static async calculateFee({
        provider_id,
        to_address,
        weight = 1,
        order_value = 0,
        insurance = false
    }) {
        const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === provider_id)
        if (!provider) {
            throw new BadRequestError('Invalid shipping provider')
        }

        const fees = DEFAULT_SHIPPING_FEES[provider_id]
        if (!fees) {
            throw new BadRequestError('Shipping fees not configured for this provider')
        }

        // Simple calculation (in real app, use provider's API)
        // TEMPORARILY DISABLED: Set shipping fee to 0
        let shipping_fee = 0 // fees.base_fee
        
        // Add weight-based fee - DISABLED
        // if (weight > 1) {
        //     shipping_fee += (weight - 1) * 5000 // 5000 VND per additional kg
        // }

        // Add insurance if requested - DISABLED
        let insurance_fee = 0
        // if (insurance && order_value > 0) {
        //     insurance_fee = Math.max(order_value * fees.insurance_rate, 2000)
        // }

        const total_fee = shipping_fee + insurance_fee

        return {
            provider_id,
            provider_name: provider.name,
            shipping_fee,
            insurance_fee,
            total_fee,
            estimated_delivery_time: provider.delivery_time,
            features: provider.features
        }
    }

    // Generate tracking code
    static generateTrackingCode(provider_id) {
        const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === provider_id)
        if (!provider) {
            throw new BadRequestError('Invalid provider ID')
        }

        const timestamp = Date.now().toString().slice(-8)
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        
        switch (provider_id) {
            case 'ghn':
                return `GHN${timestamp}${random.slice(0, 2)}`
            case 'ghtk':
                const date = new Date()
                const year = date.getFullYear().toString().slice(-2)
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const day = date.getDate().toString().padStart(2, '0')
                return `GHTK${year}${month}${day}${random.slice(0, 2)}`
            case 'vtp':
                return `VT${timestamp}${random}`
            case 'vnpost':
                return `VN${timestamp.slice(-9)}${random}VN`
            case 'jtx':
                return `JT${timestamp}${random}`
            case 'spx':
                return `SPX${timestamp.slice(-6)}${random}`
            case 'ntx':
                const ntxDate = new Date()
                const ntxYear = ntxDate.getFullYear()
                const ntxMonth = (ntxDate.getMonth() + 1).toString().padStart(2, '0')
                const ntxDay = ntxDate.getDate().toString().padStart(2, '0')
                return `NTX${ntxYear}${ntxMonth}${ntxDay}${random}`
            default:
                return `${provider.code}${timestamp}${random.slice(0, 3)}`
        }
    }

    // Create shipping order
    static async createShippingOrder({
        order_id,
        provider_id,
        from_address,
        to_address,
        items,
        cod_amount = 0,
        insurance_value = 0,
        note = ''
    }) {
        const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === provider_id)
        if (!provider) {
            throw new BadRequestError('Invalid shipping provider')
        }

        // Generate tracking code
        const tracking_code = this.generateTrackingCode(provider_id)
        
        // In real implementation, call shipping provider's API to create order
        const shippingOrder = {
            tracking_code,
            provider_id,
            provider_name: provider.name,
            order_id,
            from_address,
            to_address,
            items,
            cod_amount,
            insurance_value,
            note,
            status: 'pending',
            created_at: new Date(),
            estimated_delivery: this.calculateEstimatedDelivery(provider_id)
        }

        // Here you would save to database
        // await ShippingOrder.create(shippingOrder)

        return shippingOrder
    }

    // Track shipping order
    static async trackOrder(trackingCode) {
        // Get provider from tracking code
        const provider = this.getProviderFromCode(trackingCode)
        if (!provider) {
            throw new BadRequestError('Invalid tracking code format')
        }

        // In real implementation, call shipping provider's tracking API
        // Mock tracking data for demo
        const mockTrackingData = {
            tracking_code: trackingCode,
            provider_id: provider.id,
            provider_name: provider.name,
            status: 'in_transit',
            tracking_url: `${provider.tracking_url}${trackingCode}`,
            events: [
                {
                    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Kho gửi hàng',
                    description: 'Đơn hàng đã được tạo',
                    status: 'pending'
                },
                {
                    time: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Trung tâm phân loại Hà Nội',
                    description: 'Hàng đã được lấy và đang xử lý',
                    status: 'picked_up'
                },
                {
                    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Trung tâm vận chuyển',
                    description: 'Hàng đang trên đường vận chuyển',
                    status: 'in_transit'
                }
            ],
            estimated_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            current_location: 'Đang vận chuyển đến TP.HCM'
        }

        return mockTrackingData
    }

    // Update shipping status
    static async updateStatus(trackingCode, updateData) {
        const { status, location, description, updated_by } = updateData

        // In real implementation, update database
        const updatedData = {
            tracking_code: trackingCode,
            status,
            location,
            description,
            updated_by,
            updated_at: new Date()
        }

        return updatedData
    }

    // Cancel shipping order
    static async cancelOrder(trackingCode, reason, userId) {
        // In real implementation, call provider's API to cancel
        const cancelData = {
            tracking_code: trackingCode,
            status: 'cancelled',
            reason,
            cancelled_by: userId,
            cancelled_at: new Date()
        }

        return cancelData
    }

    // Get providers for location
    static async getProvidersForLocation({ province_id, ward_id }) {
        // In real implementation, filter providers based on location coverage
        // For now, return all providers as they support nationwide delivery
        return Object.values(SHIPPING_PROVIDERS)
    }

    // Get shipping rates
    static async getRates({
        from_address,
        to_address,
        weight = 1,
        dimensions,
        order_value = 0
    }) {
        const providers = Object.values(SHIPPING_PROVIDERS)
        const rates = []

        for (const provider of providers) {
            try {
                const rate = await this.calculateFee({
                    provider_id: provider.id,
                    to_address,
                    weight,
                    order_value,
                    insurance: order_value > 1000000
                })
                rates.push(rate)
            } catch (error) {
                console.error(`Error calculating rate for ${provider.name}:`, error.message)
            }
        }

        return rates
    }

    // Handle webhook from shipping providers
    static async handleWebhook(provider, webhookData) {
        // In real implementation, parse webhook data and update order status
        // console.log(`Received webhook from ${provider}:`, webhookData)
        
        // Process webhook data based on provider format
        // Update tracking status in database
        // Notify customer if needed

        return {
            provider,
            processed: true,
            timestamp: new Date()
        }
    }

    // Validate tracking code format
    static validateTrackingCode(trackingCode) {
        if (!trackingCode || typeof trackingCode !== 'string') {
            return { valid: false, reason: 'Invalid tracking code format' }
        }

        const provider = this.getProviderFromCode(trackingCode)
        if (!provider) {
            return { valid: false, reason: 'Unsupported provider or invalid format' }
        }

        return {
            valid: true,
            provider: provider,
            tracking_code: trackingCode
        }
    }

    // Get provider from tracking code
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

    // Calculate estimated delivery date
    static calculateEstimatedDelivery(provider_id) {
        const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === provider_id)
        if (!provider) return null

        const now = new Date()
        const deliveryTime = provider.delivery_time

        // Parse delivery time and calculate estimated date
        let days = 3 // default
        if (deliveryTime.includes('1-3')) days = 2
        else if (deliveryTime.includes('2-4')) days = 3
        else if (deliveryTime.includes('2-5')) days = 4
        else if (deliveryTime.includes('3-7')) days = 5

        const estimatedDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        return estimatedDate.toISOString().split('T')[0]
    }
}

module.exports = ShippingService