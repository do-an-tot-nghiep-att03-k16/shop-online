const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3055/v1/api'
const API_STRAPI_URL =
    import.meta.env.VITE_API_STRAPI_URL || 'https://cms.aristia.shop/api'

// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// N8N Chatbot Configuration
const N8N_WEBHOOK_URL =
    import.meta.env.VITE_N8N_WEBHOOK_URL ||
    'http://localhost:5678/webhook-test/chatbot'

export const envConfig = {
    API_BASE_URL,
    API_STRAPI_URL,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    N8N_WEBHOOK_URL,
}

export default envConfig
