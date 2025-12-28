import React, { useState, useEffect } from 'react'
import {
  Card,
  Steps,
  Typography,
  Button,
  Space,
  Tag,
  Timeline,
  Alert,
  Spin,
  Row,
  Col,
  Image,
  Divider
} from 'antd'
import {
  TruckOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import { SHIPPING_STATUS } from '../../constants/shipping'
import shippingService from '../../services/shippingService'

const { Title, Text, Paragraph } = Typography

const TrackingStatus = ({ trackingCode, autoRefresh = false, refreshInterval = 30000 }) => {
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (trackingCode) {
      loadTrackingData()
    }
  }, [trackingCode])

  useEffect(() => {
    if (autoRefresh && trackingCode) {
      const interval = setInterval(() => {
        refreshTrackingData()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, trackingCode, refreshInterval])

  const loadTrackingData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await shippingService.trackShippingOrder(trackingCode)
      
      if (response.success) {
        setTrackingData(response.data)
      }
    } catch (err) {
      console.error('Error loading tracking data:', err)
      setError('Không thể tải thông tin vận chuyển. Vui lòng kiểm tra lại mã vận đơn.')
    } finally {
      setLoading(false)
    }
  }

  const refreshTrackingData = async () => {
    try {
      setRefreshing(true)
      const response = await shippingService.trackShippingOrder(trackingCode)
      
      if (response.success) {
        setTrackingData(response.data)
      }
    } catch (err) {
      console.error('Error refreshing tracking data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusConfig = (status) => {
    return Object.values(SHIPPING_STATUS).find(s => s.code === status) || {
      code: status,
      label: status,
      color: 'default',
      description: ''
    }
  }

  const getStepStatus = (eventStatus, currentStatus) => {
    const statusOrder = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
    const currentIndex = statusOrder.indexOf(currentStatus)
    const eventIndex = statusOrder.indexOf(eventStatus)

    if (eventIndex < currentIndex) return 'finish'
    if (eventIndex === currentIndex) return 'process'
    return 'wait'
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải thông tin vận chuyển...</div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadTrackingData}>
              Thử lại
            </Button>
          }
        />
      </Card>
    )
  }

  if (!trackingData) {
    return (
      <Card>
        <Alert
          message="Không tìm thấy thông tin"
          description="Không tìm thấy thông tin vận chuyển cho mã vận đơn này."
          type="warning"
          showIcon
        />
      </Card>
    )
  }

  const statusConfig = getStatusConfig(trackingData.status)

  return (
    <div>
      {/* Header with tracking info */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="start" size="large">
              <div>
                <Text type="secondary">Mã vận đơn</Text>
                <Title level={4} copyable style={{ margin: 0 }}>
                  {trackingData.tracking_code}
                </Title>
              </div>
              
              <div>
                <Text type="secondary">Đơn vị vận chuyển</Text>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                  <Image
                    src={`/shipping-logos/${trackingData.provider_id}.png`}
                    alt={trackingData.provider_name}
                    width={40}
                    height={30}
                    fallback="/placeholder-logo.png"
                    preview={false}
                    style={{ objectFit: 'contain', marginRight: 8 }}
                  />
                  <Text strong>{trackingData.provider_name}</Text>
                </div>
              </div>

              <div>
                <Text type="secondary">Trạng thái</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag 
                    color={statusConfig.color} 
                    icon={
                      statusConfig.code === 'delivered' ? <CheckCircleOutlined /> :
                      statusConfig.code === 'delivery_failed' ? <ExclamationCircleOutlined /> :
                      <ClockCircleOutlined />
                    }
                  >
                    {statusConfig.label}
                  </Tag>
                </div>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Button 
                icon={<LinkOutlined />} 
                href={trackingData.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tra cứu trên web
              </Button>
              <Button 
                icon={<TruckOutlined />} 
                onClick={refreshTrackingData} 
                loading={refreshing}
              >
                Cập nhật
              </Button>
            </Space>
          </Col>
        </Row>

        {trackingData.current_location && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message={
                <Space>
                  <EnvironmentOutlined />
                  <Text>Vị trí hiện tại: {trackingData.current_location}</Text>
                </Space>
              }
              type="info"
              showIcon={false}
            />
          </div>
        )}
      </Card>

      {/* Progress Steps */}
      <Card title="Tiến trình vận chuyển" style={{ marginBottom: 16 }}>
        <Steps
          current={['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].indexOf(trackingData.status)}
          status={trackingData.status === 'delivery_failed' ? 'error' : undefined}
        >
          <Steps.Step 
            title="Đã tạo đơn" 
            description="Đơn hàng được tạo"
            icon={<ClockCircleOutlined />}
          />
          <Steps.Step 
            title="Đã lấy hàng" 
            description="Đã lấy hàng từ kho"
            icon={<TruckOutlined />}
          />
          <Steps.Step 
            title="Đang vận chuyển" 
            description="Đang trên đường giao"
            icon={<TruckOutlined />}
          />
          <Steps.Step 
            title="Đang giao hàng" 
            description="Shipper đang giao"
            icon={<TruckOutlined />}
          />
          <Steps.Step 
            title="Đã giao hàng" 
            description="Giao hàng thành công"
            icon={<CheckCircleOutlined />}
          />
        </Steps>

        {trackingData.estimated_delivery && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Text type="secondary">
              Dự kiến giao hàng: <Text strong>{trackingData.estimated_delivery}</Text>
            </Text>
          </div>
        )}
      </Card>

      {/* Timeline Events */}
      <Card title="Lịch sử vận chuyển">
        <Timeline mode="left">
          {trackingData.events.map((event, index) => {
            const eventStatusConfig = getStatusConfig(event.status)
            return (
              <Timeline.Item
                key={index}
                color={eventStatusConfig.color}
                label={
                  <div style={{ textAlign: 'right' }}>
                    <div>{event.time}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {event.location}
                    </Text>
                  </div>
                }
              >
                <div>
                  <Text strong>{event.description}</Text>
                  <br />
                  <Tag size="small" color={eventStatusConfig.color}>
                    {eventStatusConfig.label}
                  </Tag>
                </div>
              </Timeline.Item>
            )
          })}
        </Timeline>

        {trackingData.events.length === 0 && (
          <Alert
            message="Chưa có thông tin vận chuyển"
            description="Đơn hàng vừa được tạo, vui lòng kiểm tra lại sau."
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  )
}

export default TrackingStatus