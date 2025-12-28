// hooks/useBlog.js
import { useState, useEffect } from 'react'
import blogService from '../services/blogService'

export const useBlogs = (params = {}) => {
    const [blogs, setBlogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 0
    })

    const fetchBlogs = async (fetchParams = {}) => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await blogService.getBlogs({
                ...params,
                ...fetchParams
            })
            
            setBlogs(response.data.data || [])
            setPagination(response.data.meta?.pagination || pagination)
        } catch (err) {
            console.error('❌ Error fetching blogs:', err)
            setError(err.response?.data?.error?.message || 'Không thể tải bài viết')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBlogs()
    }, [])

    return {
        blogs,
        loading,
        error,
        pagination,
        refetch: fetchBlogs
    }
}

export const useBlogBySlug = (slug) => {
    const [blog, setBlog] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!slug) return

        const fetchBlog = async () => {
            try {
                setLoading(true)
                setError(null)
                
                const response = await blogService.getBlogBySlug(slug)
                const blogData = response.data.data?.[0]
                
                if (blogData) {
                    setBlog(blogData)
                } else {
                    setError('Bài viết không tồn tại')
                }
            } catch (err) {
                console.error('❌ Error fetching blog:', err)
                setError(err.response?.data?.error?.message || 'Không thể tải bài viết')
            } finally {
                setLoading(false)
            }
        }

        fetchBlog()
    }, [slug])

    return { blog, loading, error }
}

export const useBlogCategories = () => {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true)
                setError(null)
                
                const response = await blogService.getCategories()
                setCategories(response.data.data || [])
            } catch (err) {
                console.error('❌ Error fetching blog categories:', err)
                setError(err.response?.data?.error?.message || 'Không thể tải danh mục')
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])

    return { categories, loading, error }
}

export const useBlogsByCategory = (categorySlug, params = {}) => {
    const [blogs, setBlogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 0
    })

    const fetchBlogsByCategory = async (fetchParams = {}) => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await blogService.getBlogsByCategory(categorySlug, {
                ...params,
                ...fetchParams
            })
            
            setBlogs(response.data.data || [])
            setPagination(response.data.meta?.pagination || pagination)
        } catch (err) {
            console.error('❌ Error fetching blogs by category:', err)
            setError(err.response?.data?.error?.message || 'Không thể tải bài viết')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (categorySlug) {
            fetchBlogsByCategory()
        }
    }, [categorySlug])

    return {
        blogs,
        loading,
        error,
        pagination,
        refetch: fetchBlogsByCategory
    }
}