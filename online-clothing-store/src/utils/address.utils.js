'use strict'

const Location = require('../models/location.model')
const { BadRequestError, NotFoundError } = require('../core/error.response')
const { removeUndefinedObject } = require('../utils')

class AddressUtils {
    
    /**
     * Validate và format address data từ client
     * @param {Object} addressData - Raw address data từ client
     * @returns {Object} - Formatted address data
     */
    static async validateAndFormatAddress(addressData) {
        const {
            full_name,
            phone,
            address_line,
            province_id,
            ward_id,
            type = 'home',
            is_default = false,
            note,
            postal_code
        } = addressData

        // Validate required fields (phone is optional)
        if (!full_name || !address_line || !province_id || !ward_id) {
            throw new BadRequestError('Missing required address fields: full_name, address_line, province_id, ward_id')
        }

        // Lấy thông tin location từ database
        const [province, ward] = await Promise.all([
            Location.findById(province_id),
            Location.findById(ward_id)
        ])

        if (!province || province.type !== 'province') {
            throw new NotFoundError('Invalid province ID')
        }

        if (!ward || ward.type !== 'ward') {
            throw new NotFoundError('Invalid ward ID')
        }

        // Validate hierarchy: ward phải thuộc province
        if (ward.province_code !== province.province_code) {
            throw new BadRequestError('Ward does not belong to the specified province')
        }

        // Format address object
        return removeUndefinedObject({
            full_name: full_name.trim(),
            phone: phone?.trim() || '', // Phone is optional
            address_line: address_line.trim(),
            province: {
                id: province._id,
                name: province.name,
                code: province.province_code
            },
            ward: {
                id: ward._id,
                name: ward.name,
                code: ward.ward_code
            },
            type,
            is_default,
            is_active: true,
            note: note?.trim() || '',
            country: 'Vietnam',
            postal_code: postal_code?.trim() || ''
        })
    }

    /**
     * Tạo full address string từ address object
     * @param {Object} address - Address object
     * @returns {String} - Full address string
     */
    static generateFullAddress(address) {
        const parts = [
            address.address_line,
            address.ward?.name || address.ward,
            address.province?.name || address.province
        ].filter(part => part && part.trim())

        return parts.join(', ')
    }

    /**
     * Convert user address sang order shipping address format
     * @param {Object} userAddress - Address từ user model
     * @returns {Object} - Shipping address cho order
     */
    static convertToShippingAddress(userAddress) {
        const shippingAddress = {
            full_name: userAddress.full_name,
            phone: userAddress.phone,
            address_line: userAddress.address_line,
            province: userAddress.province,
            ward: userAddress.ward,
            country: userAddress.country || 'Vietnam',
            postal_code: userAddress.postal_code || ''
        }

        // Generate full address
        shippingAddress.full_address = this.generateFullAddress(shippingAddress)

        return shippingAddress
    }

    /**
     * Lấy default address của user
     * @param {Object} user - User object
     * @returns {Object|null} - Default address or null
     */
    static getDefaultAddress(user) {
        if (!user.usr_addresses || user.usr_addresses.length === 0) {
            return null
        }

        // Tìm address có is_default = true
        let defaultAddress = user.usr_addresses.find(addr => addr.is_default && addr.is_active)
        
        // Nếu không có default, lấy address đầu tiên active
        if (!defaultAddress) {
            defaultAddress = user.usr_addresses.find(addr => addr.is_active)
        }

        return defaultAddress || null
    }

    /**
     * Set address làm default và unset các address khác
     * @param {Object} user - User object
     * @param {String} addressId - Address ID to set as default
     */
    static setDefaultAddress(user, addressId) {
        user.usr_addresses.forEach(addr => {
            addr.is_default = addr._id.toString() === addressId.toString()
        })
    }

    /**
     * Tìm kiếm addresses theo location
     * @param {Object} user - User object
     * @param {String} provinceId - Province ID
     * @param {String} wardId - Ward ID (optional)
     * @returns {Array} - Filtered addresses
     */
    static findAddressesByLocation(user, provinceId, wardId = null) {
        if (!user.usr_addresses) return []

        return user.usr_addresses.filter(addr => {
            if (!addr.is_active) return false
            
            const matchProvince = addr.province.id.toString() === provinceId.toString()
            
            if (wardId) {
                const matchWard = addr.ward.id.toString() === wardId.toString()
                return matchProvince && matchWard
            }
            
            return matchProvince
        })
    }

    /**
     * Validate shipping fee calculation data
     * @param {Object} shippingAddress - Shipping address
     * @returns {Object} - Data for shipping calculation
     */
    static getShippingCalculationData(shippingAddress) {
        return {
            province_code: shippingAddress.province.code,
            ward_code: shippingAddress.ward.code,
            province_name: shippingAddress.province.name,
            ward_name: shippingAddress.ward.name,
            full_address: shippingAddress.full_address || this.generateFullAddress(shippingAddress)
        }
    }

    /**
     * Populate location info cho addresses (nếu cần full data)
     * @param {Array} addresses - Array of addresses
     * @returns {Promise<Array>} - Populated addresses
     */
    static async populateLocationInfo(addresses) {
        const locationIds = []
        
        addresses.forEach(addr => {
            if (addr.province?.id) locationIds.push(addr.province.id)
            if (addr.ward?.id) locationIds.push(addr.ward.id)
        })

        // Lấy tất cả location info một lần
        const locations = await Location.find({
            _id: { $in: locationIds }
        }).lean()

        // Map locations by ID
        const locationMap = {}
        locations.forEach(loc => {
            locationMap[loc._id.toString()] = loc
        })

        // Update addresses với location info
        return addresses.map(addr => {
            const province = locationMap[addr.province?.id?.toString()]
            const ward = locationMap[addr.ward?.id?.toString()]

            return {
                ...addr.toObject ? addr.toObject() : addr,
                province: {
                    ...addr.province,
                    full_info: province
                },
                ward: {
                    ...addr.ward,
                    full_info: ward
                }
            }
        })
    }
}

module.exports = AddressUtils