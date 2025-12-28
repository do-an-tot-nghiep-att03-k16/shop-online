import { productAPI } from './api'
import { extractData } from '../utils/apiUtils'
import { handleApiError } from '../utils/errorHandler'

const productService = {
    // === PUBLIC METHODS ===
    getAllProducts: async (params) => {
        try {
            const response = await productAPI.getAll(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách sản phẩm')
        }
    },
    
    // === ADMIN METHODS ===
    getAllProductsForAdmin: async (params) => {
        try {
            const response = await productAPI.getAllForAdmin(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách sản phẩm admin')
        }
    },

    getProductById: async (id) => {
        try {
            const response = await productAPI.getById(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải thông tin sản phẩm')
        }
    },

    getProductBySlug: async (slug) => {
        try {
            const response = await productAPI.getBySlug(slug)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải sản phẩm')
        }
    },

    getProductsByCategory: async (categoryId, params) => {
        try {
            const response = await productAPI.getByCategory(categoryId, params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải sản phẩm theo danh mục')
        }
    },

    getProductsByGender: async (gender, params) => {
        try {
            const response = await productAPI.getByGender(gender, params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải sản phẩm theo giới tính')
        }
    },

    getProductsOnSale: async (params) => {
        try {
            const response = await productAPI.getOnSale(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải sản phẩm khuyến mãi')
        }
    },

    searchProducts: async (query, params) => {
        try {
            // Use dedicated search endpoint
            const response = await productAPI.search(query, params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tìm kiếm sản phẩm')
        }
    },
    
    getAllProducts: async (params) => {
        try {
            // Route to search endpoint if search query exists
            if (params.search && params.search.trim() !== '') {
                // Ensure search term is properly decoded and clean
                const cleanSearchTerm = decodeURIComponent(params.search).trim()
                const { search, ...otherParams } = params
                
                return await productAPI.search(cleanSearchTerm, otherParams)
            }
            // Otherwise use regular product endpoint
            const response = await productAPI.getAll(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải sản phẩm')
        }
    },

    checkVariantAvailability: async (productId, sku) => {
        try {
            const response = await productAPI.checkVariant(productId, sku)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể kiểm tra variant')
        }
    },

    getAvailableSizes: async (productId, color) => {
        try {
            const response = await productAPI.getAvailableSizes(
                productId,
                color
            )
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải sizes')
        }
    },

    // === ADMIN/SHOP METHODS ===
    createProduct: async (data) => {
        try {
            const response = await productAPI.create(data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tạo sản phẩm')
        }
    },

    updateProduct: async (id, data) => {
        try {
            const response = await productAPI.update(id, data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể cập nhật sản phẩm')
        }
    },

    deleteProduct: async (id) => {
        try {
            const response = await productAPI.delete(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể xóa sản phẩm')
        }
    },

    publishProduct: async (id) => {
        try {
            const response = await productAPI.publish(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể xuất bản sản phẩm')
        }
    },

    unpublishProduct: async (id) => {
        try {
            const response = await productAPI.unpublish(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể ẩn sản phẩm')
        }
    },

    updateStock: async (id, data) => {
        try {
            const response = await productAPI.updateStock(id, data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể cập nhật tồn kho')
        }
    },

    // Inventory management methods
    getInventoryOverview: async (params) => {
        try {
            const response = await productAPI.getInventoryOverview(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải tổng quan tồn kho')
        }
    },

    getLowStockAlerts: async (params) => {
        try {
            const response = await productAPI.getLowStockAlerts(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải cảnh báo tồn kho')
        }
    },

    bulkUpdateStock: async (updates) => {
        try {
            const response = await productAPI.bulkUpdateStock({ updates })
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể cập nhật tồn kho hàng loạt')
        }
    },

    // ⭐ Upload nhiều ảnh - Nhận files array, trả về URLs array
    uploadImages: async (files) => {
        try {
            if (!files || files.length === 0) {
                throw new Error('Không có file để upload')
            }

            // console.log(`📤 Uploading ${files.length} images...`)

            const response = await productAPI.uploadImages(files)


            // Test extractData
            const test1 = extractData(response, 'images')
            const test2 = extractData(response)

            // Use simple path first
            const uploadData = response?.metadata || response

            if (!uploadData?.images || uploadData.images.length === 0) {
                console.error('❌ NO IMAGES FOUND IN:', uploadData)
                throw new Error('Không nhận được images từ server')
            }

            // console.log(`✅ Upload success: ${uploadData.images.length} images received`)

            return uploadData
        } catch (error) {
            console.error('❌ Upload failed:', error)
            throw handleApiError(error, 'Upload ảnh thất bại')
        }
    },
}

export default productService
