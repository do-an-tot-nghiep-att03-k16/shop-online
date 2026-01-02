export default ({ env }) => ({
    auth: {
        secret: env('ADMIN_JWT_SECRET'),
        // Strapi 5+ session configuration (thay thế expiresIn deprecated)
        sessions: {
            // Thời gian tối đa refresh token có hiệu lực (7 ngày)
            maxRefreshTokenLifespan: env.int('ADMIN_SESSION_MAX_REFRESH_TOKEN_LIFESPAN', 7 * 24 * 60 * 60 * 1000), // 7 days
            // Thời gian tối đa session có hiệu lực (30 ngày)
            maxSessionLifespan: env.int('ADMIN_SESSION_MAX_SESSION_LIFESPAN', 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    },
    apiToken: {
        salt: env('API_TOKEN_SALT'),
    },
    transfer: {
        enabled: true,
        token: {
            salt: env('TRANSFER_TOKEN_SALT'),
        },
    },
    secrets: {
        encryptionKey: env('ENCRYPTION_KEY'),
    },
    flags: {
        nps: env.bool('FLAG_NPS', true),
        promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    },
})
