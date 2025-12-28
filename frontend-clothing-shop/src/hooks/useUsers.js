import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userService } from "../services/userService"
import { message } from "antd"

// Query keys (centralized)
export const userKeys = {
    all: ["users"],
    paginated: (params) => ["users", "paginated", params],
    detail: (id) => ["users", id],
}

// ===== GET ALL USERS =====
/**
 * Hook to fetch users with pagination and sorting
 * @param {Object} params - { page, limit, sortBy, sortOrder }
 */
export const useUsers = (
    params = { page: 1, limit: 10, sortBy: "_id", sortOrder: "desc" }
) => {
    return useQuery({
        queryKey: userKeys.paginated(params),
        queryFn: () => userService.getAllUsers(params),
        keepPreviousData: true, // Giữ data cũ khi chuyển trang
        staleTime: 30000, // Cache 30s
    })
}

// ===== GET USER BY ID =====
/**
 * Hook to get user by ID
 */
export const useUser = (id, options = {}) => {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => userService.getUserById(id),
        enabled: !!id,
        ...options,
    })
}

// ===== CREATE USER =====
export const useCreateUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            // Invalidate tất cả các page
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            message.success("Tạo user thành công!")
        },
        onError: (error) => {
            message.error(error.message || "Không thể tạo user")
        },
    })
}

// ====== UPDATE USER =====
export const useUpdateUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, data }) => userService.updateUser(userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            queryClient.invalidateQueries(userKeys.detail(variables.userId))
            message.success("Cập nhật user thành công!")
        },
        onError: (error) => {
            message.error(error.message || "Không thể cập nhật user")
        },
    })
}

// ===== DELETE USER =====
export const useDeleteUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            message.success("Xóa user thành công!")
        },
        onError: (error) => {
            message.error(error.message || "Không thể xóa user")
        },
    })
}
