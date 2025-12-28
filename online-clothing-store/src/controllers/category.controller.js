'use strict'

const { CREATED, SuccessResponse } = require('../core/success.response')
const CategoryService = require('../services/category.service')

class CategoryController {
    /**
     * @desc Create new Category
     * @route POST /api/v1/category
     * @access Private/Admin
     */
    createCategory = async (req, res, next) => {
        new CREATED({
            message: 'Category created sucessfully',
            metadata: await CategoryService.createCategory(req.body),
        }).send(res)
    }

    /**
     * @desc Get category by Id
     * @route GET /api/v1/category/:id
     * @access Public
     */
    getCategoryById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get category successfully',
            metadata: await CategoryService.getCategoryById(req.params.id),
        }).send(res)
    }

    /**
     * @desc Get category by slug
     * @route GET /api/v1/category/:slug
     * @access Public
     */
    getCategoryBySlug = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get category successfully',
            metadata: await CategoryService.getCategoryBySlug(req.params.slug),
        }).send(res)
    }

    /**
     * @desc Get all category
     * @route GET /api/v1/category
     * @access Public
     */
    getAllCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all categories successfully',
            metadata: await CategoryService.getAllCategories({
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: req.query.sort || 'createdAt',
                order: req.query.order || 'desc',
                is_active: req.query.is_active,
                isPublished: req.query.isPublished,
            }),
        }).send(res)
    }

    /**
     * @desc update Category
     * @route PUT /api/v1/category/:id
     * @access Private/Admin/Shop
     */
    updateCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Category updated successfully',
            metadata: await CategoryService.updateCategory(
                req.params.id,
                req.body
            ),
        }).send(res)
    }

    /**
     * @desc delete Category
     * @route DELETE /api/v1/category/:id
     * @access Private/Admin/Shop
     */
    deleteCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Category deleted successfully',
            metadata: await CategoryService.deleteCategory(req.params.id),
        }).send(res)
    }

    /**
     * @desc publish Category
     * @route PATCH /api/v1/category/:id/publish
     * @access Private/Admin/Shop
     */
    publishCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Category published successfully',
            metadata: await CategoryService.publishCategory(req.params.id),
        }).send(res)
    }

    /**
     * @desc publish Category
     * @route PATCH /api/v1/category/:id/unpublish
     * @access Private/Admin/Shop
     */

    unpublishCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Category published successfully',
            metadata: await CategoryService.unpublishCategory(req.params.id),
        }).send(res)
    }

    /**
     * @desc Get active Category
     * @route GET /api/v1/category/active
     * @access Public
     */

    getActiveCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get active categories successfully',
            metadata: await CategoryService.getActiveCategories({
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit || 20),
            }),
        }).send(res)
    }

    /**
     * @desc Search Category
     * @route GET /api/v1/category/search
     * @access Public
     */

    searchCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search categories successfully',
            metadata: await CategoryService.searchCategories(req.query.q, {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            }),
        }).send(res)
    }

    getParentCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get parent categories successfully',
            metadata: await CategoryService.getParentCategories(),
        }).send(res)
    }

    // Lấy children của một parent
    getChildrenCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get children categories successfully',
            metadata: await CategoryService.getChildrenByParent(req.params.id),
        }).send(res)
    }
}

module.exports = new CategoryController()
