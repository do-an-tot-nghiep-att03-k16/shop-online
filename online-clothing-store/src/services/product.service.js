'use strict'

const { removeUndefinedObject } = require('../utils')
const ProductBuilder = require('../builders/product.builder')
const { BadRequestError, NotFoundError } = require('../core/error.response')
const ProductRepository = require('../models/repositories/product.repo')
const slugify = require('slugify')
const { buildProductResponse } = require('../utils/product.mapper')
const { product: Product } = require('../models/product.model')

class ProductService {
    // Helper to build standard response
    static buildResponse(result) {
        return {
            products: result.products.map(buildProductResponse),
            pagination: result.pagination,
        }
    }

    // ⭐ ADVANCED SEARCH - Chính xác hơn nhiều
    static async searchProducts(searchText, options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'relevance', // relevance | price | rating | newest
            minPrice,
            maxPrice,
            gender,
            categoryIds,
            minRating,
            inStockOnly = false,
        } = options

        if (!searchText?.trim()) {
            throw new BadRequestError('Search text is required')
        }

        // BUILD QUERY - Thứ tự quan trọng
        const query = ProductRepository.createQuery()

        // 1. Set base filters TRƯỚC (sẽ được lưu vào baseFilters)
        query.withActivePublished()

        if (gender) query.byGender(gender)
        if (categoryIds?.length) query.byCategories(categoryIds)
        if (minRating) query.withMinRating(minRating)
        if (inStockOnly) query.inStock()

        // 2. Run search (sẽ combine baseFilters + search conditions)
        query.advancedSearch(searchText, {
            enableFuzzy: true,
            enablePartial: true,
            boostExactMatch: true,
        })

        // 3. Apply price range (sau search vì cần calculate sale_price)
        if (minPrice || maxPrice) {
            query.withPriceRange(minPrice, maxPrice)
        }

        // 4. Apply sorting
        switch (sortBy) {
            case 'price-asc':
                query.sortByPrice('asc')
                break
            case 'price-desc':
                query.sortByPrice('desc')
                break
            case 'rating':
                query.sortByRating()
                break
            case 'newest':
                query.sort('createdAt', 'desc')
                break
            case 'relevance':
            default:
                query.sortByRelevance()
        }

        // 5. Paginate & Populate
        query.paginate(page, limit).populateCategories()

        const result = await ProductRepository.findWithBuilder(query)
        return this.buildResponse(result)
    }

    // Get all products with filters
    static async getAllProducts(options = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'newest',
            minPrice,
            maxPrice,
            gender,
            categoryIds,
            minRating,
            onSaleOnly = false,
            inStockOnly = false,
            // Admin filters
            status,
            isPublished,
            adminMode = false,
        } = options

        const query = ProductRepository.createQuery()

        // Admin mode: show ALL products (published + unpublished, all statuses)
        if (adminMode) {
            // Admin can see everything - only apply specific filters if provided
            if (status !== undefined) {
                query.byStatus(status)
            }
            if (isPublished !== undefined) {
                query.byPublishStatus(isPublished)
            }
            // If no specific filters, show ALL products (no default filters)
        } else {
            // Public mode: only show active + published products
            if (status !== undefined) {
                // Admin filter by specific status
                query.byStatus(status)
            } else if (isPublished !== undefined) {
                // Admin filter by published status  
                query.byPublishStatus(isPublished)
            } else {
                // Default: ALWAYS apply filter for public API
                query.withActivePublished()
            }
        }

        if (gender) query.byGender(gender)
        if (categoryIds?.length) query.byCategories(categoryIds)
        if (minRating) query.withMinRating(minRating)
        if (onSaleOnly) query.onSale()
        if (inStockOnly) query.inStock()

        // Price range (cần calculate sale_price)
        if (minPrice || maxPrice) {
            query.withPriceRange(minPrice, maxPrice)
        }

        // Apply sorting
        switch (sortBy) {
            case 'price-asc':
                query.sortByPrice('asc')
                break
            case 'price-desc':
                query.sortByPrice('desc')
                break
            case 'rating':
                query.sortByRating()
                break
            case 'discount':
                query.sortByDiscount()
                break
            case 'newest':
            default:
                query.sort('createdAt', 'desc')
        }

        query.paginate(page, limit).populateCategories()

        const result = await ProductRepository.findWithBuilder(query)
        return this.buildResponse(result)
    }

    // Get products by category
    static async getProductsByCategory(categoryId, options = {}) {
        const { page = 1, limit = 10, ...filters } = options

        const query = ProductRepository.createQuery()

        query.withActivePublished()
        query.byCategories([categoryId])

        // Apply additional filters from options
        if (filters.gender) query.byGender(filters.gender)
        if (filters.minRating) query.withMinRating(filters.minRating)
        if (filters.inStockOnly) query.inStock()

        if (filters.minPrice || filters.maxPrice) {
            query.withPriceRange(filters.minPrice, filters.maxPrice)
        }

        query
            .sort('createdAt', 'desc')
            .paginate(page, limit)
            .populateCategories()

        const result = await ProductRepository.findWithBuilder(query)
        return this.buildResponse(result)
    }

    // Get products by gender
    static async getProductsByGender(gender, options = {}) {
        if (!gender) throw new BadRequestError('Gender is required')

        const { page = 1, limit = 10, ...filters } = options

        const query = ProductRepository.createQuery()

        query.withActivePublished()
        query.byGender(gender)

        if (filters.categoryIds?.length) {
            query.byCategories(filters.categoryIds)
        }
        if (filters.minRating) query.withMinRating(filters.minRating)

        if (filters.minPrice || filters.maxPrice) {
            query.withPriceRange(filters.minPrice, filters.maxPrice)
        }

        query
            .sort('createdAt', 'desc')
            .paginate(page, limit)
            .populateCategories()

        const result = await ProductRepository.findWithBuilder(query)
        return this.buildResponse(result)
    }

    // Get on sale products
    static async getOnSaleProducts(options = {}) {
        const { page = 1, limit = 10, ...filters } = options

        const query = ProductRepository.createQuery()

        query.withActivePublished()
        query.onSale()

        if (filters.gender) query.byGender(filters.gender)
        if (filters.categoryIds?.length) query.byCategories(filters.categoryIds)

        if (filters.minPrice || filters.maxPrice) {
            query.withPriceRange(filters.minPrice, filters.maxPrice)
        }

        query.sortByDiscount().paginate(page, limit).populateCategories()

        const result = await ProductRepository.findWithBuilder(query)
        return this.buildResponse(result)
    }

    // Get single product
    static async getProductById(productId) {
        const product = await ProductRepository.findById(productId, {
            populate: { path: 'category_ids', select: 'name slug' },
        })

        if (!product) throw new NotFoundError('Product not found')
        return buildProductResponse(product)
    }

    static async getProductBySlug(slug) {
        const product = await ProductRepository.findBySlug(slug, {
            populate: { path: 'category_ids', select: 'name slug' },
        })

        if (!product || !product.isPublished) {
            throw new NotFoundError('Product not found')
        }
        return buildProductResponse(product)
    }

    static async getProductBySKU(sku) {
        const product = await ProductRepository.findBySKU(sku)

        if (!product) {
            throw new NotFoundError('Product with this SKU not found')
        }

        // Populate categories
        const populatedProduct = await ProductRepository.findById(product._id, {
            populate: { path: 'category_ids', select: 'name slug' },
        })

        // Find the specific variant
        const variant = populatedProduct.variants.find((v) => v.sku === sku)

        return {
            ...buildProductResponse(populatedProduct),
            selectedVariant: variant,
        }
    }

    // Create product
    static async createProduct(productData) {
        const {
            name,
            description,
            category_ids,
            material,
            gender,
            base_price,
            discount_percent = 0,
            color_images,
            variants,
            status = 'active',
        } = productData

        // Validation
        if (!name || !category_ids || !base_price || !gender) {
            throw new BadRequestError('Missing required fields')
        }

        if (!variants || variants.length === 0) {
            throw new BadRequestError('Product must have at least one variant')
        }

        // Check duplicate SKUs
        const skus = variants.map((v) => v.sku)
        const uniqueSkus = new Set(skus)
        if (skus.length !== uniqueSkus.size) {
            throw new BadRequestError('Duplicate SKUs found in variants')
        }

        // Generate slug
        const slug = slugify(name, { lower: true, strict: true })
        const existingProduct = await ProductRepository.findBySlug(slug)
        if (existingProduct) {
            throw new BadRequestError('Product with this name already exists')
        }

        // Build product payload
        const productPayload = new ProductBuilder()
            .withName(name)
            .withDescription(description)
            .withCategoryIds(category_ids)
            .withMaterial(material)
            .withGender(gender)
            .withBasePrice(base_price)
            .withDiscountPercent(discount_percent)
            .withColorImages(color_images)
            .withVariants(variants)
            .withStatus(status)
            .withSlug(slug)
            .build()

        const product = await ProductRepository.create(
            removeUndefinedObject(productPayload)
        )

        return buildProductResponse(product)
    }

    // Update product
    static async updateProduct(productId, updateData) {
        const product = await ProductRepository.findById(productId)
        if (!product) {
            throw new NotFoundError('Product not found')
        }

        // Update slug if name changed
        if (updateData.name && updateData.name !== product.name) {
            const newSlug = slugify(updateData.name, {
                lower: true,
                strict: true,
            })

            const existingProduct = await ProductRepository.findBySlug(newSlug)
            if (
                existingProduct &&
                existingProduct._id.toString() !== productId
            ) {
                throw new BadRequestError('Product name already exists')
            }
            updateData.slug = newSlug
        }

        const updatedProduct = await ProductRepository.updateById(
            productId,
            removeUndefinedObject(updateData)
        )

        return buildProductResponse(updatedProduct)
    }

    // Delete product (soft delete)
    static async deleteProduct(productId) {
        const product = await ProductRepository.findById(productId)
        if (!product) {
            throw new NotFoundError('Product not found')
        }

        return await ProductRepository.deleteById(productId)
    }

    // Publish/Unpublish
    static async publishProduct(productId) {
        const product = await ProductRepository.findById(productId)
        if (!product) throw new NotFoundError('Product not found')
        return await ProductRepository.publishProduct(productId, true)
    }

    static async unpublishProduct(productId) {
        const product = await ProductRepository.findById(productId)
        if (!product) throw new NotFoundError('Product not found')
        return await ProductRepository.publishProduct(productId, false)
    }

    // Stock management
    static async updateStock(productId, sku, quantity) {
        const product = await ProductRepository.findById(productId)
        if (!product) throw new NotFoundError('Product not found')

        const variant = product.variants.find((v) => v.sku === sku)
        if (!variant) throw new NotFoundError('Variant not found')

        // Check sufficient stock for negative quantity
        if (quantity < 0 && variant.stock_quantity + quantity < 0) {
            throw new BadRequestError('Not enough stock')
        }

        return await ProductRepository.updateStock(productId, sku, quantity)
    }

    // Bulk update stock for multiple variants
    static async bulkUpdateStock(updates) {
        const results = []
        const errors = []

        for (const update of updates) {
            try {
                const { productId, sku, quantity } = update
                
                if (!productId || !sku || quantity === undefined) {
                    errors.push({
                        productId,
                        sku,
                        error: 'Missing required fields (productId, sku, quantity)'
                    })
                    continue
                }

                const result = await this.updateStock(productId, sku, parseInt(quantity))
                results.push({
                    productId,
                    sku,
                    quantity: parseInt(quantity),
                    success: true,
                    result
                })
            } catch (error) {
                errors.push({
                    productId: update.productId,
                    sku: update.sku,
                    error: error.message
                })
            }
        }

        return {
            successful: results.length,
            failed: errors.length,
            results,
            errors
        }
    }

    // Get inventory overview for admin dashboard
    static async getInventoryOverview(options = {}) {
        const {
            lowStockThreshold = 10,
            page = 1,
            limit = 50,
            sortBy = 'stock_asc'
        } = options

        // Build aggregation pipeline
        const pipeline = [
            {
                $match: {
                    status: { $in: ['active', 'out_of_stock'] },
                    isPublished: true
                }
            },
            {
                $unwind: '$variants'
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    base_price: 1,
                    discount_percent: 1,
                    status: 1,
                    isPublished: 1,
                    'variant.sku': '$variants.sku',
                    'variant.color': '$variants.color',
                    'variant.size': '$variants.size',
                    'variant.stock_quantity': '$variants.stock_quantity',
                    'variant.price': '$variants.price',
                    isLowStock: {
                        $lte: ['$variants.stock_quantity', lowStockThreshold]
                    },
                    isOutOfStock: {
                        $eq: ['$variants.stock_quantity', 0]
                    }
                }
            }
        ]

        // Add sorting
        let sortStage = {}
        switch (sortBy) {
            case 'stock_asc':
                sortStage = { 'variant.stock_quantity': 1 }
                break
            case 'stock_desc':
                sortStage = { 'variant.stock_quantity': -1 }
                break
            case 'name_asc':
                sortStage = { name: 1 }
                break
            case 'name_desc':
                sortStage = { name: -1 }
                break
            default:
                sortStage = { 'variant.stock_quantity': 1 }
        }
        pipeline.push({ $sort: sortStage })

        // Add pagination
        const skip = (page - 1) * limit
        pipeline.push({ $skip: skip }, { $limit: limit })

        const results = await Product.aggregate(pipeline)

        // Get total count for pagination
        const countPipeline = [
            { $unwind: '$variants' },
            { $count: 'total' }
        ]
        const countResult = await Product.aggregate(countPipeline)
        const total = countResult[0]?.total || 0

        // Get summary statistics
        const statsPipeline = [
            { $unwind: '$variants' },
            {
                $group: {
                    _id: null,
                    totalVariants: { $sum: 1 },
                    totalStock: { $sum: '$variants.stock_quantity' },
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                { $lte: ['$variants.stock_quantity', lowStockThreshold] },
                                1,
                                0
                            ]
                        }
                    },
                    outOfStockCount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$variants.stock_quantity', 0] },
                                1,
                                0
                            ]
                        }
                    },
                    averageStock: { $avg: '$variants.stock_quantity' }
                }
            }
        ]
        const statsResult = await Product.aggregate(statsPipeline)
        const stats = statsResult[0] || {
            totalVariants: 0,
            totalStock: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            averageStock: 0
        }

        return {
            variants: results,
            pagination: {
                current_page: page,
                per_page: limit,
                total,
                total_pages: Math.ceil(total / limit)
            },
            summary: stats
        }
    }

    // Get low stock alerts
    static async getLowStockAlerts(threshold = 10) {
        
        const pipeline = [
            {
                $unwind: '$variants'
            },
            {
                $match: {
                    'variants.stock_quantity': { $lte: threshold },
                    status: { $in: ['active', 'out_of_stock'] },
                    isPublished: true
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    'variant.sku': '$variants.sku',
                    'variant.color': '$variants.color',
                    'variant.size': '$variants.size',
                    'variant.stock_quantity': '$variants.stock_quantity',
                    alertLevel: {
                        $cond: [
                            { $eq: ['$variants.stock_quantity', 0] },
                            'critical', // Out of stock
                            {
                                $cond: [
                                    { $lte: ['$variants.stock_quantity', Math.floor(threshold / 2)] },
                                    'high', // Very low stock
                                    'medium' // Low stock
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $sort: { 'variant.stock_quantity': 1, name: 1 }
            }
        ]

        const alerts = await Product.aggregate(pipeline)

        // Group by alert level
        const groupedAlerts = {
            critical: alerts.filter(a => a.alertLevel === 'critical'),
            high: alerts.filter(a => a.alertLevel === 'high'),
            medium: alerts.filter(a => a.alertLevel === 'medium')
        }

        return {
            alerts: groupedAlerts,
            total: alerts.length,
            summary: {
                critical: groupedAlerts.critical.length,
                high: groupedAlerts.high.length,
                medium: groupedAlerts.medium.length
            }
        }
    }

    // Get available sizes by color
    static async getAvailableSizes(productId, color) {
        const product = await ProductRepository.findById(productId)
        if (!product) throw new NotFoundError('Product not found')

        const sizes = product.variants
            .filter((v) => v.color === color && v.stock_quantity > 0)
            .map((v) => ({
                size: v.size,
                sku: v.sku,
                stock_quantity: v.stock_quantity,
            }))

        return sizes
    }

    // Check variant availability
    static async checkVariantAvailability(productId, sku) {
        const product = await ProductRepository.findById(productId)
        if (!product) throw new NotFoundError('Product not found')

        const variant = product.variants.find((v) => v.sku === sku)
        if (!variant) throw new NotFoundError('Variant not found')

        return {
            available: variant.stock_quantity > 0,
            stock_quantity: variant.stock_quantity,
        }
    }
}

module.exports = ProductService
