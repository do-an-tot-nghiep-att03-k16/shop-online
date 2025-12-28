import { Component } from 'react'
import { Result, Button } from 'antd'
import { FrownOutlined } from '@ant-design/icons'

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * Used to prevent entire app from crashing due to component errors
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo)
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        })

        // You can also log the error to an error reporting service here
        // logErrorToService(error, errorInfo)
    }

    handleRetry = () => {
        // Reset error state to try rendering again
        this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null 
        })
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <Result
                        icon={<FrownOutlined />}
                        title="Oops! Đã có lỗi xảy ra"
                        subTitle={
                            this.props.showDetails && this.state.error
                                ? `Lỗi: ${this.state.error.message}`
                                : 'Có lỗi không mong muốn đã xảy ra. Vui lòng thử lại.'
                        }
                        extra={[
                            <Button 
                                type="primary" 
                                onClick={this.handleRetry}
                                key="retry"
                            >
                                Thử lại
                            </Button>,
                            <Button 
                                onClick={() => window.location.reload()}
                                key="reload"
                            >
                                Tải lại trang
                            </Button>
                        ]}
                    />
                    
                    {/* Show error details in development */}
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <details style={{ 
                            marginTop: 20, 
                            padding: 10, 
                            background: '#f5f5f5',
                            borderRadius: 4,
                            textAlign: 'left',
                            fontSize: '12px',
                            color: '#666'
                        }}>
                            <summary>Chi tiết lỗi (development only)</summary>
                            <pre>{this.state.error && this.state.error.stack}</pre>
                            <pre>{this.state.errorInfo.componentStack}</pre>
                        </details>
                    )}
                </div>
            )
        }

        // If no error, render children normally
        return this.props.children
    }
}

export default ErrorBoundary