// config/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL hoặc Anon Key chưa được cấu hình trong .env')
    console.log('Vui lòng thêm các biến môi trường sau vào .env:')
    console.log('VITE_SUPABASE_URL=your_supabase_project_url')
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
}

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

// Test connection function
export const testSupabaseConnection = async () => {
    try {
        console.log('🔄 Đang kiểm tra kết nối Supabase...')

        // Test basic connection
        const { data, error } = await supabase
            .from('_test')
            .select('*')
            .limit(1)

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = table không tồn tại (OK)
            throw error
        }

        // console.log('✅ Kết nối Supabase thành công!')
        return { success: true, message: 'Kết nối thành công' }
    } catch (error) {
        console.error('❌ Lỗi kết nối Supabase:', error.message)
        return { success: false, error: error.message }
    }
}

// Auth helper functions
export const supabaseAuth = {
    // Đăng nhập
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    },

    // Đăng ký
    signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { data, error }
    },

    // Đăng xuất
    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    // Lấy user hiện tại
    getCurrentUser: async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        return user
    },

    // Lắng nghe thay đổi auth state
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback)
    },
}

export default supabase
