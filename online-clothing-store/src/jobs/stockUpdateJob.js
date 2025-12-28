'use strict'

const { product: productModel } = require('../models/product.model')

class StockUpdateJob {
    constructor() {
        this.jobInterval = null
        this.intervalTime = process.env.STOCK_UPDATE_INTERVAL || 60 * 60 * 1000 // Default: 1 hour
    }

    // Update out of stock products
    async updateOutOfStockProducts() {
        try {
            console.log('🔄 Starting stock status update job...')

            // Find all active products
            const products = await productModel.find({
                status: { $ne: 'out_of_stock' },
            })

            let updatedCount = 0
            let restoredCount = 0

            for (const product of products) {
                // Check if all variants are out of stock
                const totalStock = this.calculateTotalStock(product)

                if (totalStock === 0 && product.status !== 'out_of_stock') {
                    // Mark as out of stock
                    await productModel.updateOne(
                        { _id: product._id },
                        {
                            status: 'out_of_stock',
                            updated_at: new Date(),
                        }
                    )
                    updatedCount++
                    console.log(
                        `📦 Product "${product.name}" marked as out_of_stock (ID: ${product._id})`
                    )
                } else if (
                    totalStock > 0 &&
                    product.status === 'out_of_stock'
                ) {
                    // Restore to active if stock is available
                    await productModel.updateOne(
                        { _id: product._id },
                        {
                            status: 'active',
                            updated_at: new Date(),
                        }
                    )
                    restoredCount++
                    console.log(
                        ` Product "${product.name}" restored to active (ID: ${product._id})`
                    )
                }
            }

            console.log(`✅ Stock update job completed:`)
            console.log(`   - ${updatedCount} products marked as out_of_stock`)
            console.log(`   - ${restoredCount} products restored to active`)
            console.log(`   - Total products checked: ${products.length}`)

            return {
                success: true,
                updatedCount,
                restoredCount,
                totalChecked: products.length,
            }
        } catch (error) {
            console.error('❌ Stock update job failed:', error)
            return {
                success: false,
                error: error.message,
            }
        }
    }

    // Calculate total stock across all variants
    calculateTotalStock(product) {
        if (!product.variants || !Array.isArray(product.variants)) {
            return 0
        }

        return product.variants.reduce((total, variant) => {
            return total + (variant.stock_quantity || 0)
        }, 0)
    }

    // Start the scheduled job
    start() {
        if (this.jobInterval) {
            console.log('⚠️ Stock update job is already running')
            return
        }

        console.log(
            `🚀 Starting stock update job with interval: ${
                this.intervalTime / 1000
            }s`
        )

        // Run immediately on start
        this.updateOutOfStockProducts()

        // Schedule recurring job
        this.jobInterval = setInterval(() => {
            this.updateOutOfStockProducts()
        }, this.intervalTime)

        console.log(`✅ Stock update job started successfully`)
    }

    // Stop the scheduled job
    stop() {
        if (this.jobInterval) {
            clearInterval(this.jobInterval)
            this.jobInterval = null
            console.log('🛑 Stock update job stopped')
        } else {
            console.log('⚠️ Stock update job is not running')
        }
    }

    // Update interval time
    setInterval(newInterval) {
        this.intervalTime = newInterval

        if (this.jobInterval) {
            // Restart with new interval
            this.stop()
            this.start()
            console.log(
                `🔄 Stock update job interval updated to ${newInterval / 1000}s`
            )
        } else {
            console.log(
                `⏱️ Stock update job interval set to ${newInterval / 1000}s`
            )
        }
    }

    // Manual trigger for testing
    async runOnce() {
        console.log('🔧 Manual stock update job triggered')
        return await this.updateOutOfStockProducts()
    }

    // Get job status
    getStatus() {
        return {
            isRunning: !!this.jobInterval,
            intervalTime: this.intervalTime,
            intervalSeconds: this.intervalTime / 1000,
            nextRun: this.jobInterval
                ? new Date(Date.now() + this.intervalTime)
                : null,
        }
    }
}

module.exports = new StockUpdateJob()
