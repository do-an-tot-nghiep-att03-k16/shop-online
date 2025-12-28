const { NotFoundError } = require('../core/error.response')
const cloudinary = require('../configs/cloudinary.config')

const getImageFromCloudinary = ({ imageId, height, width, format = 'jpg' }) => {
    try {
        if (!imageId || typeof imageId !== 'string' || imageId.trim() === '')
            return ''

        const imageUrl = cloudinary.url(imageId, {
            height,
            width,
            format,
            secure: true,
            crop: 'fill',
        })

        return imageUrl
    } catch (error) {
        console.error('Error getting image from Cloudinary::', error)
        throw new NotFoundError('Not found the image')
    }
}

module.exports = getImageFromCloudinary
