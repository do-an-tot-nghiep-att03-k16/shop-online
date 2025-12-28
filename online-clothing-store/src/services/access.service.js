'use strict'

const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const KeyTokenService = require('./key.service')
const { createTokenPair, createTokenPairV2 } = require('../auth/authUtils')

const {
    BadRequestError,
    ConflictRequestError,
    ForbiddenError,
    AuthFailureError,
} = require('../core/error.response')
const UserService = require('./user.service')
const UserRepository = require('../models/repositories/user.repo')
const UserBuilder = require('../builders/user.builder')
const { removeUndefinedObject, getInfoData } = require('../utils')
const keyModel = require('../models/key.model')
const getImageFromCloudinary = require('../helpers/getImageFromCloudinary')
const { v4: uuidv4 } = require('uuid')
const { sendEmailToken } = require('./email.service')
const { checkEmailToken } = require('./otp.service')
const { getRedis } = require('../dbs/init.redis')
const {
    REDIS_TOKEN_BLACKLIST_PREFIX,
    REDIS_REFRESH_TOKEN_PREFIX,
    REDIS_AVAILABLE_IAT_PREFIX,
    REDIS_EX_TOKEN,
    REDIS_EX_REFRESH,
} = require('../configs/redis.config')

const SALT_ROUNDS = 10

class AccessService {
    /**
     * 1 - Check email in dbs
     * 2 - match password
     * 3 - create AT vs RT and save
     * 4 - generate tokens
     * 5 - get data return login
     */
    static login = async ({ email, password }) => {
        //1.
        const foundUser = await UserService.findByEmail(email)
        if (!foundUser) throw new ConflictRequestError('User not registered!')

        //2.
        const match = await bcrypt.compare(password, foundUser.usr_password)
        if (!match) throw new AuthFailureError('Authentication error')

        // Check user status
        if (foundUser['usr_status'] !== 'active') {
            throw new AuthFailureError('User account is not active')
        }

        const payload = {
            uid: foundUser._id,
            role: foundUser.usr_role,
            jti: uuidv4(),
        }
        const tokens = await createTokenPairV2(payload)

        return {
            user: getInfoData({
                fields: [
                    '_id',
                    'usr_name',
                    'usr_email',
                    'usr_role',
                    'usr_status',
                ],
                object: foundUser,
            }),
            tokens,
            images: {
                thumbnail: getImageFromCloudinary({
                    imageId: foundUser.usr_avatar,
                    width: 32,
                    height: 32,
                }),
                medium: getImageFromCloudinary({
                    imageId: foundUser.usr_avatar,
                    width: 150,
                    height: 150,
                }),
                large: getImageFromCloudinary({
                    imageId: foundUser.usr_avatar,
                    width: 300,
                    height: 300,
                }),
            },
        }
    }

    /**
     *
     * send Email verify
     */
    static signUp = async ({ email }) => {
        // const newUser = await UserService.createUser({ name, email, password: email, role = 'user', status = 'pending'})
        // if (!newUser) throw new BadRequestError('User create not success')
        const foundUser = await UserService.findByEmail(email)
        if (foundUser) throw new ConflictRequestError('User already registered')

        const result = await sendEmailToken({ email })

        return result
    }

    /**
     * 1. Tìm token
     * 2. Tạo user
     * 3. tạo token
     */
    static verifyEmailToken = async ({ token }) => {
        try {
            const redis = getRedis()
            const foundToken = await checkEmailToken({ token })
            if (!foundToken || !foundToken.otp_email)
                throw new AuthFailureError('Token is invalid')

            const foundUser = await UserService.findByEmail(
                foundToken.otp_email
            )
            if (foundUser)
                throw new ConflictRequestError('User alreday registered')

            const rawPass = foundToken.otp_email

            const hashedPassword = rawPass
                ? await bcrypt.hash(rawPass, SALT_ROUNDS)
                : undefined

            const newUser = await UserService.createUser({
                name: foundToken.otp_email?.split('@')[0],
                email: foundToken.otp_email,
                password: hashedPassword,
                role: 'user',
                status: 'active',
            })
            if (!newUser) throw new BadRequestError('User create not success')
            const payload = {
                uid: newUser.user._id,
                role: newUser.user.usr_role,
                jti: uuidv4(),
            }
            const tokens = await createTokenPairV2(payload)

            return {
                ...newUser,
                tokens,
            }
        } catch (error) {
            throw error
        }
    }

    // static signUp = async ({ name, email, password }) => {
    //     // step: check email exisists??
    //     const foundUser = await UserRepository.findByEmail(email)
    //     if (foundUser) {
    //         throw new ConflictRequestError('Email already exists')
    //     }

    //     const hashedPassword = password
    //         ? await bcrypt.hash(password, SALT_ROUNDS)
    //         : undefined

    //     const userPayload = new UserBuilder()
    //         .withName(name)
    //         .withEmail(email)
    //         .withPassword(hashedPassword)
    //         .withRole('user')
    //         .withStatus('active')
    //         .build()

    //     const result = removeUndefinedObject(userPayload)
    //     const newUser = await UserRepository.create(result)
    //     if (!newUser) throw new BadRequestError('User create not success!')

    //     const refreshKey = crypto.randomBytes(64).toString('hex')
    //     const accessKey = crypto.randomBytes(64).toString('hex')

    //     console.log({ refreshKey, accessKey }) //save collection KeyStore

    //     // Create token pair first
    //     // Use bracket notation to access _id (avoids TypeScript error)
    //     const userId = String(newUser['_id'])
    //     const role = String(newUser['usr_role'])
    //     const tokens = await createTokenPair(
    //         {
    //             userId,
    //             email,
    //             role,
    //         },
    //         accessKey,
    //         refreshKey
    //     )

    //     // Save tokens to KeyStore
    //     const keyStore = await KeyTokenService.createKeyToken({
    //         userId,
    //         accessKey,
    //         refreshKey,
    //         refreshToken: tokens.refreshToken,
    //     })

    //     if (!keyStore) {
    //         throw new BadRequestError('Create keyStore failed!')
    //     }

    //     console.log(`Create Token Success::`, tokens)

    //     return {
    //         user: getInfoData({
    //             fields: ['_id', 'usr_name', 'usr_email', 'usr_role'],
    //             object: newUser,
    //         }),
    //         tokens,
    //     }
    // }

    static logout = async ({ userId, jti }) => {
        const redis = getRedis()
        await redis.set(`${REDIS_TOKEN_BLACKLIST_PREFIX}_${userId}_${jti}`, 1, {
            EX: REDIS_EX_TOKEN,
        })
    }

    static getProfile = async ({ userId }) => {
        const unSelectData = ['usr_password', '__v', 'createdAt', 'updatedAt']
        const user = await UserRepository.findById(userId, [], unSelectData)
        if (user.usr_avatar !== null && user.usr_avatar !== '') {
            // const { url } = getImageFromCloudinary({
            //     imageId: user.usr_avatar,
            //     width: 150,
            //     height: 150,
            //     format: 'jpg',
            // })
            // user.usr_avatar_url = url
        }
        return {
            profile: user,
            images: {
                thumbnail: getImageFromCloudinary({
                    imageId: user.usr_avatar,
                    width: 32,
                    height: 32,
                }),
                medium: getImageFromCloudinary({
                    imageId: user.usr_avatar,
                    width: 150,
                    height: 150,
                }),
                large: getImageFromCloudinary({
                    imageId: user.usr_avatar,
                    width: 300,
                    height: 300,
                }),
            },
        }
    }

    static refreshToken = async ({ userId, jti }) => {
        const redis = getRedis()
        await redis.set(`${REDIS_TOKEN_BLACKLIST_PREFIX}_${userId}_${jti}`, 1, {
            EX: REDIS_EX_TOKEN,
        })

        const foundUser = await UserService.findByEmail(email)
        if (!foundUser) throw new ConflictRequestError('User not registered!')

        // Check user status
        if (foundUser['usr_status'] !== 'active') {
            throw new AuthFailureError('User account is not active')
        }

        const payload = {
            uid: foundUser._id,
            role: foundUser.usr_role,
            jti: uuidv4(),
        }

        const tokens = await createTokenPair(payload)

        return {
            user: getInfoData({
                fields: [
                    '_id',
                    'usr_name',
                    'usr_email',
                    'usr_role',
                    'usr_status',
                ],
                object: foundUser,
            }),
            tokens,
        }
    }

    static changePassword = async ({ newPassword, userId }) => {
        const redis = getRedis()

        const foundUser = UserService.findById(userId)
        if (!foundUser) throw new BadRequestError('User not registered')

        const hashedPassword = newPassword
            ? await bcrypt.hash(newPassword, SALT_ROUNDS)
            : undefined

        const passwordUpdate = UserService.changePassword(
            userId,
            hashedPassword
        )
        if (!passwordUpdate)
            throw new BadRequestError('User update not success')

        const invalidationKey = `${REDIS_AVAILABLE_IAT_PREFIX}_${userId}`
        const passwordTimestamp = Math.floor(Date.now() / 1000)
        await redis.set(invalidationKey, passwordTimestamp)

        return 1
    }

    static updateProfile = async ({
        userId,
        name,
        phone,
        sex,
        dateOfBirth,
        address,
    }) => {
        const unSelectData = ['usr_password', '__v', 'createdAt', 'updatedAt']
        const userPayload = new UserBuilder()
            .withName(name)
            .withPhone(phone)
            .withSex(sex)
            .withDateOfBirth(dateOfBirth)
            .build()

        const updateData = { $set: removeUndefinedObject(userPayload) }

        if (address && address.trim() !== '') {
            updateData.$push = { usr_addresses: address }
        }

        // Update user
        const updatedUser = await UserRepository.updateById(
            userId,
            updateData,
            [], // options hoặc array populate nếu có
            unSelectData
        )
        if (!updatedUser)
            throw new BadRequestError('Update user is not success!!')

        return {
            profile: updatedUser,
        }
    }
}

module.exports = AccessService
