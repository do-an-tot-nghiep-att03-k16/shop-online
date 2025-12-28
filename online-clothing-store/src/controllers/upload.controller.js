'use strict'
const { CREATED, SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const ApiKeyService = require('../services/apikey.service')
const {
    uploadImageFromLocalS3,
    uploadImageFromLocalCloudinary,
    uploadImagesToCloudinary,
} = require('../services/upload.service')

class UploadController {
    uploadImage = async (req, res, next) => {
        if (!req.file) {
            throw new BadRequestError('No file uploaded')
        }
        new SuccessResponse({
            message: 'Upload image success!',
            metadata: await uploadImageFromLocalS3({ file: req.file }),
        }).send(res)
    }

    uploadImageCloudinary = async (req, res, next) => {
        if (!req.file) {
            throw new BadRequestError('No file uploaded')
        }
        new SuccessResponse({
            message: 'Upload image to Cloudinary success!',
            metadata: await uploadImageFromLocalCloudinary({
                file: req.file,
            }),
        }).send(res)
    }

    uploadImageCategory = async (req, res, next) => {
        if (!req.file) {
            throw new BadRequestError('No file uploaded')
        }
        new SuccessResponse({
            message: 'Upload image to Cloudinary success!',
            metadata: await uploadImageFromLocalCloudinary({
                file: req.file,
                folderName: 'categories',
            }),
        }).send(res)
    }

    uploadAvatarCloudinary = async (req, res, next) => {
        if (req.avatar) {
            throw new BadRequestError('No file uploaded')
        }
        new SuccessResponse({
            message: 'Upload avatar success!',
            metadata: await uploadImageFromLocalCloudinary({
                file: req.avatar,
            }),
        }).send(res)
    }

    uploadProductImages = async (req, res, next) => {
        if (!req.files || req.files.length === 0)
            throw new BadRequestError('No file uploaded')
            
        // console.log(`📋 Upload request received: ${req.files.length} files`)
        
        // Set longer timeout cho response
        req.setTimeout(0) // Disable request timeout
        res.setTimeout(0) // Disable response timeout
        
        const startTime = Date.now()
        
        try {
            const result = await uploadImagesToCloudinary({
                files: req.files,
                folderName: 'products',
            })
            
            const duration = Date.now() - startTime
            // console.log(`⏱️ Upload completed in ${duration}ms`)
            
            new SuccessResponse({
                message: 'Upload images successfully',
                metadata: {
                    ...result,
                    upload_time_ms: duration
                },
            }).send(res)
        } catch (error) {
            const duration = Date.now() - startTime
            // console.error(`💥 Upload failed after ${duration}ms:`, error.message)
            throw error
        }
    }

    uploadReviewImages = async (req, res, next) => {
        if (!req.files || req.files.length === 0)
            throw new BadRequestError('No file uploaded')
            
        const result = await uploadImagesToCloudinary({
            files: req.files,
            folderName: 'reviews',
        })
        
        // Ensure result has proper structure like product upload
        if (!result || !result.images) {
            throw new BadRequestError('Upload service failed - no images returned')
        }
        
        new SuccessResponse({
            message: 'Upload images successfully',
            metadata: result,
        }).send(res)
    }
}

module.exports = new UploadController()
