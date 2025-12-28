'use strict'

module.exports = {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_CONNECT_TIMEOUT: 10000,
    REDIS_TIMEOUT_MESSAGE: {
        code: -99,
        message: 'Redis connection timeout',
    },
    REDIS_TOKEN_BLACKLIST_PREFIX: 'TOKEN_BLACK_LIST',
    REDIS_REFRESH_TOKEN_PREFIX: 'TOKEN_REFRESH_BLACK_LIST',
    REDIS_AVAILABLE_IAT_PREFIX: 'TOKEN_IAT_AVAILABLE',
    REDIS_EX_TOKEN: 7 * 3600 * 24,
}
