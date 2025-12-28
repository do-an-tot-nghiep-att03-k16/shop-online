/**
 * Advanced error suppression for drag/drop libraries
 */

// Create a more aggressive error interceptor
export const suppressDragErrors = () => {
    // Override console.error temporarily for useDrag errors
    const originalError = console.error
    console.error = (...args) => {
        const message = args[0]?.toString() || ''
        if (message.includes('getBoundingClientRect') || 
            message.includes('useDrag.js') ||
            message.includes('Cannot read properties of null')) {
            // Log as warning instead
            console.warn('🔇 Suppressed drag error:', ...args)
            return
        }
        // Call original console.error for other errors
        originalError.apply(console, args)
    }

    // More aggressive error event interception
    const errorHandler = (event) => {
        const error = event.error || event.reason
        if (error?.message?.includes('getBoundingClientRect') ||
            error?.stack?.includes('useDrag.js') ||
            error?.message?.includes('Cannot read properties of null')) {
            event.preventDefault()
            event.stopImmediatePropagation()
            console.warn('🔇 Intercepted and suppressed drag error:', error.message)
            return false
        }
    }

    // Add multiple error listeners
    window.addEventListener('error', errorHandler, true)
    window.addEventListener('unhandledrejection', errorHandler, true)
    document.addEventListener('error', errorHandler, true)

    // Return cleanup function
    return () => {
        console.error = originalError
        window.removeEventListener('error', errorHandler, true)
        window.removeEventListener('unhandledrejection', errorHandler, true)  
        document.removeEventListener('error', errorHandler, true)
    }
}

export default suppressDragErrors