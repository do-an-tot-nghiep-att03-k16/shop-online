import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import cartReducer from './cartSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        // Thêm các reducers khác ở đây
        // products: productsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Tắt warning cho non-serializable data
        }),
    devTools: import.meta.env.DEV
})

export default store