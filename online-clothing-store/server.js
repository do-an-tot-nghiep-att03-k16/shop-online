const app = require('./src/app')
const {
    app: { port },
} = require('./src/configs/mongodb.config')

const mongoose = require('mongoose')
const { stopCheckOverload } = require('./src/helpers/check.connect')
const { closeRedis, initRedis } = require('./src/dbs/init.redis')
const jobManager = require('./src/jobs/jobManager')

const PORT = port || 3052

const startServer = async () => {
    await initRedis()
    
    // Initialize background jobs
    await jobManager.init()
    console.log('✅ Background jobs initialized')

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Clothing Shop start with ${PORT}`)
    })

    process.on('SIGINT', async () => {
        // server.close(() => {
        //     console.log(`Exist Server Express`)
        // })
        await new Promise((resolve) =>
            server.close(() => {
                console.log(`Exit Server Express`)
                resolve()
            })
        )
        await mongoose.disconnect()

        stopCheckOverload()
        await closeRedis()
        
        // Stop background jobs
        jobManager.stop()
        console.log('✅ Background jobs stopped')
        
        process.exit(0)
    })
}

startServer()
