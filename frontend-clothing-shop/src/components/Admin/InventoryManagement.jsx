import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../config/apiClient'
import { authUtils } from '../../utils/authUtils'
import LoadingSpinner from '../Common/LoadingSpinner'

const InventoryManagement = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [sortBy, setSortBy] = useState('stock_asc')
    const [lowStockThreshold, setLowStockThreshold] = useState(10)
    const [selectedItems, setSelectedItems] = useState([])
    const [bulkUpdateMode, setBulkUpdateMode] = useState(false)
    const [editingStock, setEditingStock] = useState({}) // { variantId: newQuantity }
    
    const queryClient = useQueryClient()

    // Check if user is admin
    const isUserAdmin = authUtils.isAdmin()

    // Fetch inventory overview
    const {
        data: inventoryData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['inventory-overview', currentPage, sortBy, lowStockThreshold],
        queryFn: async () => {
            const response = await api.get('/products/inventory/overview', {
                params: {
                    page: currentPage,
                    limit: 50,
                    sortBy,
                    lowStockThreshold
                }
            })
            return response.data.metadata
        },
        enabled: isUserAdmin,
    })

    // Fetch low stock alerts
    const { data: alertsData } = useQuery({
        queryKey: ['low-stock-alerts', lowStockThreshold],
        queryFn: async () => {
            const response = await api.get('/products/inventory/low-stock-alerts', {
                params: { threshold: lowStockThreshold }
            })
            return response.data.metadata
        },
        enabled: isUserAdmin,
    })

    // Single stock update mutation
    const updateStockMutation = useMutation({
        mutationFn: async ({ productId, sku, quantity }) => {
            const response = await api.patch(`/products/${productId}/stock`, {
                sku,
                quantity
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-overview'] })
            queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
            setEditingStock({})
        },
    })

    // Bulk update mutation
    const bulkUpdateMutation = useMutation({
        mutationFn: async (updates) => {
            const response = await api.post('/products/inventory/bulk-update', {
                updates
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-overview'] })
            queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
            setSelectedItems([])
            setBulkUpdateMode(false)
            setEditingStock({})
        },
    })

    const handleStockUpdate = (variant) => {
        const newQuantity = editingStock[variant.variant.sku]
        if (newQuantity !== undefined) {
            updateStockMutation.mutate({
                productId: variant._id,
                sku: variant.variant.sku,
                quantity: parseInt(newQuantity)
            })
        }
    }

    const handleBulkUpdate = () => {
        const updates = selectedItems
            .filter(item => editingStock[item.variant.sku] !== undefined)
            .map(item => ({
                productId: item._id,
                sku: item.variant.sku,
                quantity: parseInt(editingStock[item.variant.sku])
            }))

        if (updates.length > 0) {
            bulkUpdateMutation.mutate(updates)
        }
    }

    const handleSelectItem = (variant) => {
        setSelectedItems(prev => {
            const isSelected = prev.some(item => item.variant.sku === variant.variant.sku)
            if (isSelected) {
                return prev.filter(item => item.variant.sku !== variant.variant.sku)
            } else {
                return [...prev, variant]
            }
        })
    }

    const getStockStatusColor = (quantity) => {
        if (quantity === 0) return 'text-red-600 bg-red-50'
        if (quantity <= lowStockThreshold / 2) return 'text-orange-600 bg-orange-50'
        if (quantity <= lowStockThreshold) return 'text-yellow-600 bg-yellow-50'
        return 'text-green-600 bg-green-50'
    }

    const getStockStatusText = (quantity) => {
        if (quantity === 0) return 'Out of Stock'
        if (quantity <= lowStockThreshold / 2) return 'Critical'
        if (quantity <= lowStockThreshold) return 'Low Stock'
        return 'In Stock'
    }

    if (!isUserAdmin) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Access denied. Admin privileges required.</p>
            </div>
        )
    }

    if (isLoading) {
        return <LoadingSpinner />
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Error loading inventory data</p>
                <button 
                    onClick={refetch}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        )
    }

    const { variants = [], pagination = {}, summary = {} } = inventoryData || {}

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
                        className={`px-4 py-2 rounded ${bulkUpdateMode ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                    >
                        {bulkUpdateMode ? 'Cancel Bulk Edit' : 'Bulk Edit'}
                    </button>
                    <button
                        onClick={refetch}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-800">{summary.totalVariants}</div>
                    <div className="text-sm text-gray-500">Total Variants</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-800">{summary.totalStock}</div>
                    <div className="text-sm text-gray-500">Total Stock</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-red-600">{summary.outOfStockCount}</div>
                    <div className="text-sm text-gray-500">Out of Stock</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-orange-600">{summary.lowStockCount}</div>
                    <div className="text-sm text-gray-500">Low Stock</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-800">{Math.round(summary.averageStock)}</div>
                    <div className="text-sm text-gray-500">Avg Stock</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Low Stock Threshold
                        </label>
                        <input
                            type="number"
                            value={lowStockThreshold}
                            onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                            className="border rounded px-3 py-1 w-20"
                            min="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border rounded px-3 py-1"
                        >
                            <option value="stock_asc">Stock (Low to High)</option>
                            <option value="stock_desc">Stock (High to Low)</option>
                            <option value="name_asc">Name (A-Z)</option>
                            <option value="name_desc">Name (Z-A)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Update Controls */}
            {bulkUpdateMode && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-800">
                            {selectedItems.length} items selected for bulk update
                        </span>
                        <button
                            onClick={handleBulkUpdate}
                            disabled={selectedItems.length === 0 || bulkUpdateMutation.isPending}
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
                        >
                            {bulkUpdateMutation.isPending ? 'Updating...' : 'Update Selected'}
                        </button>
                    </div>
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {bulkUpdateMode && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Update Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {variants.map((variant) => (
                                <tr key={`${variant._id}-${variant.variant.sku}`} className="hover:bg-gray-50">
                                    {bulkUpdateMode && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.some(item => item.variant.sku === variant.variant.sku)}
                                                onChange={() => handleSelectItem(variant)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{variant.name}</div>
                                        <div className="text-sm text-gray-500">{variant.slug}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {variant.variant.sku}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {variant.variant.color} / {variant.variant.size}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {variant.variant.stock_quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(variant.variant.stock_quantity)}`}>
                                            {getStockStatusText(variant.variant.stock_quantity)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={editingStock[variant.variant.sku] ?? variant.variant.stock_quantity}
                                            onChange={(e) => setEditingStock(prev => ({
                                                ...prev,
                                                [variant.variant.sku]: e.target.value
                                            }))}
                                            className="w-20 border rounded px-2 py-1 text-sm"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {!bulkUpdateMode && (
                                            <button
                                                onClick={() => handleStockUpdate(variant)}
                                                disabled={updateStockMutation.isPending || editingStock[variant.variant.sku] === undefined}
                                                className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                                            >
                                                {updateStockMutation.isPending ? 'Updating...' : 'Update'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:bg-gray-100"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-700">
                        Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                        disabled={currentPage === pagination.total_pages}
                        className="px-3 py-1 border rounded disabled:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Low Stock Alerts */}
            {alertsData && alertsData.total > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Alerts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Critical Alerts */}
                        {alertsData.alerts.critical.length > 0 && (
                            <div className="border-l-4 border-red-500 bg-red-50 p-4">
                                <h3 className="font-medium text-red-800">Critical ({alertsData.summary.critical})</h3>
                                <div className="mt-2 space-y-1">
                                    {alertsData.alerts.critical.slice(0, 3).map((item) => (
                                        <div key={item.variant.sku} className="text-sm text-red-700">
                                            {item.name} - {item.variant.color}/{item.variant.size}
                                        </div>
                                    ))}
                                    {alertsData.alerts.critical.length > 3 && (
                                        <div className="text-sm text-red-600">
                                            +{alertsData.alerts.critical.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* High Priority Alerts */}
                        {alertsData.alerts.high.length > 0 && (
                            <div className="border-l-4 border-orange-500 bg-orange-50 p-4">
                                <h3 className="font-medium text-orange-800">High Priority ({alertsData.summary.high})</h3>
                                <div className="mt-2 space-y-1">
                                    {alertsData.alerts.high.slice(0, 3).map((item) => (
                                        <div key={item.variant.sku} className="text-sm text-orange-700">
                                            {item.name} - {item.variant.color}/{item.variant.size} ({item.variant.stock_quantity})
                                        </div>
                                    ))}
                                    {alertsData.alerts.high.length > 3 && (
                                        <div className="text-sm text-orange-600">
                                            +{alertsData.alerts.high.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Medium Priority Alerts */}
                        {alertsData.alerts.medium.length > 0 && (
                            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                                <h3 className="font-medium text-yellow-800">Medium Priority ({alertsData.summary.medium})</h3>
                                <div className="mt-2 space-y-1">
                                    {alertsData.alerts.medium.slice(0, 3).map((item) => (
                                        <div key={item.variant.sku} className="text-sm text-yellow-700">
                                            {item.name} - {item.variant.color}/{item.variant.size} ({item.variant.stock_quantity})
                                        </div>
                                    ))}
                                    {alertsData.alerts.medium.length > 3 && (
                                        <div className="text-sm text-yellow-600">
                                            +{alertsData.alerts.medium.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default InventoryManagement