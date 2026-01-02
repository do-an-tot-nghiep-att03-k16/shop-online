import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.css'
import App from './App.jsx'

const link = document.createElement('link')
link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap'
link.rel = 'stylesheet'
document.head.appendChild(link)
import { store } from './store/store'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './config/queryClient.js'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'

createRoot(document.getElementById('root')).render(
    // <StrictMode>
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <ConfigProvider>
                <App />
            </ConfigProvider>
            {/* {import.meta.env.DEV && (
                <ReactQueryDevtools
                    initialIsOpen={false}
                    position="bottom-right"
                />
            )} */}
        </QueryClientProvider>
    </Provider>
    // </StrictMode>
)
