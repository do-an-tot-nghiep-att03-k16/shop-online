'use strict'
const Redis = require('ioredis')
const {
    REDIS_HOST,
    REDIS_PORT,
    REDIS_CONNECT_TIMEOUT,
} = require('../configs/redis.config')
const { RedisError } = require('../core/error.response')

// Client storage
const clients = {
    main: null,
    publisher: null,
    subscriber: null,
}

// Create client
const createClient = (name) => {
    // Support both REDIS_URL (production) and REDIS_HOST/PORT (local)
    const redisUrl = process.env.REDIS_URL
    const client = redisUrl 
        ? new Redis(redisUrl, {
            connectTimeout: REDIS_CONNECT_TIMEOUT,
            retryStrategy(times) {
                if (times > 10) return null
                return Math.min(times * 100, 3000)
            },
        })
        : new Redis({
            host: REDIS_HOST,
            port: REDIS_PORT,
            connectTimeout: REDIS_CONNECT_TIMEOUT,
            retryStrategy(times) {
                if (times > 10) return null
                return Math.min(times * 100, 3000)
            },
        })

    client.on('connect', () => {
        console.log(`${name}: connecting...`)
    })

    client.on('ready', () => {
        console.log(`${name}: ready`)
    })

    client.on('error', (err) => {
        console.log(`${name}: error...`, err.message)
    })
    client.on('close', () => {
        console.log(`${name}: disconnected...`)
    })

    return client
}

// Init all client
const initRedis = async () => {
    try {
        clients.main = createClient('Redis')
        clients.publisher = createClient('Publisher')
        clients.subscriber = createClient('Subscriber')

        await clients.main.ping()
    } catch (error) {
        console.error('Redis init failed', error.message)
        throw new RedisError(
            (REDIS_CONNECT_TIMEOUT.message, REDIS_CONNECT_TIMEOUT.code)
        )
    }
}

// Close
const closeRedis = async () => {
    const closeClient = async (client, name) => {
        await client.quit()
        console.log(`${name}: closed`)
    }

    await Promise.all([
        closeClient(clients.main, 'Redis'),
        closeClient(clients.publisher, 'Publisher'),
        closeClient(clients.subscriber, 'Subscriber'),
    ])

    clients.main = null
    clients.publisher = null
    clients.subscriber = null
}

const getRedis = () => clients.main
const getPublisher = () => clients.publisher
const getSubscriber = () => clients.subscriber

module.exports = {
    initRedis,
    getRedis,
    getPublisher,
    getSubscriber,
    closeRedis,
}
