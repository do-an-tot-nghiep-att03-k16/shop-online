const { apikey } = require('../models/apikey.model')
const crypto = require('crypto')
class ApiKeyService {
    static createApiKey = async (permissions = ['1111']) => {
        const keyCode = crypto.randomBytes(64).toString('hex')
        const newKey = apikey.create({
            key: keyCode,
            permissions: permissions,
        })
        return newKey
    }

    static findKeyByKeyCode = async (keyCode) => {
        const foundKey = await apikey
            .findOne({ key: keyCode, status: true })
            .lean()
        return foundKey
    }
}
module.exports = ApiKeyService
