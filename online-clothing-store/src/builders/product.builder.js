'use strict'

const slugify = require('slugify')
const { BadRequestError } = require('../core/error.response')

class ProductBuilder {
    constructor() {
        this.product = {}
    }

    withName(name) {
        if (name) {
            this.product.name = name
        }
        return this
    }

    withSlug(slug) {
        if (slug) {
            this.product.slug = slug
        }
        return this
    }

    withDescription(description) {
        if (description) {
            this.product.description = description
        }
        return this
    }

    withCategoryIds(categoryIds) {
        if (categoryIds && categoryIds.length > 0)
            this.product.category_ids = categoryIds
        return this
    }

    withMaterial(material) {
        if (material) this.product.material = material
        return this
    }

    withGender(gender) {
        if (gender) this.product.gender = gender
        return this
    }

    withBasePrice(basePrice) {
        if (basePrice) this.product.base_price = basePrice
        return this
    }

    withDiscountPercent(discountPercent) {
        if (discountPercent) this.product.discount_percent = discountPercent
        return this
    }

    withColorImages(colorImages) {
        if (colorImages && colorImages.length > 0)
            this.product.color_images = colorImages
        return this
    }

    withVariants(variants) {
        if (variants && variants.length > 0) this.product.variants = variants
        return this
    }

    withStatus(status) {
        if (status) this.product.status = status
        return this
    }

    build() {
        return { ...this.product }
    }
}

module.exports = ProductBuilder
