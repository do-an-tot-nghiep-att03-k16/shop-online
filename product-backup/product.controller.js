'use strict'

const { resolve, parse } = require('path')
const { CREATED, SuccessResponse } = require('../core/success.response')
const ProductService = require('../services/product.service')
const { BadRequestError } = require('../core/error.response')

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
            // Admin filters (only if authenticated)
            status: status || 'active',
            isPublished:
                isPublished !== undefined ? isPublished === 'true' : true,
        }

        const result = await ProductService.getAllProducts(options)

        new SuccessResponse({
            message: 'Get products successfully',
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
