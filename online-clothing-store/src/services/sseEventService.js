'use strict'

/**
 * SSE Event Service - Độc lập cho realtime events
 * Tách riêng logic SSE khỏi PaymentService để tuân thủ kiến trúc
 */

class SSEEventService {
    
    constructor() {
        // Store active SSE connections - Di chuyển từ PaymentController
        this.activeSSEConnections = new Map() // orderId -> Set of response objects
        this.sseSessions = new Map() // sessionKey -> {userId, orderId, createdAt}
    }
    
    /**
     * 🔥 FIX: Normalize orderId format để consistent 
     */
    normalizeOrderId(orderId) {
        if (!orderId) return orderId
        
        // Convert any format to clean number: ORD123, DH123, 123 -> 123
        const cleaned = orderId.toString().replace(/^(ORD|DH)/i, '')
        // console.log(`🔧 OrderId normalized: ${orderId} -> ${cleaned}`)
        return cleaned
    }
    
    /**
     * ✅ REGISTER SSE CONNECTION - Đăng ký connection từ controller
     * 🔥 FIXED: Normalize orderId before storing
     */
    registerSSEConnection(orderId, responseObject) {
        try {
            const normalizedOrderId = this.normalizeOrderId(orderId)
            
            if (!this.activeSSEConnections.has(normalizedOrderId)) {
                this.activeSSEConnections.set(normalizedOrderId, new Set())
            }
            this.activeSSEConnections.get(normalizedOrderId).add(responseObject)
            
            // console.log(`📡 SSE connection registered for order: ${orderId} -> ${normalizedOrderId}`)
            // console.log(`📊 Total connections for ${normalizedOrderId}: ${this.activeSSEConnections.get(normalizedOrderId).size}`)
            return true
        } catch (error) {
            console.error('❌ Error registering SSE connection:', error)
            return false
        }
    }

    /**
     * ✅ REMOVE SSE CONNECTION - Xóa connection khi client disconnect
     * 🔥 FIXED: Normalize orderId before removing
     */
    removeSSEConnection(orderId, responseObject) {
        try {
            const normalizedOrderId = this.normalizeOrderId(orderId)
            const connections = this.activeSSEConnections.get(normalizedOrderId)
            if (connections) {
                connections.delete(responseObject)
                if (connections.size === 0) {
                    this.activeSSEConnections.delete(normalizedOrderId)
                }
                // console.log(`🔌 SSE connection removed for order: ${orderId} -> ${normalizedOrderId}`)
            }
            return true
        } catch (error) {
            console.error('❌ Error removing SSE connection:', error)
            return false
        }
    }

    /**
     * ✅ EMIT EVENT TO SSE CLIENTS - Business logic thuần túy, không depend Controller
     * Service gọi Service - ĐÚNG KIẾN TRÚC
     */
    emitPaymentEvent(orderId, eventData) {
        try {
            const normalizedOrderId = this.normalizeOrderId(orderId)
            const connections = this.activeSSEConnections.get(normalizedOrderId)
            
            // console.log(`🔍 Looking for SSE connections: ${orderId} -> ${normalizedOrderId}`)
            
            if (!connections || connections.size === 0) {
                // console.log(`⚠️ No active SSE connections for order: ${orderId} -> ${normalizedOrderId}`)
                // console.log('📊 Active connections:', Array.from(this.activeSSEConnections.keys()))
                return { success: false, reason: 'No active connections' }
            }

            // console.log(`📡 Emitting payment event to ${connections.size} SSE client(s) for order: ${orderId} -> ${normalizedOrderId}`)

            // ✅ OPTIMIZED: Minimal trigger-only SSE payload (best practice)
            const eventMessage = {
                type: 'payment_update',
                orderId: normalizedOrderId,
                status: eventData.payment_status || 'unknown'
            }
            
            // 🗂️ REMOVED from SSE (frontend should fetch via API instead):
            // - transaction_code, amount, received_amount (detailed payment info)  
            // - sepay_transaction_id, transfer_content (internal data)
            // - webhook_data (backend-only data)
            // - user_id, event_type (redundant)
            
            // 💡 Frontend flow: Receive SSE trigger → Call GET /orders/:id API for fresh data

            // 🔥 BACKEND SENDING SSE EVENT
            // console.log('🔥 ========== BACKEND SENDING SSE EVENT ==========')
            // console.log('📨 EXACT SSE MESSAGE TO FRONTEND:', JSON.stringify(eventMessage, null, 2))
            // console.log(`📡 Sending to ${connections.size} connections for order: ${orderId} -> ${normalizedOrderId}`)
            // console.log(`📡 Active connection IDs:`, Array.from(this.activeSSEConnections.keys()))
            // console.log('🔥 ===============================================')

            const sseData = `event: payment_update\ndata: ${JSON.stringify(eventMessage)}\n\n`
            let successCount = 0

            // Send to all connected clients for this order
            connections.forEach(res => {
                try {
                    res.write(sseData)
                    successCount++
                } catch (error) {
                    console.error('❌ Error writing to SSE client:', error)
                    connections.delete(res) // Remove failed connection
                }
            })

            // console.log(`✅ Payment event sent to ${successCount}/${connections.size} SSE client(s)`)
            
            return { 
                success: true, 
                clientsNotified: successCount,
                totalClients: connections.size,
                normalizedOrderId
            }

        } catch (error) {
            console.error('❌ Error emitting payment event via SSE:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * ✅ CREATE SSE SESSION - Business logic for session management
     */
    createSSESession(userId, orderId) {
        try {
            const normalizedOrderId = this.normalizeOrderId(orderId)
            const crypto = require('crypto')
            const sessionKey = crypto.randomBytes(16).toString('hex')
            
            // Store session (expire in 30 minutes)
            this.sseSessions.set(sessionKey, {
                userId: userId.toString(),
                orderId: normalizedOrderId, // 🔥 Store normalized orderId
                createdAt: Date.now(),
                expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
            })

            // console.log(`✅ SSE session created: ${sessionKey} for ${userId} -> ${orderId} -> ${normalizedOrderId}`)

            return {
                success: true,
                sessionKey,
                orderId: normalizedOrderId, // 🔥 Return normalized orderId
                expiresIn: 30 * 60 // seconds
            }

        } catch (error) {
            console.error('❌ Create SSE session error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * ✅ VALIDATE SSE SESSION - Check session validity
     */
    validateSSESession(sessionKey, orderId) {
        try {
            const normalizedOrderId = this.normalizeOrderId(orderId)
            const sessionData = this.sseSessions.get(sessionKey)
            
            if (!sessionData) {
                return { valid: false, reason: 'Session not found' }
            }

            // Check session expiry
            if (Date.now() > sessionData.expiresAt) {
                this.sseSessions.delete(sessionKey) // Cleanup expired session
                return { valid: false, reason: 'Session expired' }
            }

            // Verify session matches order (use normalized comparison)
            if (sessionData.orderId !== normalizedOrderId) {
                console.log(`❌ Order mismatch: session=${sessionData.orderId}, request=${normalizedOrderId}`)
                return { valid: false, reason: 'Session/order mismatch' }
            }

            // console.log(`✅ Valid SSE session for user: ${sessionData.userId} -> ${normalizedOrderId}`)

            return { 
                valid: true, 
                sessionData: {
                    userId: sessionData.userId,
                    orderId: normalizedOrderId
                }
            }

        } catch (error) {
            console.error('❌ Validate SSE session error:', error)
            return { valid: false, reason: 'Validation error' }
        }
    }

    /**
     * ✅ GET SSE STATUS - Debug information
     */
    getSSEStatus() {
        try {
            const status = {
                activeOrders: this.activeSSEConnections.size,
                activeSessions: this.sseSessions.size,
                connections: {}
            }

            this.activeSSEConnections.forEach((connections, orderId) => {
                status.connections[orderId] = connections.size
            })

            return status

        } catch (error) {
            console.error('❌ Get SSE status error:', error)
            return { error: error.message }
        }
    }

    /**
     * ✅ CLEANUP EXPIRED SESSIONS - Maintenance function
     */
    cleanupExpiredSessions() {
        try {
            const now = Date.now()
            let cleanedCount = 0

            for (const [sessionKey, sessionData] of this.sseSessions) {
                if (now > sessionData.expiresAt) {
                    this.sseSessions.delete(sessionKey)
                    cleanedCount++
                }
            }

            if (cleanedCount > 0) {
                // console.log(`🧹 Cleaned up ${cleanedCount} expired SSE sessions`)
            }

            return cleanedCount

        } catch (error) {
            console.error('❌ Cleanup sessions error:', error)
            return 0
        }
    }
}

// Export singleton instance
module.exports = new SSEEventService()