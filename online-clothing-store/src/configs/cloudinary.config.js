'use strict'

const cloudinary = require('cloudinary').v2

const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 120000, // Tăng timeout lên 2 phút
    max_image_file_size: 10485760, // 10MB
    chunk_size: 6000000, // 6MB chunks
}

cloudinary.config(cloudinaryConfig)

module.exports = cloudinary
