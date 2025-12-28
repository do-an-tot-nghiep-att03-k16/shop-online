// Payment SSE Service
// Handles Server-Sent Events for real-time payment updates from backend

import { envConfig } from '../config/env'
import apiClient from '../config/apiClient'

class PaymentSSEService {
    constructor() {
        this.connections = new Map() // orderId -> { eventSource, callbacks }
        this.reconnectAttempts = new Map() // orderId -> attempt count
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 2000 // 2 seconds base delay
    }

    /**
     * Subscribe to payment events for a specific order
     * @param {string} orderId - Order ID to monitor
     * @param {object} callbacks - Event callbacks
     * @returns {object} Connection control object
     */
    async subscribeToPaymentEvents(orderId, callbacks = {}) {
        const {
            onPaymentCompleted = () => {},
            onPaymentFailed = () => {},
            onPaymentUpdate = () => {},
            onConnected = () => {},
            onError = (error) => console.error(`❌ Payment SSE error for ${orderId}:`, error),
            onConnectionLost = () => console.warn(`⚠️ Payment SSE connection lost for ${orderId}`)
        } = callbacks

        // Close existing connection if any
        this.unsubscribeFromOrder(orderId)

        // console.log(`🔌 Subscribing to payment SSE for order: ${orderId}`)

        try {
            // ✅ STEP 1: Create SSE session first
            // console.log(`🔑 Creating SSE session for order: ${orderId}`)
            
            // Use apiClient to include API key + auth headers automatically
            const sessionResponse = await apiClient.post('/payment/sse-session', {
                orderId
            })

            // Fix: sessionResponse itself contains the data (not sessionResponse.data)
            const sessionKey = sessionResponse.metadata?.sessionKey

            if (!sessionKey) {
                console.error('❌ No sessionKey found. Full response:', sessionResponse)
                throw new Error(`No sessionKey in response: ${JSON.stringify(sessionResponse)}`)
            }

            // console.log(`✅ SSE session created: ${sessionKey}`)

            // ✅ STEP 2: Connect SSE với session key - NORMALIZE ORDER ID
            const normalizedOrderId = orderId.toString().replace(/^(ORD|DH)/i, '')
            // console.log(`🔧 Frontend normalizing orderId: ${orderId} -> ${normalizedOrderId}`)
            const sseUrl = new URL(`${envConfig.API_BASE_URL}/payment/events/${normalizedOrderId}`)
            sseUrl.searchParams.append('session', sessionKey)
            
            // console.log(`🔌 Creating SSE connection to: ${sseUrl.toString()}`)
            
            // ✅ SSE connection - minimal setup, no credentials, no custom headers
            const eventSource = new EventSource(sseUrl.toString())
            // NOTE: EventSource chỉ gửi cookies, không gửi Authorization header
            // Authentication qua session key trong URL query string
            
            // ✅ DEBUG: Log EventSource creation
            // console.log(`📡 EventSource created. ReadyState: ${eventSource.readyState}`)
            // console.log(`📡 EventSource URL: ${eventSource.url}`)
            
            // ✅ DEBUG: Check EventSource state after 1 second  
            setTimeout(() => {
                // console.log(`🕐 EventSource after 1s - ReadyState: ${eventSource.readyState}`)
                // console.log(`🕐 ReadyState meanings: 0=CONNECTING, 1=OPEN, 2=CLOSED`)
                if (eventSource.readyState === EventSource.CLOSED) {
                    console.error(`❌ EventSource CLOSED immediately! Check Network tab for errors.`)
                } else if (eventSource.readyState === EventSource.CONNECTING) {
                    console.warn(`⚠️ Still CONNECTING after 1s. Should receive "connected" event soon.`)
                }
            }, 1000)
            
            // ✅ DEBUG: Check again after 3 seconds
            setTimeout(() => {
                // console.log(`🕕 EventSource after 3s - ReadyState: ${eventSource.readyState}`)
                if (eventSource.readyState === EventSource.CONNECTING) {
                    console.error(`❌ PROBLEM: Still CONNECTING after 3s! EventSource not receiving data.`)
                    console.error(`❌ Check if browser blocks SSE or CORS issues.`)
                }
            }, 3000)

            // Store connection info
            this.connections.set(orderId, {
                eventSource,
                callbacks,
                startTime: Date.now()
            })

            // Reset reconnect attempts on new connection
            this.reconnectAttempts.set(orderId, 0)

            // ===== EVENT HANDLERS =====

            // Connection opened
            eventSource.onopen = () => {
                // console.log(`✅ Payment SSE connected for order: ${orderId}`)
                // console.log(`🔗 EventSource readyState: ${eventSource.readyState}`)
                // console.log(`🔗 EventSource URL: ${eventSource.url}`)
                // console.log(`🕐 Connection timestamp: ${new Date().toISOString()}`)
                this.reconnectAttempts.set(orderId, 0) // Reset on successful connection
                onConnected({ orderId, timestamp: new Date().toISOString() })
            }

            // ✅ FIX: XÓA onmessage - CHỈ dùng custom events vì backend KHÔNG BAO GIỜ gửi default events
            // ❌ REMOVED: eventSource.onmessage = ... (backend không gửi default events)
            
            // ✅ Listen cho TẤT CẢ custom events mà backend gửi
            
            // 1. Connected event (khi SSE connection established)
            eventSource.addEventListener('connected', (event) => {
                // console.log(`📡 Raw event data:`, event.data)
                // console.log(`📡 Event type: connected`)
                // console.log(`📡 Event timestamp:`, new Date().toISOString())
                // console.log(`📡 Order ID:`, orderId)
                
                try {
                    const data = JSON.parse(event.data)
                    // console.log(`✅ Parsed connected data:`, data)
                    this.handleSSEMessage(orderId, data, callbacks)
                } catch (error) {
                    console.error('❌ Error parsing connected event:', error)
                    onError(new Error(`Failed to parse connected event: ${error.message}`))
                }
            })

            // 2. Heartbeat events (keep connection alive)
            eventSource.addEventListener('heartbeat', (event) => {
                // console.log(`📡 Raw event data:`, event.data)
                // console.log(`📡 Event type: heartbeat`)
                // console.log(`📡 Event timestamp:`, new Date().toISOString())
                // console.log(`📡 Order ID:`, orderId)
                
                try {
                    const data = JSON.parse(event.data)
                    // console.log(`✅ Parsed heartbeat data:`, data)
                    this.handleSSEMessage(orderId, data, callbacks)
                } catch (error) {
                    console.error('❌ Error parsing heartbeat event:', error)
                    // Don't call onError for heartbeat failures, just log
                }
            })

            // 3. Payment update events (MAIN EVENT)
            eventSource.addEventListener('payment_update', (event) => {
                // console.log(`📡 Raw event data:`, event.data)
                // console.log(`📡 Event type: payment_update`)
                // console.log(`📡 Event timestamp:`, new Date().toISOString())
                // console.log(`📡 Order ID:`, orderId)
                
                try {
                    const data = JSON.parse(event.data)
                    // console.log(`✅ Parsed payment data:`, data)
                    this.handleSSEMessage(orderId, data, callbacks)
                } catch (error) {
                    console.error(`❌ Error parsing payment_update event:`, error)
                    console.error(`❌ Raw event.data:`, event.data)
                    onError(new Error(`Failed to parse payment_update event: ${error.message}`))
                }
            })

            // Connection error
            eventSource.onerror = (event) => {
                console.error(`❌ Payment SSE error for order ${orderId}:`, event)
                
                if (eventSource.readyState === EventSource.CLOSED) {
                    // console.log(`🔌 Payment SSE connection closed for order: ${orderId}`)
                    onConnectionLost()
                    this.attemptReconnect(orderId, callbacks)
                } else {
                    onError(new Error('SSE connection error'))
                }
            }

            return {
                orderId,
                eventSource,
                unsubscribe: () => this.unsubscribeFromOrder(orderId),
                isConnected: () => eventSource.readyState === EventSource.OPEN,
                getConnectionInfo: () => this.getConnectionInfo(orderId)
            }

        } catch (error) {
            console.error(`❌ Failed to create SSE connection for order ${orderId}:`, error)
            onError(error)
            return null
        }
    }

    /**
     * Handle incoming SSE messages
     */
    handleSSEMessage(orderId, data, callbacks) {
        const { type } = data

        // console.log(`📡 SSE message received for order ${orderId}:`, {
        //     type,
        //     payment_status: data.payment_status,
        //     event_type: data.event_type,
        //     full_data: data
        // })
        // console.log(`📋 Message type: "${type}"`)
        // console.log(`📋 Payment status: "${data.payment_status}"`)
        // console.log(`📋 Event type: "${data.event_type}"`)
        // console.log(`📋 Full message data:`, JSON.stringify(data, null, 2))

        switch (type) {
            case 'connected':
                // console.log(`🔗 SSE connection confirmed for order: ${orderId}`)
                callbacks.onConnected?.(data)
                break

            case 'heartbeat':
                // Silent heartbeat - just log for debug
                // console.debug(`💓 SSE heartbeat for order: ${orderId}`)
                break

            case 'payment_update':
                console.log(`💰 Processing payment update for order: ${orderId}`)
                console.log(`💰 Payment data:`, JSON.stringify(data, null, 2))
                this.handlePaymentUpdate(orderId, data, callbacks)
                break

            default:
                console.warn(`⚠️ Unknown SSE message type: ${type}`, data)
                callbacks.onError?.(new Error(`Unknown message type: ${type}`))
        }
    }

    /**
     * ✅ OPTIMIZED: Handle minimal SSE triggers and fetch fresh data
     * Best Practice: SSE = trigger only, API = data source
     */
    async handlePaymentUpdate(orderId, sseData, callbacks) {
        // console.log(`🎯 Processing minimal SSE trigger for order: ${orderId}`, sseData)
        
        // ✅ MINIMAL SSE DATA: Only status trigger (optimized backend)
        const status = sseData.status || sseData.payment_status || 'unknown'
        
        try {
            // console.log(`📡 SSE trigger received → fetching fresh order data via API`)
            
            // ✅ BEST PRACTICE: Fetch complete, fresh order data from API
            const orderResponse = await apiClient.get(`/orders/${orderId}`)
            
            if (orderResponse.data.success) {
                const freshOrderData = {
                    ...orderResponse.data.metadata,
                    source: 'API_after_SSE_trigger',
                    ssePayload: sseData,
                    timestamp: new Date().toISOString()
                }
                
                // console.log(`✅ Fresh order data fetched via API:`, freshOrderData)

                // Process based on FRESH data (not stale SSE data)
                const paymentStatus = freshOrderData.payment_status

                switch (paymentStatus) {
                    case 'completed':
                    case 'paid':  // ✅ Backend sends 'paid'
                        // console.log(`✅ Payment completed (SSE trigger + fresh API) for order: ${orderId}`)
                        callbacks.onPaymentCompleted?.(freshOrderData)
                        // Auto cleanup connection after successful payment
                        setTimeout(() => this.unsubscribeFromOrder(orderId), 5000)
                        break

                    case 'failed':
                    case 'cancelled':
                    case 'expired':
                        console.log(`❌ Payment ${paymentStatus} (SSE trigger + fresh API) for order: ${orderId}`)
                        callbacks.onPaymentFailed?.(freshOrderData)
                        break

                    case 'pending':
                    default:
                        // console.log(`🔄 Payment update (SSE trigger + fresh API) for order: ${orderId}`)
                        callbacks.onPaymentUpdate?.(freshOrderData)
                        break
                }
            } else {
                throw new Error(`API failed: ${orderResponse.data.message}`)
            }

        } catch (error) {
            console.error(`❌ Failed to fetch fresh data after SSE trigger:`, error)
            
            // ⚠️ FALLBACK: Use minimal SSE trigger data (not ideal but prevents total failure)
            // console.warn(`⚠️ Using fallback SSE trigger data only`)
            
            const fallbackData = {
                orderId,
                payment_status: status,
                source: 'SSE_trigger_fallback',
                error: error.message,
                timestamp: new Date().toISOString(),
                note: 'API fetch failed after SSE trigger'
            }

            switch (status) {
                case 'paid':
                case 'completed':
                    callbacks.onPaymentCompleted?.(fallbackData)
                    break
                case 'failed':
                case 'cancelled':
                    callbacks.onPaymentFailed?.(fallbackData)
                    break
                default:
                    callbacks.onPaymentUpdate?.(fallbackData)
                    break
            }
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect(orderId, callbacks) {
        const currentAttempts = this.reconnectAttempts.get(orderId) || 0

        if (currentAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached for order: ${orderId}`)
            callbacks.onError?.(new Error('Max reconnection attempts reached'))
            this.unsubscribeFromOrder(orderId)
            return
        }

        this.reconnectAttempts.set(orderId, currentAttempts + 1)
        
        const delay = this.reconnectDelay * Math.pow(2, currentAttempts) // Exponential backoff

        setTimeout(() => {
            if (this.connections.has(orderId)) { // Only reconnect if still needed
                this.subscribeToPaymentEvents(orderId, callbacks)
            }
        }, delay)
    }

    /**
     * Unsubscribe from payment events for a specific order
     */
    unsubscribeFromOrder(orderId) {
        const connection = this.connections.get(orderId)
        
        if (connection) {
            connection.eventSource.close()
            this.connections.delete(orderId)
            this.reconnectAttempts.delete(orderId)
            return true
        }
        
        return false
    }

    /**
     * Unsubscribe from all payment events
     */
    unsubscribeAll() {
        
        this.connections.forEach((connection, orderId) => {
            connection.eventSource.close()
        })
        
        this.connections.clear()
        this.reconnectAttempts.clear()
    }

    /**
     * Get connection info for debugging
     */
    getConnectionInfo(orderId) {
        const connection = this.connections.get(orderId)
        
        if (!connection) {
            return null
        }

        return {
            orderId,
            connected: connection.eventSource.readyState === EventSource.OPEN,
            readyState: connection.eventSource.readyState,
            url: connection.eventSource.url,
            startTime: connection.startTime,
            duration: Date.now() - connection.startTime,
            reconnectAttempts: this.reconnectAttempts.get(orderId) || 0
        }
    }

    /**
     * Get status of all connections
     */
    getAllConnectionsStatus() {
        const status = {
            totalConnections: this.connections.size,
            activeOrders: [],
            connections: {}
        }

        this.connections.forEach((connection, orderId) => {
            const info = this.getConnectionInfo(orderId)
            status.activeOrders.push(orderId)
            status.connections[orderId] = info
        })

        return status
    }

    /**
     * Helper method for React hooks integration
     */
    usePaymentSSE(orderId, callbacks = {}) {
        return this.subscribeToPaymentEvents(orderId, callbacks)
    }
}

// Create singleton instance
export const paymentSSEService = new PaymentSSEService()

// Helper function for easy usage
export const usePaymentSSE = (orderId, callbacks = {}) => {
    return paymentSSEService.subscribeToPaymentEvents(orderId, callbacks)
}

// Cleanup on window unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        paymentSSEService.unsubscribeAll()
    })
}

export default paymentSSEService