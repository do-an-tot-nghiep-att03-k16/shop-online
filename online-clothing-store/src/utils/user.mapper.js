'use strict'

const getImageFromCloudinary = require('../helpers/getImageFromCloudinary')

const buildUserAvatar = (image_id) => {
    if (!image_id) return null

    return {
        image_id,
        thumbnail: getImageFromCloudinary({
            imageId: image_id,
            width: 50,
            height: 50,
        }),
        medium: getImageFromCloudinary({
            imageId: image_id,
            width: 150,
            height: 150,
        }),
        large: getImageFromCloudinary({
            imageId: image_id,
            width: 400,
            height: 400,
        }),
    }
}

const buildUserResponse = (user) => {
    return {
        ...user,
        avatar: buildUserAvatar(user.usr_avatar),
    }
}

module.exports = { buildUserResponse }