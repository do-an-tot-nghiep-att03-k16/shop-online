'use strict'

const express = require('express')
const transactionController = require('../../controllers/transaction.controller')
const { authenticate } = require('../../auth/checkAuth')
const grantAccess = require('../../middlewares/rbac.middleware')
const asyncHandler = require('../../helpers/asyncHandler')
const router = express.Router()

// Authentication required for all admin routes
router.use(authenticate)

// ============ ADMIN TRANSACTION ROUTES ============
// RBAC: admin and shop can view transactions

// Get transaction history with filters and pagination
router.get(
    '/admin/history',
    grantAccess('readAny', 'transaction'), // admin or shop
    asyncHandler(transactionController.getTransactionHistory)
)

// Get transaction details by ID
router.get(
    '/admin/details/:transactionId',
    grantAccess('readAny', 'transaction'),
    asyncHandler(transactionController.getTransactionDetails)
)

// Get dashboard statistics
router.get(
    '/admin/stats',
    grantAccess('readAny', 'transaction'),
    asyncHandler(transactionController.getDashboardStats)
)

// Export transaction data (admin only)
router.get(
    '/admin/export',
    grantAccess('updateAny', 'transaction'), // Only admin can export
    asyncHandler(transactionController.exportTransactionData)
)

module.exports = router
