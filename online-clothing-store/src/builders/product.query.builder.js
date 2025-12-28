class ProductQueryBuilder {
    constructor() {
        this.pipeline = []
        this.countPipeline = []
        this._page = 1
        this._limit = 10
        this.hasTextSearch = false // Track nếu có text search
        this.baseFilters = {} // Lưu filters cơ bản
        this.pipelineBuilt = false // Prevent duplicate buildPipeline calls
    }

    // Base filters - CHỈ LƯU, chưa push vào pipeline
    withActivePublished() {
        this.baseFilters = { 
            ...this.baseFilters,
            status: 'active', 
            isPublished: true 
        }
        return this
    }

    // Custom match conditions
    match(conditions) {
        this.baseFilters = { ...this.baseFilters, ...conditions }
        return this
    }

    // ⭐ ADVANCED SEARCH - ƯU TIÊN CHẠY ĐẦU TIÊN
    advancedSearch(searchText, options = {}) {
        if (!searchText?.trim()) return this

        this.hasTextSearch = true

        const {
            enableFuzzy = true,
            enablePartial = true,
            boostExactMatch = true,
        } = options

        const normalized = searchText.trim().toLowerCase()
        const words = normalized.split(/\s+/)

        // BUILD SEARCH CONDITIONS (không có $text)
        const searchConditions = []

        // 1. Exact match (boost cao nhất)
        if (boostExactMatch) {
            searchConditions.push({
                name: {
                    $regex: `^${this.escapeRegex(normalized)}$`,
                    $options: 'i',
                },
            })
        }

        // 2. Starts with
        if (enablePartial) {
            searchConditions.push({
                name: {
                    $regex: `^${this.escapeRegex(normalized)}`,
                    $options: 'i',
                },
            })
        }

        // 3. Contains all words (order independent)
        if (words.length > 1) {
            const wordRegexes = words.map((w) => ({
                name: { $regex: this.escapeRegex(w), $options: 'i' },
            }))
            searchConditions.push({ $and: wordRegexes })
        }

        // 4. Contains anywhere in name
        searchConditions.push({
            name: { $regex: this.escapeRegex(normalized), $options: 'i' },
        })

        // 5. Search in description
        searchConditions.push({
            description: {
                $regex: this.escapeRegex(normalized),
                $options: 'i',
            },
        })

        // COMBINE với base filters
        const combinedMatch = {
            ...this.baseFilters,
            $or: searchConditions
        }

        // PUSH VÀO PIPELINE
        this.pipeline.push({ $match: combinedMatch })
        this.countPipeline.push({ $match: combinedMatch })

        // ADD RELEVANCE SCORING
        this.pipeline.push({
            $addFields: {
                relevanceScore: {
                    $sum: [
                        // Exact match: 100
                        {
                            $cond: [
                                { $eq: [{ $toLower: '$name' }, normalized] },
                                100,
                                0,
                            ],
                        },
                        // Starts with: 50
                        {
                            $cond: [
                                {
                                    $regexMatch: {
                                        input: '$name',
                                        regex: `^${this.escapeRegex(normalized)}`,
                                        options: 'i',
                                    },
                                },
                                50,
                                0,
                            ],
                        },
                        // Contains: 20
                        {
                            $cond: [
                                {
                                    $regexMatch: {
                                        input: '$name',
                                        regex: this.escapeRegex(normalized),
                                        options: 'i',
                                    },
                                },
                                20,
                                0,
                            ],
                        },
                    ],
                },
            },
        })

        return this
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    // Gender filter
    byGender(gender) {
        if (!gender) return this
        this.baseFilters.gender = gender
        return this
    }

    // Category filter
    byCategories(categoryIds) {
        if (!categoryIds?.length) return this
        
        // Convert strings to ObjectIds if needed
        const { ObjectId } = require('mongoose').Types;
        const objectIds = categoryIds.map(id => {
            if (typeof id === 'string' && ObjectId.isValid(id)) {
                return new ObjectId(id)
            }
            return id
        })
        
        this.baseFilters.category_ids = { $in: objectIds }
        return this
    }

    // Sale filter
    onSale() {
        this.baseFilters.discount_percent = { $gt: 0 }
        return this
    }

    // In stock filter
    inStock() {
        this.baseFilters['variants.stock_quantity'] = { $gt: 0 }
        return this
    }

    // Price range
    withPriceRange(minPrice, maxPrice) {
        if (minPrice === undefined && maxPrice === undefined) return this

        // Calculate sale_price
        const salePriceCalc = {
            $addFields: {
                sale_price: {
                    $round: [
                        {
                            $multiply: [
                                '$base_price',
                                {
                                    $subtract: [
                                        1,
                                        { $divide: ['$discount_percent', 100] },
                                    ],
                                },
                            ],
                        },
                        0,
                    ],
                },
            },
        }

        this.pipeline.push(salePriceCalc)
        this.countPipeline.push(salePriceCalc)

        // Match price range
        const priceMatch = {}
        if (minPrice !== undefined) priceMatch.$gte = Number(minPrice)
        if (maxPrice !== undefined) priceMatch.$lte = Number(maxPrice)

        if (Object.keys(priceMatch).length > 0) {
            this.pipeline.push({ $match: { sale_price: priceMatch } })
            this.countPipeline.push({ $match: { sale_price: priceMatch } })
        }

        return this
    }

    // Rating filter
    withMinRating(minRating) {
        if (!minRating) return this
        this.baseFilters.ratings_average = { $gte: Number(minRating) }
        return this
    }

    // Status filter (for admin)
    byStatus(status) {
        if (!status) return this
        this.baseFilters.status = status
        return this
    }

    // Publish status filter (for admin)
    byPublishStatus(isPublished) {
        if (isPublished === undefined) return this
        this.baseFilters.isPublished = isPublished
        return this
    }

    // BUILD PIPELINE - Gọi trước khi sort/paginate
    buildPipeline() {
        // Prevent duplicate builds
        if (this.pipelineBuilt) return this
        
        // Nếu chưa có text search, push base filters vào đầu
        if (!this.hasTextSearch && Object.keys(this.baseFilters).length > 0) {
            this.pipeline.unshift({ $match: this.baseFilters })
            this.countPipeline.unshift({ $match: this.baseFilters })
        }
        
        this.pipelineBuilt = true
        return this
    }

    // Sort
    sort(field = 'createdAt', order = 'desc') {
        this.buildPipeline() // Đảm bảo pipeline đã build
        this.pipeline.push({
            $sort: { [field]: order === 'desc' ? -1 : 1 },
        })
        return this
    }

    sortByRelevance() {
        return this.sort('relevanceScore', 'desc')
    }

    sortByDiscount() {
        return this.sort('discount_percent', 'desc')
    }

    sortByPrice(order = 'asc') {
        this.buildPipeline()
        // Ensure sale_price is calculated
        this.pipeline.push({
            $addFields: {
                sale_price: {
                    $round: [
                        {
                            $multiply: [
                                '$base_price',
                                {
                                    $subtract: [
                                        1,
                                        { $divide: ['$discount_percent', 100] },
                                    ],
                                },
                            ],
                        },
                        0,
                    ],
                },
            },
        })
        return this.sort('sale_price', order)
    }

    sortByRating() {
        return this.sort('ratings_average', 'desc')
    }

    // Pagination
    paginate(page = 1, limit = 10) {
        this.buildPipeline() // Đảm bảo pipeline đã build
        this._page = Number(page)
        this._limit = Number(limit)
        const skip = (this._page - 1) * this._limit

        this.pipeline.push({ $skip: skip })
        this.pipeline.push({ $limit: this._limit })
        return this
    }

    // Populate categories
    populateCategories() {
        this.pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'category_ids',
                foreignField: '_id',
                as: 'category_ids',
            },
        })
        return this
    }

    // Execute query
    async execute(model) {
        this.buildPipeline() // Đảm bảo pipeline hoàn chỉnh
        
        const [products, totalResult] = await Promise.all([
            model.aggregate(this.pipeline),
            model.aggregate([...this.countPipeline, { $count: 'total' }]),
        ])

        const total = totalResult[0]?.total || 0

        return {
            products,
            pagination: {
                page: this._page,
                limit: this._limit,
                total,
                totalPages: Math.ceil(total / this._limit),
                hasNextPage: this._page < Math.ceil(total / this._limit),
                hasPrevPage: this._page > 1,
            },
        }
    }
}

module.exports = ProductQueryBuilder

