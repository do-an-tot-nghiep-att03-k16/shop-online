'use strict'

const User = require('../models/user.model')
const AddressUtils = require('../utils/address.utils')
const { BadRequestError, NotFoundError } = require('../core/error.response')

class AddressService {
    
    /**
     * Thêm address mới cho user
     * @param {String} userId - User ID
     * @param {Object} addressData - Address data
     * @returns {Object} - Created address
     */
    static async addUserAddress(userId, addressData) {
        // Validate và format address
        const formattedAddress = await AddressUtils.validateAndFormatAddress(addressData)
        
        // Lấy user
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }

        // Nếu đây là address đầu tiên hoặc được set làm default
        if (!user.usr_addresses.length || formattedAddress.is_default) {
            formattedAddress.is_default = true
            // Unset default từ các address khác nếu có
            user.usr_addresses.forEach(addr => {
                addr.is_default = false
            })
        }

        // Thêm timestamps
        formattedAddress.created_at = new Date()
        formattedAddress.updated_at = new Date()

        // Thêm address mới
        user.usr_addresses.push(formattedAddress)
        
        await user.save()
        
        // Return address vừa được thêm
        const newAddress = user.usr_addresses[user.usr_addresses.length - 1]
        return newAddress
    }

    /**
     * Lấy tất cả addresses của user
     * @param {String} userId - User ID
     * @returns {Array} - User addresses
     */
    static async getUserAddresses(userId) {
        const user = await User.findById(userId).lean()
        if (!user) {
            throw new NotFoundError('User not found')
        }

        // Lọc chỉ các address active
        const activeAddresses = user.usr_addresses?.filter(addr => addr.is_active) || []
        
        return activeAddresses
    }

    /**
     * Lấy address theo ID
     * @param {String} userId - User ID
     * @param {String} addressId - Address ID
     * @returns {Object} - Address
     */
    static async getUserAddressById(userId, addressId) {
        const user = await User.findById(userId).lean()
        if (!user) {
            throw new NotFoundError('User not found')
        }

        const address = user.usr_addresses?.find(
            addr => addr._id.toString() === addressId && addr.is_active
        )
        
        if (!address) {
            throw new NotFoundError('Address not found')
        }

        return address
    }

    /**
     * Lấy default address của user
     * @param {String} userId - User ID
     * @returns {Object|null} - Default address
     */
    static async getDefaultAddress(userId) {
        const user = await User.findById(userId).lean()
        if (!user) {
            throw new NotFoundError('User not found')
        }

        return AddressUtils.getDefaultAddress(user)
    }

    /**
     * Cập nhật address của user
     * @param {String} userId - User ID
     * @param {String} addressId - Address ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated address
     */
    static async updateUserAddress(userId, addressId, updateData) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }

        const address = user.usr_addresses.id(addressId)
        if (!address || !address.is_active) {
            throw new NotFoundError('Address not found')
        }

        // Validate updated data nếu có location changes
        if (updateData.province_id || updateData.ward_id) {
            const formattedAddress = await AddressUtils.validateAndFormatAddress({
                full_name: updateData.full_name || address.full_name,
                phone: updateData.phone || address.phone,
                address_line: updateData.address_line || address.address_line,
                province_id: updateData.province_id || address.province.id,
                ward_id: updateData.ward_id || address.ward.id,
                type: updateData.type || address.type,
                is_default: updateData.is_default || address.is_default,
                note: updateData.note || address.note,
                postal_code: updateData.postal_code || address.postal_code
            })

            // Update với validated data
            Object.assign(address, formattedAddress)
        } else {
            // Update các field không phải location
            if (updateData.full_name !== undefined) address.full_name = updateData.full_name.trim()
            if (updateData.phone !== undefined) address.phone = updateData.phone.trim()
            if (updateData.address_line !== undefined) address.address_line = updateData.address_line.trim()
            if (updateData.type !== undefined) address.type = updateData.type
            if (updateData.note !== undefined) address.note = updateData.note?.trim() || ''
            if (updateData.postal_code !== undefined) address.postal_code = updateData.postal_code?.trim() || ''
        }

        address.updated_at = new Date()

        // Handle default address logic
        if (updateData.is_default) {
            AddressUtils.setDefaultAddress(user, addressId)
        }

        await user.save()
        
        return address
    }

    /**
     * Set address làm default
     * @param {String} userId - User ID
     * @param {String} addressId - Address ID to set as default
     * @returns {Object} - Updated address
     */
    static async setDefaultAddress(userId, addressId) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }

        const address = user.usr_addresses.id(addressId)
        if (!address || !address.is_active) {
            throw new NotFoundError('Address not found')
        }

        // Set làm default
        AddressUtils.setDefaultAddress(user, addressId)
        address.updated_at = new Date()

        await user.save()
        
        return address
    }

    /**
     * Xóa address của user (soft delete)
     * @param {String} userId - User ID
     * @param {String} addressId - Address ID
     * @returns {Object} - Success message
     */
    static async deleteUserAddress(userId, addressId) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }

        const address = user.usr_addresses.id(addressId)
        if (!address || !address.is_active) {
            throw new NotFoundError('Address not found')
        }

        const wasDefault = address.is_default
        
        // Soft delete (set is_active = false)
        address.is_active = false
        address.updated_at = new Date()

        // Nếu address bị xóa là default và còn address khác active, set address đầu tiên làm default
        if (wasDefault) {
            const activeAddresses = user.usr_addresses.filter(addr => 
                addr._id.toString() !== addressId && addr.is_active
            )
            
            if (activeAddresses.length > 0) {
                activeAddresses[0].is_default = true
                activeAddresses[0].updated_at = new Date()
            }
        }

        await user.save()
        
        return { message: 'Address deleted successfully' }
    }

    /**
     * Tìm kiếm addresses theo location
     * @param {String} userId - User ID
     * @param {String} provinceId - Province ID
     * @param {String} wardId - Ward ID (optional)
     * @returns {Array} - Filtered addresses
     */
    static async searchAddressesByLocation(userId, provinceId, wardId = null) {
        const user = await User.findById(userId).lean()
        if (!user) {
            throw new NotFoundError('User not found')
        }

        return AddressUtils.findAddressesByLocation(user, provinceId, wardId)
    }

    /**
     * Validate address để dùng cho order
     * @param {String} userId - User ID
     * @param {Object} addressData - Address data (có thể là address_id hoặc full data)
     * @returns {Object} - Validated shipping address
     */
    static async validateOrderAddress(userId, addressData) {
        // Nếu client gửi address_id, lấy từ user addresses
        if (addressData && addressData.address_id) {
            const userAddress = await this.getUserAddressById(userId, addressData.address_id)
            return AddressUtils.convertToShippingAddress(userAddress)
        }

        // Nếu client gửi address data trực tiếp
        if (addressData && addressData.province_id && addressData.ward_id) {
            const formattedAddress = await AddressUtils.validateAndFormatAddress(addressData)
            return AddressUtils.convertToShippingAddress(formattedAddress)
        }

        throw new BadRequestError('Missing shipping address data. Provide either address_id or full address data')
    }

    /**
     * @desc Get all provinces for address selection
     * @returns {Array} List of provinces
     */
    static async getProvinces() {
        const LocationService = require('./location.service')
        return await LocationService.getProvinces()
    }

    /**
     * @desc Get wards by province ID for address selection
     * @param {String} provinceId - Province ID
     * @returns {Array} List of wards in the province
     */
    static async getWardsByProvince(provinceId) {
        const LocationService = require('./location.service')
        return await LocationService.getWardsByProvince(provinceId)
    }

    /**
     * @desc Search locations for address selection
     * @param {Object} options - Search options
     * @returns {Array} Filtered locations
     */
    static async searchLocations(options) {
        const LocationService = require('./location.service')
        return await LocationService.searchLocations(options)
    }
}

module.exports = AddressService