'use strict'

const Location = require('../models/location.model')
const { BadRequestError, NotFoundError } = require('../core/error.response')
const { Types } = require('mongoose')

class LocationService {
    /**
     * Get all provinces
     * @returns {Promise<Array>} List of provinces
     */
    static async getProvinces() {
        const provinces = await Location.find({
            type: 'province'
        }).select('_id name province_code type level').sort({ name: 1 })

        return provinces
    }

    /**
     * Get wards by province ID
     * @param {string} provinceId - Province ObjectId
     * @returns {Promise<Array>} List of wards in the province
     */
    static async getWardsByProvince(provinceId) {
        if (!Types.ObjectId.isValid(provinceId)) {
            throw new BadRequestError('Invalid province ID format')
        }

        // Verify province exists
        const province = await Location.findById(provinceId)
        if (!province) {
            throw new NotFoundError('Province not found')
        }

        // Get all wards within this province using nested set model
        const wards = await Location.find({
            type: 'ward',
            left: { $gt: province.left },
            right: { $lt: province.right }
        }).select('_id name ward_code type level parent').sort({ name: 1 })

        return wards
    }

    /**
     * Get wards by province code
     * @param {string} provinceCode - Province code
     * @returns {Promise<Array>} List of wards in the province
     */
    static async getWardsByProvinceCode(provinceCode) {
        // Find province by code first
        const province = await Location.findOne({
            type: 'province',
            province_code: provinceCode
        })

        if (!province) {
            throw new NotFoundError('Province not found with this code')
        }

        // Get all wards within this province using nested set model
        const wards = await Location.find({
            type: 'ward',
            left: { $gt: province.left },
            right: { $lt: province.right }
        }).select('_id name ward_code type level parent').sort({ name: 1 })

        return wards
    }

    /**
     * Search locations with filters
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Filtered locations
     */
    static async searchLocations(options = {}) {
        const { query = '', type, level, province_code, limit = 20 } = options
        
        // Build search filter
        const filter = {}
        
        if (query) {
            filter.name = { $regex: query, $options: 'i' }
        }
        
        if (type) {
            filter.type = type
        }
        
        if (level !== null && level !== undefined) {
            filter.level = level
        }
        
        if (province_code) {
            // If searching within specific province
            const province = await Location.findOne({
                type: 'province',
                province_code: province_code
            })
            
            if (province) {
                filter.left = { $gt: province.left }
                filter.right = { $lt: province.right }
            }
        }

        const locations = await Location.find(filter)
            .select('_id name type level province_code district_code ward_code')
            .limit(limit)
            .sort({ name: 1 })

        return locations
    }

    /**
     * Get location tree (provinces with their wards)
     * @returns {Promise<Array>} Hierarchical location structure
     */
    static async getLocationTree() {
        // Get all provinces
        const provinces = await Location.find({
            type: 'province'
        }).select('_id name province_code type level').sort({ name: 1 })

        // Get all wards grouped by province
        const result = []
        for (const province of provinces) {
            const wards = await Location.find({
                type: 'ward',
                left: { $gt: province.left },
                right: { $lt: province.right }
            }).select('_id name ward_code type level').sort({ name: 1 })

            result.push({
                ...province.toObject(),
                wards: wards
            })
        }

        return result
    }
}

module.exports = LocationService
