'use strict'

const { SuccessResponse } = require('../core/success.response')
const { newTemplateService } = require('../services/template.service')

const newTemplate = async (req, res, next) => {
    new SuccessResponse({
        message: 'Create template successfully',
        metadata: await newTemplateService(req.body),
    }).send(res)
}

module.exports = {
    newTemplate,
}
