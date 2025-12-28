'use strict'
const HEADER = require('./header.config')
const ApiKeyService = require('../services/apikey.service')
const KeyTokenService = require('../services/key.service')
const { verifyJWT, checkTokenExistsBlacklist } = require('./authUtils')
const { ForbiddenError, AuthFailureError } = require('../core/error.response')
const { JWT_SECRET, JWT_REFRESH } = require('../configs/jwtkey.config')
const { getRedis } = require('../dbs/init.redis')
const {
    REDIS_TOKEN_BLACKLIST_PREFIX,
    REDIS_REFRESH_TOKEN_PREFIX,
    REDIS_AVAILABLE_IAT_PREFIX,
} = require('../configs/redis.config')
const { decode } = require('punycode')

const apiKey = async (req, res, next) => {
    try {
        const keyCode = req.headers[HEADER.API_KEY]
        if (!keyCode) {
            throw new ForbiddenError('Invalid Request - Missing API Key')
        }
        const objKey = await ApiKeyService.findKeyByKeyCode(keyCode.toString())
        if (!objKey) {
            throw new ForbiddenError('Invalid Request - API Key not found')
        }
        req.objKey = objKey
        next()
    } catch (error) {
        next(error)
    }
}

const sepayApiKey = async (req, res, next) => {
    try {
        const authHeader = req.headers[HEADER.AUTHORIZATION]
        // console.log('AuthHeader::', authHeader)
        if (!authHeader || !authHeader.startsWith('Apikey ')) {
            throw new ForbiddenError('Invalid Request - Missing SePay API Key')
        }

        const keyCode = authHeader.split(' ')[1] // Remove "Apikey " prefix
        const objKey = await ApiKeyService.findKeyByKeyCode(keyCode.toString())
        if (!objKey) {
            throw new ForbiddenError(
                'Invalid Request - SePay API Key not found'
            )
        }
        req.objKey = objKey
        next()
    } catch (error) {
        next(error)
    }
}

const permission = (permission) => {
    return async (req, res, next) => {
        try {
            const { objKey } = req
            if (!objKey.permissions.includes(permission)) {
                throw new ForbiddenError('Invalid Permission')
            }
            next()
        } catch (error) {
            next(error)
        }
    }
}

/**
 * Authentication middleware - Basic version
 * Verify accessToken và attach user info vào request
 */
const authenticate = async (req, res, next) => {
    try {
        // console.log(`Incoming request header::`, req.headers)

        // 1. get accessToken
        const authHeader = req.headers[HEADER.AUTHORIZATION]
        if (!authHeader) {
            throw new AuthFailureError(
                'Invalid Request - Missing Authorization Header'
            )
        }

        const parts = authHeader.split(' ')
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AuthFailureError(
                'Invalid Authorization format. Expected: Bearer <token>'
            )
        }

        const accessToken = parts[1]
        if (!accessToken) {
            throw new AuthFailureError('Invalid Request - Missing accessToken')
        }

        // 4. Verify accessToken

        const decoded = await verifyJWT(accessToken, JWT_SECRET)
        // console.log(`decode::`, decoded)

        await checkTokenExistsBlacklist(decoded)

        // 5. Attach user info to request
        req.userId = decoded.uid
        req.role = decoded.role
        req.jti = decoded.jti
        // console.log(`UserId::`, req.userId)

        return next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AuthFailureError(
                'Access token expired. Please login again.'
            )
        } else if (error.name === 'JsonWebTokenError') {
            throw new AuthFailureError('Invalid access token.')
        } else {
            throw error
        }
    }
}

const authenticateRefresh = async (req, res, next) => {
    try {
        const redis = getRedis()
        const refreshHeader = req.headers[HEADER.AUTHORIZATION]
        if (!refreshHeader)
            throw new AuthFailureError(
                'Invalid request, missing refresh header'
            )
        const decoded = await verifyJWT(refreshHeader, JWT_REFRESH)

        await checkTokenExistsBlacklist(decoded)

        req.userId = decoded.uid
        req.role = decoded.role
        req.jti = req.jti
        return next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AuthFailureError(
                'Refresh token expired. Please login again.'
            )
        } else if (error.name === 'JsonWebTokenError') {
            throw new AuthFailureError('Invalid refresh token.')
        } else {
            throw error
        }
    }
}

/**
 * Authentication middleware V2 - Enhanced security
 * Có thêm check token reuse để phát hiện token bị đánh cắp
 * Nên dùng cho các route quan trọng (payment, admin, etc.)
 */
const authenticationV2 = async (req, res, next) => {
    // console.log(`Incoming header::`, req.headers)

    try {
        // 1. Get userId from header
        const userId = req.headers[HEADER.CLIENT_ID]
        if (!userId) {
            throw new AuthFailureError('Invalid Request - Missing userId')
        }

        // 2. Get accessToken from header
        const authHeader = req.headers[HEADER.AUTHORIZATION]
        if (!authHeader) {
            throw new AuthFailureError(
                'Invalid Request - Missing Authorization Header'
            )
        }

        const parts = authHeader.split(' ')
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AuthFailureError(
                'Invalid Authorization format. Expected: Bearer <token>'
            )
        }

        const accessToken = parts[1]

        // 3. Get keyStore by userId
        const keyStore = await KeyTokenService.findByUserId(userId)
        if (!keyStore) {
            throw new AuthFailureError('Invalid Request - KeyStore not found')
        }

        // 4. Verify accessToken first
        const decodedUser = await verifyJWT(accessToken, keyStore.accessKey)
        if (userId !== decodedUser.userId) {
            throw new AuthFailureError('Invalid Request - UserId mismatch')
        }

        // 5. Check if refreshToken was used (detect token reuse attack)
        // Nếu refreshToken đã được dùng để tạo accessToken mới,
        // thì accessToken cũ không còn hợp lệ
        const refreshToken = req.headers[HEADER.REFRESH_TOKEN]
        if (refreshToken && keyStore.refreshTokensUsed.includes(refreshToken)) {
            // Token đã bị reuse - có thể bị đánh cắp
            await KeyTokenService.deleteKeyByUserId(userId)
            throw new AuthFailureError(
                'Invalid Request - Token has been reused. Please login again.'
            )
        }

        // 6. Attach user info to request
        req.keyStore = keyStore
        req.user = decodedUser
        req.userId = decodedUser.userId
        req.role = decodedUser.role
        return next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AuthFailureError(
                'Access token expired. Please login again.'
            )
        } else if (error.name === 'JsonWebTokenError') {
            throw new AuthFailureError('Invalid access token.')
        } else {
            throw error
        }
    }
}

module.exports = {
    apiKey,
    sepayApiKey,
    permission,
    authenticate,
    authenticationV2,
    authenticateRefresh,
}
