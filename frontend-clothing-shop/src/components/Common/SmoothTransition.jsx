import { useState, useEffect, useRef } from 'react'
import { Spin } from 'antd'
import './SmoothTransition.css'

/**
 * Enhanced SmoothTransition - Wrapper để tránh flash/chớp tắt khi loading
 * @param {Object} props
 * @param {boolean} props.loading - Loading state
 * @param {React.ReactNode} props.children - Content to render
 * @param {number} props.minLoadTime - Minimum time to show loading (ms)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showSkeletons - Show skeleton loaders instead of spinner
 * @param {number} props.skeletonCount - Number of skeleton items to show
 * @param {boolean} props.preserveHeight - Maintain container height during transitions
 */
const SmoothTransition = ({ 
    loading, 
    children, 
    minLoadTime = 200, // Reduced for better responsiveness
    className = '',
    showSkeletons = false,
    skeletonCount = 6,
    preserveHeight = true,
    ...props 
}) => {
    const [isVisible, setIsVisible] = useState(!loading)
    const [showContent, setShowContent] = useState(!loading)
    const [delayedLoading, setDelayedLoading] = useState(false)
    const containerRef = useRef(null)
    const loadingTimer = useRef(null)
    const contentTimer = useRef(null)

    useEffect(() => {
        // Clear any existing timers
        if (loadingTimer.current) clearTimeout(loadingTimer.current)
        if (contentTimer.current) clearTimeout(contentTimer.current)

        if (loading) {
            // Small delay before showing loading to prevent flicker for fast responses
            loadingTimer.current = setTimeout(() => {
                setDelayedLoading(true)
                setIsVisible(false)
                setShowContent(false)
            }, 150)
        } else {
            setDelayedLoading(false)
            // Show content with smooth transition
            contentTimer.current = setTimeout(() => {
                setShowContent(true)
                setIsVisible(true)
            }, minLoadTime)
        }

        return () => {
            if (loadingTimer.current) clearTimeout(loadingTimer.current)
            if (contentTimer.current) clearTimeout(contentTimer.current)
        }
    }, [loading, minLoadTime])

    // Skeleton loader component
    const SkeletonLoader = () => (
        <div className="skeleton-grid">
            {Array.from({ length: skeletonCount }).map((_, index) => (
                <div key={index} className="product-skeleton" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="product-skeleton-image" />
                    <div className="product-skeleton-title" />
                    <div className="product-skeleton-price" />
                </div>
            ))}
        </div>
    )

    if (loading && delayedLoading) {
        return (
            <div 
                className={`smooth-transition-loading ${className}`}
                ref={containerRef}
                style={preserveHeight ? { minHeight: containerRef.current?.offsetHeight || '400px' } : {}}
            >
                {showSkeletons ? (
                    <SkeletonLoader />
                ) : (
                    <div className="smooth-spinner">
                        <Spin size="large" tip="Đang tải sản phẩm..." />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div 
            className={`smooth-transition-content ${isVisible ? 'visible' : 'hidden'} ${className}`}
            ref={containerRef}
            {...props}
        >
            {showContent ? children : (
                // Keep previous content visible during transition
                loading ? null : children
            )}
        </div>
    )
}

export default SmoothTransition