'use strict'

const { category } = require('../../models/category.model')

class CategoryRepository {
    static async findById(categoryId, options = {}) {
        const query = category.findById(categoryId)
        if (options.select) query.select(options.select)

        return await query.lean()
    }

    static async findBySlug(slug, options = {}) {
        const query = category.findOne({ slug })
        if (options.select) query.select(options.select)

        return await query.lean()
    }

    static async findAll({
        filter = {},
        sort = { createdAt: -1 },
        skip = 0,
        limit = 10,
        select = null,
    }) {
        const query = category.find(filter).sort(sort).skip(skip).limit(limit)

        if (select) query.select(select)

        return await query.lean()
    }

    static async count(filter = {}) {
        return await category.countDocuments(filter)
    }

    static async create(categoryData) {
        return await category.create(categoryData)
    }

    static async updateById(categoryId, updateData) {
        return await category.findByIdAndUpdate(categoryId, updateData, {
            new: true,
            runValidators: true,
        })
    }

    static async deleteById(categoryId) {
        return await category.findByIdAndUpdate(
            categoryId,
            {
                is_active: false,
                isPublished: false,
            },
            { new: true }
        )
    }

    static async publishCategory(categoryId, isPublished) {
        return await category.findByIdAndUpdate(
            categoryId,
            {
                isPublished,
                isDraft: !isPublished,
                is_active: isPublished,
            },
            { new: true }
        )
    }

    static async findActiveCategories({ skip = 0, limit = 10 }) {
        return await category
            .find({ is_active: true, isPublished: true })
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean()
    }

    static async searchCategories(searchText, { skip = 0, limit = 10 }) {
        return await category
            .find({
                name: { $regex: searchText, $options: 'i' },
                is_active: true,
                isPublished: true,
            })
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean()
    }

    static async hasChildren(categoryId) {
        const count = await category.countDocuments({ parentId: categoryId })
        return count > 0
    }

    static async findParentCategories() {
        return await category
            .find({
                parentId: null,
                is_active: true,
                isPublished: true,
            })
            .sort({ name: 1 })
            .lean()
    }

    // Lấy children của một parent
    static async findChildrenByParentId(parentId) {
        return await category
            .find({
                parentId,
                is_active: true,
                isPublished: true,
            })
            .sort({ name: 1 })
            .lean()
    }
}

module.exports = CategoryRepository
