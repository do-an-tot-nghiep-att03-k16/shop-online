'use strict'

const express = require('express')
const router = express.Router()
const categoryController = require('../../controllers/category.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticationV2, authenticate } = require('../../auth/checkAuth')

// Public routes - chỉ cần API key
// Specific routes MUST come before generic patterns like /:id
router.get('/search', asyncHandler(categoryController.searchCategories))
router.get('/active', asyncHandler(categoryController.getActiveCategories))
router.get('/parents', asyncHandler(categoryController.getParentCategories))
router.get('/slug/:slug', asyncHandler(categoryController.getCategoryBySlug))
router.get('/', asyncHandler(categoryController.getAllCategories))

// Routes with parameters come after specific ones
router.get(
    '/:id/children',
    asyncHandler(categoryController.getChildrenCategories)
)
router.get('/:id', asyncHandler(categoryController.getCategoryById))

// Protected routes - cần authentication
router.use(authenticate)

router.post('/', asyncHandler(categoryController.createCategory))
router.put('/:id', asyncHandler(categoryController.updateCategory))
router.delete('/:id', asyncHandler(categoryController.deleteCategory))
router.patch('/:id/publish', asyncHandler(categoryController.publishCategory))
router.patch(
    '/:id/unpublish',
    asyncHandler(categoryController.unpublishCategory)
)

module.exports = router
