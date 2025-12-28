// services/supabaseRealtimeService.js
import { supabase } from '../config/supabaseClient.js'

class SupabaseRealtimeService {
    constructor() {
        this.subscriptions = new Map()
        this.isConnected = false
    }

    // Kết nối và lắng nghe thay đổi của một table
    subscribeToTable(tableName, options = {}) {
        const {
            event = '*', // 'INSERT', 'UPDATE', 'DELETE', hoặc '*' cho tất cả
            filter = null, // Ví dụ: 'id=eq.1' 
            callback = () => {},
            onError = (error) => console.error(`❌ Lỗi realtime cho table ${tableName}:`, error)
        } = options

        // console.log(`🔄 Đang subscribe vào table: ${tableName}`)

        // Tạo subscription
        const subscription = supabase
            .channel(`realtime_${tableName}`)
            .on(
                'postgres_changes',
                {
                    event,
                    schema: 'public',
                    table: tableName,
                    ...(filter && { filter })
                },
                (payload) => {
                    callback(payload)
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log(`✅ Đã subscribe thành công vào table: ${tableName}`)
                    this.isConnected = true
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`❌ Lỗi khi subscribe vào table: ${tableName}`)
                    onError(new Error(`Channel error for table ${tableName}`))
                }
            })

        // Lưu subscription để có thể unsubscribe sau
        const subscriptionKey = `${tableName}_${event}`
        this.subscriptions.set(subscriptionKey, subscription)

        return {
            subscription,
            unsubscribe: () => this.unsubscribe(subscriptionKey)
        }
    }

    // Hủy subscription
    unsubscribe(subscriptionKey) {
        const subscription = this.subscriptions.get(subscriptionKey)
        if (subscription) {
            supabase.removeChannel(subscription)
            this.subscriptions.delete(subscriptionKey)
            // console.log(`✅ Đã hủy subscription: ${subscriptionKey}`)
        }
    }

    // Hủy tất cả subscriptions
    unsubscribeAll() {
        this.subscriptions.forEach((subscription, key) => {
            supabase.removeChannel(subscription)
            // console.log(`✅ Đã hủy subscription: ${key}`)
        })
        this.subscriptions.clear()
        this.isConnected = false
    }

    // Subscribe vào nhiều table cùng lúc
    subscribeToMultipleTables(tableConfigs) {
        const subscriptions = {}
        
        tableConfigs.forEach(config => {
            const { tableName, ...options } = config
            subscriptions[tableName] = this.subscribeToTable(tableName, options)
        })

        return {
            subscriptions,
            unsubscribeAll: () => {
                Object.values(subscriptions).forEach(sub => sub.unsubscribe())
            }
        }
    }

    // Lắng nghe presence (user online/offline)
    subscribeToPresence(channelName, options = {}) {
        const {
            onJoin = () => {},
            onLeave = () => {},
            onSync = () => {}
        } = options

        // console.log(`🔄 Đang subscribe vào presence channel: ${channelName}`)

        const channel = supabase.channel(channelName, {
            config: {
                presence: {
                    key: 'user_presence'
                }
            }
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                // console.log('👥 Presence sync:', state)
                onSync(state)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                onJoin(key, newPresences)
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                onLeave(key, leftPresences)
            })
            .subscribe()

        return {
            channel,
            track: (userInfo) => channel.track(userInfo),
            untrack: () => channel.untrack(),
            unsubscribe: () => supabase.removeChannel(channel)
        }
    }

    // Gửi broadcast message
    sendBroadcast(channelName, eventName, payload) {
        const channel = supabase.channel(channelName)
        return channel.send({
            type: 'broadcast',
            event: eventName,
            payload
        })
    }

    // Lắng nghe broadcast messages
    subscribeToBroadcast(channelName, eventName, callback) {
        // console.log(`🔄 Đang subscribe vào broadcast: ${channelName}/${eventName}`)

        const channel = supabase.channel(channelName)
        
        channel
            .on('broadcast', { event: eventName }, callback)
            .subscribe()

        return {
            channel,
            unsubscribe: () => supabase.removeChannel(channel)
        }
    }

    // Kiểm tra trạng thái kết nối
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            activeSubscriptions: this.subscriptions.size,
            subscriptionKeys: Array.from(this.subscriptions.keys())
        }
    }
}

// Tạo instance duy nhất
export const realtimeService = new SupabaseRealtimeService()

// Helper functions để sử dụng dễ dàng
export const useRealtimeSubscription = (tableName, callback, options = {}) => {
    return realtimeService.subscribeToTable(tableName, {
        ...options,
        callback
    })
}

export const usePresence = (channelName, callbacks = {}) => {
    return realtimeService.subscribeToPresence(channelName, callbacks)
}

export const useBroadcast = (channelName, eventName, callback) => {
    return realtimeService.subscribeToBroadcast(channelName, eventName, callback)
}

export default realtimeService