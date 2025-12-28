'use strict'

const { product } = require('../product.model')
const ProductQueryBuilder = require('../../builders/product.query.builder')

class ProductRepository {
    // Query builder factory
    static createQuery() {
        return new ProductQueryBuilder()
    }

    // Execute builder query
    static async findWithBuilder(builder) {
        return builder.execute(product)
    }

    // Simple finds
    static async findById(productId, options = {}) {
        const query = product.findById(productId)
        if (options.populate) query.populate(options.populate)
        if (options.select) query.select(options.select)
        return await query.lean({ virtuals: true })
    }

    static async findBySlug(slug, options = {}) {
        const query = product.findOne({ slug })
        if (options.populate) query.populate(options.populate)
        if (options.select) query.select(options.select)
        return await query.lean({ virtuals: true })
    }

    static async findBySKU(sku) {
        return await product.findOne({ 'variants.sku': sku }).lean()
    }

    static async findByIds(productIds, options = {}) {
        const query = product.find({ _id: { $in: productIds } })
        if (options.populate) query.populate(options.populate)
        if (options.select) query.select(options.select)
        return await query.lean({ virtuals: true })
    }

    // CRUD operations
    static async create(productData) {
        return await product.create(productData)
    }

    static async updateById(productId, updateData) {
        return await product.findByIdAndUpdate(productId, updateData, {
            new: true,
            runValidators: true,
        })
    }

    static async deleteById(productId) {
        return await product.findByIdAndUpdate(
            productId,
            { status: 'inactive', isPublished: false },
            { new: true }
        )
    }

    // Stock management
    static async updateStock(productId, sku, quantity) {
        return await product.findOneAndUpdate(
            { _id: productId, 'variants.sku': sku },
            { $inc: { 'variants.$.stock_quantity': quantity } },
            { new: true }
        )
    }

    // Stock management với session (for transactions)
    static async updateStockWithSession(productId, sku, quantity, session) {
        const result = await product.findOneAndUpdate(
            { 
                _id: productId, 
                'variants.sku': sku,
                'variants.stock_quantity': { $gte: Math.abs(quantity) } // Đảm bảo stock đủ
            },
            { $inc: { 'variants.$.stock_quantity': quantity } },
            { new: true, session }
        )
        return result // Trả về null nếu không đủ stock
    }

    // Publish/Unpublish
    static async publishProduct(productId, isPublished) {
        return await product.findByIdAndUpdate(
            productId,
            {
                isPublished,
                isDraft: !isPublished,
                status: isPublished ? 'active' : 'inactive',
            },
            { new: true }
        )
    }

    // Bulk operations
    static async bulkUpdateStock(updates) {
        const bulkOps = updates.map(({ productId, sku, quantity }) => ({
            updateOne: {
                filter: { _id: productId, 'variants.sku': sku },
                update: { $inc: { 'variants.$.stock_quantity': quantity } },
            },
        }))
        return await product.bulkWrite(bulkOps)
    }
}

module.exports = ProductRepository
