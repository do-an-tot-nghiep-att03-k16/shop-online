'use strict'

const { resolve, parse } = require('path')
const { CREATED, SuccessResponse } = require('../core/success.response')
const ProductService = require('../services/product.service')
const { BadRequestError } = require('../core/error.response')
const { isAdmin } = require('../helpers')

class ProductController {
    getProducts = async (req, res) => {
        const {
            page,
            limit,
            sort, // old param for backward compatibility
            sortBy, // new param
            order, // old param
            gender,
            category, // single category
            categories, // multiple categories (comma-separated)
            min_price: minPrice,
            maxPrice: maxPrice,
            minRating,
            on_sale: onSale,
            in_stock: inStock,
            status, // for admin
            isPublished, // for admin
        } = req.query

        // Parse category IDs
        let categoryIds = null
        if (categories) {
            categoryIds = categories.split(',').map((id) => id.trim())
        } else if (category) {
            categoryIds = [category]
        }

        // Parse sortBy - support both old and new format
        let sortByValue = sortBy
        if (!sortByValue && sort) {
            // Convert old format to new format
            const sortMap = {
                createdAt: 'newest',
                base_price: order === 'asc' ? 'price-asc' : 'price-desc',
                discount_percent: 'discount',
                ratings_average: 'rating',
            }
            sortByValue = sortMap[sort] || 'newest'
        }

        // Check if this is admin request using helper function
        const isAdminRequest = req.role && isAdmin(req.role)

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            sortBy: sortByValue || 'newest',
            gender,
            categoryIds,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            minRating: minRating ? parseFloat(minRating) : undefined,
            onSaleOnly: onSale === 'true',
            inStockOnly: inStock === 'true',
        }

        // Only allow admin filters for authenticated admin users
        if (isAdminRequest) {
            options.status = status
            options.isPublished = isPublished !== undefined ? isPublished === 'true' : undefined
        }

        const result = await ProductService.getAllProducts(options)

        new SuccessResponse({
            message: 'Get products successfully',
            metadata: result,
        }).send(res)
    }

    /**
     * ⭐ ADMIN ENDPOINT - Get ALL products (published + unpublished)
     * GET /products/admin/all?page=1&limit=20&status=draft&isPublished=false
     */
    getProductsForAdmin = async (req, res) => {
        const {
            page,
            limit,
            sort,
            sortBy,
            order,
            gender,
            category,
            categories,
            min_price: minPrice,
            max_price: maxPrice,
            minRating,
            on_sale: onSale,
            in_stock: inStock,
            status,
            isPublished,
            search,
        } = req.query

        // Parse category IDs
        let categoryIds = null
        if (categories) {
            categoryIds = categories.split(',').map((id) => id.trim())
        } else if (category) {
            categoryIds = [category]
        }

        // Parse sortBy
        let sortByValue = sortBy
        if (!sortByValue && sort) {
            const sortMap = {
                createdAt: 'newest',
                base_price: order === 'asc' ? 'price-asc' : 'price-desc',
                discount_percent: 'discount',
                ratings_average: 'rating',
            }
            sortByValue = sortMap[sort] || 'newest'
        }

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            sortBy: sortByValue || 'newest',
            gender,
            categoryIds,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            minRating: minRating ? parseFloat(minRating) : undefined,
            onSaleOnly: onSale === 'true',
            inStockOnly: inStock === 'true',
            // ADMIN-SPECIFIC: Always include admin filters
            status,
            isPublished: isPublished !== undefined ? isPublished === 'true' : undefined,
            search,
            // Force admin mode
            adminMode: true,
        }

        const result = await ProductService.getAllProducts(options)

        new SuccessResponse({
            message: 'Get admin products successfully',
            metadata: result,
        }).send(res)
    }

    /**
     * ⭐ SEARCH ENDPOINT
     * GET /products/search?q=áo+thun&gender=male&category=shirts&minPrice=100000&inStock=true&sort=relevance
     */
    searchProducts = async (req, res) => {
        const {
            q,
            page,
            limit,
            sortBy,
            gender,
            category,
            categories,
            min_price: minPrice,
            max_price: maxPrice,
            minRating,
            inStock,
            on_sale: onSale,
        } = req.query

        if (!q || !q.trim()) {
            throw new BadRequestError('Search query (q) is required')
        }

        // Parse category IDs
        let categoryIds = null
        if (categories) {
            categoryIds = categories.split(',').map((id) => id.trim())
        } else if (category) {
            categoryIds = [category]
        }

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            sortBy: sortBy || 'relevance',
            gender,
            categoryIds,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            minRating: minRating ? parseFloat(minRating) : undefined,
            inStockOnly: inStock === 'true',
        }

        const result = await ProductService.searchProducts(q, options)

        new SuccessResponse({
            message: 'Search products successfully',
            metadata: result,
        }).send(res)
    }

    /**
     * ⭐ Get single product by ID or slug
     * GET /products/507f1f77bcf86cd799439011
     * GET /products/ao-thun-nam-basic
     */
    getProduct = async (req, res) => {
        const { identifier } = req.params

        // Check if identifier is MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier)

        const product = isObjectId
            ? await ProductService.getProductById(identifier)
            : await ProductService.getProductBySlug(identifier)

        new SuccessResponse({
            message: 'Get product successfully',
            metadata: product,
        }).send(res)
    }

    // ============================================
    // CRUD OPERATIONS (Admin only)
    // ============================================

    createProduct = async (req, res) => {
        new CREATED({
            message: 'Product created successfully',
            metadata: await ProductService.createProduct(req.body),
        }).send(res)
    }

    updateProduct = async (req, res) => {
        new SuccessResponse({
            message: 'Product updated successfully',
            metadata: await ProductService.updateProduct(
                req.params.id,
                req.body
            ),
        }).send(res)
    }

    deleteProduct = async (req, res) => {
        new SuccessResponse({
            message: 'Product deleted successfully',
            metadata: await ProductService.deleteProduct(req.params.id),
        }).send(res)
    }

    publishProduct = async (req, res) => {
        new SuccessResponse({
            message: 'Product published successfully',
            metadata: await ProductService.publishProduct(req.params.id),
        }).send(res)
    }

    unpublishProduct = async (req, res) => {
        new SuccessResponse({
            message: 'Product unpublished successfully',
            metadata: await ProductService.unpublishProduct(req.params.id),
        }).send(res)
    }

    updateStock = async (req, res) => {
        const { sku, quantity } = req.body

        if (!sku) {
            throw new BadRequestError('SKU is required')
        }
        if (quantity === undefined) {
            throw new BadRequestError('Quantity is required')
        }

        new SuccessResponse({
            message: 'Stock updated successfully',
            metadata: await ProductService.updateStock(
                req.params.id,
                sku,
                parseInt(quantity)
            ),
        }).send(res)
    }

    // Bulk update stock for multiple variants
    bulkUpdateStock = async (req, res) => {
        const { updates } = req.body // [{ productId, sku, quantity }]

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            throw new BadRequestError('Updates array is required')
        }

        new SuccessResponse({
            message: 'Bulk stock update completed',
            metadata: await ProductService.bulkUpdateStock(updates),
        }).send(res)
    }

    // Get inventory overview for admin
    getInventoryOverview = async (req, res) => {
        const { 
            lowStockThreshold = 10,
            page = 1,
            limit = 50,
            sortBy = 'stock_asc' // stock_asc, stock_desc, name_asc, name_desc
        } = req.query

        new SuccessResponse({
            message: 'Inventory overview retrieved successfully',
            metadata: await ProductService.getInventoryOverview({
                lowStockThreshold: parseInt(lowStockThreshold),
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy
            }),
        }).send(res)
    }

    // Get low stock alerts
    getLowStockAlerts = async (req, res) => {
        const { threshold = 10 } = req.query

        new SuccessResponse({
            message: 'Low stock alerts retrieved successfully',
            metadata: await ProductService.getLowStockAlerts(parseInt(threshold)),
        }).send(res)
    }

    // ============================================
    // HELPER ENDPOINTS
    // ============================================

    checkVariantAvailability = async (req, res) => {
        new SuccessResponse({
            message: 'Check variant availability successfully',
            metadata: await ProductService.checkVariantAvailability(
                req.params.id,
                req.params.sku
            ),
        }).send(res)
    }

    getAvailableSizes = async (req, res) => {
        new SuccessResponse({
            message: 'Get available sizes successfully',
            metadata: await ProductService.getAvailableSizes(
                req.params.id,
                req.params.color
            ),
        }).send(res)
    }
}

module.exports = new ProductController()
