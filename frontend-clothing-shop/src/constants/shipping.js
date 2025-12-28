// Shipping providers configuration
export const SHIPPING_PROVIDERS = {
  GIAO_HANG_NHANH: {
    id: 'ghn',
    name: 'Giao Hàng Nhanh',
    code: 'GHN',
    logo: '/shipping-logos/ghn.png',
    description: 'Giao hàng nhanh chóng, an toàn',
    tracking_url: 'https://tracking.ghn.vn/tracking/',
    api_endpoint: 'https://dev-online-gateway.ghn.vn',
    features: ['cod', 'insurance', 'tracking'],
    delivery_time: '1-3 ngày',
    coverage: 'Toàn quốc'
  },
  GIAO_HANG_TIET_KIEM: {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm',
    code: 'GHTK',
    logo: '/shipping-logos/ghtk.png',
    description: 'Tiết kiệm chi phí vận chuyển',
    tracking_url: 'https://khachhang.giaohangtietkiem.vn/khachhang/tra-cuu',
    api_endpoint: 'https://services.giaohangtietkiem.vn',
    features: ['cod', 'tracking'],
    delivery_time: '2-5 ngày',
    coverage: 'Toàn quốc'
  },
  VIETTEL_POST: {
    id: 'vtp',
    name: 'Viettel Post',
    code: 'VTP',
    logo: '/shipping-logos/vtp.png',
    description: 'Dịch vụ bưu chính uy tín',
    tracking_url: 'https://viettelpost.com.vn/tra-cuu',
    api_endpoint: 'https://api.viettelpost.vn',
    features: ['cod', 'insurance', 'tracking'],
    delivery_time: '2-4 ngày',
    coverage: 'Toàn quốc'
  },
  VNPOST: {
    id: 'vnpost',
    name: 'VNPost',
    code: 'VNPOST',
    logo: '/shipping-logos/vnpost.png',
    description: 'Bưu điện Việt Nam',
    tracking_url: 'https://www.vnpost.vn/vi-vn/dinh-vi/buu-pham',
    api_endpoint: 'https://donhang.vnpost.vn',
    features: ['cod', 'tracking'],
    delivery_time: '3-7 ngày',
    coverage: 'Toàn quốc'
  },
  J_T_EXPRESS: {
    id: 'jtx',
    name: 'J&T Express',
    code: 'JTX',
    logo: '/shipping-logos/jt.png',
    description: 'Vận chuyển nhanh chóng',
    tracking_url: 'https://www.jtexpress.vn/track',
    api_endpoint: 'https://api.jtexpress.com.vn',
    features: ['cod', 'tracking'],
    delivery_time: '1-3 ngày',
    coverage: 'Toàn quốc'
  },
  SHOPEE_EXPRESS: {
    id: 'spx',
    name: 'Shopee Express',
    code: 'SPX',
    logo: '/shipping-logos/spx.png',
    description: 'Giao hàng tiêu chuẩn Shopee',
    tracking_url: 'https://spx.vn/tracking',
    api_endpoint: 'https://api.shopee.vn/logistics',
    features: ['cod', 'tracking'],
    delivery_time: '2-4 ngày',
    coverage: 'Toàn quốc'
  },
  NHAT_TIN_LOGISTICS: {
    id: 'ntx',
    name: 'Nhật Tín Logistics',
    code: 'NTX',
    logo: '/shipping-logos/ntx.png',
    description: 'Dịch vụ logistics chuyên nghiệp',
    tracking_url: 'https://www.nhattinlogistics.com/tracking',
    api_endpoint: 'https://api.nhattinlogistics.com',
    features: ['cod', 'insurance', 'tracking'],
    delivery_time: '1-4 ngày',
    coverage: 'Toàn quốc'
  }
}

// Shipping status mapping
export const SHIPPING_STATUS = {
  PENDING: {
    code: 'pending',
    label: 'Chờ xử lý',
    color: 'orange',
    description: 'Đơn hàng đang chờ xử lý'
  },
  PICKED_UP: {
    code: 'picked_up',
    label: 'Đã lấy hàng',
    color: 'blue',
    description: 'Hàng đã được lấy từ kho'
  },
  IN_TRANSIT: {
    code: 'in_transit',
    label: 'Đang vận chuyển',
    color: 'cyan',
    description: 'Đang trên đường giao hàng'
  },
  OUT_FOR_DELIVERY: {
    code: 'out_for_delivery',
    label: 'Đang giao hàng',
    color: 'geekblue',
    description: 'Shipper đang giao hàng'
  },
  DELIVERED: {
    code: 'delivered',
    label: 'Đã giao hàng',
    color: 'green',
    description: 'Giao hàng thành công'
  },
  DELIVERY_FAILED: {
    code: 'delivery_failed',
    label: 'Giao hàng thất bại',
    color: 'red',
    description: 'Không thể giao hàng'
  },
  RETURNED: {
    code: 'returned',
    label: 'Hàng trả lại',
    color: 'magenta',
    description: 'Hàng đã được trả lại'
  },
  CANCELLED: {
    code: 'cancelled',
    label: 'Đã hủy',
    color: 'red',
    description: 'Đơn vận chuyển đã bị hủy'
  }
}

// Default shipping fees by provider (VND)
export const DEFAULT_SHIPPING_FEES = {
  [SHIPPING_PROVIDERS.GIAO_HANG_NHANH.id]: {
    base_fee: 25000,
    per_km: 2000,
    insurance_rate: 0.005 // 0.5%
  },
  [SHIPPING_PROVIDERS.GIAO_HANG_TIET_KIEM.id]: {
    base_fee: 20000,
    per_km: 1500,
    insurance_rate: 0.003 // 0.3%
  },
  [SHIPPING_PROVIDERS.VIETTEL_POST.id]: {
    base_fee: 22000,
    per_km: 1800,
    insurance_rate: 0.004 // 0.4%
  },
  [SHIPPING_PROVIDERS.VNPOST.id]: {
    base_fee: 18000,
    per_km: 1200,
    insurance_rate: 0.002 // 0.2%
  },
  [SHIPPING_PROVIDERS.J_T_EXPRESS.id]: {
    base_fee: 23000,
    per_km: 1700,
    insurance_rate: 0.003 // 0.3%
  },
  [SHIPPING_PROVIDERS.SHOPEE_EXPRESS.id]: {
    base_fee: 21000,
    per_km: 1600,
    insurance_rate: 0.003 // 0.3%
  },
  [SHIPPING_PROVIDERS.NHAT_TIN_LOGISTICS.id]: {
    base_fee: 26000,
    per_km: 2200,
    insurance_rate: 0.006 // 0.6%
  }
}

export default {
  SHIPPING_PROVIDERS,
  SHIPPING_STATUS,
  DEFAULT_SHIPPING_FEES
}