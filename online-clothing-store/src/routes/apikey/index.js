'use strict'

const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { newApiKey } = require('../../controllers/apikey.controller')
const { authenticate } = require('../../auth/checkAuth')

router.use(authenticate)
router.post('', asyncHandler(newApiKey))
module.exports = router
