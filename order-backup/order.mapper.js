'use strict'

const { buildCartItemImages } = require('./cart.mapper')

const buildOrderItemImages = (image_id) => {
    return buildCartItemImages(image_id)
}

const buildOrderResponse = (order) => {
    if (!order) return null

    // Handle both Mongoose document and plain object
    const orderData = order.toObject ? order.toObject() : order

    return {
        ...orderData,
        items: orderData.items?.map((item) => ({
            ...item,
            product_images: buildOrderItemImages(item.product_image),
        })) || [],
    }
}

module.exports = { buildOrderResponse, buildOrderItemImages }