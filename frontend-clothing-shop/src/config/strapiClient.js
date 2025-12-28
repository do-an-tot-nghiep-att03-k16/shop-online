// config/strapiClient.js
import axios from 'axios'

// Strapi client configuration
const strapiClient = axios.create({
    baseURL: 'http://localhost:1337/api', // Your Strapi URL
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
strapiClient.interceptors.request.use(
    (config) => {
        // console.log(`🔵 [Strapi Request] ${config.method?.toUpperCase()} ${config.url}`)
        return config
    },
    (error) => {
        console.error('🔴 [Strapi Request Error]:', error)
        return Promise.reject(error)
    }
)

// Response interceptor
strapiClient.interceptors.response.use(
    (response) => {
        // console.log(`🟢 [Strapi Response] ${response.status} ${response.config.url}`)
        return response
    },
    (error) => {
        console.error(
            '🔴 [Strapi Response Error]:',
            error.response?.data || error.message
        )
        return Promise.reject(error)
    }
)

export { strapiClient }
