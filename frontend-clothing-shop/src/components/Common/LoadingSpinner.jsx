import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

/**
 * LoadingSpinner - Reusable loading component
 * @param {Object} props
 * @param {string} props.size - Size: 'small', 'default', 'large'
 * @param {string} props.text - Loading text
 * @param {boolean} props.spinning - Whether to show spinner
 * @param {React.ReactNode} props.children - Content to wrap (optional)
 * @param {string} props.tip - Tooltip text for spinner
 */
const LoadingSpinner = ({
    size = 'default',
    text = '',
    spinning = true,
    children,
    tip = 'Đang tải...',
    ...props
}) => {
    // Custom spinner icon
    const antIcon = <LoadingOutlined style={{ fontSize: getSizeValue(size) }} spin />

    // If children provided, wrap them with spinner
    if (children) {
        return (
            <Spin
                spinning={spinning}
                indicator={antIcon}
                tip={tip}
                size={size}
                {...props}
            >
                {children}
            </Spin>
        )
    }

    // Standalone spinner
    return (
        <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Spin
                spinning={spinning}
                indicator={antIcon}
                size={size}
                {...props}
            />
            {(text || tip) && (
                <div style={{ marginTop: '8px', color: '#666' }}>
                    {text || tip}
                </div>
            )}
        </div>
    )
}

// Helper function to get icon size
const getSizeValue = (size) => {
    const sizeMap = {
        small: 14,
        default: 24,
        large: 32
    }
    return sizeMap[size] || 24
}

export default LoadingSpinner