'use strict'

const { htmlEmailToken } = require('../utils/tem.html')
const TEMPLATE = require('../models/template.model')

const newTemplateService = async ({ tem_name, tem_id = 0, tem_html }) => {
    const newTem = await TEMPLATE.create({
        tem_name,
        tem_id,
        tem_html: htmlEmailToken(),
    })

    return newTem
}

const getTemplate = async (tem_name) => {
    const template = await TEMPLATE.findOne({ tem_name }).lean()

    return template
}

module.exports = {
    newTemplateService,
    getTemplate,
}
