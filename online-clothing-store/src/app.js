require('dotenv').config()
const express = require('express')
const { default: helmet } = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const corsOptions = require('./configs/cors.config')
const qs = require('qs')
const decodeQueryParams = require('./middlewares/decodeQuery.middleware')

// init middleware
app.set('query parser', (str) =>
    qs.parse(str, {
        depth: 10, // Cho phép nested object
        arrayLimit: 100, // Giới hạn array
    })
)
app.use(morgan('dev'))
app.use(helmet())
// ✅ FIX: Exclude SSE routes from compression (compression blocks streaming)
app.use(
    compression({
        filter: (req, res) => {
            // Don't compress SSE endpoints - they need to stream immediately
            if (
                req.headers.accept?.includes('text/event-stream') ||
                req.url.includes('/payment/events/')
            ) {
                console.log(`Skipping compression for SSE: ${req.url}`)
                return false
            }
            // Use default compression for everything else
            return compression.filter(req, res)
        },
    })
)

// CORS

app.use(cors(corsOptions))

app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    })
)

app.use(decodeQueryParams)

// init db
require('./dbs/init.mongodb')
const { checkOverload } = require('./helpers/check.connect')
const { initRedis } = require('./dbs/init.redis')

// init router
app.use('/', require('./routes'))

//handling error
app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    const statusCode = error.status || 500
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'dev' && { stack: error.stack }),
    })
})

module.exports = app
