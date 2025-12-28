'use strict'

const { category } = require('../models/category.model')
const { BadRequestError, NotFoundError } = require('../core/error.response')
const CategoryRepository = require('../models/repositories/category.repo')
const slugify = require('slugify')
const { buildCategoryResponse } = require('../utils/category.mapper')

class CategoryService {
    static async createCategory({
        name,
        description = '',
        image_id = '',
        parentId = null,
    }) {
        if (!name) throw new BadRequestError('Category name is required')

        // Kiểm tra parentId có tồn tại không
        if (parentId) {
            const parentCategory = await CategoryRepository.findById(parentId)
            if (!parentCategory) {
                throw new NotFoundError('Parent category not found')
            }
        }

        const slug = slugify(name, { lower: true, strict: true })

        const existingCategory = await CategoryRepository.findBySlug(slug)
        if (existingCategory)
            throw new BadRequestError('Category with this name already exists')

        const categoryData = {
            name,
            slug,
            description,
            image_id,
            parentId: parentId || null,
        }

        const category = await CategoryRepository.create(categoryData)
        return category
    }

    static async getCategoryById(categoryId) {
        const category = await CategoryRepository.findById(categoryId)
        if (!category) throw new NotFoundError('Category not found')

        return buildCategoryResponse(category)
    }

    static async getCategoryBySlug(slug) {
        const category = await CategoryRepository.findBySlug(slug)
        if (!category || !category.isPublished)
            throw new NotFoundError('Category not found')

        return buildCategoryResponse(category)
    }

    static async getAllCategories({
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        is_active,
        isPublished,
    }) {
        const skip = (page - 1) * limit
        const filter = {}

        if (is_active !== undefined) filter.is_active = is_active
        if (isPublished !== undefined) filter.isPublished = isPublished

        const sortObj = {}
        sortObj[sort] = order === 'desc' ? -1 : 1

        const [categories, total] = await Promise.all([
            CategoryRepository.findAll({
                filter,
                sort: sortObj,
                skip,
                limit,
            }),
            CategoryRepository.count(filter),
        ])

        return {
            categories: categories.map(buildCategoryResponse),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    static async updateCategory(categoryId, updateData) {
        const category = await CategoryRepository.findById(categoryId)
        if (!category) throw new NotFoundError('Category not found')

        // Kiểm tra parentId mới (nếu có)
        if (updateData.parentId !== undefined && updateData.parentId !== null) {
            if (updateData.parentId === categoryId) {
                throw new BadRequestError('Category cannot be its own parent')
            }

            const parentCategory = await CategoryRepository.findById(
                updateData.parentId
            )
            if (!parentCategory) {
                throw new NotFoundError('Parent category not found')
            }
        }

        if (updateData.name && updateData.name !== category.name) {
            const newSlug = slugify(updateData.name, {
                lower: true,
                strict: true,
            })

            const existingCategory = await CategoryRepository.findBySlug(
                newSlug
            )
            if (
                existingCategory &&
                existingCategory._id.toString() !== categoryId
            )
                throw new BadRequestError('Category name already exists!')

            updateData.slug = newSlug
        }

        const updatedCategory = await CategoryRepository.updateById(
            categoryId,
            updateData
        )
        return updatedCategory
    }

    static async deleteCategory(categoryId) {
        const category = await CategoryRepository.findById(categoryId)
        if (!category) throw new NotFoundError('Category not found')

        // Kiểm tra có children không
        const hasChildren = await CategoryRepository.hasChildren(categoryId)
        if (hasChildren) {
            throw new BadRequestError(
                'Cannot delete category with children. Delete children first.'
            )
        }

        return await CategoryRepository.deleteById(categoryId)
    }

    static async publishCategory(categoryId) {
        const category = await CategoryRepository.findById(categoryId)
        if (!category) throw new NotFoundError('Category not found')

        return await CategoryRepository.publishCategory(categoryId, true)
    }

    static async unpublishCategory(categoryId) {
        const category = await CategoryRepository.findById(categoryId)
        if (!category) throw new NotFoundError('Category not found')

        return await CategoryRepository.publishCategory(categoryId, false)
    }

    static async getActiveCategories({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit
        const categories = await CategoryRepository.findActiveCategories({
            skip,
            limit,
        })

        return {
            categories: categories.map(buildCategoryResponse),
            pagination: {
                page,
                limit,
                total: categories.length,
            },
        }
    }

    static async searchCategories(searchText, { page = 1, limit = 20 }) {
        if (!searchText || searchText.trim() === '') {
            throw new BadRequestError('Search text is required')
        }

        const skip = (page - 1) * limit
        const categories = await CategoryRepository.searchCategories(
            searchText,
            { skip, limit }
        )

        return {
            categories: categories.map(buildCategoryResponse),
            pagination: {
                page,
                limit,
                total: categories.length,
            },
        }
    }

    // === PHẦN MỚI ĐƠN GIẢN ===

    // Lấy tất cả parent categories
    static async getParentCategories() {
        return await CategoryRepository.findParentCategories()
    }

    // Lấy children của một parent
    static async getChildrenByParent(parentId) {
        return await CategoryRepository.findChildrenByParentId(parentId)
    }
}

module.exports = CategoryService
