'use strict'

const {
    PutObjectCommand,
    s3,
    GetObjectCommand,
} = require('../configs/s3.config')
const crypto = require('crypto')
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
const streamifier = require('streamifier')
const { randomImageName } = require('../utils')
const { BadRequestError, NotFoundError } = require('../core/error.response')
const urlImagePublish = process.env.AWS_BUCKET_PUBLIC_URL
const cloudinary = require('../configs/cloudinary.config')

// upload file use S3Client //
// upload file use image local
const uploadImageFromLocalS3 = async ({ file }) => {
    try {
        const imageName = randomImageName()
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName, // file.originalname || 'unknown',
            Body: file.buffer,
            ContentType: 'image/jpeg', // that is what you need
        })

        const result = await s3.send(command)
        if (!result) {
            throw new BadRequestError('Upload image failed')
        }
        return {
            image_name: imageName,
        }
    } catch (error) {
        console.error('Error uploading image use S3Client::', error)
        throw error
    }
}

const getImageUrlFromS3 = async ({ imageName, expiresIn = 3600 }) => {
    try {
        const url = await getSignedUrl({
            url: `${urlImagePublish}/${imageName}`,
            keyPairId: process.env.AWS_BUCKET_PUBLIC_KEY_ID,
            dateLessThan: new Date(Date.now() + expiresIn),
            privateKey: process.env.AWS_BUCKET_PRIVATE_KEY,
        })
        return {
            url,
            expiresIn,
        }
    } catch (error) {
        console.error('Error getting image url from S3::', error)
        throw error
    }
}

//  END S3 SERVICE /////////

const uploadImageFromLocalCloudinary = async ({ file, folderName = '' }) => {
    try {
        const folderRes = 'myshop/' + folderName
        if (!file || !file.buffer) {
            throw new BadRequestError('No file or file buffer provided')
        }

        const imageName = randomImageName()

        // Upload from buffer using upload_stream
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: imageName,
                    folder: folderRes,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(result)
                    }
                }
            )

            // Write buffer to upload stream
            uploadStream.end(file.buffer)
        })

        return {
            image_id: result.public_id,
            image_url: result.secure_url,
            image_name: imageName,
        }
    } catch (error) {
        console.error('Error uploading image to Cloudinary::', error)
        throw new BadRequestError('Upload file not successfully!')
    }
}

const uploadImagesToCloudinary = async ({ files, folderName }) => {
    try {
        // console.log(`🚀 Starting upload of ${files.length} files to folder: ${folderName}`)
        const folderRes = 'myshop/' + folderName
        
        // Validate files trước khi upload
        for (let i = 0; i < files.length; i++) {
            if (!files[i].buffer || files[i].buffer.length === 0) {
                throw new BadRequestError(`File ${i + 1} is empty or invalid`)
            }
            if (files[i].size > 10 * 1024 * 1024) { // 10MB
                throw new BadRequestError(`File ${i + 1} is too large (max 10MB)`)
            }
        }
        
        const uploadPromises = files.map((file, index) => {
            return new Promise((resolve, reject) => {
                const imageName = randomImageName()
                // console.log(`📤 Uploading file ${index + 1}/${files.length}: ${imageName}`)
                
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: imageName,
                        folder: folderRes,
                        transformation: [
                            { width: 1000, height: 1000, crop: 'limit' },
                            { quality: 'auto:good' }, // Tối ưu quality
                            { fetch_format: 'auto' },
                        ],
                        timeout: 60000, // 60 giây per file
                        resource_type: 'auto',
                        use_filename: false,
                        unique_filename: true,
                    },
                    (error, result) => {
                        if (error) {
                            console.error(`❌ Upload failed for file ${index + 1}:`, error)
                            reject(new Error(`Upload file ${index + 1} failed: ${error.message}`))
                        } else {
                            // console.log(`✅ Successfully uploaded file ${index + 1}: ${result.secure_url}`)
                            resolve({
                                image_id: result.public_id,
                                image_url: result.secure_url,
                                image_name: imageName,
                            })
                        }
                    }
                )
                
                // Thêm error handling cho stream
                const readStream = streamifier.createReadStream(file.buffer)
                readStream.on('error', (streamError) => {
                    console.error(`❌ Stream error for file ${index + 1}:`, streamError)
                    reject(new Error(`Stream error for file ${index + 1}: ${streamError.message}`))
                })
                
                readStream.pipe(uploadStream)
            })
        })

        // Chờ tất cả upload xong với timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Upload timeout after 90 seconds'))
            }, 90000) // 90 giây timeout tổng
        })
        
        const images = await Promise.race([
            Promise.all(uploadPromises),
            timeoutPromise
        ])
        
        // console.log(`🎉 All uploads completed successfully: ${images.length} files`)
        return {
            images,
            count: images.length,
        }
    } catch (error) {
        console.error('🔥 Error uploading images to Cloudinary:', error)
        // Throw more specific error
        if (error.message.includes('timeout')) {
            throw new BadRequestError('Upload timeout. Please try with fewer or smaller images.')
        }
        throw new BadRequestError(`Upload failed: ${error.message}`)
    }
}

const getImageFromCloudinary = ({ imageId, height, width, format }) => {
    try {
        const imageUrl = cloudinary.url(imageId, {
            height,
            width,
            format,
            secure: true,
        })
        return {
            url: imageUrl,
        }
    } catch (error) {
        console.error('Error getting image from Cloudinary::', error)
        throw new NotFoundError('Not found the image')
    }
}

module.exports = {
    uploadImageFromLocalS3,
    getImageUrlFromS3,
    uploadImageFromLocalCloudinary,
    getImageFromCloudinary,
    uploadImagesToCloudinary,
}
