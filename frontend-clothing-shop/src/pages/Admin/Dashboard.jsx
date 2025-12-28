import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, Statistic, message, Spin } from 'antd'
import {
    UserOutlined,
    ShoppingOutlined,
    DollarOutlined,
    LineChartOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../services/api'
// import { Line } from '@ant-design/plots'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts'

const { Title } = Typography

function Dashboard() {
    // Fetch dashboard stats với error handling an toàn
    const {
        data: dashboardStats,
        isLoading: statsLoading,
        error: statsError,
    } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: analyticsAPI.getDashboardStats,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Fetch revenue chart data
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['revenue-analytics'],
        queryFn: analyticsAPI.getRevenueAnalytics,
        retry: 1,
        staleTime: 5 * 60 * 1000,
    })

    // Fetch order status distribution
    const { data: orderStatusData, isLoading: orderStatusLoading } = useQuery({
        queryKey: ['order-status-distribution'],
        queryFn: analyticsAPI.getOrderStatusDistribution,
        retry: 1,
        staleTime: 5 * 60 * 1000,
    })

    // Handle error
    useEffect(() => {
        if (statsError) {
            console.error('Dashboard stats error:', statsError)
            message.error('Không thể tải dữ liệu thống kê')
        }
    }, [statsError])

    // Debug data structure
    // useEffect(() => {
    //     if (dashboardStats) {
    //         console.log('Dashboard Stats:', dashboardStats)
    //         console.log(
    //             'Conversion Rate:',
    //             dashboardStats?.metadata?.conversionRate
    //         )
    //     }
    //     if (orderStatusData) {
    //         console.log('Order Status Data:', orderStatusData)
    //     }
    // }, [dashboardStats, orderStatusData])

    // Test data for pie chart if needed
    const testOrderStatusData = [
        { name: 'Hoàn thành', count: 5, color: '#52c41a' },
        { name: 'Đang xử lý', count: 3, color: '#1890ff' },
        { name: 'Đã hủy', count: 2, color: '#f5222d' },
    ]

    // Safely extract data with fallbacks
    const stats = dashboardStats?.metadata
        ? [
              {
                  title: 'Tổng Users (30 ngày)',
                  value: dashboardStats.metadata.totalUsers?.value || 0,
                  change: dashboardStats.metadata.totalUsers?.change || 0,
                  icon: (
                      <UserOutlined
                          style={{ fontSize: 24, color: '#1890ff' }}
                      />
                  ),
                  color: '#e6f7ff',
              },
              {
                  title: 'Đơn hàng hôm nay',
                  value: dashboardStats.metadata.ordersToday?.value || 0,
                  change: dashboardStats.metadata.ordersToday?.change || 0,
                  icon: (
                      <ShoppingOutlined
                          style={{ fontSize: 24, color: '#52c41a' }}
                      />
                  ),
                  color: '#f6ffed',
              },
              {
                  title: 'Doanh thu tháng',
                  value: dashboardStats.metadata.monthlyRevenue?.value || 0,
                  change: dashboardStats.metadata.monthlyRevenue?.change || 0,
                  icon: (
                      <DollarOutlined
                          style={{ fontSize: 24, color: '#faad14' }}
                      />
                  ),
                  color: '#fffbe6',
                  prefix: '₫',
              },
              {
                  title: 'Tỉ lệ mua hàng',
                  value: parseFloat(
                      dashboardStats.metadata.conversionRate?.value || 0
                  ),
                  change: dashboardStats.metadata.conversionRate?.change || 0,
                  icon: (
                      <LineChartOutlined
                          style={{ fontSize: 24, color: '#f5222d' }}
                      />
                  ),
                  color: '#fff1f0',
                  suffix: '%',
              },
          ]
        : []

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Dashboard</Title>

            {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: '16px' }}>Đang tải dữ liệu...</p>
                </div>
            ) : (
                <Row gutter={[16, 16]}>
                    {stats.length > 0
                        ? stats.map((stat, index) => (
                              <Col xs={12} sm={12} md={6} lg={6} key={index}>
                                  <Card
                                      style={{
                                          backgroundColor: stat.color,
                                          height: '100%',
                                      }}
                                      bodyStyle={{
                                          padding: 'clamp(12px, 3vw, 20px)',
                                      }}
                                  >
                                      <div
                                          style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                          }}
                                      >
                                          <div>
                                              <Statistic
                                                  title={stat.title}
                                                  value={stat.value}
                                                  prefix={stat.prefix}
                                                  suffix={stat.suffix}
                                                  valueStyle={{
                                                      fontSize:
                                                          'clamp(18px, 4vw, 24px)',
                                                      fontWeight: 'bold',
                                                  }}
                                              />
                                              {stat.change !== undefined && (
                                                  <div
                                                      style={{
                                                          color:
                                                              stat.change >= 0
                                                                  ? '#52c41a'
                                                                  : '#f5222d',
                                                          fontSize: '14px',
                                                          marginTop: '8px',
                                                      }}
                                                  >
                                                      {stat.change >= 0
                                                          ? '↗'
                                                          : '↘'}{' '}
                                                      {Math.abs(stat.change)}%
                                                  </div>
                                              )}
                                          </div>
                                          <div>{stat.icon}</div>
                                      </div>
                                  </Card>
                              </Col>
                          ))
                        : // Fallback khi không có dữ liệu
                          [
                              'Total Users',
                              'Orders Today',
                              'Monthly Revenue',
                              'Conversion Rate',
                          ].map((title, index) => (
                              <Col xs={12} sm={12} md={6} lg={6} key={index}>
                                  <Card
                                      title={title}
                                      style={{ height: '100%' }}
                                      bodyStyle={{
                                          padding: 'clamp(12px, 3vw, 24px)',
                                      }}
                                  >
                                      <p
                                          style={{
                                              margin: 0,
                                              fontSize:
                                                  'clamp(12px, 3vw, 14px)',
                                          }}
                                      >
                                          Không có dữ liệu
                                      </p>
                                  </Card>
                              </Col>
                          ))}
                </Row>
            )}

            {/* Charts Section */}
            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                {/* Revenue Chart */}
                <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                    <Card
                        title="📈 Doanh thu theo thời gian"
                        loading={revenueLoading}
                    >
                        {revenueData?.metadata ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData.metadata}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) =>
                                            new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                                notation: 'compact',
                                            }).format(value)
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value, name) => [
                                            new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(value),
                                            'Doanh thu',
                                        ]}
                                        labelFormatter={(label) =>
                                            `Ngày: ${label}`
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#1890ff"
                                        strokeWidth={2}
                                        dot={{ fill: '#1890ff', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div
                                style={{ textAlign: 'center', padding: '50px' }}
                            >
                                <p>Chưa có dữ liệu doanh thu</p>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Order Status Pie Chart */}
                <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <Card
                        title="Phân bố trạng thái đơn hàng"
                        loading={orderStatusLoading}
                    >
                        {orderStatusData?.metadata &&
                        orderStatusData.metadata.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={orderStatusData.metadata}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, value, percent }) =>
                                            `${name}: ${(percent * 100).toFixed(
                                                1
                                            )}%`
                                        }
                                    >
                                        {orderStatusData.metadata.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            )
                                        )}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [
                                            `${value} đơn hàng`,
                                            name,
                                        ]}
                                    />
                                    <Legend
                                        formatter={(value, entry) => (
                                            <span
                                                style={{ color: entry.color }}
                                            >
                                                {value} ({entry.payload.value}{' '}
                                                đơn)
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            // Fallback: Hiển thị test data hoặc empty state
                            <div>
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '20px',
                                    }}
                                >
                                    <p
                                        style={{
                                            color: '#999',
                                            marginBottom: '16px',
                                        }}
                                    >
                                        Chưa có dữ liệu thực - Hiển thị demo
                                    </p>
                                </div>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={testOrderStatusData.map(
                                                (item) => ({
                                                    name: item.name,
                                                    value: item.count,
                                                    color: item.color,
                                                })
                                            )}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={70}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, value, percent }) =>
                                                `${name}: ${(
                                                    percent * 100
                                                ).toFixed(1)}%`
                                            }
                                        >
                                            {testOrderStatusData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [
                                                `${value} đơn hàng (demo)`,
                                                name,
                                            ]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Dashboard
