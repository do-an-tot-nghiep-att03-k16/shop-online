'use strict'
const { CREATED, SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const UserService = require('../services/user.service')
const { resolve } = require('path')

class UserController {
    createUser = async (req, res, next) => {
        const { name, email, password, role, status } = req.body

        if (!email) {
            throw new BadRequestError('Email is required')
        }

        new CREATED({
            message: 'Create user success!',
            metadata: await UserService.createUser({
                name,
                email,
                password,
                role,
                status,
            }),
        }).send(res)
    }

    updateUserByAdmin = async (req, res, next) => {
        const { id: userId } = req.params
        const { role, email, status } = req.body

        if (!userId) {
            throw new BadRequestError('User ID is required')
        }

        new SuccessResponse({
            message: 'Update user success!',
            metadata: await UserService.updateUserByAdmin({
                userId,
                email,
                role,
                status,
            }),
        }).send(res)
    }

    getUsers = async (req, res, next) => {
        const {
            limit = 10,
            page = 1,
            sortBy = '_id',
            sortOrder = 'desc',
            query = {},
            search = '',
        } = req.query
        // console.log(`query::`, query)

        // Xây dựng sort object
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

        const result = await UserService.getUsers({
            query,
            search,
            limit,
            page,
            sort,
        })

        new SuccessResponse({
            message: 'Get users success!',
            metadata: result,
        }).send(res)
    }

    deleteUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete User success!',
            metadata: await UserService.deleteUser(req.params.id),
        }).send(res)
    }
}

module.exports = new UserController()
