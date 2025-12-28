'use strict'

const { CREATED, SuccessResponse } = require('../core/success.response')
const AddressService = require('../services/address.service')

class AddressController {
    /**
     * @desc Get all addresses of user
     * @route GET /api/v1/user/addresses
     * @access Private
     */
    getUserAddresses = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get user addresses successfully',
            metadata: await AddressService.getUserAddresses(req.userId),
        }).send(res)
    }

    /**
     * @desc Get default address of user
     * @route GET /api/v1/user/addresses/default
     * @access Private
     */
    getDefaultAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get default address successfully',
            metadata: await AddressService.getDefaultAddress(req.userId),
        }).send(res)
    }

    /**
     * @desc Get address by ID
     * @route GET /api/v1/user/addresses/:addressId
     * @access Private
     */
    getAddressById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get address successfully',
            metadata: await AddressService.getUserAddressById(
                req.userId,
                req.params.addressId
            ),
        }).send(res)
    }

    /**
     * @desc Add new address for user
     * @route POST /api/v1/user/addresses
     * @access Private
     * @body { full_name, phone, address_line, province_id, ward_id, type?, is_default?, note?, postal_code? }
     */
    addUserAddress = async (req, res, next) => {
        new CREATED({
            message: 'Address added successfully',
            metadata: await AddressService.addUserAddress(
                req.userId,
                req.body
            ),
        }).send(res)
    }

    /**
     * @desc Update user address
     * @route PUT /api/v1/user/addresses/:addressId
     * @access Private
     */
    updateUserAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Address updated successfully',
            metadata: await AddressService.updateUserAddress(
                req.userId,
                req.params.addressId,
                req.body
            ),
        }).send(res)
    }

    /**
     * @desc Set address as default
     * @route PATCH /api/v1/user/addresses/:addressId/set-default
     * @access Private
     */
    setDefaultAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Default address updated successfully',
            metadata: await AddressService.setDefaultAddress(
                req.userId,
                req.params.addressId
            ),
        }).send(res)
    }

    /**
     * @desc Delete user address
     * @route DELETE /api/v1/user/addresses/:addressId
     * @access Private
     */
    deleteUserAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Address deleted successfully',
            metadata: await AddressService.deleteUserAddress(
                req.userId,
                req.params.addressId
            ),
        }).send(res)
    }

    /**
     * @desc Search addresses by location
     * @route GET /api/v1/user/addresses/search
     * @access Private
     * @query { province_id, ward_id? }
     */
    searchAddressesByLocation = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search addresses successfully',
            metadata: await AddressService.searchAddressesByLocation(
                req.userId,
                req.query.province_id,
                req.query.ward_id
            ),
        }).send(res)
    }

    /**
     * @desc Get all provinces for address selection
     * @route GET /api/v1/user/addresses/provinces
     * @access Private
     */
    getProvinces = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get provinces successfully',
            metadata: await AddressService.getProvinces(),
        }).send(res)
    }

    /**
     * @desc Get wards by province ID for address selection
     * @route GET /api/v1/user/addresses/provinces/:provinceId/wards
     * @access Private
     */
    getWardsByProvince = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get wards by province successfully',
            metadata: await AddressService.getWardsByProvince(req.params.provinceId),
        }).send(res)
    }

    /**
     * @desc Search locations for address selection
     * @route GET /api/v1/user/addresses/locations/search
     * @access Private
     * @query { query?, type?, level?, province_code?, limit? }
     */
    searchLocations = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search locations successfully',
            metadata: await AddressService.searchLocations(req.query),
        }).send(res)
    }
}

module.exports = new AddressController()