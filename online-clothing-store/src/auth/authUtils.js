'use strict'

const { promisify } = require('util')
const JWT = require('jsonwebtoken')
const asyncHandler = require('../helpers/asyncHandler')
const {
    AuthFailureError,
    NotFoundError,
    ForbiddenError,
} = require('../core/error.response')
const { JWT_SECRET, JWT_REFRESH } = require('../configs/jwtkey.config')
const { getRedis } = require('../dbs/init.redis')
const {
    REDIS_AVAILABLE_IAT_PREFIX,
    REDIS_TOKEN_BLACKLIST_PREFIX,
} = require('../configs/redis.config')

const createTokenPair = async (payload, accessKey, refreshKey) => {
    try {
        // accessToken
        const accessToken = await JWT.sign(payload, accessKey, {
            // algorithm: 'RS256',
            expiresIn: '5h',
        })

        const refreshToken = await JWT.sign(payload, refreshKey, {
            // algorithm: 'RS256',
            expiresIn: '7d',
        })

        //verify

        JWT.verify(accessToken, accessKey, (err, decode) => {
            if (err) {
                console.error('error verify::', err)
            } else {
                console.log('decode verify::', decode)
            }
        })
        return { accessToken, refreshToken }
    } catch (error) {
        throw error
    }
}

const createTokenPairV2 = async (payload) => {
    try {
        const accessToken = JWT.sign(payload, JWT_SECRET, {
            expiresIn: '2d',
        })
        const refreshToken = JWT.sign(payload, JWT_REFRESH, {
            expiresIn: '7d',
        })
        JWT.verify(accessToken, JWT_SECRET, (err, decode) => {
            if (err) {
                console.error('error verify::', err)
            } else {
                console.log('decode verify::', decode)
            }
        })

        return { accessToken, refreshToken }
    } catch (error) {
        throw error
    }
}

const verifyJWT = (token, secretKey) => {
    return new Promise((resolve, reject) => {
        JWT.verify(token, secretKey, (err, decode) => {
            if (err) {
                reject(err)
            } else {
                resolve(decode)
            }
        })
    })
}

const checkTokenExistsBlacklist = async (decoded) => {
    const redis = getRedis()

    const changePasswordTimestamp = await redis.get(
        `${REDIS_AVAILABLE_IAT_PREFIX}_${decoded.uid}`
    )
    if (changePasswordTimestamp && decoded.iat < changePasswordTimestamp)
        throw new AuthFailureError('Token revoked!')

    const isTokenExistsBlacklist = await redis.get(
        `${REDIS_TOKEN_BLACKLIST_PREFIX}_${decoded.uid}_${decoded.jti}`
    )

    if (isTokenExistsBlacklist) throw new AuthFailureError('Token revoked!')
    return true
}

module.exports = {
    createTokenPair,
    createTokenPairV2,
    verifyJWT,
    checkTokenExistsBlacklist,
}
