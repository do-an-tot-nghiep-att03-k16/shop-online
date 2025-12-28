'use strict'

const multer = require('multer')
const { BadRequestError } = require('../core/error.response')
const uploadRules = require('./upload.config')

const storage = multer.memoryStorage()

const uploadMemory = multer({
    storage: multer.memoryStorage(),
})

const fileFilter = (fieldName) => (req, file, cb) => {
    const rules = uploadRules[fieldName]
    if (!rules)
        return cb(
            new BadRequestError('No upload rules defined for this field'),
            false
        )

    // check mime type
    if (!rules.allowedMime.includes(file.mimetype)) {
        return cb(new BadRequestError('Invalid file type'), false)
    }

    cb(null, true)
}

const uploadDisk = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './src/uploads/')
        },
        filename: function (req, file, cb) {
            cb(null, `${Date.now()}-${file.originalname}`)
        },
    }),
})

const upload = multer({
    storage,
    limits: { fileSize: uploadRules.avatar.maxSize },
    fileFilter: fileFilter('avatar'),
})

const uploadProductImages = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: uploadRules.product.maxSize,
        files: uploadRules.product.maxCount,
    },
    fileFilter: fileFilter('product'),
})

// ⭐ THÊM MỚI: Upload middleware cho category image
const uploadCategoryImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: uploadRules.category.maxSize },
    fileFilter: fileFilter('category'),
})

module.exports = {
    uploadMemory,
    uploadDisk,
    upload,
    uploadCategoryImage,
    uploadProductImages,
}
