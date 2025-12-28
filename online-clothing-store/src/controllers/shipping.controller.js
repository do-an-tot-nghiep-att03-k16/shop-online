'use strict'

const { SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const ShippingService = require('../services/shipping.service')

class ShippingController {
    // Get available shipping providers
    getProviders = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get shipping providers success!',
            metadata: await ShippingService.getProviders(),
        }).send(res)
    }

    // Calculate shipping fee
    calculateFee = async (req, res, next) => {
        const { provider_id, to_address, weight, order_value, insurance } = req.body

        if (!provider_id) {
            throw new BadRequestError('Provider ID is required')
        }

        if (!to_address) {
            throw new BadRequestError('Destination address is required')
        }

        new SuccessResponse({
            message: 'Calculate shipping fee success!',
            metadata: await ShippingService.calculateFee({
                provider_id,
                to_address,
                weight: weight || 1,
                order_value: order_value || 0,
                insurance: insurance || false
            }),
        }).send(res)
    }

    // Create shipping order (Admin only)
    createOrder = async (req, res, next) => {
        const {
            order_id,
            provider_id,
            from_address,
            to_address,
            items,
            cod_amount,
            insurance_value,
            note
        } = req.body

        if (!order_id || !provider_id) {
            throw new BadRequestError('Order ID and Provider ID are required')
        }

        new SuccessResponse({
            message: 'Create shipping order success!',
            metadata: await ShippingService.createShippingOrder({
                order_id,
                provider_id,
                from_address,
                to_address,
                items,
                cod_amount: cod_amount || 0,
                insurance_value: insurance_value || 0,
                note: note || ''
            }),
        }).send(res)
    }

    // Track shipping order
    track = async (req, res, next) => {
        const { trackingCode } = req.params

        if (!trackingCode) {
            throw new BadRequestError('Tracking code is required')
        }

        new SuccessResponse({
            message: 'Track shipping order success!',
            metadata: await ShippingService.trackOrder(trackingCode),
        }).send(res)
    }

    // Update shipping status (Admin/Webhook)
    updateStatus = async (req, res, next) => {
        const { trackingCode } = req.params
        const { status, location, description, updated_by } = req.body

        if (!trackingCode || !status) {
            throw new BadRequestError('Tracking code and status are required')
        }

        new SuccessResponse({
            message: 'Update shipping status success!',
            metadata: await ShippingService.updateStatus(trackingCode, {
                status,
                location,
                description,
                updated_by: updated_by || req.userId
            }),
        }).send(res)
    }

    // Cancel shipping order
    cancel = async (req, res, next) => {
        const { trackingCode } = req.params
        const { reason } = req.body

        if (!trackingCode) {
            throw new BadRequestError('Tracking code is required')
        }

        if (!reason) {
            throw new BadRequestError('Cancellation reason is required')
        }

        new SuccessResponse({
            message: 'Cancel shipping order success!',
            metadata: await ShippingService.cancelOrder(trackingCode, reason, req.userId),
        }).send(res)
    }

    // Get providers for specific location
    getProvidersForLocation = async (req, res, next) => {
        const { province_id, ward_id } = req.body

        new SuccessResponse({
            message: 'Get providers for location success!',
            metadata: await ShippingService.getProvidersForLocation({
                province_id,
                ward_id
            }),
        }).send(res)
    }

    // Generate tracking code
    generateTrackingCode = async (req, res, next) => {
        const { provider } = req.params

        if (!provider) {
            throw new BadRequestError('Provider is required')
        }

        new SuccessResponse({
            message: 'Generate tracking code success!',
            metadata: await ShippingService.generateTrackingCode(provider),
        }).send(res)
    }

    // Validate tracking code format
    validateTrackingCode = async (req, res, next) => {
        const { tracking_code } = req.body

        if (!tracking_code) {
            throw new BadRequestError('Tracking code is required')
        }

        new SuccessResponse({
            message: 'Validate tracking code success!',
            metadata: await ShippingService.validateTrackingCode(tracking_code),
        }).send(res)
    }

    // Webhook handler for shipping providers
    handleWebhook = async (req, res, next) => {
        const { provider } = req.params
        const webhookData = req.body

        if (!provider) {
            throw new BadRequestError('Provider is required')
        }

        new SuccessResponse({
            message: 'Handle webhook success!',
            metadata: await ShippingService.handleWebhook(provider, webhookData),
        }).send(res)
    }

    // Get shipping rates
    getRates = async (req, res, next) => {
        const { 
            from_address, 
            to_address, 
            weight, 
            dimensions,
            order_value 
        } = req.body

        if (!from_address || !to_address) {
            throw new BadRequestError('From and to addresses are required')
        }

        new SuccessResponse({
            message: 'Get shipping rates success!',
            metadata: await ShippingService.getRates({
                from_address,
                to_address,
                weight: weight || 1,
                dimensions,
                order_value: order_value || 0
            }),
        }).send(res)
    }
}

module.exports = new ShippingController()