'use strict'

const express = require('express')
const jobController = require('../../controllers/job.controller')
const { apiKey, permission } = require('../../auth/checkAuth')

const router = express.Router()

// Get status of all jobs
router.get('/status', jobController.getJobStatus)

// Health check for job system
router.get('/health', jobController.healthCheck)

// Stock update job specific routes
router.get('/stock-update/info', jobController.getStockUpdateInfo)
router.post('/stock-update/run', (req, res, next) => {
    req.params.jobName = 'stockUpdate'
    jobController.runJob(req, res, next)
})
router.post('/stock-update/start', (req, res, next) => {
    req.params.jobName = 'stockUpdate'
    jobController.startJob(req, res, next)
})
router.post('/stock-update/stop', (req, res, next) => {
    req.params.jobName = 'stockUpdate'
    jobController.stopJob(req, res, next)
})
router.patch('/stock-update/settings', (req, res, next) => {
    req.params.jobName = 'stockUpdate'
    jobController.updateJobSettings(req, res, next)
})

// Generic job routes (for future jobs)
router.post('/:jobName/run', jobController.runJob)
router.post('/:jobName/start', jobController.startJob)
router.post('/:jobName/stop', jobController.stopJob)
router.patch('/:jobName/settings', jobController.updateJobSettings)

module.exports = router
