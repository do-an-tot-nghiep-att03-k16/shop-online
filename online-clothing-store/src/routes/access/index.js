'use strict'

const express = require('express')
const accessController = require('../../controllers/access.controller')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const {
    authenticationV2,
    authenticateRefresh,
    authenticate,
} = require('../../auth/checkAuth')
const { upload } = require('../../configs/multer.config')
// const { authentication, authenticationV2 } = require('../../auth/authUtils')

// Public routes - không cần authentication
router.post('/register', asyncHandler(accessController.signUp))
router.get('/verify-email', asyncHandler(accessController.verifyEmailToken))
router.post('/login', asyncHandler(accessController.login))

router.post(
    '/refresh-token',
    authenticateRefresh,
    asyncHandler(accessController.refreshToken)
)

// Protected routes - cần authentication
router.use(authenticate)
router.post('/logout', asyncHandler(accessController.logout))
router.get('/profile', asyncHandler(accessController.getProfile))
router.patch('/profile', asyncHandler(accessController.updateProfile))
router.post(
    '/avatar',
    upload.single('avatar'),
    asyncHandler(accessController.updateAvatar)
)

router.post('/change-password', asyncHandler(accessController.changePassword))

module.exports = router
