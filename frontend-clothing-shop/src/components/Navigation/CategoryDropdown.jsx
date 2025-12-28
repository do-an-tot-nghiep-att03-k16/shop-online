import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'antd'
import { useParentCategories, useChildrenCategories } from '../../hooks/useCategories'
import { ensureArray } from '../../utils/apiUtils'
import { createSlug } from '../../utils/slugUtils'

const useCategoryDropdown = () => {
    const [hoveredParentId, setHoveredParentId] = useState(null)
    const [loadedParentIds, setLoadedParentIds] = useState(new Set())

    // Use React Query hook for parent categories
    const { data: parentCategories = [], isLoading: isLoadingParents } = useParentCategories()

    // Use React Query hook for children categories (only when parent is hovered)
    const { data: childrenData = [], isLoading: isLoadingChildren } = useChildrenCategories(
        hoveredParentId,
        { enabled: !!hoveredParentId }
    )

    const handleParentHover = useCallback((parentId) => {
        if (!loadedParentIds.has(parentId)) {
            setHoveredParentId(parentId)
            setLoadedParentIds(prev => new Set([...prev, parentId]))
        }
    }, [loadedParentIds])

    const createCategoryMenuItems = useMemo(() => {
        if (!Array.isArray(parentCategories)) return []
        
        return parentCategories.slice(0, 4).map(parent => {
            const parentSlug = parent.slug || createSlug(parent.name)
            const hasLoadedChildren = loadedParentIds.has(parent._id)
            const children = hasLoadedChildren && hoveredParentId === parent._id ? ensureArray(childrenData) : []
            
            return {
                key: `parent-${parent._id}`,
                label: parent.name,
                children: [
                    {
                        key: `all-${parent._id}`,
                        label: <Link to={`/shop/${parentSlug}`}>Tất cả {parent.name}</Link>
                    },
                    ...(children.length > 0 ? [{ type: 'divider' }] : []),
                    ...children.map(child => {
                        const childSlug = child.slug || createSlug(child.name)
                        return {
                            key: `child-${child._id}`,
                            label: <Link to={`/shop/${childSlug}`}>{child.name}</Link>
                        }
                    }),
                    ...(isLoadingChildren && hoveredParentId === parent._id ? [{
                        key: `loading-${parent._id}`,
                        label: 'Đang tải...',
                        disabled: true
                    }] : [])
                ],
                onMouseEnter: () => handleParentHover(parent._id)
            }
        })
    }, [parentCategories, childrenData, hoveredParentId, isLoadingChildren, loadedParentIds, handleParentHover])

    return {
        menuItems: createCategoryMenuItems,
        menuKey: parentCategories.length // Use parentCategories length as key for re-rendering
    }
}

export default useCategoryDropdown