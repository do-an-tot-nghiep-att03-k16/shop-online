import React, { useState } from 'react'
import { 
  Card, 
  Input, 
  Button, 
  Form, 
  Alert, 
  Space,
  Typography 
} from 'antd'
import { 
  SearchOutlined, 
  TruckOutlined 
} from '@ant-design/icons'
import TrackingStatus from './TrackingStatus'
import TrackingCodeGenerator from '../../utils/trackingCodeGenerator'

const { Title, Text } = Typography

const ShippingTracker = () => {
  const [form] = Form.useForm()
  const [trackingCode, setTrackingCode] = useState('')
  const [showTracking, setShowTracking] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = (values) => {
    const { tracking_code } = values
    
    if (!tracking_code || !tracking_code.trim()) {
      setError('Vui lòng nhập mã vận đơn')
      return
    }

    // Validate tracking code format
    const provider = TrackingCodeGenerator.getProviderFromCode(tracking_code.trim())
    if (!provider) {
      setError('Mã vận đơn không đúng định dạng hoặc không được hỗ trợ')
      return
    }

    setError('')
    setTrackingCode(tracking_code.trim())
    setShowTracking(true)
  }

  const resetSearch = () => {
    setShowTracking(false)
    setTrackingCode('')
    setError('')
    form.resetFields()
  }

  if (showTracking && trackingCode) {
    return (
      <div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              <TruckOutlined /> Tra cứu vận đơn
            </Title>
            <Button onClick={resetSearch}>
              Tra cứu mã khác
            </Button>
          </div>
        </Card>
        
        <TrackingStatus 
          trackingCode={trackingCode} 
          autoRefresh={true}
          refreshInterval={60000} // Refresh every minute
        />
      </div>
    )
  }

  return (
    <Card title={<><TruckOutlined /> Tra cứu vận đơn</>}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={4}>Nhập mã vận đơn để theo dõi</Title>
          <Text type="secondary">
            Hỗ trợ các đơn vị vận chuyển: GHN, GHTK, Viettel Post, VNPost, J&T Express, Shopee Express, Nhật Tín Logistics
          </Text>
        </div>

        <Form
          form={form}
          onFinish={handleTrack}
          layout="vertical"
        >
          <Form.Item
            name="tracking_code"
            label="Mã vận đơn"
            rules={[
              { required: true, message: 'Vui lòng nhập mã vận đơn' },
              { 
                min: 6, 
                message: 'Mã vận đơn phải có ít nhất 6 ký tự' 
              }
            ]}
          >
            <Input
              placeholder="Nhập mã vận đơn (ví dụ: GHN1234567890)"
              size="large"
              prefix={<SearchOutlined />}
              onPressEnter={() => form.submit()}
            />
          </Form.Item>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item style={{ textAlign: 'center' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              icon={<SearchOutlined />}
            >
              Tra cứu
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24 }}>
          <Alert
            message="Hướng dẫn"
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>• Mã vận đơn thường có 10-15 ký tự</Text>
                <Text>• Bạn có thể tìm mã vận đơn trong email xác nhận đơn hàng</Text>
                <Text>• Nếu không tìm thấy, liên hệ hotline hỗ trợ</Text>
              </Space>
            }
            type="info"
            showIcon
          />
        </div>
      </div>
    </Card>
  )
}

export default ShippingTracker