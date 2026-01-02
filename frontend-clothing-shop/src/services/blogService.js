// services/blogService.js
import axios from 'axios'
import envConfig from '../config/env'

// Sử dụng cmsClient để nhất quán với các service khác
const CMS_URL = envConfig.API_STRAPI_URL.replace(/\/api$/, '');
const cmsClient = axios.create({
    baseURL: `${CMS_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

const blogService = {
    // Get all blog posts with pagination and advanced sorting
    getBlogs: (params = {}) => {
        const queryParams = {
            // Populate all relations to avoid errors
            'populate': '*',
            // Pagination
            'pagination[page]': params.page || 1,
            'pagination[pageSize]': params.pageSize || 12,
            'pagination[withCount]': true
        }

        // Advanced sorting - support multiple fields
        if (params.sort) {
            if (Array.isArray(params.sort)) {
                // Multiple sorts: sort[0]=createdAt:desc&sort[1]=title:asc
                params.sort.forEach((sortField, index) => {
                    queryParams[`sort[${index}]`] = sortField
                })
            } else {
                // Single sort
                queryParams['sort[0]'] = params.sort
            }
        } else {
            // Default sort: newest first, then alphabetical
            queryParams['sort[0]'] = 'createdAt:desc'
            queryParams['sort[1]'] = 'title:asc'
        }
        
        // Add filters if provided
        if (params.category) {
            queryParams['filters[category][slug][$eq]'] = params.category
        }

        return cmsClient.get('/blogs', { params: queryParams })
    },

    // Get single blog by slug - populate everything for detail view
    getBlogBySlug: (slug) => {
        return cmsClient.get('/blogs', {
            params: {
                'filters[slug][$eq]': slug,
                // Use populate=* for blog detail to get all relations and content
                'populate': '*'
            }
        })
    },

    // Get blogs by category with optimized population and advanced sorting
    getBlogsByCategory: (categorySlug, params = {}) => {
        const queryParams = {
            'filters[category][slug][$eq]': categorySlug,
            'populate': '*',
            'pagination[page]': params.page || 1,
            'pagination[pageSize]': params.pageSize || 12,
            'pagination[withCount]': true
        }

        // Advanced sorting
        if (params.sort) {
            if (Array.isArray(params.sort)) {
                params.sort.forEach((sortField, index) => {
                    queryParams[`sort[${index}]`] = sortField
                })
            } else {
                queryParams['sort[0]'] = params.sort
            }
        } else {
            queryParams['sort[0]'] = 'createdAt:desc'
            queryParams['sort[1]'] = 'title:asc'
        }

        return cmsClient.get('/blogs', { params: queryParams })
    },

    // Get blog categories - no population needed
    getCategories: () => {
        return cmsClient.get('/blog-categories', {
            params: {
                'sort': 'name:asc'
            }
        })
    },

    // Search blogs with field selection and advanced sorting
    searchBlogs: (query, params = {}) => {
        const queryParams = {
            'filters[$or][0][title][$containsi]': query,
            'filters[$or][1][description][$containsi]': query,
            'filters[$or][2][content][$containsi]': query,
            // Populate all relations to avoid errors
            'populate': '*',
            // Pagination
            'pagination[page]': params.page || 1,
            'pagination[pageSize]': params.pageSize || 12,
            'pagination[withCount]': true
        }

        // Advanced sorting for search results
        if (params.sort) {
            if (Array.isArray(params.sort)) {
                params.sort.forEach((sortField, index) => {
                    queryParams[`sort[${index}]`] = sortField
                })
            } else {
                queryParams['sort[0]'] = params.sort
            }
        } else {
            // Default: relevance (newest first), then alphabetical
            queryParams['sort[0]'] = 'createdAt:desc'
            queryParams['sort[1]'] = 'title:asc'
        }

        return cmsClient.get('/blogs', { params: queryParams })
    }
}

export default blogService