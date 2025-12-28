import { QueryClient } from "@tanstack/react-query"

import React from "react"

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // Retry 1 lần nếu lỗi
            refetchOnWindowFocus: false, // ko auto refetch khi focus window
            refetchOnReconnect: true, // refetch khi internet reconnect
            staleTime: 5 * 60 * 1000, // Data tươi trong 5 phút (ko refetch)
            cacheTime: 10 * 60 * 1000, //giữ cache 10 phút

            // Có thể custom thêm:
            // refetchInterval: 30000, // Auto refetch mỗi 30s
            // enabled: true, // Có tự động fetch không
        },
        mutations: {
            retry: 0, // KO retry khi mutation fail
        },
    },
})
