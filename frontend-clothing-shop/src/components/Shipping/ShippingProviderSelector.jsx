import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Radio, 
  Space, 
  Typography, 
  Tag, 
  Image, 
  Spin, 
  Alert,
  Row,
  Col,
  Tooltip
} from 'antd'
import { 
  TruckOutlined, 
  ClockCircleOutlined, 
  SafetyOutlined,
  DollarOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import shippingService from '../../services/shippingService'
import { formatPrice } from '../../utils/priceUtils'

const { Text, Title } = Typography

const ShippingProviderSelector = ({ 
  onProviderSelect, 
  selectedProvider, 
  shippingAddress, 
  orderValue = 0,
  orderWeight = 1 
}) => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculatingFees, setCalculatingFees] = useState({})
  const [shippingFees, setShippingFees] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    if (providers.length > 0 && shippingAddress) {
      calculateFeesForAllProviders()
    }
  }, [providers, shippingAddress, orderValue, orderWeight])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const response = await shippingService.getShippingProviders()
      
      if (response.success) {
        setProviders(response.data)
      }
    } catch (err) {
      console.error('Error loading shipping providers:', err)
      setError('Không thể tải danh sách đơn vị vận chuyển')
    } finally {
      setLoading(false)
    }
  }

  const calculateFeesForAllProviders = async () => {
    for (const provider of providers) {
      await calculateShippingFee(provider.id)
    }
  }

  const calculateShippingFee = async (providerId) => {
    try {
      setCalculatingFees(prev => ({ ...prev, [providerId]: true }))

      const shippingData = {
        provider_id: providerId,
        to_address: shippingAddress,
        weight: orderWeight,
        order_value: orderValue,
        insurance: orderValue > 1000000 // Auto-insurance for orders > 1M VND
      }

      const response = await shippingService.calculateShippingFee(shippingData)
      
      if (response.success) {
        setShippingFees(prev => ({ 
          ...prev, 
          [providerId]: response.data 
        }))
      }
    } catch (err) {
      console.error(`Error calculating fee for provider ${providerId}:`, err)
      setShippingFees(prev => ({ 
        ...prev, 
        [providerId]: { error: 'Không thể tính phí vận chuyển' }
      }))
    } finally {
      setCalculatingFees(prev => ({ ...prev, [providerId]: false }))
    }
  }

  const handleProviderSelect = (providerId) => {
    const provider = providers.find(p => p.id === providerId)
    const fee = shippingFees[providerId]
    
    if (provider && fee && !fee.error) {
      onProviderSelect({
        provider,
        fee
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải đơn vị vận chuyển...</div>
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
        />
      </Card>
    )
  }

  return (
    <Card title={<><TruckOutlined /> Chọn đơn vị vận chuyển</>}>
      <Radio.Group 
        value={selectedProvider?.provider?.id} 
        onChange={(e) => handleProviderSelect(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {providers.map((provider) => {
            const fee = shippingFees[provider.id]
            const isCalculating = calculatingFees[provider.id]
            const isDisabled = !fee || fee.error || isCalculating

            return (
              <Card 
                key={provider.id}
                size="small"
                hoverable={!isDisabled}
                className={`shipping-provider-card ${selectedProvider?.provider?.id === provider.id ? 'selected' : ''}`}
                style={{ 
                  border: selectedProvider?.provider?.id === provider.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  opacity: isDisabled ? 0.7 : 1
                }}
              >
                <Radio 
                  value={provider.id} 
                  disabled={isDisabled}
                  style={{ width: '100%' }}
                >
                  <Row align="middle" gutter={16}>
                    <Col span={4}>
                      <Image
                        src={provider.logo}
                        alt={provider.name}
                        width={60}
                        height={40}
                        fallback="/placeholder-logo.png"
                        preview={false}
                        style={{ objectFit: 'contain' }}
                      />
                    </Col>
                    
                    <Col span={12}>
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {provider.name}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {provider.description}
                        </Text>
                        
                        <div style={{ marginTop: 4 }}>
                          <Space size="small" wrap>
                            <Tag icon={<ClockCircleOutlined />} color="blue">
                              {provider.delivery_time}
                            </Tag>
                            <Tag icon={<GlobalOutlined />} color="green">
                              {provider.coverage}
                            </Tag>
                            {provider.features.includes('insurance') && (
                              <Tooltip title="Bảo hiểm hàng hóa">
                                <Tag icon={<SafetyOutlined />} color="orange">
                                  Bảo hiểm
                                </Tag>
                              </Tooltip>
                            )}
                          </Space>
                        </div>
                      </div>
                    </Col>
                    
                    <Col span={8} style={{ textAlign: 'right' }}>
                      {isCalculating ? (
                        <div>
                          <Spin size="small" />
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            Đang tính phí...
                          </div>
                        </div>
                      ) : fee && !fee.error ? (
                        <div>
                          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                            {formatPrice(fee.total_fee)}
                          </Title>
                          {fee.insurance_fee > 0 && (
                            <Text style={{ fontSize: 12 }} type="secondary">
                              (Bao gồm bảo hiểm: {formatPrice(fee.insurance_fee)})
                            </Text>
                          )}
                        </div>
                      ) : fee && fee.error ? (
                        <Text type="danger" style={{ fontSize: 12 }}>
                          {fee.error}
                        </Text>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Chọn địa chỉ để tính phí
                        </Text>
                      )}
                    </Col>
                  </Row>
                </Radio>
              </Card>
            )
          })}
        </Space>
      </Radio.Group>
      
      {!shippingAddress && (
        <Alert
          message="Vui lòng nhập địa chỉ giao hàng để tính phí vận chuyển"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  )
}

export default ShippingProviderSelector