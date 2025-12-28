'use strict'
const { model, Schema } = require('mongoose')

const DOCUMENT_NAME = 'Category'
const COLLECTION_NAME = 'categories'

const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        image_id: {
            type: String,
            default: '',
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        isDraft: { type: Boolean, default: true },
        isPublished: { type: Boolean, default: false },
    },
    {
        collection: COLLECTION_NAME,
        timestamps: true,
    }
)

// categorySchema.index({ slug: 1 })
categorySchema.index({ is_active: 1 })
categorySchema.index({ parentId: 1 })

module.exports = {
    category: model(DOCUMENT_NAME, categorySchema),
}
