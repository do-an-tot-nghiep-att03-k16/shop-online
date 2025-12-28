'use strict'

const { model, Schema } = require('mongoose') // Erase if already required
const { permission } = require('process')

const DOCUMENT_NAME = 'Apikey'
const COLLECTION_NAME = 'apikeys'

// Declare the Schema of the Mongo model
var apiKeySchema = new Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
        permissions: {
            type: [String],
            required: true,
            enum: ['0000', '1111', '2222'],
        },
        createAt: {
            type: Date,
            default: Date.now,
            expires: '30d', //This wil automatically delete expired API keys after 30 days
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

//Export the model
module.exports = {
    apikey: model(DOCUMENT_NAME, apiKeySchema),
}
