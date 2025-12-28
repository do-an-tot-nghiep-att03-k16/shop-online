import React, { useState } from 'react';
import { message, Modal } from 'antd';
import { useCouponByCode } from '../../hooks/useCoupons';

/**
 * Component hiển thị các coupons được featured từ CMS
 */
const FeaturedCouponsSection = ({ featuredCoupons, loading }) => {
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  
  // Use hook to fetch coupon details
  const { 
    data: couponDetails, 
    isLoading: detailsLoading,
    error: detailsError 
  } = useCouponByCode(selectedCoupon?.code);

  const handleCopyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      message.success(`Đã sao chép mã giảm giá: ${code}`);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } catch (error) {
      message.error('Không thể sao chép mã giảm giá');
    }
  };

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `${coupon.discount_value?.toLocaleString()}đ`;
  };

  const formatMinOrder = (minValue) => {
    if (!minValue || minValue === 0) return 'Không giới hạn';
    return `Đơn tối thiểu ${minValue.toLocaleString()}đ`;
  };

  // Format apply type based on apply_type field and applicable arrays
  const formatApplyType = (coupon) => {
    if (coupon.apply_type === 'all') {
      return 'Áp dụng cho tất cả sản phẩm';
    }
    
    const hasCategories = coupon.applicable_categories && coupon.applicable_categories.length > 0;
    const hasProducts = coupon.applicable_products && coupon.applicable_products.length > 0;
    
    if (hasCategories && hasProducts) {
      return 'Áp dụng cho một số danh mục và sản phẩm';
    } else if (hasCategories) {
      return 'Áp dụng cho một số danh mục';
    } else if (hasProducts) {
      return 'Áp dụng cho một số sản phẩm';
    }
    
    return 'Áp dụng có điều kiện';
  };

  // Handle show coupon details
  const handleShowDetails = (coupon) => {
    setSelectedCoupon(coupon);
    // Hook will automatically fetch details when selectedCoupon changes
  };

  if (loading) {
    return (
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!featuredCoupons?.length) {
    return null;
  }

  return (
    <>
    <section style={{ padding: '48px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Section Header - Left aligned */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1f2937', 
            margin: '0 0 8px 0' 
          }}>
            Mã Giảm Giá
          </h2>
          <p style={{ 
            color: '#6b7280', 
            margin: '0', 
            maxWidth: '512px' 
          }}>
            Ưu đãi đặc biệt dành riêng cho bạn
          </p>
        </div>

        {/* Coupons Grid - Compact horizontal layout */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {featuredCoupons.map((coupon) => (
            <div
              key={coupon._id || coupon.code}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                width: '320px',
                height: '120px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#cbd5e1'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              {/* Top Section: Description + Button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  fontSize: '14px',
                  color: '#000000',
                  margin: '0',
                  lineHeight: '1.4',
                  fontWeight: '400',
                  flex: '1',
                  overflow: 'hidden',
                  textShadow: 'none',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale'
                }}>
                  {coupon.description || 'Ưu đãi đặc biệt'}
                </div>
                
                <button
                  onClick={() => handleShowDetails(coupon)}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.color = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.color = '#64748b';
                  }}
                >
                  Chi tiết
                </button>
              </div>

              {/* Bottom Section: Coupon Code */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                backgroundColor: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px dashed #cbd5e1'
              }}>
                <div style={{ flex: '1', minWidth: '0' }}>
                  <p style={{
                    fontSize: '10px',
                    color: '#64748b',
                    margin: '0 0 2px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Mã giảm giá
                  </p>
                  <p style={{
                    fontFamily: 'SFMono-Regular, Consolas, monospace',
                    fontWeight: '700',
                    fontSize: '13px',
                    color: '#0f172a',
                    letterSpacing: '1px',
                    margin: '0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {coupon.code}
                  </p>
                </div>
                
                <button
                  onClick={() => handleCopyCoupon(coupon.code)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: copiedCode === coupon.code ? '#10b981' : '#3b82f6',
                    color: 'white',
                    flexShrink: 0,
                    minWidth: '60px'
                  }}
                >
                  {copiedCode === coupon.code ? 'OK' : 'Copy'}
                </button>
              </div>

              {/* Source indicator (dev only) */}
              {process.env.NODE_ENV === 'development' && coupon.source === 'cms_fallback' && (
                <div className="absolute top-2 left-2">
                  <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    CMS
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action - Simple */}
        <div style={{ textAlign: 'left', marginTop: '24px' }}>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0'
          }}>
            💡 Áp dụng mã giảm giá khi thanh toán để nhận ưu đãi
          </p>
        </div>
      </div>
    </section>

    {/* Coupon Details Modal */}
    <Modal
      title={null}
      open={selectedCoupon !== null}
      onCancel={() => {
        setSelectedCoupon(null);
      }}
      footer={null}
      width="90%"
      style={{ maxWidth: '480px' }}
      centered
      styles={{
        content: {
          padding: '0',
          borderRadius: '16px',
          overflow: 'hidden'
        }
      }}
    >
      {detailsLoading ? (
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <div>Đang tải thông tin...</div>
          </div>
        </div>
      ) : detailsError ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#ef4444'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div>Không thể tải thông tin chi tiết</div>
        </div>
      ) : couponDetails?.metadata ? (
        <div>
          {/* Header Section */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '24px 24px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '16px'
            }}>
              Mã giảm giá
            </div>
            
            <h2 style={{ 
              margin: '0 0 6px 0',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              {couponDetails.metadata.description}
            </h2>
            
            <div style={{
              fontFamily: 'SFMono-Regular, Consolas, monospace',
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 20px',
              borderRadius: '8px',
              border: '2px dashed rgba(255, 255, 255, 0.3)',
              display: 'inline-block',
              marginTop: '12px'
            }}>
              {couponDetails.metadata.code}
            </div>
          </div>

          {/* Content Section */}
          <div style={{ padding: '24px' }}>
            {/* Discount Highlight */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #0ea5e9'
            }}>
              <div style={{ 
                fontSize: '28px',
                fontWeight: '700',
                color: '#0369a1',
                marginBottom: '4px'
              }}>
                {formatDiscount(couponDetails.metadata)}
              </div>
              <div style={{ color: '#0369a1', fontWeight: '500', fontSize: '14px' }}>
                Giảm giá ngay
              </div>
            </div>

            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0',
                  color: '#1e293b',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  Điều kiện sử dụng
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#475569' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Đơn tối thiểu:</strong> {formatMinOrder(couponDetails.metadata.min_order_value)}
                  </div>
                  {couponDetails.metadata.max_discount && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Giảm tối đa:</strong> {couponDetails.metadata.max_discount.toLocaleString()}đ
                    </div>
                  )}
                  <div>
                    <strong>Phạm vi:</strong> {formatApplyType(couponDetails.metadata)}
                  </div>
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0',
                  color: '#1e293b',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  Thời gian & Giới hạn
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#475569' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Có hiệu lực:</strong><br />
                    {new Date(couponDetails.metadata.start_date).toLocaleDateString('vi-VN')} - {new Date(couponDetails.metadata.end_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Đã sử dụng:</strong> {couponDetails.metadata.used_count}/{couponDetails.metadata.usage_limit}
                  </div>
                  {couponDetails.metadata.usage_limit_per_user && (
                    <div>
                      <strong>Tối đa/người:</strong> {couponDetails.metadata.usage_limit_per_user} lần
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div style={{
              paddingTop: '20px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: couponDetails.metadata.is_active ? '#10b981' : '#ef4444'
                }}></div>
                <span style={{
                  fontWeight: '500',
                  color: couponDetails.metadata.is_active ? '#10b981' : '#ef4444',
                  fontSize: '14px'
                }}>
                  {couponDetails.metadata.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <button
                  onClick={() => handleCopyCoupon(selectedCoupon?.code)}
                  style={{
                    flex: '1',
                    minWidth: '120px',
                    padding: '10px 16px',
                    backgroundColor: copiedCode === selectedCoupon?.code ? '#10b981' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px'
                  }}
                >
                  {copiedCode === selectedCoupon?.code ? '✓ Đã sao chép' : 'Sao chép mã'}
                </button>
                
                <button
                  onClick={() => setSelectedCoupon(null)}
                  style={{
                    flex: '0 0 auto',
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#ef4444'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div>Không thể tải thông tin chi tiết</div>
        </div>
      )}
    </Modal>
    </>
  );
};

export default FeaturedCouponsSection;