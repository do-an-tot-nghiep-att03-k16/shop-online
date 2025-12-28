'use strict'

const express = require('express')
const router = express.Router()
const locationController = require('../../controllers/location.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')

// Public routes - chỉ cần API key
// Specific routes MUST come before generic patterns like /:id

// Get all provinces
router.get('/provinces', asyncHandler(locationController.getProvinces))

// Get location tree (provinces with their wards)
router.get('/tree', asyncHandler(locationController.getLocationTree))

// Get location statistics
router.get('/stats', asyncHandler(locationController.getLocationStats))

// Search locations
router.get('/search', asyncHandler(locationController.searchLocations))

// Get location by code with type query parameter
router.get('/code/:code', asyncHandler(locationController.getLocationByCode))

// Get wards by province code
router.get(
    '/province-code/:provinceCode/wards',
    asyncHandler(locationController.getWardsByProvinceCode)
)

// Search wards in specific province
router.get(
    '/province-code/:provinceCode/wards/search',
    asyncHandler(locationController.searchWardsInProvince)
)

// Get wards by province ID
router.get(
    '/province/:provinceId/wards',
    asyncHandler(locationController.getWardsByProvince)
)

// Routes with parameters come after specific ones
router.get('/:id/path', asyncHandler(locationController.getLocationPath))
router.get('/:id/children', asyncHandler(locationController.getChildren))
router.get(
    '/:id/direct-children',
    asyncHandler(locationController.getDirectChildren)
)
router.get('/:id', asyncHandler(locationController.getLocationById))

// Protected routes - cần authentication
router.use(authenticate)

router.post('/', asyncHandler(locationController.createLocation))
router.put('/:id', asyncHandler(locationController.updateLocation))
router.delete('/:id', asyncHandler(locationController.deleteLocation))

module.exports = router
