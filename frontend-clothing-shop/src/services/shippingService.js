import apiClient from '../config/apiClient'
import { SHIPPING_PROVIDERS, DEFAULT_SHIPPING_FEES } from '../constants/shipping'
import TrackingCodeGenerator from '../utils/trackingCodeGenerator'

class ShippingService {
  /**
   * Get available shipping providers
   * @returns {Promise<Array>} List of shipping providers
   */
  async getShippingProviders() {
    try {
      // In a real app, this might come from API
      // For now, return the static providers list
      return {
        success: true,
        data: Object.values(SHIPPING_PROVIDERS)
      }
    } catch (error) {
      console.error('Error fetching shipping providers:', error)
      throw error
    }
  }

  /**
   * Calculate shipping fee
   * @param {Object} shippingData - Shipping calculation data
   * @returns {Promise<Object>} Shipping fee calculation
   */
  async calculateShippingFee(shippingData) {
    try {
      const {
        provider_id,
        from_address,
        to_address,
        weight = 1,
        order_value = 0,
        insurance = false
      } = shippingData

      // In real implementation, this would call the shipping provider's API
      const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === provider_id)
      if (!provider) {
        throw new Error('Invalid shipping provider')
      }

      const fees = DEFAULT_SHIPPING_FEES[provider_id]
      if (!fees) {
        throw new Error('Shipping fees not configured for this provider')
      }

      // Simple calculation (in real app, use provider's API)
      let shipping_fee = fees.base_fee
      
      // Add weight-based fee
      if (weight > 1) {
        shipping_fee += (weight - 1) * 5000 // 5000 VND per additional kg
      }

      // Add insurance if requested
      let insurance_fee = 0
      if (insurance && order_value > 0) {
        insurance_fee = Math.max(order_value * fees.insurance_rate, 2000)
      }

      const total_fee = shipping_fee + insurance_fee

      return {
        success: true,
        data: {
          provider_id,
          provider_name: provider.name,
          shipping_fee,
          insurance_fee,
          total_fee,
          estimated_delivery_time: provider.delivery_time,
          features: provider.features
        }
      }
    } catch (error) {
      console.error('Error calculating shipping fee:', error)
      throw error
    }
  }

  /**
   * Create shipping order
   * @param {Object} shippingOrder - Shipping order data
   * @returns {Promise<Object>} Created shipping order
   */
  async createShippingOrder(shippingOrder) {
    try {
      const {
        order_id,
        provider_id,
        from_address,
        to_address,
        items,
        cod_amount = 0,
        insurance_value = 0,
        note = ''
      } = shippingOrder

      // Generate tracking code
      const tracking_code = TrackingCodeGenerator.generate(provider_id)
      
      // In real implementation, call shipping provider's API to create order
      const provider = Object.values(SHIPPING_PROVIDERS).find(p => p.id === provider_id)
      
      const shippingOrderData = {
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
        created_at: new Date().toISOString(),
        estimated_delivery: this.calculateEstimatedDelivery(provider_id)
      }

      return {
        success: true,
        data: shippingOrderData
      }
    } catch (error) {
      console.error('Error creating shipping order:', error)
      throw error
    }
  }

  /**
   * Track shipping order
   * @param {string} tracking_code - Tracking code
   * @returns {Promise<Object>} Tracking information
   */
  async trackShippingOrder(tracking_code) {
    try {
      // In real implementation, call shipping provider's tracking API
      const provider = TrackingCodeGenerator.getProviderFromCode(tracking_code)
      
      if (!provider) {
        throw new Error('Invalid tracking code format')
      }

      // Mock tracking data
      const mockTrackingData = {
        tracking_code,
        provider_id: provider.id,
        provider_name: provider.name,
        status: 'in_transit',
        tracking_url: `${provider.tracking_url}${tracking_code}`,
        events: [
          {
            time: '2024-01-15 09:00:00',
            location: 'Kho gửi hàng',
            description: 'Đơn hàng đã được tạo',
            status: 'pending'
          },
          {
            time: '2024-01-15 14:30:00',
            location: 'Trung tâm phân loại Hà Nội',
            description: 'Hàng đã được lấy và đang xử lý',
            status: 'picked_up'
          },
          {
            time: '2024-01-16 08:15:00',
            location: 'Trung tâm vận chuyển',
            description: 'Hàng đang trên đường vận chuyển',
            status: 'in_transit'
          }
        ],
        estimated_delivery: '2024-01-17',
        current_location: 'Đang vận chuyển đến TP.HCM'
      }

      return {
        success: true,
        data: mockTrackingData
      }
    } catch (error) {
      console.error('Error tracking shipping order:', error)
      throw error
    }
  }

  /**
   * Update shipping status
   * @param {string} tracking_code - Tracking code
   * @param {string} status - New status
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} Updated tracking info
   */
  async updateShippingStatus(tracking_code, status, details = {}) {
    try {
      // This would typically be called by webhook from shipping provider
      // or by admin panel
      
      const updateData = {
        tracking_code,
        status,
        updated_at: new Date().toISOString(),
        ...details
      }

      // In real implementation, update database and notify customer
      
      return {
        success: true,
        data: updateData
      }
    } catch (error) {
      console.error('Error updating shipping status:', error)
      throw error
    }
  }

  /**
   * Get shipping providers for location
   * @param {Object} location - Location data
   * @returns {Promise<Array>} Available providers for location
   */
  async getProvidersForLocation(location) {
    try {
      // In real implementation, filter providers based on location coverage
      const providers = Object.values(SHIPPING_PROVIDERS).filter(provider => {
        // All providers support nationwide delivery for now
        return provider.coverage === 'Toàn quốc'
      })

      return {
        success: true,
        data: providers
      }
    } catch (error) {
      console.error('Error getting providers for location:', error)
      throw error
    }
  }

  /**
   * Calculate estimated delivery date
   * @param {string} provider_id - Provider ID
   * @returns {string} Estimated delivery date
   */
  calculateEstimatedDelivery(provider_id) {
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

  /**
   * Cancel shipping order
   * @param {string} tracking_code - Tracking code
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelShippingOrder(tracking_code, reason) {
    try {
      // In real implementation, call provider's API to cancel
      
      const cancelData = {
        tracking_code,
        status: 'cancelled',
        reason,
        cancelled_at: new Date().toISOString()
      }

      return {
        success: true,
        data: cancelData
      }
    } catch (error) {
      console.error('Error cancelling shipping order:', error)
      throw error
    }
  }
}

export default new ShippingService()