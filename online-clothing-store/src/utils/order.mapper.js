'use strict'

const getImageFromCloudinary = require('../helpers/getImageFromCloudinary')

/**
 * Build product images from product_image field
 * Similar to cart mapper logic
 */
const buildOrderItemImages = (product_image) => {
    if (!product_image) return null

    return {
        image_id: product_image,
        thumbnail: getImageFromCloudinary({
            imageId: product_image,
            width: 100,
            height: 100,
        }),
        medium: getImageFromCloudinary({
            imageId: product_image,
            width: 300,
            height: 300,
        }),
        large: getImageFromCloudinary({
            imageId: product_image,
            width: 800,
            height: 800,
        }),
    }
}

/**
 * Transform order response - duyệt qua items và gắn product_images
 */
const buildOrderResponse = (order) => {
    if (!order) return null

    // Convert mongoose doc to plain object
    const orderData = order.toObject ? order.toObject() : order

    // Duyệt qua từng item trong order và gắn product_images
    const transformedItems = orderData.items?.map((item) => {
        return {
            ...item,
            // Gắn product_images từ product_image
            product_images: buildOrderItemImages(item.product_image)
        }
    }) || []

    return {
        ...orderData,
        items: transformedItems
    }
}

module.exports = { 
    buildOrderResponse, 
    buildOrderItemImages 
}