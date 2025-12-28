const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : '*', // Cho phép tất cả origins nếu không có config
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'x-api-key',
        'x-client-id',
        'x-rtoken-id',
    ],
    credentials: true, // Cho phép gửi cookies/credentials
}

module.exports = corsOptions
