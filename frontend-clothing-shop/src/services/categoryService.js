import { categoryAPI } from './api'
import { handleApiError } from '../utils/errorHandler'

const categoryService = {
    getAllCategories: async (params) => {
        try {
            const response = await categoryAPI.getAll(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách danh mục')
        }
    },

    getCategoryById: async (id) => {
        try {
            const response = await categoryAPI.getById(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải thông tin danh mục')
        }
    },

    getCategoryBySlug: async (slug) => {
        try {
            const response = await categoryAPI.getBySlug(slug)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh mục')
        }
    },

    getActiveCategories: async (params) => {
        try {
            const response = await categoryAPI.getActive(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh mục active')
        }
    },

    searchCategories: async (searchText, params) => {
        try {
            const response = await categoryAPI.search(searchText, params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tìm kiếm danh mục')
        }
    },

    createCategory: async (data) => {
        try {
            const response = await categoryAPI.create(data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tạo danh mục')
        }
    },

    updateCategory: async (id, data) => {
        try {
            const response = await categoryAPI.update(id, data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể cập nhật danh mục')
        }
    },

    deleteCategory: async (id) => {
        try {
            const response = await categoryAPI.delete(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể xóa danh mục')
        }
    },

    publishCategory: async (id) => {
        try {
            const response = await categoryAPI.publish(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể xuất bản danh mục')
        }
    },

    unpublishCategory: async (id) => {
        try {
            const response = await categoryAPI.unpublish(id)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể ẩn danh mục')
        }
    },

    // === METHODS MỚI CHO PARENT-CHILD ===

    getParentCategories: async () => {
        try {
            const response = await categoryAPI.getParents()
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh mục cha')
        }
    },

    getChildrenCategories: async (parentId) => {
        try {
            const response = await categoryAPI.getChildren(parentId)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh mục con')
        }
    },

    // Alternative method name to match backend
    getChildrenByParent: async (parentId) => {
        try {
            const response = await categoryAPI.getChildren(parentId)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh mục con')
        }
    },
}

export default categoryService
