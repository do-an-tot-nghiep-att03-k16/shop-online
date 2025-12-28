import React, { createContext, useContext } from 'react'
import { useSetting } from '../hooks/useSetting'

const SettingContext = createContext()

/**
 * Provider cho website setting - chia sẻ thông tin cấu hình toàn website
 */
export const SettingProvider = ({ children }) => {
    const settingData = useSetting()

    return (
        <SettingContext.Provider value={settingData}>
            {children}
        </SettingContext.Provider>
    )
}

/**
 * Hook để sử dụng setting context
 * @returns {Object} Setting data và helper functions
 */
export const useSettingContext = () => {
    const context = useContext(SettingContext)
    
    if (context === undefined) {
        throw new Error('useSettingContext must be used within a SettingProvider')
    }
    
    return context
}

/**
 * HOC để wrap component với setting context
 */
export const withSetting = (WrappedComponent) => {
    return function WithSettingComponent(props) {
        return (
            <SettingProvider>
                <WrappedComponent {...props} />
            </SettingProvider>
        )
    }
}