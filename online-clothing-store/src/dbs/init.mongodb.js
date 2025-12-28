'use strict'
const mongoose = require('mongoose')
const {
    db: { host, name, port },
} = require('../configs/mongodb.config')
// const { countConnect } = require('../helpers/check.connect')

// Support both local MongoDB and MongoDB Atlas
const connectString = process.env.MONGODB_URI || `mongodb://${host}:${port}/${name}`

class Database {
    constructor() {
        this.connect()
    }

    //connect
    connect(type = 'mongodb') {
        if (1 === 1) {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }
        mongoose
            .connect(connectString, {
                maxPoolSize: 50,
                // Cấu hình để hỗ trợ transactions
                readPreference: 'primary',
                retryWrites: true,
                w: 'majority'
            })
            .then(_ => console.log(`Connect Mongodb Success PRO - Transactions enabled`))
            .catch(err => console.log(`Error Connect!`, err))
    }

    // Tạo session để sử dụng transactions
    static async startSession() {
        return await mongoose.startSession()
    }

    // Helper method để thực hiện transaction
    static async withTransaction(fn) {
        const session = await Database.startSession()
        try {
            const result = await session.withTransaction(async () => {
                return await fn(session)
            })
            return result
        } finally {
            await session.endSession()
        }
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }
}

const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb
