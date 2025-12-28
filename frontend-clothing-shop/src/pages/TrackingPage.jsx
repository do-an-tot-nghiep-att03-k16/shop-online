import React from 'react'
import { useParams } from 'react-router-dom'
import { Typography } from 'antd'
import ShippingTracker from '../components/Shipping/ShippingTracker'
import TrackingStatus from '../components/Shipping/TrackingStatus'

const { Title } = Typography

const TrackingPage = () => {
  const { trackingCode } = useParams()

  return (
    <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>Theo dõi đơn hàng</Title>
      
      {trackingCode ? (
        <TrackingStatus 
          trackingCode={trackingCode} 
          autoRefresh={true}
          refreshInterval={30000}
        />
      ) : (
        <ShippingTracker />
      )}
    </div>
  )
}

export default TrackingPage