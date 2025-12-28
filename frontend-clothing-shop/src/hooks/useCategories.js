import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import categoryService from '../services/categoryService'
import { categoryAPI } from '../services/api'
import { message } from 'antd'
import { handleApiError } from '../utils/errorHandler'

// Query keys (centralized)
export const categoryKeys = {
    all: ['categories'],
    paginated: (params) => ['categories', 'paginated', params],
    detail: (id) => ['categories', id],
    search: (searchText) => ['categories', 'search', searchText],
    active: ['categories', 'active'],
}

// ===== GET ALL CATEGORIES =====
export const useCategories = (params = { page: 1, limit: 10 }) => {
    // console.log('🎯 useCategories params:', params)

    const result = useQuery({
        queryKey: categoryKeys.paginated(params),
        queryFn: async () => {
            const data = await categoryService.getAllCategories(params)
            // console.log('📦 Service returned:', data)
            return data
        },
        keepPreviousData: true,
        staleTime: 30000,
        onError: (error) => {
            console.error('❌ useCategories Error:', error)
            const handledError = handleApiError(error, 'Không thể tải danh mục')
            message.error(handledError.message)
        },
    })

    console.log('🔥 useQuery result:', result)
    return result
}

// ===== GET CATEGORY BY ID =====
export const useCategory = (id, options = {}) => {
    return useQuery({
        queryKey: categoryKeys.detail(id),
        queryFn: () => categoryService.getCategoryById(id),
        enabled: !!id,
        ...options,
    })
}

// ===== SEARCH CATEGORIES =====
export const useSearchCategories = (searchText, params = {}) => {
    return useQuery({
        queryKey: categoryKeys.search(searchText),
        queryFn: () => categoryService.searchCategories(searchText, params),
        enabled: !!searchText && searchText.trim() !== '',
        staleTime: 30000,
    })
}

// ===== GET ACTIVE CATEGORIES =====
export const useActiveCategories = (params = { page: 1, limit: 100 }) => {
    // console.log('🎯 useActiveCategories called with params:', params)

    return useQuery({
        queryKey: categoryKeys.active,
        queryFn: async () => {
            // Sử dụng getActiveCategories endpoint chính thức
            const data = await categoryService.getActiveCategories(params)
            // console.log('📦 Active categories service returned:', data)
            return data
        },
        staleTime: 60000,
        onError: (error) => {
            console.error('❌ useActiveCategories Error:', error)
            const handledError = handleApiError(
                error,
                'Không thể tải danh mục active'
            )
            message.error(handledError.message)
        },
    })
}

// ===== CREATE CATEGORY =====
export const useCreateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: categoryService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
            message.success('Tạo danh mục thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tạo danh mục')
            message.error(handledError.message)
        },
    })
}

// ===== UPDATE CATEGORY =====
export const useUpdateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ categoryId, data }) =>
            categoryService.updateCategory(categoryId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
            queryClient.invalidateQueries(
                categoryKeys.detail(variables.categoryId)
            )
            message.success('Cập nhật danh mục thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(
                error,
                'Không thể cập nhật danh mục'
            )
            message.error(handledError.message)
        },
    })
}

// ===== DELETE CATEGORY =====
export const useDeleteCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: categoryService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
            message.success('Xóa danh mục thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể xóa danh mục')
            message.error(handledError.message)
        },
    })
}

// ===== PUBLISH CATEGORY =====
export const usePublishCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: categoryService.publishCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
            message.success('Đã xuất bản danh mục')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể xuất bản')
            message.error(handledError.message)
        },
    })
}

// ===== UNPUBLISH CATEGORY =====
export const useUnpublishCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: categoryService.unpublishCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
            message.success('Đã ẩn danh mục')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể ẩn danh mục')
            message.error(handledError.message)
        },
    })
}

// Hook lấy parent categories
export const useParentCategories = () => {
    return useQuery({
        queryKey: ['parent-categories'],
        queryFn: () => categoryService.getParentCategories(),
        select: (response) => response?.metadata || [],
        staleTime: 5 * 60 * 1000, // Cache 5 phút
    })
}

// Hook lấy children categories
export const useChildrenCategories = (parentId, options = {}) => {
    return useQuery({
        queryKey: ['children-categories', parentId],
        queryFn: () => categoryService.getChildrenCategories(parentId),
        select: (response) => response?.metadata || [],
        enabled: !!parentId && options.enabled !== false, // Chỉ chạy khi có parentId
        staleTime: 5 * 60 * 1000,
    })
}

// ===== UPLOAD CATEGORY IMAGE =====
export const useUploadCategoryImage = () => {
    return useMutation({
        mutationFn: async (file) => {
            const formData = new FormData()
            formData.append('category', file)
            const response = await categoryAPI.uploadImage(formData)
            // Response structure: { message, status, metadata }
            return response.metadata
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Upload ảnh thất bại!')
            message.error(handledError.message)
        },
    })
}
