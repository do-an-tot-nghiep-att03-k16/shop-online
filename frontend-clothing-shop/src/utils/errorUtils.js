/**
 * Error handling utilities
 */

// Global error handler for uncaught errors
export const setupGlobalErrorHandler = () => {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        // Ignore useDrag errors (likely from browser extensions)
        if (event.error?.message?.includes('getBoundingClientRect') ||
            event.error?.stack?.includes('useDrag.js') ||
            event.filename?.includes('useDrag.js')) {
            console.warn('Ignoring useDrag error (likely from browser extension):', event.error)
            event.preventDefault()
            return false
        }
        
        console.error('Global error caught:', event.error)
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason)
    })
}

// Safe component wrapper to prevent crashes
export const withErrorSafety = (Component) => {
    return function SafeComponent(props) {
        try {
            return <Component {...props} />
        } catch (error) {
            console.error('Component error caught:', error)
            return null
        }
    }
}

export default {
    setupGlobalErrorHandler,
    withErrorSafety
}