const mongoose = require('mongoose')

const { Schema, model } = mongoose

const DOCUMENT_NAME = 'Location'
const COLLECTION_NAME = 'locations'

const locationSchema = new Schema(
    {
        name: { type: String, required: true },
        province_code: String,
        district_code: String,
        ward_code: String,
        type: { type: String, required: true }, // province, district, ward
        level: { type: Number, required: true },
        left: { type: Number, required: true },
        right: { type: Number, required: true },
        parent: {
            type: Schema.Types.ObjectId,
            ref: DOCUMENT_NAME,
            default: null,
        }, // parent reference
    },
    {
        collection: COLLECTION_NAME,
        timestamps: true,
    }
)

module.exports = model(DOCUMENT_NAME, locationSchema)
