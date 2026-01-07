import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    DatePicker,
    Select,
    Input,
    Row,
    Col,
    Statistic,
    Drawer,
    Descriptions,
    Tooltip,
    message,
    Badge,
    Typography
} from 'antd'
import {
    SearchOutlined,
    DownloadOutlined,
    EyeOutlined,
    ReloadOutlined,
    TransactionOutlined,
    DollarCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons'
import adminTransactionService from '../../services/adminTransactionService'
import { useAuth } from '../../hooks/useAuth'

const { RangePicker } = DatePicker
const { Option } = Select

const TransactionHistory = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    
    // Transaction data
    const [transactions, setTransactions] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    })
    const [stats, setStats] = useState([])
    const [revenue, setRevenue] = useState({})
    
    // Dashboard stats
    const [dashboardStats, setDashboardStats] = useState({})
    
    // Filters
    const [filters, setFilters] = useState({
        transferType: 'all',
        search: '',
        dateRange: null
    })
    
    // UI states
    const [detailDrawer, setDetailDrawer] = useState({
        visible: false,
        data: null
    })

    // Load data on mount and filter changes
    useEffect(() => {
        fetchTransactionHistory()
    }, [filters, pagination.current])

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    // Fetch transaction history
    const fetchTransactionHistory = async () => {
        setLoading(true)
        try {
            const queryParams = {
                ...filters,
                page: pagination.current,
                limit: pagination.pageSize,
                start_date: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
                end_date: filters.dateRange?.[1]?.format('YYYY-MM-DD')
            }
            
            const response = await adminTransactionService.getTransactionHistory(queryParams)
            
            
            setTransactions(response.metadata.transactions)
            setPagination(prev => ({
                ...prev,
                total: response.metadata.pagination.total
            }))
            setStats(response.metadata.stats)
            setRevenue(response.metadata.revenue)
        } catch (error) {
            message.error('Không thể tải lịch sử giao dịch')
            console.error('Error fetching transaction history:', error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
        try {
            const response = await adminTransactionService.getDashboardStats({ period: '7d' })
            setDashboardStats(response.metadata)
        } catch (error) {
            message.error('Không thể tải thống kê dashboard')
            console.error('Error fetching dashboard stats:', error)
        }
    }

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
        
        // Reset pagination when filters change
        setPagination(prev => ({ ...prev, current: 1 }))
    }

    // Handle pagination
    const handleTableChange = (paginationInfo) => {
        setPagination(prev => ({
            ...prev,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize
        }))
    }

    // viewDetails function removed - no longer needed

    // Export data
    const handleExport = async (format) => {
        setExporting(true)
        try {
            const exportFilters = {
                ...filters,
                start_date: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
                end_date: filters.dateRange?.[1]?.format('YYYY-MM-DD')
            }
            
            await adminTransactionService.exportData(format, exportFilters)
            message.success(`Xuất dữ liệu ${format.toUpperCase()} thành công`)
        } catch (error) {
            message.error('Xuất dữ liệu thất bại')
        } finally {
            setExporting(false)
        }
    }

    // Transaction columns with responsive design
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            fixed: window.innerWidth < 768 ? false : 'left',
            render: (id) => <code style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}>{id}</code>
        },
        {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content',
            width: window.innerWidth < 768 ? 120 : 180,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip title={text}>
                    <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        fontSize: 'clamp(12px, 2.8vw, 14px)',
                        lineHeight: '1.3',
                        maxWidth: '100%'
                    }}>
                        {text}
                    </div>
                </Tooltip>
            )
        },
        {
            title: 'Số tiền',
            dataIndex: 'transferAmount',
            key: 'transferAmount',
            width: window.innerWidth < 768 ? 120 : 150,
            render: (amount, record) => (
                <span style={{ 
                    fontWeight: 500, 
                    color: record.transferType === 'in' ? '#52c41a' : '#ff4d4f',
                    fontSize: 'clamp(11px, 2.8vw, 14px)'
                }}>
                    {record.transferType === 'in' ? 
                        <ArrowUpOutlined style={{ marginRight: 2 }} /> : 
                        <ArrowDownOutlined style={{ marginRight: 2 }} />
                    }
                    <span style={{ display: window.innerWidth < 768 ? 'block' : 'inline' }}>
                        {adminTransactionService.formatCurrency(amount)}
                    </span>
                </span>
            ),
            sorter: true,
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title: 'Loại',
            dataIndex: 'transferType',
            key: 'transferType',
            width: 100,
            render: (type) => (
                <Tag color={adminTransactionService.getTransactionTypeColor(type)}>
                    {adminTransactionService.getTransactionTypeText(type)}
                </Tag>
            ),
            filters: [
                { text: 'Tiền vào', value: 'in' },
                { text: 'Tiền ra', value: 'out' }
            ]
        },
        {
            title: 'Gateway',
            dataIndex: 'gateway',
            key: 'gateway',
            width: 100,
            responsive: ['md', 'lg', 'xl'],
            render: (gateway) => <Tag color="blue" style={{ fontSize: 'clamp(10px, 2.3vw, 12px)' }}>{gateway}</Tag>
        },
        {
            title: 'Đơn hàng',
            dataIndex: 'order_id',
            key: 'order_id',
            width: 110,
            responsive: ['sm', 'md', 'lg', 'xl'],
            render: (orderId) => orderId ? 
                <code style={{ fontSize: 'clamp(10px, 2.3vw, 12px)' }}>{orderId}</code> : 
                <span style={{ color: '#8c8c8c' }}>-</span>
        },
        {
            title: 'Thời gian GD',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            width: 130,
            responsive: ['lg', 'xl'],
            sorter: true,
            render: (date) => (
                <span style={{ fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{date}</span>
            )
        },
        {
            title: 'Thời gian tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 130,
            responsive: ['md', 'lg', 'xl'],
            render: (date) => (
                <span style={{ fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                    {adminTransactionService.formatDate(date)}
                </span>
            ),
            sorter: true
        },
        // Actions column removed as requested
    ]

    // Render filter controls
    const renderFilters = () => (
        <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Tìm kiếm theo nội dung, đơn hàng..."
                        prefix={<SearchOutlined />}
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        allowClear
                    />
                </Col>
                
                <Col xs={24} sm={12} md={4}>
                    <Select
                        placeholder="Loại giao dịch"
                        value={filters.transferType}
                        onChange={(value) => handleFilterChange('transferType', value)}
                        style={{ width: '100%' }}
                    >
                        {adminTransactionService.getTransactionTypeOptions().map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                    <RangePicker
                        style={{ width: '100%' }}
                        value={filters.dateRange}
                        onChange={(dates) => handleFilterChange('dateRange', dates)}
                        format="DD/MM/YYYY"
                        placeholder={['Từ ngày', 'Đến ngày']}
                    />
                </Col>
                
                <Col xs={24} sm={12} md={8}>
                    <Space wrap style={{ width: '100%', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchTransactionHistory}
                            size="small"
                        >
                            Làm mới
                        </Button>
                        
                        {user?.role === 'admin' && (
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={() => handleExport('csv')}
                                loading={exporting}
                                size="small"
                            >
                                Xuất CSV
                            </Button>
                        )}
                    </Space>
                </Col>
            </Row>
        </Card>
    )

    // Render stats cards
    const renderStats = () => (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6} md={6}>
                <Card 
                    size="small"
                    style={{ height: '100%' }}
                    bodyStyle={{ padding: 'clamp(8px, 2vw, 16px)' }}
                >
                    <Statistic
                        title="Tổng tiền vào"
                        value={revenue.total_in || 0}
                        formatter={(value) => adminTransactionService.formatCurrency(value)}
                        prefix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
                        valueStyle={{ 
                            color: '#3f8600', 
                            fontSize: 'clamp(12px, 3vw, 18px)' 
                        }}
                    />
                </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
                <Card 
                    size="small"
                    style={{ height: '100%' }}
                    bodyStyle={{ padding: 'clamp(8px, 2vw, 16px)' }}
                >
                    <Statistic
                        title="Tổng tiền ra"
                        value={revenue.total_out || 0}
                        formatter={(value) => adminTransactionService.formatCurrency(value)}
                        prefix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
                        valueStyle={{ 
                            color: '#cf1322',
                            fontSize: 'clamp(12px, 3vw, 18px)' 
                        }}
                    />
                </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
                <Card 
                    size="small"
                    style={{ height: '100%' }}
                    bodyStyle={{ padding: 'clamp(8px, 2vw, 16px)' }}
                >
                    <Statistic
                        title="Doanh thu ròng"
                        value={revenue.net_revenue || 0}
                        formatter={(value) => adminTransactionService.formatCurrency(value)}
                        prefix={<DollarCircleOutlined style={{ color: '#1890ff' }} />}
                        valueStyle={{ 
                            color: revenue.net_revenue >= 0 ? '#3f8600' : '#cf1322',
                            fontSize: 'clamp(12px, 3vw, 18px)' 
                        }}
                    />
                </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
                <Card 
                    size="small"
                    style={{ height: '100%' }}
                    bodyStyle={{ padding: 'clamp(8px, 2vw, 16px)' }}
                >
                    <Statistic
                        title="Tổng giao dịch"
                        value={stats.reduce((sum, stat) => sum + stat.count, 0)}
                        prefix={<TransactionOutlined style={{ color: '#722ed1' }} />}
                        valueStyle={{ fontSize: 'clamp(12px, 3vw, 18px)' }}
                    />
                </Card>
            </Col>
        </Row>
    )

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        Lịch sử giao dịch
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Theo dõi và quản lý các giao dịch thanh toán
                    </Typography.Text>
                </Col>
            </Row>

            {renderFilters()}
            {renderStats()}

            <Card>
                
                <Table
                    columns={columns}
                    dataSource={transactions}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: window.innerWidth > 768,
                        showQuickJumper: window.innerWidth > 768,
                        showTotal: (total, range) => 
                            window.innerWidth > 768 
                                ? `${range[0]}-${range[1]} của ${total} giao dịch`
                                : `${range[0]}-${range[1]}/${total}`,
                        size: window.innerWidth < 768 ? 'small' : 'default'
                    }}
                    onChange={handleTableChange}
                    rowKey="_id"
                    scroll={{ x: window.innerWidth < 768 ? 800 : 1400 }}
                    size={window.innerWidth < 768 ? 'small' : 'default'}
                />
            </Card>

            {/* Detail Drawer removed - no longer needed */}
        </div>
    )
}

export default TransactionHistory