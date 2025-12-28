'use strict'

// level 01
const dev = {
    url: process.env.DEV_URL_VERIFY || 'http://localhost:5174'
}

const pro = {
    url: process.env.PRO_URL_VERIFY || 'http://localhost:5174'
}
const config = { dev, pro }
const env = process.env.NODE_ENV || 'dev'
module.exports = config[env]
