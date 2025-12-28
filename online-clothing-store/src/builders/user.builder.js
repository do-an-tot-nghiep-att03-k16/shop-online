'use strict'

const slugify = require('slugify')
const { BadRequestError } = require('../core/error.response')

class UserBuilder {
    constructor() {
        this.user = {}
    }

    withName(name) {
        if (name) {
            this.user.usr_name = name.trim()
            this.user.usr_slug = slugify(name, { lower: true, strict: true })
        }
        return this
    }

    withEmail(email) {
        if (email) {
            this.user.usr_email = email.toLowerCase()
        }
        return this
    }

    withPassword(password) {
        if (password) {
            this.user.usr_password = password
        }
        return this
    }

    withPhone(phone) {
        if (phone) {
            this.user.usr_phone = phone
        }
        return this
    }

    withSex(sex) {
        if (sex) {
            this.user.usr_sex = sex
        }
        return this
    }

    withAvatar(avatar) {
        if (avatar) {
            this.user.usr_avatar = avatar
        }
        return this
    }

    withDateOfBirth(dateOfBirth) {
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth)
            if (!Number.isNaN(dob.getTime())) {
                this.user.usr_date_of_birth = dob
            }
        }
        return this
    }

    withRole(role) {
        if (role) {
            this.user.usr_role = role
        }
        return this
    }

    withStatus(status) {
        if (status) {
            this.user.usr_status = status
        }
        return this
    }

    withAddresses(addresses) {
        if (Array.isArray(addresses)) {
            this.user.usr_addresses = addresses
        }
        return this
    }

    withSlug(slug) {
        if (slug) {
            this.user.usr_slug = slugify(slug, { lower: true, strict: true })
        }
        return this
    }

    build() {
        if (
            !this.user.usr_slug &&
            (this.user.usr_name || this.user.usr_email)
        ) {
            const slugSource = this.user.usr_name || this.user.usr_email
            this.user.usr_slug = slugify(slugSource, {
                lower: true,
                strict: true,
            })
        }

        // this.user.usr_role = this.user.usr_role || 'user'
        // this.user.usr_status = this.user.usr_status || 'pending'
        // this.user.usr_addresses = this.user.usr_addresses || []

        return { ...this.user }
    }
}

module.exports = UserBuilder
