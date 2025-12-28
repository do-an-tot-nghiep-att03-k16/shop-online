'use strict'

const { cart } = require('../cart.model')

class CartRepository {
    // Tìm hoặc tạo cart cho user
    static async findOrCreateByUserId(userId) {
        let userCart = await cart.findOne({ user_id: userId, status: 'active' })

        if (!userCart) {
            userCart = await cart.create({
                user_id: userId,
                items: [],
                status: 'active',
            })
        }

        return userCart
    }

    // Tìm cart theo user ID
    static async findByUserId(userId, options = {}) {
        const query = cart.findOne({ user_id: userId, status: 'active' })

        if (options.populate) {
            query.populate(options.populate)
        }

        if (options.session) {
            query.session(options.session)
        }

        return await query
    }

    // Tìm cart theo ID
    static async findById(cartId, options = {}) {
        const query = cart.findById(cartId)

        if (options.populate) {
            query.populate(options.populate)
        }

        return await query
    }

    // Update cart
    static async update(cartId, updateData) {
        return await cart.findByIdAndUpdate(cartId, updateData, {
            new: true,
            runValidators: true,
        })
    }

    // Xóa cart
    static async deleteById(cartId) {
        return await cart.findByIdAndDelete(cartId)
    }

    // Tìm carts bị abandoned (hơn X ngày không update)
    static async findAbandonedCarts(daysAgo = 3) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

        return await cart
            .find({
                status: 'active',
                updatedAt: { $lt: cutoffDate },
                total_items: { $gt: 0 },
            })
            .populate('user_id', 'email name')
            .populate('items.product_id', 'name slug')
    }

    // Mark cart as abandoned
    static async markAsAbandoned(cartId) {
        return await cart.findByIdAndUpdate(
            cartId,
            {
                status: 'abandoned',
                abandoned_at: new Date(),
            },
            { new: true }
        )
    }

    // Mark cart as converted (đã thành order)
    static async markAsConverted(cartId) {
        return await cart.findByIdAndUpdate(
            cartId,
            {
                status: 'converted',
                converted_at: new Date(),
            },
            { new: true }
        )
    }

    // Mark cart as converted với session (for transactions)
    static async markAsConvertedWithSession(cartId, session) {
        return await cart.findByIdAndUpdate(
            cartId,
            {
                status: 'converted',
                converted_at: new Date(),
            },
            { new: true, session }
        )
    }

    // Đếm số lượng items trong cart
    static async countItems(userId) {
        const userCart = await cart.findOne({
            user_id: userId,
            status: 'active',
        })
        return userCart ? userCart.total_items : 0
    }
}

module.exports = CartRepository
