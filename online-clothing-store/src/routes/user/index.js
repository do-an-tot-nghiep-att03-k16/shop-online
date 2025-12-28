'use strict'

const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const userController = require('../../controllers/user.controller')
const { authenticate } = require('../../auth/checkAuth')
const { roleCheck } = require('../../middlewares/role.middleware')
const grantAccess = require('../../middlewares/rbac.middleware')
const { upload } = require('../../configs/multer.config')

// All user management routes require authentication
router.use(authenticate)

// Create user - Only admin can create users
router.post(
    '',
    roleCheck(['admin']),
    grantAccess('createAny', 'user'),
    asyncHandler(userController.createUser)
)

// Get all users - Admin có full access, shop chỉ xem thông tin cơ bản
router.get(
    '',
    roleCheck(['admin', 'shop']),
    grantAccess('readAny', 'user'),
    asyncHandler(userController.getUsers)
)

// Update user by admin - Only admin can update any user
router.put(
    '/:id',
    roleCheck(['admin']),
    grantAccess('updateAny', 'user'),
    asyncHandler(userController.updateUserByAdmin)
)

// Delete user - Only admin can delete users
router.delete(
    '/:id',
    roleCheck(['admin']),
    grantAccess('deleteAny', 'user'),
    asyncHandler(userController.deleteUser)
)

// Upload avatar - Fixed: this was incorrectly pointing to getUsers
router.put(
    '/avatar',
    upload.single('avatar'),
    asyncHandler(userController.updateAvatar) // TODO: Need to create this controller method
)

module.exports = router
