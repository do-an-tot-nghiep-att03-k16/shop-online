'use strict'

const { verifyJWT } = require('./authUtils')
const { JWT_SECRET } = require('../configs/jwtkey.config')

/**
 * Optional authentication middleware
 * Nếu có Authorization header → authenticate và set req.role
 * Nếu không có → skip và tiếp tục (for public access)
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        
        // Nếu không có auth header → skip authentication
        if (!authHeader) {
            return next()
        }
        
        const parts = authHeader.split(' ')
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return next() // Skip invalid format
        }
        
        const accessToken = parts[1]
        if (!accessToken) {
            return next() // Skip empty token
        }
        
        try {
            // Verify token và set user info
            const decoded = await verifyJWT(accessToken, JWT_SECRET)
            req.userId = decoded.uid
            req.role = decoded.role
            req.jti = decoded.jti
        } catch (error) {
            // Token invalid → skip authentication (don't throw error)
            console.log('Optional auth failed:', error.message)
        }
        
        return next()
    } catch (error) {
        // Any error → skip authentication
        return next()
    }
}

module.exports = {
    optionalAuthenticate
}