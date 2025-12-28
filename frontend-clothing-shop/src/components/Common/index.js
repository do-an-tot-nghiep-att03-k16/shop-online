// Common Components Barrel Export
export { default as CouponInput } from './CouponInput'
export { default as ErrorBoundary } from './ErrorBoundary'
export { default as LoadingSpinner } from './LoadingSpinner'
export { default as ProductCardSkeleton } from './ProductCardSkeleton'
export { default as SafeSlider } from './SafeSlider'
export { default as SmoothTransition } from './SmoothTransition'
export { default as CartButton } from './CartButton'
export { default as ChatWidget } from './ChatWidget'

// Usage examples:
// import { LoadingSpinner, ErrorBoundary, CartButton } from '../components/Common'
// 
// <LoadingSpinner size="large" text="Đang tải dữ liệu..." />
// <ErrorBoundary><YourComponent /></ErrorBoundary>
// <CartButton product={product} showModal={true} />