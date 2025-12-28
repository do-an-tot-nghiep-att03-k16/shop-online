'use strict'

const { CREATED, SuccessResponse } = require('../core/success.response')
const LocationService = require('../services/location.service')

class LocationController {
    /**
     * @desc Get all provinces
     * @route GET /api/v1/location/provinces
     * @access Public
     */
    getProvinces = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get provinces successfully',
            metadata: await LocationService.getProvinces(),
        }).send(res)
    }

    /**
     * @desc Get wards by province ID
     * @route GET /api/v1/location/province/:provinceId/wards
     * @access Public
     */
    getWardsByProvince = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get wards by province successfully',
            metadata: await LocationService.getWardsByProvince(req.params.provinceId),
        }).send(res)
    }

    /**
     * @desc Get wards by province code
     * @route GET /api/v1/location/province-code/:provinceCode/wards
     * @access Public
     */
    getWardsByProvinceCode = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get wards by province code successfully',
            metadata: await LocationService.getWardsByProvinceCode(req.params.provinceCode),
        }).send(res)
    }

    /**
     * @desc Get location by ID
     * @route GET /api/v1/location/:id
     * @access Public
     */
    getLocationById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get location successfully',
            metadata: await LocationService.getLocationById(req.params.id),
        }).send(res)
    }

    /**
     * @desc Get location path (full hierarchy)
     * @route GET /api/v1/location/:id/path
     * @access Public
     */
    getLocationPath = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get location path successfully',
            metadata: await LocationService.getLocationPath(req.params.id),
        }).send(res)
    }

    /**
     * @desc Search locations
     * @route GET /api/v1/location/search
     * @access Public
     */
    searchLocations = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search locations successfully',
            metadata: await LocationService.searchLocations({
                query: req.query.q || '',
                type: req.query.type,
                level: req.query.level ? parseInt(req.query.level) : null,
                province_code: req.query.province_code,
                limit: parseInt(req.query.limit) || 20,
            }),
        }).send(res)
    }

    /**
     * @desc Search wards in province
     * @route GET /api/v1/location/province-code/:provinceCode/wards/search
     * @access Public
     */
    searchWardsInProvince = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search wards in province successfully',
            metadata: await LocationService.searchWardsInProvince(
                req.params.provinceCode,
                req.query.q || ''
            ),
        }).send(res)
    }

    /**
     * @desc Get children of location
     * @route GET /api/v1/location/:id/children
     * @access Public
     */
    getChildren = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get children successfully',
            metadata: await LocationService.getChildren(req.params.id),
        }).send(res)
    }

    /**
     * @desc Get direct children of location
     * @route GET /api/v1/location/:id/direct-children
     * @access Public
     */
    getDirectChildren = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get direct children successfully',
            metadata: await LocationService.getDirectChildren(req.params.id),
        }).send(res)
    }

    /**
     * @desc Get location tree (provinces with their wards)
     * @route GET /api/v1/location/tree
     * @access Public
     */
    getLocationTree = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get location tree successfully',
            metadata: await LocationService.getLocationTree(),
        }).send(res)
    }

    /**
     * @desc Get location by code
     * @route GET /api/v1/location/code/:code
     * @access Public
     */
    getLocationByCode = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get location by code successfully',
            metadata: await LocationService.getLocationByCode(
                req.params.code,
                req.query.type
            ),
        }).send(res)
    }

    /**
     * @desc Get location statistics
     * @route GET /api/v1/location/stats
     * @access Public
     */
    getLocationStats = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get location statistics successfully',
            metadata: await LocationService.getLocationStats(),
        }).send(res)
    }

    /**
     * @desc Create new location
     * @route POST /api/v1/location
     * @access Private/Admin
     */
    createLocation = async (req, res, next) => {
        new CREATED({
            message: 'Location created successfully',
            metadata: await LocationService.createLocation(req.body),
        }).send(res)
    }

    /**
     * @desc Update location
     * @route PUT /api/v1/location/:id
     * @access Private/Admin
     */
    updateLocation = async (req, res, next) => {
        new SuccessResponse({
            message: 'Location updated successfully',
            metadata: await LocationService.updateLocation(
                req.params.id,
                req.body
            ),
        }).send(res)
    }

    /**
     * @desc Delete location
     * @route DELETE /api/v1/location/:id
     * @access Private/Admin
     */
    deleteLocation = async (req, res, next) => {
        new SuccessResponse({
            message: 'Location deleted successfully',
            metadata: await LocationService.deleteLocation(req.params.id),
        }).send(res)
    }
}

module.exports = new LocationController()