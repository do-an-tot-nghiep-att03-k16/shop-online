import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import productService from '../services/productService'
import { message } from 'antd'
import { handleApiError } from '../utils/errorHandler'

// Query keys
export const productKeys = {
    all: ['products'],
    paginated: (params) => ['products', 'paginated', params],
    detail: (id) => ['products', id],
    bySlug: (slug) => ['products', 'slug', slug],
    search: (query, params) => ['products', 'search', query, params],
    byCategory: (categoryId, params) => [
        'products',
        'category',
        categoryId,
        params,
    ],
    byGender: (gender, params) => [
        'products',
        'gender',
        gender,
        params,
    ],
    onSale: (params) => ['products', 'sale', params],
}

// ===== GET ALL PRODUCTS =====
export const useProducts = (params = {}) => {
    // Nếu có productId, sử dụng getProductById thay vì getAllProducts
    if (params.productId) {
        return useQuery({
            queryKey: productKeys.detail(params.productId),
            queryFn: () => productService.getProductById(params.productId),
            enabled: !!params.productId,
            staleTime: 60000,
            onError: (error) => {
                const handledError = handleApiError(error, 'Không thể tải chi tiết sản phẩm')
                message.error(handledError.message)
            },
        })
    }
    
    // Nếu không có productId, sử dụng getAllProducts với filters
    const queryParams = {
        page: 1,
        limit: 10,
        ...params
    }
    
    return useQuery({
        queryKey: productKeys.paginated(queryParams),
        queryFn: () => productService.getAllProducts(queryParams),
        keepPreviousData: true,
        staleTime: 30000,
        select: (data) => {
            // Backend returns: {metadata: {products: [...], pagination: {...}}}
            // or {products: [...], pagination: {...}}
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {}
            }
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải sản phẩm')
            message.error(handledError.message)
        },
    })
}

// ===== GET PRODUCT BY ID =====
export const useProduct = (id, options = {}) => {
    return useQuery({
        queryKey: productKeys.detail(id),
        queryFn: () => productService.getProductById(id),
        enabled: !!id,
        select: (data) => {
            // Backend returns single product directly or wrapped in metadata
            return data?.metadata || data
        },
        ...options,
    })
}

// ===== GET PRODUCT BY SLUG =====
export const useProductBySlug = (slug, options = {}) => {
    return useQuery({
        queryKey: productKeys.bySlug(slug),
        queryFn: () => productService.getProductBySlug(slug),
        enabled: !!slug,
        select: (data) => {
            // Backend returns single product directly or wrapped in metadata
            return data?.metadata || data
        },
        ...options,
    })
}

// ===== SEARCH PRODUCTS =====
export const useSearchProducts = (query, params = {}) => {
    return useQuery({
        queryKey: productKeys.search(query, params),
        queryFn: () => productService.searchProducts(query, params),
        enabled: !!query && query.trim() !== '',
        staleTime: 30000,
        select: (data) => {
            // Backend returns: {metadata: {products: [...], pagination: {...}}}
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {}
            }
        },
    })
}

// ===== GET PRODUCTS BY CATEGORY =====
export const useProductsByCategory = (categoryId, params = {}) => {
    return useQuery({
        queryKey: productKeys.byCategory(categoryId, params),
        queryFn: () => productService.getProductsByCategory(categoryId, params),
        enabled: !!categoryId,
        staleTime: 30000,
        select: (data) => {
            // Backend returns: {metadata: {products: [...], pagination: {...}}}
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {}
            }
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải sản phẩm theo danh mục')
            message.error(handledError.message)
        },
    })
}

// ===== GET PRODUCTS BY GENDER =====
export const useProductsByGender = (gender, params = {}) => {
    return useQuery({
        queryKey: productKeys.byGender(gender, params),
        queryFn: () => productService.getProductsByGender(gender, params),
        enabled: !!gender,
        retry: 1,
        staleTime: 30000,
        select: (data) => {
            // Backend returns: {metadata: {products: [...], pagination: {...}}}
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {}
            }
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải sản phẩm theo giới tính')
            message.error(handledError.message)
        },
    })
}

// ===== GET PRODUCTS ON SALE =====
export const useProductsOnSale = (params = {}) => {
    return useQuery({
        queryKey: productKeys.onSale(params),
        queryFn: () => productService.getProductsOnSale(params),
        staleTime: 30000,
        select: (data) => {
            // Backend returns: {metadata: {products: [...], pagination: {...}}}
            const responseData = data?.metadata || data
            return {
                products: responseData?.products || [],
                pagination: responseData?.pagination || {}
            }
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tải sản phẩm khuyến mãi')
            message.error(handledError.message)
        },
    })
}

// ===== CREATE PRODUCT =====
export const useCreateProduct = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: productService.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all })
            message.success('Tạo sản phẩm thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể tạo sản phẩm')
            message.error(handledError.message)
        },
    })
}

// ===== UPDATE PRODUCT =====
export const useUpdateProduct = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => productService.updateProduct(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: productKeys.all })
            queryClient.invalidateQueries(productKeys.detail(variables.id))
            message.success('Cập nhật sản phẩm thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể cập nhật sản phẩm')
            message.error(handledError.message)
        },
    })
}

// ===== DELETE PRODUCT =====
export const useDeleteProduct = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: productService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all })
            message.success('Xóa sản phẩm thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể xóa sản phẩm')
            message.error(handledError.message)
        },
    })
}

// ===== PUBLISH PRODUCT =====
export const usePublishProduct = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: productService.publishProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all })
            message.success('Đã xuất bản sản phẩm')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể xuất bản')
            message.error(handledError.message)
        },
    })
}

// ===== UNPUBLISH PRODUCT =====
export const useUnpublishProduct = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: productService.unpublishProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all })
            message.success('Đã ẩn sản phẩm')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể ẩn sản phẩm')
            message.error(handledError.message)
        },
    })
}

// ===== UPDATE STOCK =====
export const useUpdateStock = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => productService.updateStock(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all })
            message.success('Cập nhật tồn kho thành công!')
        },
        onError: (error) => {
            const handledError = handleApiError(error, 'Không thể cập nhật tồn kho')
            message.error(handledError.message)
        },
    })
}

// ===== UPLOAD IMAGES =====
export const useUploadProductImages = () => {
    return useMutation({
        mutationFn: productService.uploadImages,
        onError: (error) => {
            const handledError = handleApiError(error, 'Upload ảnh thất bại!')
            message.error(handledError.message)
        },
    })
}
