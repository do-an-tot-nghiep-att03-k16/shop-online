'use strict'

const getImageFromCloudinary = require('../helpers/getImageFromCloudinary')

const buildCartItemImages = (image_id) => {
    if (!image_id) return null

    return {
        image_id,
        thumbnail: getImageFromCloudinary({
            imageId: image_id,
            width: 100,
            height: 100,
        }),
        medium: getImageFromCloudinary({
            imageId: image_id,
            width: 300,
            height: 300,
        }),
        large: getImageFromCloudinary({
            imageId: image_id,
            width: 800,
            height: 800,
        }),
    }
}

const buildCartResponse = (cart) => {
    if (!cart) {
        return {
            _id: null,
            user_id: null,
            items: [],
            total_items: 0,
            subtotal: 0,
            total: 0,
            applied_coupon: null,
        }
    }

    // Handle both Mongoose document and plain object
    const cartData = cart.toObject ? cart.toObject() : cart

    return {
        ...cartData,
        items:
            cartData.items?.map((item) => ({
                ...item,
                product_images: buildCartItemImages(item.product_image),
            })) || [],
    }
}

module.exports = { buildCartResponse, buildCartItemImages }
