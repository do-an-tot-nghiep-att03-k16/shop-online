'use strict'

const { CREATED, SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const PaymentService = require('../services/payment.service')
const SSEEventService = require('../services/sseEventService') // ✅ Import SSE service
// TransactionRepo removed - using simplified transaction model directly

class PaymentController {

    // POST /payment/sepay/webhook - Webhook nhận thông báo từ Sepay
    sepayWebhook = async (req, res, next) => {
        // console.log('🔔 Sepay webhook received:', req.body)
        
        try {
            const webhookData = req.body
            
            // Authentication đã được handle bởi sepayApiKey middleware - không cần check signature
            // const isValidSignature = await PaymentService.verifySepaySignature(webhookData, req.headers)

            // ✅ Chuẩn bị request info để lưu transaction
            const requestInfo = {
                ip: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
                userAgent: req.headers['user-agent'],
                timestamp: new Date()
            }

            // Xử lý webhook data
            const result = await PaymentService.processSepayWebhook(webhookData, requestInfo)

            // Trả về response cho Sepay (quan trọng!)
            new SuccessResponse({
                message: 'Webhook processed successfully',
                metadata: result,
            }).send(res)

        } catch (error) {
            console.error('❌ Sepay webhook error:', error)
            
            // Vẫn trả về success để tránh Sepay retry liên tục
            new SuccessResponse({
                message: 'Webhook received',
                metadata: { processed: false, error: error.message },
            }).send(res)
        }
    }

    // GET /payment/sepay/check-status/:order_id - Kiểm tra trạng thái thanh toán
    checkSepayStatus = async (req, res, next) => {
        const { order_id } = req.params
        const userId = req.userId

        const statusResult = await PaymentService.checkSepayPaymentStatus({
            order_id,
            userId
        })

        new SuccessResponse({
            message: 'Payment status retrieved',
            metadata: statusResult,
        }).send(res)
    }


    // ===============================
    // TRANSACTION MANAGEMENT - MINIMAL
    // ===============================

    // NOTE: getTransactions method removed - moved to TransactionController

    /**
     * ✅ CREATE SSE SESSION - Tạo session key để connect SSE
     * POST /payment/sse-session  
     * CONTROLLER → SERVICE (đúng kiến trúc)
     */
    createSSESession = async (req, res) => {
        try {
            const { orderId } = req.body
            const userId = req.userId // From authenticate middleware

            // console.log('🔑 SSE Session request:', { orderId, userId })

            if (!orderId || !userId) {
                throw new BadRequestError(`Missing orderId (${orderId}) or userId (${userId})`)
            }

            // Verify user owns this order
            const { order } = require('../models/order.model')
            const orderDoc = await order.findOne({ 
                order_number: orderId,
                user_id: userId 
            })
            
            if (!orderDoc) {
                throw new BadRequestError('Order not found or access denied')
            }

            // ✅ Delegate to SSE service for business logic
            const sessionResult = SSEEventService.createSSESession(userId, orderId)
            
            if (!sessionResult.success) {
                throw new BadRequestError(sessionResult.error || 'Failed to create SSE session')
            }

            // console.log(`✅ SSE session created via service: ${sessionResult.sessionKey}`)

            new SuccessResponse({
                message: 'SSE session created successfully',
                metadata: sessionResult
            }).send(res)

        } catch (error) {
            console.error('❌ Create SSE session error:', error)
            throw new BadRequestError(error.message)
        }
    }

    /**
     * ✅ SSE ENDPOINT - Lắng nghe payment events realtime
     * GET /payment/events/:orderId
     * CONTROLLER → SERVICE (đúng kiến trúc)
     */
    paymentSSE = async (req, res) => {
        try {
            const { orderId } = req.params
            const { session } = req.query // Session key validation

            // console.log(`🔌 SSE connection request for order: ${orderId}`)

            // ✅ SECURITY: Validate session via service
            if (!session) {
                // console.log(`❌ Missing session key for order: ${orderId}`)
                return res.status(403).json({
                    success: false,
                    message: 'Missing session key'
                })
            }

            // ✅ Delegate validation to SSE service
            const validation = SSEEventService.validateSSESession(session, orderId)
            if (!validation.valid) {
                // console.log(`❌ Session validation failed: ${validation.reason}`)
                return res.status(403).json({
                    success: false,
                    message: validation.reason
                })
            }

            // console.log(`✅ Valid session for user: ${validation.sessionData.userId} -> ${orderId}`)

            // ✅ SSE headers theo CORS spec - NO credentials, NO custom headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
                // ✅ REMOVED: Allow-Headers, Allow-Methods (không cần cho SSE)
                // ✅ REMOVED: Allow-Credentials (SSE dùng session key thay vì cookies)
            })

            // 🔥 FIX #1: CRITICAL - Flush headers immediately to prevent browser pending
            res.flushHeaders()

            // ✅ OPTIMIZED: Minimal heartbeat (best practice)
            const heartbeatInterval = setInterval(() => {
                res.write(`event: heartbeat\ndata: {"type":"heartbeat"}\n\n`)
            }, 30000) // 30 giây

            // ✅ Register connection via service
            SSEEventService.registerSSEConnection(orderId, res)

            // ✅ FIX: Send initial connection confirmation với custom event type
            res.write(`event: connected\ndata: {"type":"connected","orderId":"${orderId}","timestamp":"${new Date().toISOString()}"}\n\n`)

            // Handle client disconnect
            req.on('close', () => {
                // console.log(`🔌 SSE connection closed for order: ${orderId}`)
                clearInterval(heartbeatInterval)
                
                // ✅ Remove connection via service
                SSEEventService.removeSSEConnection(orderId, res)
            })

        } catch (error) {
            console.error('❌ SSE connection error:', error)
            res.status(500).json({
                success: false,
                message: 'SSE connection failed',
                error: error.message
            })
        }
    }

    // ✅ REMOVED: Static method moved to SSEEventService
    // Không cần static method trong Controller nữa - logic đã chuyển sang Service

    /**
     * ✅ GET SSE CONNECTIONS STATUS - Debug endpoint
     * GET /payment/sse-status
     * CONTROLLER → SERVICE (đúng kiến trúc)
     */
    getSSEStatus = async (req, res) => {
        try {
            // ✅ Delegate to SSE service
            const status = SSEEventService.getSSEStatus()

            new SuccessResponse({
                message: 'SSE status retrieved successfully',
                metadata: status
            }).send(res)

        } catch (error) {
            throw new BadRequestError(error.message)
        }
    }

    // NOTE: Admin transaction history moved to separate TransactionController
    // to avoid confusion with payment QR logic
}

module.exports = new PaymentController()