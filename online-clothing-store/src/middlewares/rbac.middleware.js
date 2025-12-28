'use strict'

const { AuthFailureError } = require('../core/error.response')
// const ac = require('../middlewares/role.middleware')
const rbac = require('./role.middleware')
/**
 * @param {string} action // read, delete or update, create
 * @param {*} resource // profile, balance
 */
const grantAccess = (action, resource) => {
    return async (req, res, next) => {
        try {
            const rol_name = req.role
            const permission = rbac.can(rol_name)[action](resource)
            if (!permission.granted) {
                throw new AuthFailureError(
                    `You don't have enough permission...`
                )
            }
            next()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = grantAccess
