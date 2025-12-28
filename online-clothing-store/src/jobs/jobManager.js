'use strict'

const stockUpdateJob = require('./stockUpdateJob')

class JobManager {
    constructor() {
        this.jobs = {
            stockUpdate: stockUpdateJob,
        }
        this.isInitialized = false
    }

    // Initialize and start all jobs
    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Job Manager already initialized')
            return
        }

        try {
            console.log('🚀 Initializing Job Manager...')

            // Start stock update job
            if (process.env.ENABLE_STOCK_UPDATE_JOB !== 'false') {
                this.jobs.stockUpdate.start()
                console.log('✅ Stock Update Job started')
            } else {
                console.log(
                    '⏸️ Stock Update Job disabled by environment variable'
                )
            }

            this.isInitialized = true
            console.log('🎉 Job Manager initialized successfully')
        } catch (error) {
            console.error('❌ Failed to initialize Job Manager:', error)
            throw error
        }
    }

    // Stop all jobs
    stop() {
        console.log('🛑 Stopping Job Manager...')

        try {
            // Stop all jobs
            Object.keys(this.jobs).forEach((jobName) => {
                if (
                    this.jobs[jobName] &&
                    typeof this.jobs[jobName].stop === 'function'
                ) {
                    this.jobs[jobName].stop()
                    console.log(`✅ ${jobName} job stopped`)
                }
            })

            this.isInitialized = false
            console.log('🎉 Job Manager stopped successfully')
        } catch (error) {
            console.error('❌ Error stopping Job Manager:', error)
        }
    }

    // Get status of all jobs
    getStatus() {
        const status = {
            isInitialized: this.isInitialized,
            jobs: {},
        }

        Object.keys(this.jobs).forEach((jobName) => {
            if (
                this.jobs[jobName] &&
                typeof this.jobs[jobName].getStatus === 'function'
            ) {
                status.jobs[jobName] = this.jobs[jobName].getStatus()
            }
        })

        return status
    }

    // Manual trigger specific job
    async runJob(jobName) {
        if (!this.jobs[jobName]) {
            throw new Error(`Job "${jobName}" not found`)
        }

        if (typeof this.jobs[jobName].runOnce !== 'function') {
            throw new Error(
                `Job "${jobName}" does not support manual execution`
            )
        }

        console.log(`🔧 Manually triggering job: ${jobName}`)
        return await this.jobs[jobName].runOnce()
    }

    // Update job settings
    updateJobSettings(jobName, settings) {
        if (!this.jobs[jobName]) {
            throw new Error(`Job "${jobName}" not found`)
        }

        // Update interval for stock update job
        if (jobName === 'stockUpdate' && settings.interval) {
            this.jobs[jobName].setInterval(settings.interval)
            return { success: true, message: 'Interval updated successfully' }
        }

        throw new Error(`Settings update not supported for job "${jobName}"`)
    }

    // Health check for jobs
    async healthCheck() {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            jobs: {},
        }

        try {
            // Check each job status
            Object.keys(this.jobs).forEach((jobName) => {
                const jobStatus = this.jobs[jobName].getStatus()
                health.jobs[jobName] = {
                    status: jobStatus.isRunning ? 'running' : 'stopped',
                    ...jobStatus,
                }
            })

            // Overall health assessment
            const hasFailedJobs = Object.values(health.jobs).some(
                (job) => job.status === 'failed'
            )
            if (hasFailedJobs) {
                health.status = 'degraded'
            }
        } catch (error) {
            health.status = 'unhealthy'
            health.error = error.message
        }

        return health
    }
}

// Graceful shutdown handling
const jobManager = new JobManager()

module.exports = jobManager
