import { handleApiError } from '../utils/errorHandler'
import { addressAPI, locationAPI } from './api'
import { extractData } from '../utils/apiUtils'

const addressService = {
    // Lấy tất cả địa chỉ của user
    getUserAddresses: async () => {
        try {
            const response = await addressAPI.getAll()
            return extractData(response, 'metadata') // Extract addresses array from metadata
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách địa chỉ')
        }
    },

    // Lấy địa chỉ theo ID
    getAddressById: async (addressId) => {
        try {
            const response = await addressAPI.getById(addressId)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải địa chỉ')
        }
    },

    // Lấy địa chỉ mặc định
    getDefaultAddress: async () => {
        try {
            const response = await addressAPI.getDefault()
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tải địa chỉ mặc định')
        }
    },

    // Tạo địa chỉ mới
    createAddress: async (data) => {
        try {
            const response = await addressAPI.create(data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tạo địa chỉ mới')
        }
    },

    // Cập nhật địa chỉ
    updateAddress: async (addressId, data) => {
        try {
            const response = await addressAPI.update(addressId, data)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể cập nhật địa chỉ')
        }
    },

    // Xóa địa chỉ
    deleteAddress: async (addressId) => {
        try {
            const response = await addressAPI.delete(addressId)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể xóa địa chỉ')
        }
    },

    // Đặt làm địa chỉ mặc định
    setDefaultAddress: async (addressId) => {
        try {
            const response = await addressAPI.setDefault(addressId)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể đặt địa chỉ mặc định')
        }
    },

    // Tìm kiếm địa chỉ theo location
    searchByLocation: async (params) => {
        try {
            const response = await addressAPI.searchByLocation(params)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tìm kiếm địa chỉ')
        }
    }
}

// Location service
export const locationService = {
    // Lấy tất cả tỉnh/thành phố
    getProvinces: async () => {
        try {
            const response = await locationAPI.getProvinces()
            return extractData(response, 'metadata') // Extract provinces array from metadata
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách tỉnh/thành phố')
        }
    },

    // Lấy phường/xã theo tỉnh (không có quận/huyện)
    getWards: async (provinceId) => {
        try {
            const response = await locationAPI.getWards(provinceId)
            return extractData(response, 'metadata') // Extract wards array from metadata
        } catch (error) {
            throw handleApiError(error, 'Không thể tải danh sách phường/xã')
        }
    },

    // Tìm kiếm location
    searchLocations: async (query) => {
        try {
            const response = await locationAPI.search(query)
            return response
        } catch (error) {
            throw handleApiError(error, 'Không thể tìm kiếm địa điểm')
        }
    }
}

export default addressService