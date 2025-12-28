'use strict'

const getImageFromCloudinary = require('../helpers/getImageFromCloudinary')

/**
 * Build review image object with different sizes like product/category
 * @param {String} image_id - Image ID
 * @returns {Object} Image object with thumbnail, medium, large URLs
 */
const buildReviewImage = (image_id) => {
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
            width: 600,
            height: 600,
        }),
        // Also provide a default 'url' field for backward compatibility
        url: getImageFromCloudinary({
            imageId: image_id,
            width: 400,
            height: 400,
        }),
    }
}

/**
 * Convert image IDs to image objects
 * @param {Array} imageIds - Array of image IDs
 * @returns {Array} Array of image objects
 */
const mapImageIdsToImageObjects = (imageIds) => {
    if (!imageIds || imageIds.length === 0) {
        return []
    }
    
    try {
        const imageObjects = imageIds.map((imageId) => {
            try {
                return buildReviewImage(imageId)
            } catch (error) {
                console.warn(`Failed to build image object for image ID: ${imageId}`, error.message)
                return null
            }
        })
        
        // Filter out null values (failed image builds)
        return imageObjects.filter(img => img !== null)
    } catch (error) {
        console.error('Error mapping image IDs to image objects:', error)
        return []
    }
}

/**
 * Transform review data to include image objects from image IDs
 * @param {Object} review - Review object
 * @returns {Object} Review object with image objects populated
 */
const transformReviewImages = (review) => {
    if (!review) return review
    
    const reviewObj = review.toObject ? review.toObject() : review
    
    // If review has image_ids, convert them to full image objects
    if (reviewObj.image_ids && reviewObj.image_ids.length > 0) {
        const imageObjects = mapImageIdsToImageObjects(reviewObj.image_ids)
        
        // Set images to the full image objects
        reviewObj.images = imageObjects
    }
    
    // Remove image_ids from response for cleaner API
    delete reviewObj.image_ids
    
    return reviewObj
}

/**
 * Transform array of reviews to include image objects
 * @param {Array} reviews - Array of review objects
 * @returns {Array} Array of reviews with image objects populated
 */
const transformReviewsImages = (reviews) => {
    if (!reviews || reviews.length === 0) {
        return reviews
    }
    
    try {
        const transformedReviews = reviews.map(review => transformReviewImages(review))
        return transformedReviews
    } catch (error) {
        console.error('Error transforming reviews images:', error)
        return reviews // Return original reviews if transformation fails
    }
}

module.exports = {
    buildReviewImage,
    mapImageIdsToImageObjects,
    transformReviewImages,
    transformReviewsImages
}