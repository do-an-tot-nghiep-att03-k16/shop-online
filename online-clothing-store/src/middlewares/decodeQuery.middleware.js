// middleware/decodeQuery.middleware.js
const decodeQueryParams = (req, res, next) => {
    try {
        if (!req.query || typeof req.query !== 'object') {
            return next()
        }

        Object.keys(req.query).forEach((key) => {
            if (typeof req.query[key] === 'string') {
                try {
                    // Decode và chỉ gán nếu khác giá trị gốc (tránh decode 2 lần)
                    const decoded = decodeURIComponent(req.query[key])
                    if (decoded !== req.query[key]) {
                        req.query[key] = decoded
                    }
                } catch (e) {
                    // Nếu string đã decode rồi hoặc invalid, giữ nguyên
                    // VD: "áo thun" đã decode → giữ nguyên
                }
            }
        })

        next()
    } catch (error) {
        next(error)
    }
}

module.exports = decodeQueryParams
