import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import addressService, { locationService } from '../services/addressService'

// Hook để lấy tất cả địa chỉ của user
export const useAddresses = () => {
    return useQuery({
        queryKey: ['user', 'addresses'],
        queryFn: addressService.getUserAddresses,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Hook để lấy địa chỉ theo ID
export const useAddress = (addressId) => {
    return useQuery({
        queryKey: ['address', addressId],
        queryFn: () => addressService.getAddressById(addressId),
        enabled: !!addressId,
    })
}

// Hook để lấy địa chỉ mặc định
export const useDefaultAddress = () => {
    return useQuery({
        queryKey: ['user', 'addresses', 'default'],
        queryFn: addressService.getDefaultAddress,
        staleTime: 5 * 60 * 1000,
    })
}

// Hook để tạo địa chỉ mới
export const useCreateAddress = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: addressService.createAddress,
        onSuccess: () => {
            // Invalidate addresses để refetch
            queryClient.invalidateQueries(['user', 'addresses'])
            message.success('Thêm địa chỉ thành công!')
        },
        onError: (error) => {
            message.error(error?.message || 'Không thể thêm địa chỉ')
        },
    })
}

// Hook để cập nhật địa chỉ
export const useUpdateAddress = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ addressId, data }) => addressService.updateAddress(addressId, data),
        onSuccess: (_, variables) => {
            // Invalidate addresses và address cụ thể
            queryClient.invalidateQueries(['user', 'addresses'])
            queryClient.invalidateQueries(['address', variables.addressId])
            message.success('Cập nhật địa chỉ thành công!')
        },
        onError: (error) => {
            message.error(error?.message || 'Không thể cập nhật địa chỉ')
        },
    })
}

// Hook để xóa địa chỉ
export const useDeleteAddress = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: addressService.deleteAddress,
        onSuccess: () => {
            // Invalidate addresses để refetch
            queryClient.invalidateQueries(['user', 'addresses'])
            message.success('Xóa địa chỉ thành công!')
        },
        onError: (error) => {
            message.error(error?.message || 'Không thể xóa địa chỉ')
        },
    })
}

// Hook để đặt địa chỉ mặc định
export const useSetDefaultAddress = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: addressService.setDefaultAddress,
        onSuccess: () => {
            // Invalidate tất cả addresses
            queryClient.invalidateQueries(['user', 'addresses'])
            message.success('Đặt địa chỉ mặc định thành công!')
        },
        onError: (error) => {
            message.error(error?.message || 'Không thể đặt địa chỉ mặc định')
        },
    })
}

// Location hooks
export const useProvinces = () => {
    return useQuery({
        queryKey: ['locations', 'provinces'],
        queryFn: locationService.getProvinces,
        staleTime: 30 * 60 * 1000, // 30 minutes - location data doesn't change often
    })
}

export const useWards = (provinceId) => {
    return useQuery({
        queryKey: ['locations', 'wards', provinceId],
        queryFn: () => locationService.getWards(provinceId),
        enabled: !!provinceId,
        staleTime: 30 * 60 * 1000,
    })
}