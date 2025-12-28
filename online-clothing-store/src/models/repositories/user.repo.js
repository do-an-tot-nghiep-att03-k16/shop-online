'use strict'

const User = require('../user.model')
const {
    getInfoData,
    getSelectData,
    unGetSelectData,
    getSelectString,
} = require('../../utils')
const { get } = require('http')

class UserRepository {
    static async findByEmail(email, select = [], unSelectData = []) {
        // Normalize email to lowercase for case-insensitive search
        const selectFields = unGetSelectData(select)
        const unSelectFields = unGetSelectData(unSelectData)
        const normalizedEmail = email?.toLowerCase()
        return await User.findOne({ usr_email: normalizedEmail })
            .select(selectFields)
            .select(unSelectFields)
            .lean()
    }

    static async findByPhone(phone) {
        return await User.findOne({ usr_phone: phone }).lean()
    }

    static async findById(userId, select = [], unSelectData = []) {
        const selectFields = getSelectData(select)
        const unSelectFields = unGetSelectData(unSelectData)
        return await User.findById(userId)
            .select(selectFields)
            .select(unSelectFields)
            .lean()
    }

    static async create(userData) {
        return await User.create(userData)
    }

    static async findOne(query, select = []) {
        const selectFields = getSelectData(select)
        return await User.findOne(query).select(selectFields).lean()
    }

    /**
     * Find all users with pagination, sorting, and filtering
     * @param {Object} options
     * @returns {Promise<Array>}
     */
    static async findAll({
        query = {},
        select = [],
        limit = 10,
        page = 1,
        sort = { _id: -1 }, // Thay đổi: nhận object sort thay vì string
    }) {
        const skip = (page - 1) * limit
        const selectFields = getSelectData(select)

        return await User.find(query)
            .sort(sort)
            .select(selectFields)
            .limit(limit)
            .skip(skip)
            .lean()
            .exec() // Thêm .exec() để performance tốt hơn
    }

    /**
     * Count documents matching query
     * @param {Object} query
     * @returns {Promise<number>}
     */
    static async count(query = {}) {
        return await User.countDocuments(query).exec()
    }

    /**
     * Find all with pagination metadata (helper method)
     * @param {Object} options
     * @returns {Promise<Object>} { data, total, page, limit, totalPages }
     */
    static async findAllWithPagination(options) {
        const [data, total] = await Promise.all([
            this.findAll(options),
            this.count(options.query || {}),
        ])

        const { page = 1, limit = 10 } = options

        return {
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    static async updateById(userId, updateData, select = [], unselect = []) {
        const selectString = getSelectString(select, unselect)
        return await User.findByIdAndUpdate(userId, updateData, {
            new: true,
        })
            .select(selectString)
            .lean()
    }

    static async deleteById(userId) {
        return await User.findByIdAndDelete(userId).lean()
    }
}

module.exports = UserRepository
