'use strict'

const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticate } = require('../../auth/checkAuth')
const { newTemplate } = require('../../controllers/template.controller')

router.use(authenticate)

router.post('', asyncHandler(newTemplate))

module.exports = router
