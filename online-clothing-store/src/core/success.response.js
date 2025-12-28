'use strict'

// const StatusCode = {
//     OK: 200,
//     CREATED: 201,
// }

// const ReasonStatusCode = {
//     CREATED: 'Created!',
//     OK: 'Success',
// }

const { StatusCodes, ReasonPhrases } = require('../utils/httpStatusCode')

class SuccessResponse {
    constructor({
        message,
        statusCode = StatusCodes.OK,
        reasonStatusCode = ReasonPhrases.OK,
        metadata = {},
    }) {
        this.message = !message ? reasonStatusCode : message
        this.status = statusCode
        this.metadata = metadata
    }

    send(res, header = {}) {
        return res.status(this.status).json(this)
    }
}

class OK extends SuccessResponse {
    constructor({ message, metadata }) {
        super({ message, metadata })
    }
}

class CREATED extends SuccessResponse {
    constructor({
        message,
        statusCode = StatusCodes.CREATED,
        reasonStatusCode = ReasonPhrases.CREATED,
        metadata,
        options = null,
    }) {
        super({ message, statusCode, reasonStatusCode, metadata })
        if (options !== null && options !== undefined) this.options = options
    }
}

module.exports = {
    OK,
    CREATED,
    SuccessResponse,
}
