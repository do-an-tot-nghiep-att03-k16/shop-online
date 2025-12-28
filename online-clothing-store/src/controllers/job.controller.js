'use strict'

const { SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const jobManager = require('../jobs/jobManager')

class JobController {
    // Get status of all jobs
    async getJobStatus(req, res, next) {
        try {
            const status = jobManager.getStatus()
            
            new SuccessResponse({
                message: 'Job status retrieved successfully',
                metadata: status
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    // Health check for job system
    async healthCheck(req, res, next) {
        try {
            const health = await jobManager.healthCheck()
            
            new SuccessResponse({
                message: 'Job health check completed',
                metadata: health
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    // Manual trigger specific job
    async runJob(req, res, next) {
        try {
            const { jobName } = req.params
            
            if (!jobName) {
                throw new BadRequestError('Job name is required')
            }

            const result = await jobManager.runJob(jobName)
            
            new SuccessResponse({
                message: `Job "${jobName}" executed successfully`,
                metadata: result
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    // Update job settings
    async updateJobSettings(req, res, next) {
        try {
            const { jobName } = req.params
            const settings = req.body

            if (!jobName) {
                throw new BadRequestError('Job name is required')
            }

            const result = jobManager.updateJobSettings(jobName, settings)
            
            new SuccessResponse({
                message: `Job "${jobName}" settings updated successfully`,
                metadata: result
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    // Stop specific job
    async stopJob(req, res, next) {
        try {
            const { jobName } = req.params
            
            if (!jobName) {
                throw new BadRequestError('Job name is required')
            }

            if (!jobManager.jobs[jobName]) {
                throw new BadRequestError(`Job "${jobName}" not found`)
            }

            jobManager.jobs[jobName].stop()
            
            new SuccessResponse({
                message: `Job "${jobName}" stopped successfully`,
                metadata: { jobName, status: 'stopped' }
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    // Start specific job
    async startJob(req, res, next) {
        try {
            const { jobName } = req.params
            
            if (!jobName) {
                throw new BadRequestError('Job name is required')
            }

            if (!jobManager.jobs[jobName]) {
                throw new BadRequestError(`Job "${jobName}" not found`)
            }

            jobManager.jobs[jobName].start()
            
            new SuccessResponse({
                message: `Job "${jobName}" started successfully`,
                metadata: { jobName, status: 'started' }
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    // Get stock update job specific info
    async getStockUpdateInfo(req, res, next) {
        try {
            const stockJob = jobManager.jobs.stockUpdate
            
            if (!stockJob) {
                throw new BadRequestError('Stock update job not found')
            }

            const status = stockJob.getStatus()
            
            // Get recent activity (you can enhance this with logging)
            const info = {
                ...status,
                description: 'Automatically updates products to out_of_stock when all variants have zero stock',
                features: [
                    'Checks all product variants stock levels',
                    'Marks products as out_of_stock when no stock available',
                    'Restores products to active when stock becomes available',
                    'Runs on configurable interval'
                ],
                configuration: {
                    defaultInterval: '1 hour',
                    environmentVariable: 'STOCK_UPDATE_INTERVAL',
                    enableVariable: 'ENABLE_STOCK_UPDATE_JOB'
                }
            }
            
            new SuccessResponse({
                message: 'Stock update job info retrieved successfully',
                metadata: info
            }).send(res)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new JobController()