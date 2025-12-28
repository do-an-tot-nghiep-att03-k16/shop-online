'use strict'

const getImageFromCloudinary = require('../helpers/getImageFromCloudinary')

const buildProductImages = (image_id) => {
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

const buildProductResponse = (product) => {
    return {
        ...product,

        color_images: product.color_images?.map((colorItem) => ({
            ...colorItem,
            images: colorItem.images?.map(buildProductImages),
        })),
    }
}

module.exports = { buildProductResponse }
