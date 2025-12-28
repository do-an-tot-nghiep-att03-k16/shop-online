'use strict'

const getImageFromCloudinary = require('../helpers/getImageFromCloudinary')

const buildCategoryImage = (image_id) => {
    if (!image_id) return null

    return {
        thumbnail: getImageFromCloudinary({
            imageId: image_id,
            width: 60,
            height: 60,
        }),
        medium: getImageFromCloudinary({
            imageId: image_id,
            width: 200,
            height: 200,
        }),
        large: getImageFromCloudinary({
            imageId: image_id,
            width: 400,
            height: 400,
        }),
    }
}

const buildCategoryResponse = (cate) => {
    return {
        ...cate,
        images: buildCategoryImage(cate.image_id),
    }
}

module.exports = { buildCategoryResponse }
