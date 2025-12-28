'use strict'

const mongoose = require('mongoose')
const os = require('os')
const _SECONDS = 5000
let intervalId

//count Connect
const countConnect = () => {
    const numConnection = mongoose.connections.length
    console.log(`Number of connections::${numConnection}`)
}

//check over load
const checkOverload = () => {
    intervalId = setInterval(() => {
        const numConnection = mongoose.connections.length
        const numCores = os.cpus().length
        const memoryUsage = process.memoryUsage().rss
        // Example maximum no connections based on no cores
        const maxConnections = numCores * 5

        console.log(`Active connection:${numConnection}`)

        console.log(`Memory usage:: ${memoryUsage / 1024 / 1024} MB`)

        if (numConnection > maxConnections) {
            console.log(`Connection overload detected`)
        }
    }, _SECONDS) //Monitor every 5 seconds
}

const stopCheckOverload = () => {
    if (intervalId) clearInterval(intervalId)
}
module.exports = {
    countConnect,
    checkOverload,
    stopCheckOverload,
}
