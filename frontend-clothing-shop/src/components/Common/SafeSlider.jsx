import { Slider } from 'antd'
import { useRef, useEffect } from 'react'

/**
 * SafeSlider - Wrapper để tránh getBoundingClientRect errors
 * Đây là defensive component để handle errors từ drag operations
 */
const SafeSlider = ({ onAfterChange, onChangeComplete, onChange, ...props }) => {
    const sliderRef = useRef(null)

    // Lightweight handlers without heavy processing
    const safeOnChange = (value) => {
        if (onChange && typeof onChange === 'function') {
            onChange(value)
        }
    }

    const safeOnChangeComplete = (value) => {
        if (onChangeComplete && typeof onChangeComplete === 'function') {
            onChangeComplete(value)
        } else if (onAfterChange && typeof onAfterChange === 'function') {
            onAfterChange(value)
        }
    }

    // Minimal error handling - just for critical errors
    useEffect(() => {
        const handleError = (event) => {
            if (event.error?.message?.includes('getBoundingClientRect')) {
                event.preventDefault()
                return false
            }
        }

        window.addEventListener('error', handleError)
        return () => window.removeEventListener('error', handleError)
    }, [])

    return (
        <div ref={sliderRef} style={{ position: 'relative' }}>
            <Slider
                {...props}
                onChange={safeOnChange}
                onChangeComplete={safeOnChangeComplete}
                getTooltipContainer={() => sliderRef.current || document.body}
            />
        </div>
    )
}

export default SafeSlider