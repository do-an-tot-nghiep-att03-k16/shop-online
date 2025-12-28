'use strict'

const crypto = require('crypto')
const axios = require('axios')
const { BadRequestError } = require('../core/error.response')
const OrderService = require('./order.service')
const PaymentRepo = require('../models/repositories/payment.repo')
const Transaction = require('../models/transaction.model')

class PaymentService {
    constructor() {
        // Sepay configuration - sẽ lấy từ environment variables
        this.sepayConfig = {
            // Production environment với thông tin thực tế
            api_url:
                process.env.SEPAY_API_URL ||
                'https://my.sepay.vn/userapi/transactions/create',
            account_number: process.env.SEPAY_ACCOUNT_NUMBER || 'VQRQAGBEN4802',
            account_name: process.env.SEPAY_ACCOUNT_NAME || 'NGUYEN VAN A',
            bank_id: process.env.SEPAY_BANK_ID || 'MBBank', // MBBank theo format QR của bạn
            template: process.env.SEPAY_TEMPLATE || 'compact2', // Template QR
            secret_key: process.env.SEPAY_SECRET_KEY || 'your_secret_key_here',
            api_key: process.env.SEPAY_API_KEY || 'your_api_key_here', // ✅ Thêm API Key
        }
    }

    // ❌ REMOVED: createSepayQR - No endpoint uses this function
    // ❌ REMOVED: generateQRCode - No endpoint uses this function

    /**
     * Xác thực webhook từ Sepay - Support cả API Key và Signature
     */
    async verifySepaySignature(webhookData, headers) {
        try {
            // ✅ 1. Kiểm tra API Key authentication (theo docs SePay)
            const authHeader =
                headers['authorization'] || headers['Authorization']
            if (authHeader && authHeader.startsWith('Apikey ')) {
                const apiKey = authHeader.substring(7) // Remove "Apikey "
                const expectedApiKey =
                    process.env.SEPAY_API_KEY || this.sepayConfig.api_key

                if (apiKey === expectedApiKey) {
                    // console.log('✅ API Key authentication successful')
                    return true
                } else {
                    // console.log('❌ Invalid API Key:', {
                    //     received: apiKey.substring(0, 8) + '...',
                    //     expected: expectedApiKey
                    //         ? expectedApiKey.substring(0, 8) + '...'
                    //         : 'NOT_SET',
                    // })
                    return false
                }
            }

            // ✅ 2. Fallback: Kiểm tra signature (nếu có)
            const signature =
                headers['x-sepay-signature'] || headers['signature']

            if (!signature) {
                // console.log(
                //     '⚠️ No authentication found (no API key or signature)'
                // )
                return false
            }

            const payload = JSON.stringify(webhookData)
            const expectedSignature = crypto
                .createHmac('sha256', this.sepayConfig.secret_key)
                .update(payload)
                .digest('hex')

            const isValid = signature === expectedSignature
            // console.log('🔐 Signature validation:', {
            //     received: signature.substring(0, 12) + '...',
            //     expected: expectedSignature.substring(0, 12) + '...',
            //     valid: isValid,
            // })

            return isValid
        } catch (error) {
            // console.error('❌ Authentication verification error:', error)
            return false
        }
    }

    /**
     * Xử lý webhook từ Sepay khi có giao dịch - VERSION CẢI THIỆN
     */
    async processSepayWebhook(webhookData, requestInfo = {}) {
        let newTransaction = null // Track transaction for error handling

        try {
            // console.log('🔍 Processing Sepay webhook:', webhookData)

            const {
                id: transaction_id,
                gateway,
                transactionDate: transaction_date,
                accountNumber: account_number,
                subAccount: sub_account,
                transferType,
                transferAmount, //
                accumulated,
                code,
                content,
                referenceCode: reference_code,
                description,
            } = webhookData

            //  1. KIỂM TRA LOẠI GIAO DỊCH - QUAN TRỌNG!
            if (transferType !== 'in') {
                // console.log('⚠️ Not an incoming transfer:', transferType)
                return { processed: false, reason: 'Not incoming transfer' }
            }

            //  2. KIỂM TRA SỐ TIỀN PHẢI > 0
            if (!transferAmount || transferAmount <= 0) {
                // console.log('⚠️ Invalid transfer amount:', transferAmount)
                return { processed: false, reason: 'Invalid amount' }
            }

            //  3. Parse content để lấy mã giao dịch
            const transaction_code = this.extractTransactionCode(
                content || description
            )

            if (!transaction_code) {
                // console.log('⚠️ No transaction code found in content:', content)
                return { processed: false, reason: 'No transaction code' }
            }

            //  4. Tìm order để validate
            const { order: Order } = require('../models/order.model')
            const order = await Order.findOne({
                order_number: transaction_code.replace('DH', ''),
            })

            if (!order) {
                // console.log(
                //     '⚠️ No order found for transaction_code:',
                //     transaction_code
                // )
                return { processed: false, reason: 'Order not found' }
            }

            //  5. Kiểm tra order chưa được thanh toán
            if (order.payment_status === 'paid') {
                // console.log('⚠️ Order already paid:', order.order_number)
                return { processed: false, reason: 'Already paid' }
            }

            //  6. Kiểm tra số tiền chính xác
            const expected_amount = order.total_amount
            const received_amount = transferAmount

            if (Math.abs(received_amount - expected_amount) > 1000) {
                // console.log('⚠️ Amount mismatch:', {
                //     expected: expected_amount,
                //     received: received_amount,
                //     difference: Math.abs(received_amount - expected_amount),
                // })
                return { processed: false, reason: 'Amount mismatch' }
            }

            //  7. Tạo transaction record - exact webhook fields
            newTransaction = await Transaction.create({
                ...webhookData, // All webhook fields exactly as received
                order_id: order.order_number,
                processed: false, // Will be marked true after successful processing
                error_message: null,
            })

            //  8. Cập nhật order payment_status = paid
            await Order.findByIdAndUpdate(order._id, {
                payment_status: 'paid',
                payment_details: {
                    transaction_id: transaction_id,
                    transaction_code: transaction_code,
                    amount: received_amount,
                    transaction_date: transaction_date,
                    gateway: gateway,
                    reference_code: reference_code,
                },
                updated_at: new Date(),
            })

            //  9. TRIGGER SSE PAYMENT EVENT - Emit tới frontend realtime
            // console.log(
            //     '🚀 About to emit SSE event for order:',
            //     order.order_number
            // )

            const sseResult = await this.emitPaymentSSEEvent({
                order_id: order.order_number,
                user_id: order.user_id,
                transaction_code,
                payment_status: 'paid',
                amount: received_amount,
                received_amount: received_amount, // Frontend expects this field
                transaction_id: transaction_id,
                sepay_transaction_id: transaction_id, // Frontend fallback field
                event_type: 'payment_completed',
                webhook_data: webhookData || {}, // Include webhook data
                transfer_content: `Payment for order ${order.order_number}`,
            })

            // console.log('📡 SSE emit result:', sseResult)

            //  10. Mark transaction as successfully processed
            if (newTransaction) {
                await Transaction.findByIdAndUpdate(newTransaction._id, {
                    processed: true,
                })
            }

            // console.log('✅ Payment processed successfully:', {
            //     transaction_code,
            //     order_id: order.order_number,
            //     amount: received_amount,
            //     gateway,
            // })

            return {
                processed: true,
                transaction_code,
                order_id: order.order_number,
                amount: received_amount,
                gateway,
                transaction_date,
            }
        } catch (error) {
            console.error('❌ Process webhook error:', error)

            // ✅ Mark transaction as failed if it was created
            if (newTransaction) {
                try {
                    await Transaction.findByIdAndUpdate(newTransaction._id, {
                        processed: false,
                        error_message: error.message,
                        error_stack: error.stack,
                        failed_at: new Date(),
                    })
                    console.log(`⚠️ Transaction ${newTransaction._id} marked as failed`)
                } catch (updateError) {
                    console.error(
                        '❌ Failed to update transaction error status:',
                        updateError.message
                    )
                }
            }

            throw error
        }
    }

    /**
     * Kiểm tra trạng thái thanh toán - Sử dụng Order model thay vì Payment
     */
    async checkSepayPaymentStatus({ order_id, userId }) {
        try {
            // ✅ Lấy thông tin từ Order model thay vì Payment
            const { order: Order } = require('../models/order.model')
            const order = await Order.findOne({
                order_number: order_id,
                user_id: userId,
            })

            if (!order) {
                throw new BadRequestError('Order not found or access denied')
            }

            return {
                order_id: order.order_number,
                payment_status: order.payment_status,
                total_amount: order.total_amount,
                payment_details: order.payment_details,
                created_at: order.created_at,
                updated_at: order.updated_at,
            }
        } catch (error) {
            console.error('Check payment status error:', error)
            throw error
        }
    }

    // ❌ REMOVED: cancelSepayPayment - No endpoint uses this function

    // =================
    // HELPER METHODS
    // =================

    extractTransactionCode(content) {
        if (!content) return null

        //  Tìm nhiều pattern có thể có:
        // Pattern 1: DHxxxxxx_timestamp (từ backend generate)
        let match = content.match(/DH\w+_\d+/)
        if (match) return match[0]

        // Pattern 2: DH xxxxxx (từ frontend simple - có space)
        match = content.match(/DH\s+(\w+)/)
        if (match) return `DH${match[1]}`

        // Pattern 3: DHxxxxxx (không có timestamp)
        match = content.match(/DH\w+/)
        if (match) return match[0]

        // Pattern 4: Mã đơn hàng trực tiếp (ORD...) - convert thành DH format
        match = content.match(/ORD\w+/)
        if (match) return `DH${match[0]}`

        // Pattern 5: Case insensitive search
        match = content.toLowerCase().match(/dh\w+_\d+/)
        if (match) return match[0].toUpperCase()

        match = content.toLowerCase().match(/dh\s+(\w+)/)
        if (match) return `DH${match[1].toUpperCase()}`

        match = content.toLowerCase().match(/dh\w+/)
        if (match) return match[0].toUpperCase()

        match = content.toLowerCase().match(/ord\w+/)
        if (match) return `DH${match[0].toUpperCase()}`
        
        return null
    }

    getBankName(bank_id) {
        const banks = {
            MB: 'MB Bank',
            VCB: 'Vietcombank',
            TCB: 'Techcombank',
            BIDV: 'BIDV',
            VIB: 'VIB',
            TPB: 'TPBank',
            STB: 'Sacombank',
        }
        return banks[bank_id] || bank_id
    }

    // ❌ REMOVED: Database operations - These functions are not used by any endpoints
    // ❌ REMOVED: savePendingPayment - No endpoint uses this function
    // ❌ REMOVED: findPendingPayment - No endpoint uses this function
    // ❌ REMOVED: updatePaymentStatus - No endpoint uses this function
    // ❌ REMOVED: getPaymentByOrderId - Only used by removed functions

    // Cập nhật payment status của Order
    async updateOrderPaymentStatus({
        order_number,
        payment_status,
        payment_details,
    }) {
        const { order } = require('../models/order.model')

        try {
            // console.log('Updating order payment status:', {
            //     order_number,
            //     payment_status,
            // })

            const orderDoc = await order.findOne({ order_number })
            if (!orderDoc) {
                throw new Error(`Order not found: ${order_number}`)
            }

            // Update payment status và details
            orderDoc.payment_status = payment_status
            orderDoc.payment_details = {
                ...orderDoc.payment_details,
                ...payment_details,
                paid_at:
                    payment_status === 'paid'
                        ? new Date()
                        : orderDoc.payment_details?.paid_at,
            }

            // Nếu thanh toán thành công, có thể tự động chuyển status order
            if (payment_status === 'paid' && orderDoc.status === 'pending') {
                orderDoc.addStatusHistory(
                    'confirmed',
                    'Thanh toán thành công qua Sepay QR',
                    null
                )
            }

            await orderDoc.save()

            // console.log(' Order payment status updated successfully')
            return orderDoc
        } catch (error) {
            // console.error(' Update order payment status error:', error)
            throw error
        }
    }

    /**
     * ✅ EMIT PAYMENT SSE EVENT - Gửi event tới frontend qua SSE
     * KIẾN TRÚC ĐÚNG: Service → Service (không gọi Controller)
     */
    async emitPaymentSSEEvent(eventData) {
        try {
            //  ĐÚNG: Service gọi Service thay vì Controller
            const SSEEventService = require('./sseEventService')

            // console.log('📡 Emitting payment SSE event:', {
            //     order_id: eventData.order_id,
            //     payment_status: eventData.payment_status,
            //     event_type: eventData.event_type,
            //     transaction_code: eventData.transaction_code,
            //     amount: eventData.amount,
            //     transaction_id: eventData.transaction_id,
            // })

            // Prepare event data for SSE clients
            const sseEventData = {
                payment_status: eventData.payment_status,
                event_type: eventData.event_type,
                user_id: eventData.user_id,
                transaction_code: eventData.transaction_code,
                amount: eventData.amount,
                received_amount: eventData.received_amount,
                sepay_transaction_id: eventData.sepay_transaction_id,
                transfer_content: eventData.transfer_content,
                webhook_data: eventData.webhook_data,
            }

            //  Gọi service khác - tuân thủ kiến trúc
            const result = SSEEventService.emitPaymentEvent(
                eventData.order_id,
                sseEventData
            )

            // console.log(' SSE payment event emitted:', result)
            return {
                success: true,
                method: 'SSE',
                order_id: eventData.order_id,
                event_type: eventData.event_type,
                clients_notified: result.clientsNotified || 0,
            }
        } catch (error) {
            console.error('❌ Error emitting payment SSE event:', error)
            return { success: false, error: error.message, method: 'SSE' }
        }
    }

    // NOTE: Admin functions moved to TransactionController 
    // to keep PaymentService focused on QR payment logic only

    // REMOVED: Deprecated Supabase realtime methods
    // Now using SSE (Server-Sent Events) for real-time payment updates
    // See emitPaymentSSEEvent() method above for current implementation
}

module.exports = new PaymentService()
