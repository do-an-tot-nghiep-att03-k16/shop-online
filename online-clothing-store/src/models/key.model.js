'use strict'

const { Schema, model } = require('mongoose') // Erase if already required
const DOCUMENT_NAME = 'Key'
const COLLECTION_NAME = 'Keys'
// Declare the Schema of the Mongo model
var keyTokenSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        refreshKey: { type: String, require: true },
        accessKey: {
            type: String,
            required: true,
        },
        refreshTokensUsed: {
            type: Array,
            default: [], //những refresh token đã được sử dụng
        },
        refreshToken: { type: String, require: true },
    },
    {
        collection: COLLECTION_NAME,
        timestamps: true,
    }
)

//Export the model
module.exports = model(DOCUMENT_NAME, keyTokenSchema)
