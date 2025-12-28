'use strict'

const express = require('express')
const router = express.Router()
const addressController = require('../../controllers/address.controller')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')

// All address routes require authentication
router.use(authenticate)

// Specific routes MUST come before generic patterns like /:addressId
router.get('/default', asyncHandler(addressController.getDefaultAddress))
router.get('/search', asyncHandler(addressController.searchAddressesByLocation))
router.get('/provinces', asyncHandler(addressController.getProvinces))
router.get('/provinces/:provinceId/wards', asyncHandler(addressController.getWardsByProvince))
router.get('/locations/search', asyncHandler(addressController.searchLocations))
router.get('/', asyncHandler(addressController.getUserAddresses))

// Routes with parameters come after specific ones
router.get('/:addressId', asyncHandler(addressController.getAddressById))
router.post('/', asyncHandler(addressController.addUserAddress))
router.put('/:addressId', asyncHandler(addressController.updateUserAddress))
router.patch('/:addressId/set-default', asyncHandler(addressController.setDefaultAddress))
router.delete('/:addressId', asyncHandler(addressController.deleteUserAddress))

module.exports = router