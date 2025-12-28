'use strict'

const keyTokenModel = require('../models/key.model')
const { Types } = require('mongoose')

class KeyTokenService {
    static createKeyToken = async ({
        userId,
        accessKey,
        refreshKey,
        refreshToken,
    }) => {
        try {
            //Level 0
            // const tokens = await keyTokenModel.create({
            //     user: userId,
            //     accessKey,
            //     refreshKey,
            // })

            // return tokens ? tokens.accessKey : null

            //level xxx
            const filter = { user: userId }
            const update = {
                accessKey,
                refreshKey,
                refreshTokensUsed: [],
                refreshToken,
            }
            const options = { upsert: true, new: true }

            const tokens = await keyTokenModel.findOneAndUpdate(
                filter,
                update,
                options
            )
            return tokens ? tokens.accessKey : null
        } catch (error) {
            console.error('KeyTokenService.createKeyToken error:', error)
            throw error
        }
    }

    static findByUserId = async userId => {
        return await keyTokenModel
            .findOne({ user: new Types.ObjectId(userId) })
            .lean()
    }

    static findByRefreshTokensUsed = async refreshToken => {
        return await keyTokenModel
            .findOne({ refreshTokensUsed: refreshToken })
            .lean()
    }

    static findByRefreshToken = async refreshToken => {
        return await keyTokenModel
            .findOne({ refreshToken: refreshToken })
            .lean()
    }

    static removeKeyById = async id => {
        return await keyTokenModel.findByIdAndDelete(id)
    }

    static deleteKeyByUserId = async userId => {
        return await keyTokenModel.findOneAndDelete({
            user: userId,
        })
    }

    static updateRefreshToken = async ({ userId, oldToken, newToken }) => {
        return await keyTokenModel.updateOne(
            { user: userId },
            {
                $addToSet: { refreshTokensUsed: oldToken },
                $set: { refreshToken: newToken },
            }
        )
    }
}

module.exports = KeyTokenService
