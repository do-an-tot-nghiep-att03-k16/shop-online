'use strict'

const emailUser = require('../configs/email.config')
const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser.EMAIL,
        pass: emailUser.PASS,
    },
})

module.exports = transport
