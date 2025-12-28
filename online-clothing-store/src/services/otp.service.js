'use strict'

const { NotFoundError } = require('../core/error.response')
const OTP = require('../models/otp.model')
const { randomInt } = require('crypto')

const generatorTokenRandom = () => {
    const token = randomInt(0, Math.pow(2, 32))
    return token
}

const newOtp = async ({ email }) => {
    const token = generatorTokenRandom()
    const newToken = await OTP.create({
        otp_token: token,
        otp_email: email,
    })
    return newToken
}

const checkEmailToken = async ({ token }) => {
    // check token in model otp
    const tokenRes = await OTP.findOne({
        otp_token: parseInt(token),
    })
    if (!tokenRes) throw new NotFoundError('token not found')

    OTP.deleteOne({ otp_token: token }).then()

    return tokenRes
}

const deleteTokenByEmail = async ({ email }) => {
    await OTP.deleteMany({ otp_email: email })
}

module.exports = {
    newOtp,
    checkEmailToken,
    deleteTokenByEmail,
}
