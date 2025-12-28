'use strict'

const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const UploadController = require('../../controllers/upload.controller')
const {
    uploadMemory,
    upload,
    uploadProductImages,
} = require('../../configs/multer.config')
const { authenticate } = require('../../auth/checkAuth')

router.use(authenticate)

router.post(
    '',
    uploadMemory.single('file'),
    asyncHandler(UploadController.uploadImage)
)

router.post(
    '/cloudinary',
    uploadMemory.single('file'),
    asyncHandler(UploadController.uploadImageCloudinary)
)
router.post(
    '/cloudinary/avatar',
    uploadMemory.single('avatar'),
    asyncHandler(UploadController.uploadImageCloudinary)
)

router.post(
    '/cloudinary/category',
    upload.single('category'),
    asyncHandler(UploadController.uploadImageCategory)
)

const handleProductUploadTimeout = (req, res, next) => {
    // Set timeout 2 phút cho upload request này
    req.setTimeout(120000, () => {
        console.error('⏰ Request timeout for product upload')
        const error = new Error(
            'Request timeout. Please try uploading fewer or smaller images.'
        )
        error.status = 408
        next(error)
    })
    next()
}

router.post(
    '/cloudinary/product', // Cần đăng nhập
    handleProductUploadTimeout,
    uploadProductImages.array('products', 10), // Tối đa 10 ảnh
    asyncHandler(UploadController.uploadProductImages)
)

router.post(
    '/cloudinary/review',
    handleProductUploadTimeout,
    uploadMemory.array('images', 5), // Tối đa 5 ảnh review
    asyncHandler(UploadController.uploadReviewImages)
)

module.exports = router
