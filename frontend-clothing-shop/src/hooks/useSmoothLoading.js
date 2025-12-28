import { useState, useEffect } from 'react'

/**
 * Hook để tạo smooth loading experience
 * @param {boolean} isLoading - Loading state từ API
 * @param {number} minLoadTime - Thời gian minimum hiển thị loading (ms)
 * @param {number} fadeDelay - Delay trước khi fade in content (ms)
 */
export const useSmoothLoading = (isLoading, minLoadTime = 300, fadeDelay = 100) => {
    const [showLoading, setShowLoading] = useState(isLoading)
    const [showContent, setShowContent] = useState(false)
    const [contentReady, setContentReady] = useState(false)

    useEffect(() => {
        if (isLoading) {
            setShowLoading(true)
            setShowContent(false)
            setContentReady(false)
        } else {
            // Content is ready, but wait for min load time
            setTimeout(() => {
                setShowLoading(false)
                // Small delay before showing content to prevent flash
                setTimeout(() => {
                    setContentReady(true)
                    setTimeout(() => {
                        setShowContent(true)
                    }, fadeDelay)
                }, 50)
            }, minLoadTime)
        }
    }, [isLoading, minLoadTime, fadeDelay])

    return {
        showLoading,
        showContent,
        contentReady
    }
}

export default useSmoothLoading