'use strict'

const bcrypt = require('bcrypt')
const User = require('../models/user.model')
const UserRepository = require('../models/repositories/user.repo')
const UserBuilder = require('../builders/user.builder')
const {
    removeUndefinedObject,
    getInfoData,
    getSelectData,
    unGetSelectData,
} = require('../utils')
const {
    ConflictRequestError,
    BadRequestError,
} = require('../core/error.response')
const SALT_ROUNDS = 10

class UserService {
    static createUser = async ({ name, email, password, role, status }) => {
        // Check if email already exists (check before processing)
        const foundUser = await UserRepository.findByEmail(email)
        if (foundUser) {
            throw new ConflictRequestError('Email already exists')
        }

        const hashedPassword = password
            ? await bcrypt.hash(password, SALT_ROUNDS)
            : undefined

        const userPayload = new UserBuilder()
            .withName(name)
            .withEmail(email)
            .withPassword(hashedPassword)
            .withRole(role)
            .withStatus(status)
            .build()

        const result = removeUndefinedObject(userPayload)

        const newUser = await UserRepository.create(result)
        return {
            user: getInfoData({
                fields: [
                    '_id',
                    'usr_name',
                    'usr_email',
                    'usr_status',
                    'usr_role',
                ],
                object: newUser,
            }),
        }
    }

    // In UserService
    static getUsers = async ({
        query = {},
        search = '',
        limit = 10,
        page = 1,
        sort = { _id: -1 },
    }) => {
        const select = [
            '_id',
            'usr_name',
            'usr_email',
            'usr_role',
            'usr_status',
        ]
        // Clean query
        let userQuery = removeUndefinedObject(query)

        // ✅ Thêm search condition nếu có
        if (search && search.trim()) {
            userQuery = {
                ...userQuery,
                $or: [
                    { usr_name: { $regex: search, $options: 'i' } }, // Tìm theo tên (case-insensitive)
                    { usr_email: { $regex: search, $options: 'i' } }, // Tìm theo email
                ],
            }
        }

        // console.log('Final query:', JSON.stringify(userQuery, null, 2))

        return await UserRepository.findAllWithPagination({
            query: userQuery,
            select,
            limit: parseInt(limit),
            page: parseInt(page),
            sort,
        })
    }

    static updateUserByAdmin = async ({ userId, email, role, status }) => {
        const updateData = removeUndefinedObject({ email, role, status })
        const userPayload = new UserBuilder()
            .withEmail(email)
            .withRole(role)
            .withStatus(status)
            .build()
        const foundUser = await UserRepository.updateById(userId, userPayload)
        if (!foundUser) throw new BadRequestError('Invalid user!')
        return {
            user: getInfoData({
                fields: ['_id', 'usr_name', 'usr_status', 'usr_role'],
                object: foundUser,
            }),
        }
    }

    static deleteUser = async (userId) => {
        const delUser = await UserRepository.deleteById(userId)
        if (!delUser) throw new BadRequestError('User not found')
        return delUser
    }

    ///////
    static findByEmail = async (email) => {
        const unSelectData = unGetSelectData([
            'usr_password',
            '__v',
            'createdAt',
            'updatedAt',
        ])
        return await UserRepository.findByEmail(email, [], unSelectData)
    }
    static findById = async (email) => {
        const unSelectData = unGetSelectData([
            'usr_password',
            '__v',
            'createdAt',
            'updatedAt',
        ])
        return await UserRepository.findById(email, [], unSelectData)
    }

    static updateAvatar = async (userId, imageId) => {
        const userData = { usr_avatar: imageId }
        const unSelectData = ['usr_password', '__v', 'createdAt', 'updatedAt']
        return await UserRepository.updateById(
            userId,
            userData,
            [],
            unSelectData
        )
    }

    static changePassword = async (userId, password) => {
        const userData = { usr_password: password }
        const unSelectData = ['usr_password', '__v', 'createdAt', 'updatedAt']
        return await UserRepository.updateById(
            userId,
            userData,
            [],
            unSelectData
        )
    }
}

module.exports = UserService
