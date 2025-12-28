import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../config/apiClient'
import { authUtils } from '../../utils/authUtils'

const InventoryManagementSimple = () => {
    const [page, setPage] = useState(1)
    const queryClient = useQueryClient()

    // Check if user is admin
    const isUserAdmin = authUtils.isAdmin()

    // Simple inventory overview fetch
    const {
        data: inventoryData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['inventory-overview', page],
        queryFn: async () => {
            const response = await api.get('/products/inventory/overview', {
                params: {
                    page,
                    limit: 20,
                    sortBy: 'stock_asc',
                    lowStockThreshold: 10
                }
            })
            return response.data.metadata
        },
        enabled: isUserAdmin,
    })

    // Simple stock update mutation
    const updateStockMutation = useMutation({
        mutationFn: async ({ productId, sku, quantity }) => {
            const response = await api.patch(`/products/${productId}/stock`, {
                sku,
                quantity: parseInt(quantity)
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-overview'] })
            alert('Stock updated successfully!')
        },
        onError: (error) => {
            alert('Error updating stock: ' + (error.response?.data?.message || error.message))
        }
    })

    const handleStockUpdate = (productId, sku, newQuantity) => {
        if (newQuantity === '' || isNaN(newQuantity)) {
            alert('Please enter a valid number')
            return
        }
        
        if (confirm(`Update stock for SKU ${sku} to ${newQuantity}?`)) {
            updateStockMutation.mutate({
                productId,
                sku,
                quantity: parseInt(newQuantity)
            })
        }
    }

    if (!isUserAdmin) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>🚫 Access Denied</h2>
                <p>You need admin or shop privileges to access inventory management.</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>⏳ Loading...</h2>
                <p>Fetching inventory data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>❌ Error</h2>
                <p>Failed to load inventory: {error.message}</p>
                <button 
                    onClick={refetch}
                    style={{
                        padding: '10px 20px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        )
    }

    const { variants = [], summary = {}, pagination = {} } = inventoryData || {}

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>🏪 Inventory Management</h1>
            
            {/* Summary */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '10px', 
                marginBottom: '20px' 
            }}>
                <div style={{ padding: '15px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                    <strong>Total Variants: {summary.totalVariants || 0}</strong>
                </div>
                <div style={{ padding: '15px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                    <strong>Total Stock: {summary.totalStock || 0}</strong>
                </div>
                <div style={{ padding: '15px', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '5px' }}>
                    <strong>Out of Stock: {summary.outOfStockCount || 0}</strong>
                </div>
                <div style={{ padding: '15px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
                    <strong>Low Stock: {summary.lowStockCount || 0}</strong>
                </div>
            </div>

            {/* Controls */}
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={refetch}
                    disabled={isLoading}
                    style={{
                        padding: '10px 20px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    {isLoading ? 'Loading...' : 'Refresh'}
                </button>
                
                <span>Page {pagination.current_page || 1} of {pagination.total_pages || 1}</span>
                
                <button 
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    style={{
                        padding: '5px 10px',
                        marginLeft: '10px',
                        background: page === 1 ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                    }}
                >
                    Prev
                </button>
                
                <button 
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page >= (pagination.total_pages || 1)}
                    style={{
                        padding: '5px 10px',
                        marginLeft: '5px',
                        background: page >= (pagination.total_pages || 1) ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: page >= (pagination.total_pages || 1) ? 'not-allowed' : 'pointer'
                    }}
                >
                    Next
                </button>
            </div>

            {/* Inventory List */}
            <div>
                <h3>Inventory Items ({variants.length})</h3>
                {variants.length === 0 ? (
                    <p>No inventory data found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Product</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>SKU</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Color/Size</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Current Stock</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Update Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map((item) => {
                                    const stockId = `stock-${item.variant.sku}`
                                    const stockStatus = item.variant.stock_quantity === 0 ? 'Out of Stock' 
                                        : item.variant.stock_quantity <= 5 ? 'Low Stock' : 'In Stock'
                                    const statusColor = item.variant.stock_quantity === 0 ? '#dc3545' 
                                        : item.variant.stock_quantity <= 5 ? '#ffc107' : '#28a745'

                                    return (
                                        <tr key={stockId}>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                <strong>{item.name}</strong>
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                {item.variant.sku}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                {item.variant.color} / {item.variant.size}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                <strong>{item.variant.stock_quantity}</strong>
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                <span style={{ 
                                                    color: statusColor, 
                                                    fontWeight: 'bold',
                                                    padding: '3px 8px',
                                                    borderRadius: '3px',
                                                    background: statusColor + '20'
                                                }}>
                                                    {stockStatus}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                <input
                                                    type="number"
                                                    id={stockId}
                                                    min="0"
                                                    defaultValue={item.variant.stock_quantity}
                                                    style={{
                                                        width: '80px',
                                                        padding: '4px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '3px',
                                                        marginRight: '5px'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newValue = document.getElementById(stockId).value
                                                        handleStockUpdate(item._id, item.variant.sku, newValue)
                                                    }}
                                                    disabled={updateStockMutation.isPending}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {updateStockMutation.isPending ? '...' : 'Update'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default InventoryManagementSimple