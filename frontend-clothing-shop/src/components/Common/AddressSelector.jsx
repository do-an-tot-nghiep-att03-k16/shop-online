import React, { useState, useEffect } from 'react'
import { Select, Row, Col } from 'antd'
import { useProvinces, useWards } from '../../hooks/useAddresses'

const { Option } = Select

const AddressSelector = ({ value, onChange, disabled = false }) => {
    const [selectedProvinceId, setSelectedProvinceId] = useState(value?.province_id || null)
    
    // Use hooks instead of direct API calls
    const { data: provinces = [], isLoading: provincesLoading } = useProvinces()
    const { data: wards = [], isLoading: wardsLoading } = useWards(selectedProvinceId)
    
    // Sync selectedProvinceId with value prop
    useEffect(() => {
        if (value?.province_id !== selectedProvinceId) {
            setSelectedProvinceId(value?.province_id || null)
        }
    }, [value?.province_id])

    const handleProvinceChange = (provinceId) => {
        // Find selected province
        const selectedProvince = provinces.find(p => p._id === provinceId)
        
        // Update selected province for useWards hook
        setSelectedProvinceId(provinceId)
        
        // Reset ward when province changes
        const newValue = {
            province_id: provinceId,
            province: selectedProvince?.name || '',
            ward_id: null,
            ward: ''
        }
        
        onChange?.(newValue)
    }

    const handleWardChange = (wardId) => {
        // Find selected ward
        const selectedWard = wards.find(w => w._id === wardId)
        
        const newValue = {
            ...value,
            ward_id: wardId,
            ward: selectedWard?.name || ''
        }
        
        onChange?.(newValue)
    }

    return (
        <Row gutter={16}>
            <Col span={12}>
                <Select
                    placeholder="Chọn Tỉnh/Thành phố"
                    style={{ width: '100%' }}
                    value={value?.province_id}
                    onChange={handleProvinceChange}
                    loading={provincesLoading}
                    disabled={disabled}
                    showSearch
                    filterOption={(input, option) =>
                        option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {provinces.map((province) => (
                        <Option key={province._id} value={province._id}>
                            {province.name}
                        </Option>
                    ))}
                </Select>
            </Col>
            
            <Col span={12}>
                <Select
                    placeholder="Chọn Phường/Xã"
                    style={{ width: '100%' }}
                    value={value?.ward_id}
                    onChange={handleWardChange}
                    loading={wardsLoading}
                    disabled={disabled || !value?.province_id}
                    showSearch
                    filterOption={(input, option) =>
                        option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {wards.map((ward) => (
                        <Option key={ward._id} value={ward._id}>
                            {ward.name}
                        </Option>
                    ))}
                </Select>
            </Col>
        </Row>
    )
}

export default AddressSelector