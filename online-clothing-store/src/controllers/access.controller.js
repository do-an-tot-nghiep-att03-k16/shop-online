'use strict'

const { CREATED, SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const AccessService = require('../services/access.service')
const UserService = require('../services/user.service')
const { uploadImageFromLocalCloudinary } = require('../services/upload.service')

class AccessController {
    signUp = async (req, res, next) => {
        const { email } = req.body

        if (!email) {
            throw new BadRequestError('Email is required')
        }

        new SuccessResponse({
            message: 'Verify email user',
            metadata: await AccessService.signUp({
                email,
            }),
        }).send(res)
    }

    verifyEmailToken = async (req, res, next) => {
        const token = req.query.token
        new CREATED({
            message: 'Sign up user successfully',
            metadata: await AccessService.verifyEmailToken({ token }),
        }).send(res)
    }

    login = async (req, res, next) => {
        const { email, password } = req.body

        if (!email) {
            throw new BadRequestError('Email is required')
        }

        if (!password) {
            throw new BadRequestError('Password is required')
        }

        new SuccessResponse({
            message: 'Login success!',
            metadata: await AccessService.login({
                email,
                password,
            }),
        }).send(res)
    }

    refreshToken = async (req, res, next) => {
        new SuccessResponse({
            message: 'Refresh sucess!',
            metadata: await AccessService.refreshToken({
                userId: req.userId,
                jti: req.jti,
            }),
        }).send(res)
    }

    logout = async (req, res, next) => {
        new SuccessResponse({
            message: 'Logout success!',
            metadata: await AccessService.logout({
                userId: req.userId,
                jti: req.jti,
            }),
        }).send(res)
    }

    getProfile = async (req, res, next) => {
        // console.log(req)

        try {
            new SuccessResponse({
                message: 'Get profile success!',
                metadata: await AccessService.getProfile({
                    userId: req.userId,
                }),
            }).send(res)
        } catch (error) {
            throw error
        }
    }

    updateAvatar = async (req, res, next) => {
        try {
            const userId = req.userId
            const file = req.file

            if (!file) throw new BadRequestError('No file uploaded!')

            // Upload to cloudinary
            const { image_id } = await uploadImageFromLocalCloudinary({
                file,
                folderName: 'avatars',
            })

            //uploadUserInDB
            const updateUser = await UserService.updateAvatar(userId, image_id)

            new SuccessResponse({
                message: 'Update avatar success!!',
                metadata: updateUser,
            }).send(res)
        } catch (error) {
            throw error
        }
    }

    updateProfile = async (req, res, next) => {
        const userId = req.userId
        const { name, phone, sex, dateOfBirth, address } = req.body
        new SuccessResponse({
            message: 'Update profile success!',
            metadata: await AccessService.updateProfile({
                userId,
                name,
                phone,
                sex,
                dateOfBirth,
                address,
            }),
        }).send(res)
    }

    changePassword = async (req, res, next) => {
        const userId = req.userId
        const { password } = req.body

        new SuccessResponse({
            message: 'Change password successfully',
            metadata: await AccessService.changePassword({
                newPassword: password,
                userId,
            }),
        }).send(res)
    }
}

module.exports = new AccessController()
