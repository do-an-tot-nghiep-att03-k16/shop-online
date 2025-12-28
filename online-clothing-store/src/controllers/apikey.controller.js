'use strict'
const { CREATED } = require('../core/success.response')
const ApiKeyService = require('../services/apikey.service')

const newApiKey = async (req, res, next) => {
    new CREATED({
        message: 'Create Apikey success!',
        metadata: await ApiKeyService.createApiKey(),
    }).send(res)
}

module.exports = {
    newApiKey,
}
