'use strict'

//!dmbg

const { model, Schema, Types } = require('mongoose') // Erase if already required
const { type } = require('os')
const DOCUMENT_NAME = 'User'
const COLLECTION_NAME = 'users'

// Declare the Schema of the Mongo model
const userSchema = new Schema(
    {
        // usr_id: { type: Number, required: true },
        usr_slug: { type: String, required: true },
        usr_name: { type: String, default: '' },
        usr_password: { type: String, default: '' },
        usr_email: { type: String, required: true },
        usr_phone: { type: String },
        usr_sex: { type: String, default: '' },
        usr_avatar: { type: String, default: '' },
        usr_date_of_birth: { type: Date, default: null },
        // usr_role: { type: Schema.Types.ObjectId, ref: 'Role' },
        usr_role: {
            type: String,
            default: 'user',
            enum: ['user', 'shop', 'admin'],
        },
        usr_status: {
            type: String,
            default: 'pending',
            enum: ['pending', 'active', 'block'],
        },
        usr_addresses: { type: Array, default: [] },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)
//Export the model
module.exports = model(DOCUMENT_NAME, userSchema)
