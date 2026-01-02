// pages/Profile.jsx
import { useState, useEffect, useRef } from 'react'
import {
    Card,
    Spin,
    Descriptions,
    Avatar,
    Button,
    Space,
    Tag,
    Row,
    Col,
    Typography,
    message,
    Upload,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Divider,
} from 'antd'
import {
    UserOutlined,
    EditOutlined,
    MailOutlined,
    HomeOutlined,
    CalendarOutlined,
    ManOutlined,
    WomanOutlined,
    CameraOutlined,
    LoadingOutlined,
    PhoneOutlined,
    SaveOutlined,
    CloseOutlined,
    EnvironmentOutlined,
    MessageOutlined,
    PlusOutlined,
    LockOutlined,
} from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import { accessAPI } from '../services/api'
import { 
    useProvinces, 
    useWards, 
    useCreateAddress, 
    useUpdateAddress,
    useAddresses 
} from '../hooks/useAddresses'
import dayjs from 'dayjs'
import SmoothTransition from '../components/Common/SmoothTransition'
import { extractData, extractMultipleData } from '../utils/apiUtils'

const { Title, Text } = Typography

const Profile = () => {
    const authHook = useAuth()
    const { user, loading, getProfile, updateUser, updateUserState } = authHook
    
    // Load user addresses separately
    const { data: userAddresses, isLoading: addressesLoading } = useAddresses()
    const [refreshing, setRefreshing] = useState(false)
    
    // Auto-refresh profile if avatar images missing (happens after F5)
    // Use useRef to avoid infinite loops caused by getProfile reference changes
    const getProfileRef = useRef(getProfile)
    getProfileRef.current = getProfile
    
    useEffect(() => {
        if (user && !user.images && !loading) {
            getProfileRef.current()
        }
    }, [user?.usr_id, user?.images, loading]) // Stable dependencies only
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [avatarKey, setAvatarKey] = useState(Date.now()) // Force re-render avatar
    
    // Location states
    const [selectedProvince, setSelectedProvince] = useState(null)
    const [previewImage, setPreviewImage] = useState('')
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [addressModalOpen, setAddressModalOpen] = useState(false)
    const [addressMode, setAddressMode] = useState('add') // 'add' or 'edit'
    const [editingAddress, setEditingAddress] = useState(null)
    const [updating, setUpdating] = useState(false)
    const [form] = Form.useForm()
    const [addressForm] = Form.useForm()
    
    // Change password states
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [passwordForm] = Form.useForm()
    const [changingPassword, setChangingPassword] = useState(false)

    // Location data hooks
    const { data: provincesData, isLoading: provincesLoading } = useProvinces()
    const { data: wardsData, isLoading: wardsLoading } = useWards(selectedProvince) // Wards belong to province directly
    
    // Address mutation hooks
    const createAddressMutation = useCreateAddress()
    const updateAddressMutation = useUpdateAddress()
    
    const provinces = provincesData?.metadata || []
    const wards = wardsData?.metadata || []

    // Handle change password
    const handleChangePassword = async (values) => {
        setChangingPassword(true)
        try {
            await authService.changePassword(values.newPassword)
            message.success('Đổi mật khẩu thành công!')
            setPasswordModalOpen(false)
            passwordForm.resetFields()
        } catch (error) {
            console.error('Change password error:', error)
            message.error(error.message || 'Đổi mật khẩu thất bại')
        } finally {
            setChangingPassword(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            await getProfile()
            message.success('Đã cập nhật thông tin mới nhất')
        } catch (error) {
            message.error('Không thể làm mới thông tin')
        } finally {
            setRefreshing(false)
        }
    }

    // Handle avatar upload
    const handleAvatarUpload = async (file) => {
        const allowedTypes = ['image/jpeg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            message.error('Chỉ hỗ trợ file JPG và PNG!')
            return false
        }

        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            message.error('Ảnh phải nhỏ hơn 10MB!')
            return false
        }

        setUploadingAvatar(true)

        try {
            const response = await authService.updateAvatar(file)

            // Nếu backend trả { status, message, metadata }
            if (response?.status === 200) {
                
                // Extract profile data - có thể là profile hoặc user
                const profile = extractData(response, 'profile') || extractData(response, 'user')
                
                // Cập nhật user với profile mới (có usr_avatar)
                if (profile) {
                    if (typeof updateUserState === 'function') {
                        updateUserState(profile) // cập nhật local state trong redux
                    } else {
                        console.error('❌ updateUserState is not a function:', updateUserState)
                    }
                } else {
                    console.warn('⚠️ No profile data found in response')
                }
                
                // Force refresh để đồng bộ hoàn toàn  
                try {
                    const profileResult = await getProfile()
                } catch (refreshError) {
                    console.error('❌ Failed to refresh profile:', refreshError)
                }
                
                // Force re-render avatar với cache busting
                setAvatarKey(Date.now())
                console.log('🔥 Avatar key updated')
                
                // Debug current user state after refresh
                setTimeout(() => {
                }, 100)
                
                message.success('Cập nhật avatar thành công!')
            } else {
                console.error('❌ Upload failed with status:', response?.status)
                throw new Error(response?.message || 'Upload thất bại')
            }
        } catch (error) {
            console.error('Upload error:', error)
            message.error(error.message || 'Upload avatar thất bại!')
        } finally {
            setUploadingAvatar(false)
        }

        return false // prevent Upload default behavior
    }

    // Preview avatar
    const handlePreview = async () => {
        if (!user?.images?.large) {
            return
        }
        setPreviewImage(user.images.large)
        setPreviewOpen(true)
    }

    // Handle open address modal
    const handleOpenAddressModal = (mode, address = null) => {
        setAddressMode(mode)
        setEditingAddress(address)
        
        if (mode === 'add') {
            // Reset form for new address
            addressForm.resetFields()
            setSelectedProvince(null)
        } else if (mode === 'edit' && address) {
            // Pre-fill form for editing
            addressForm.setFieldsValue({
                full_name: address.full_name,
                address_phone: address.phone,
                address_line: address.address_line,
                address_type: address.type,
                address_note: address.note,
                province_id: address.province?._id,
                ward_id: address.ward?._id
            })
            setSelectedProvince(address.province?._id)
        }
        
        setAddressModalOpen(true)
    }

    // Handle address form submit
    const handleAddressSubmit = async (values) => {
        try {
            setUpdating(true)
            
            // Prepare address data
            const addressData = {
                full_name: values.full_name?.trim(),
                phone: values.address_phone?.trim(),
                address_line: values.address_line?.trim(),
                province_id: values.province_id,
                ward_id: values.ward_id,
                type: values.address_type || 'home',
                note: values.address_note?.trim() || '',
                is_default: addressMode === 'add' && (!userAddresses || userAddresses.length === 0) // First address is default
            }

            if (addressMode === 'add') {
                await createAddressMutation.mutateAsync(addressData)
                message.success('Thêm địa chỉ mới thành công!')
            } else if (addressMode === 'edit' && editingAddress) {
                await updateAddressMutation.mutateAsync({
                    addressId: editingAddress._id,
                    data: addressData
                })
                message.success('Cập nhật địa chỉ thành công!')
            }
            
            setAddressModalOpen(false)
            addressForm.resetFields()
            setSelectedProvince(null)
            
        } catch (error) {
            console.error('Address error:', error)
            message.error(error?.message || 'Có lỗi xảy ra khi xử lý địa chỉ')
        } finally {
            setUpdating(false)
        }
    }

    // Handle open edit modal
    const handleOpenEditModal = () => {
        const defaultAddress = userAddresses?.find(addr => addr.is_default && addr.is_active) || 
                              userAddresses?.find(addr => addr.is_active)
        
        // Set location states if address exists
        if (defaultAddress) {
            setSelectedProvince(defaultAddress.province?._id || null)
        }
        
        form.setFieldsValue({
            usr_name: user?.usr_name || '',
            usr_phone: user?.usr_phone || '',
            usr_sex: user?.usr_sex || '',
            usr_date_of_birth: user?.usr_date_of_birth
                ? dayjs(user.usr_date_of_birth)
                : null,
            // Address fields from default address
            full_name: defaultAddress?.full_name || user?.usr_name || '',
            address_phone: defaultAddress?.phone || user?.usr_phone || '',
            address_line: defaultAddress?.address_line || '',
            address_type: defaultAddress?.type || 'home',
            address_note: defaultAddress?.note || '',
            // Location fields
            province_id: defaultAddress?.province?._id || undefined,
            ward_id: defaultAddress?.ward?._id || undefined,
        })
        setEditModalOpen(true)
    }

    // Handle update profile
    const handleUpdateProfile = async (values) => {
        setUpdating(true)
        try {
            // Prepare basic profile data
            const profileData = {
                name: values.usr_name,
                phone: values.usr_phone,
                sex: values.usr_sex,
                dateOfBirth: values.usr_date_of_birth
                    ? values.usr_date_of_birth.format('YYYY-MM-DD')
                    : null,
            }

            // Update profile first
            const resultAction = await updateUser(profileData)

            if (!resultAction.type.includes('fulfilled')) {
                throw new Error(
                    resultAction.payload ||
                        resultAction.error?.message ||
                        'Cập nhật thông tin cơ bản thất bại'
                )
            }

            // Handle address data separately if provided
            const hasAddressData = values.full_name || values.address_phone || values.address_line || values.province_id
            
            if (hasAddressData) {
                // Check required fields for address
                if (!values.province_id || !values.ward_id) {
                    message.warning('Vui lòng chọn đầy đủ tỉnh/thành phố và phường/xã để cập nhật địa chỉ')
                    message.success('Cập nhật thông tin cơ bản thành công!')
                    setEditModalOpen(false)
                    form.resetFields()
                    await getProfile()
                    return
                }

                // Prepare address data for separate API call
                const addressData = {
                    full_name: values.full_name?.trim() || values.usr_name?.trim(),
                    phone: values.address_phone?.trim() || values.usr_phone?.trim(),
                    address_line: values.address_line?.trim() || '',
                    province_id: values.province_id,
                    ward_id: values.ward_id,
                    type: values.address_type || 'home',
                    note: values.address_note?.trim() || '',
                    is_default: true
                }

                try {
                    // Check if user has existing default address to update or create new
                    const existingDefault = userAddresses?.find(addr => addr.is_default && addr.is_active)
                    
                    if (existingDefault) {
                        await updateAddressMutation.mutateAsync({ 
                            addressId: existingDefault._id, 
                            data: addressData 
                        })
                    } else {
                        await createAddressMutation.mutateAsync(addressData)
                    }
                    
                    message.success('Cập nhật thông tin và địa chỉ thành công!')
                } catch (addressError) {
                    console.error('Address error:', addressError)
                    message.warning('Cập nhật thông tin cơ bản thành công, nhưng có lỗi khi cập nhật địa chỉ: ' + (addressError.message || 'Lỗi không xác định'))
                }
            } else {
                message.success('Cập nhật thông tin thành công!')
            }

            setEditModalOpen(false)
            form.resetFields()

            // Refresh profile để sync với database
            try {
                await getProfile()
            } catch (refreshError) {
                // Không throw error, update đã thành công rồi
            }
            
        } catch (error) {
            message.error(error.message || 'Cập nhật thông tin thất bại!')
        } finally {
            setUpdating(false)
        }
    }

    // Handle cancel edit
    const handleCancelEdit = () => {
        form.resetFields()
        setEditModalOpen(false)
    }

    if (loading && !user) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                }}
            >
                <Spin size="large" tip="Đang tải thông tin cá nhân..." />
            </div>
        )
    }

    const getStatusTag = (status) => {
        const statusConfig = {
            active: { color: 'green', text: 'Hoạt động' },
            inactive: { color: 'orange', text: 'Tạm ngưng' },
            blocked: { color: 'red', text: 'Bị khóa' },
        }
        return (
            statusConfig[status] || { color: 'default', text: 'Không xác định' }
        )
    }

    const getRoleTag = (role) => {
        const roleConfig = {
            admin: { color: 'red', text: 'Quản trị viên' },
            shop: { color: 'blue', text: 'Cửa hàng' },
            user: { color: 'green', text: 'Khách hàng' },
        }
        return roleConfig[role] || { color: 'default', text: role }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật'
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const getGenderIcon = (sex) => {
        if (sex === 'male' || sex === 'nam')
            return <ManOutlined style={{ color: '#1890ff' }} />
        if (sex === 'female' || sex === 'nữ')
            return <WomanOutlined style={{ color: '#eb2f96' }} />
        return null
    }


    return (
        <SmoothTransition loading={loading}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                <Card>
                    <Row gutter={[24, 24]} align="middle">
                        <Col
                            xs={24}
                            sm={24}
                            md={6}
                            style={{ textAlign: 'center' }}
                        >
                            <Upload
                                name="avatar"
                                showUploadList={false}
                                beforeUpload={handleAvatarUpload}
                                accept="image/*"
                            >
                                <div
                                    style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Avatar
                                        size={120}
                                        src={(() => {                                            
                                            let avatarUrl = undefined
                                            if (user?.images?.medium) {
                                                // Sử dụng medium size cho avatar trong profile
                                                avatarUrl = `${user.images.medium}?v=${avatarKey}`
                                            }
                                            return avatarUrl
                                        })()}
                                        icon={
                                            uploadingAvatar ? (
                                                <LoadingOutlined />
                                            ) : (
                                                <UserOutlined />
                                            )
                                        }
                                        style={{
                                            backgroundColor: '#1890ff',
                                            border: '4px solid #f0f0f0',
                                        }}
                                        onClick={
                                            user?.images?.large
                                                ? (e) => {
                                                      e.stopPropagation()
                                                      handlePreview()
                                                  }
                                                : undefined
                                        }
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: '#1890ff',
                                            borderRadius: '50%',
                                            width: 36,
                                            height: 36,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '3px solid white',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <CameraOutlined
                                            style={{
                                                color: 'white',
                                                fontSize: 16,
                                            }}
                                        />
                                    </div>
                                </div>
                            </Upload>
                            <div
                                style={{
                                    marginTop: 8,
                                    color: '#999',
                                    fontSize: 12,
                                }}
                            >
                                Click để thay đổi ảnh
                            </div>
                        </Col>

                        <Col xs={24} sm={24} md={18}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                <Title level={2} style={{ margin: 0 }}>
                                    {user?.usr_name || 'Chưa cập nhật tên'}
                                </Title>


                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <Text type="secondary">
                                        <MailOutlined /> {user?.usr_email}
                                    </Text>
                                    {user?.usr_slug && (
                                        <Text type="secondary">
                                            @{user.usr_slug}
                                        </Text>
                                    )}
                                </div>

                                <Space style={{ marginTop: 16 }}>
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={handleOpenEditModal}
                                    >
                                        Chỉnh sửa thông tin
                                    </Button>
                                    <Button
                                        icon={<LockOutlined />}
                                        onClick={() => setPasswordModalOpen(true)}
                                    >
                                        Đổi mật khẩu
                                    </Button>
                                    <Button
                                        icon={<EditOutlined />}
                                        loading={refreshing}
                                        onClick={handleRefresh}
                                    >
                                        Làm mới
                                    </Button>
                                </Space>
                            </div>
                        </Col>
                    </Row>
                </Card>

                <Card title="Thông tin chi tiết">
                    <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>

                        <Descriptions.Item label="Tên đầy đủ">
                            {user?.usr_name || 'Chưa cập nhật'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Email">
                            {user?.usr_email}
                        </Descriptions.Item>

                        <Descriptions.Item label="Username">
                            {user?.usr_slug || 'Chưa có'}
                        </Descriptions.Item>


                        <Descriptions.Item label="Giới tính">
                            {getGenderIcon(user?.usr_sex)}{' '}
                            {user?.usr_sex || 'Chưa cập nhật'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Số điện thoại">
                            <PhoneOutlined />{' '}
                            {user?.usr_phone || 'Chưa cập nhật'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Ngày sinh">
                            <CalendarOutlined />{' '}
                            {formatDate(user?.usr_date_of_birth)}
                        </Descriptions.Item>

                    </Descriptions>
                </Card>

                <Card
                    title={
                        <Space>
                            <HomeOutlined />
                            <span>Địa chỉ</span>
                        </Space>
                    }
                >
                    <div style={{ marginBottom: '16px' }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenAddressModal('add')}
                        >
                            Thêm địa chỉ mới
                        </Button>
                    </div>
                    
                    {userAddresses && userAddresses.length > 0 ? (
                        <div
                            style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}
                        >
                            {userAddresses
                                .filter(address => address.is_active !== false) // Chỉ hiển thị address active
                                .map((address, index) => (
                                <Card
                                    key={address._id || index}
                                    type="inner"
                                    size="small"
                                    title={
                                        <Space>
                                            <span>{address.full_name}</span>
                                            <Tag color={address.type === 'home' ? 'green' : address.type === 'office' ? 'blue' : 'default'}>
                                                {address.type === 'home' ? 'Nhà riêng' : 
                                                 address.type === 'office' ? 'Văn phòng' : 'Khác'}
                                            </Tag>
                                        </Space>
                                    }
                                    extra={
                                        address.is_default && (
                                            <Tag color="gold">Mặc định</Tag>
                                        )
                                    }
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <Text>
                                            <PhoneOutlined style={{ marginRight: 8 }} />
                                            {address.phone}
                                        </Text>
                                        <Text>
                                            <HomeOutlined style={{ marginRight: 8 }} />
                                            {address.address_line}
                                        </Text>
                                        <Text type="secondary">
                                            <EnvironmentOutlined style={{ marginRight: 8 }} />
                                            {address.ward?.name ? `${address.ward.name}, ` : ''}{address.province?.name || ''}
                                        </Text>
                                        {address.note && (
                                            <Text type="secondary" italic>
                                                <MessageOutlined style={{ marginRight: 8 }} />
                                                {address.note}
                                            </Text>
                                        )}
                                        
                                        <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                            <Button
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => handleOpenAddressModal('edit', address)}
                                            >
                                                Sửa
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Text type="secondary">
                            Chưa có địa chỉ nào. Vui lòng thêm địa chỉ để dễ
                            dàng đặt hàng.
                        </Text>
                    )}
                </Card>

                {/* <Card title="Thống kê hoạt động">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <div style={{ textAlign: 'center' }}>
                                    <Title
                                        level={3}
                                        style={{ margin: 0, color: '#1890ff' }}
                                    >
                                        0
                                    </Title>
                                    <Text type="secondary">Đơn hàng</Text>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <div style={{ textAlign: 'center' }}>
                                    <Title
                                        level={3}
                                        style={{ margin: 0, color: '#52c41a' }}
                                    >
                                        0
                                    </Title>
                                    <Text type="secondary">Yêu thích</Text>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <div style={{ textAlign: 'center' }}>
                                    <Title
                                        level={3}
                                        style={{ margin: 0, color: '#faad14' }}
                                    >
                                        0đ
                                    </Title>
                                    <Text type="secondary">Tổng chi tiêu</Text>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <div style={{ textAlign: 'center' }}>
                                    <Title
                                        level={3}
                                        style={{ margin: 0, color: '#eb2f96' }}
                                    >
                                        0
                                    </Title>
                                    <Text type="secondary">Đánh giá</Text>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Card> */}
            </div>

            {/* Preview Modal */}
            <Modal
                open={previewOpen}
                title="Ảnh đại diện"
                footer={null}
                onCancel={() => setPreviewOpen(false)}
            >
                <img
                    alt="avatar"
                    style={{ width: '100%' }}
                    src={previewImage}
                />
            </Modal>

            {/* Edit Profile Modal */}
            <Modal
                title="Chỉnh sửa thông tin cá nhân"
                open={editModalOpen}
                onCancel={handleCancelEdit}
                footer={[
                    <Button key="cancel" onClick={handleCancelEdit}>
                        <CloseOutlined /> Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={updating}
                        onClick={() => form.submit()}
                    >
                        <SaveOutlined /> Lưu thay đổi
                    </Button>,
                ]}
                width={600}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    style={{ marginTop: 20 }}
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Họ và tên"
                                name="usr_name"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập họ và tên!',
                                    },
                                    {
                                        min: 2,
                                        message: 'Tên phải có ít nhất 2 ký tự!',
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Nhập họ và tên"
                                    prefix={<UserOutlined />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Số điện thoại"
                                name="usr_phone"
                                rules={[
                                    {
                                        pattern: /^[0-9]{10,11}$/,
                                        message: 'Số điện thoại không hợp lệ!',
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Nhập số điện thoại"
                                    prefix={<PhoneOutlined />}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Giới tính" name="usr_sex">
                                <Select placeholder="Chọn giới tính">
                                    <Select.Option value="male">
                                        <ManOutlined
                                            style={{ color: '#1890ff' }}
                                        />{' '}
                                        Nam
                                    </Select.Option>
                                    <Select.Option value="female">
                                        <WomanOutlined
                                            style={{ color: '#eb2f96' }}
                                        />{' '}
                                        Nữ
                                    </Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Ngày sinh"
                                name="usr_date_of_birth"
                            >
                                <DatePicker
                                    placeholder="Chọn ngày sinh"
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    disabledDate={(current) => {
                                        // Disable future dates
                                        return (
                                            current &&
                                            current > dayjs().endOf('day')
                                        )
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Address Management */}
                    <Divider orientation="left">Quản lý địa chỉ</Divider>
                    
                    {/* Display existing addresses */}
                    {userAddresses && userAddresses.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <Text strong>Địa chỉ hiện tại:</Text>
                            {userAddresses
                                .filter(addr => addr.is_active !== false)
                                .map((address, index) => (
                                <div key={address._id || index} style={{
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    marginTop: '8px',
                                    backgroundColor: address.is_default ? '#f6ffed' : '#fafafa'
                                }}>
                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                        <Space>
                                            <Text strong>{address.full_name}</Text>
                                            <Tag color={address.type === 'home' ? 'green' : 'blue'}>
                                                {address.type === 'home' ? 'Nhà riêng' : 'Văn phòng'}
                                            </Tag>
                                            {address.is_default && <Tag color="gold">Mặc định</Tag>}
                                        </Space>
                                        <Text><PhoneOutlined /> {address.phone}</Text>
                                        <Text><HomeOutlined /> {address.address_line}</Text>
                                        <Text type="secondary">
                                            <EnvironmentOutlined /> {address.ward?.name ? `${address.ward.name}, ` : ''}{address.province?.name || ''}
                                        </Text>
                                    </Space>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Simple address input for basic update - you can expand this to full address form later */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Họ và tên" name="full_name">
                                <Input
                                    placeholder="Họ và tên người nhận"
                                    prefix={<UserOutlined />}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Số điện thoại" name="address_phone">
                                <Input
                                    placeholder="Số điện thoại người nhận"
                                    prefix={<PhoneOutlined />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    {/* Location Selection */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="Tỉnh/Thành phố" 
                                name="province_id"
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            const hasAddressData = form.getFieldValue('address_line') || 
                                                                 form.getFieldValue('full_name') || 
                                                                 form.getFieldValue('address_phone')
                                            if (hasAddressData && !value) {
                                                return Promise.reject('Vui lòng chọn tỉnh/thành phố')
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                            >
                                <Select
                                    placeholder="Chọn tỉnh/thành phố"
                                    loading={provincesLoading}
                                    showSearch
                                    allowClear
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    onChange={(value) => {
                                        setSelectedProvince(value)
                                        form.setFieldsValue({ ward_id: undefined })
                                    }}
                                    onClear={() => {
                                        setSelectedProvince(null)
                                    }}
                                >
                                    {provinces.map((province) => (
                                        <Select.Option key={province._id} value={province._id}>
                                            {province.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Phường/Xã" 
                                name="ward_id"
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            const provinceId = form.getFieldValue('province_id')
                                            if (provinceId && !value) {
                                                return Promise.reject('Vui lòng chọn phường/xã')
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                            >
                                <Select
                                    placeholder={!selectedProvince ? "Chọn tỉnh/thành phố trước" : "Chọn phường/xã"}
                                    loading={wardsLoading}
                                    disabled={!selectedProvince}
                                    showSearch
                                    allowClear
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {wards.map((ward) => (
                                        <Select.Option key={ward._id} value={ward._id}>
                                            {ward.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Loại địa chỉ" name="address_type">
                                <Select placeholder="Chọn loại">
                                    <Select.Option value="home">Nhà riêng</Select.Option>
                                    <Select.Option value="office">Văn phòng</Select.Option>
                                    <Select.Option value="other">Khác</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Ghi chú" name="address_note">
                                <Input
                                    placeholder="Ghi chú thêm (tùy chọn)"
                                    prefix={<MessageOutlined />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Địa chỉ chi tiết" name="address_line">
                                <Input
                                    placeholder="Số nhà, tên đường..."
                                    prefix={<HomeOutlined />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Address Management Modal */}
            <Modal
                title={addressMode === 'add' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
                open={addressModalOpen}
                onCancel={() => {
                    setAddressModalOpen(false)
                    addressForm.resetFields()
                    setSelectedProvince(null)
                }}
                onOk={() => addressForm.submit()}
                confirmLoading={updating}
                width={600}
            >
                <Form
                    form={addressForm}
                    layout="vertical"
                    onFinish={handleAddressSubmit}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="Họ và tên" 
                                name="full_name"
                                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                            >
                                <Input placeholder="Nhập họ và tên" prefix={<UserOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Số điện thoại" 
                                name="address_phone"
                                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                            >
                                <Input placeholder="Nhập số điện thoại" prefix={<PhoneOutlined />} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="Tỉnh/Thành phố" 
                                name="province_id"
                                rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                            >
                                <Select
                                    placeholder="Chọn tỉnh/thành phố"
                                    loading={provincesLoading}
                                    showSearch
                                    optionFilterProp="children"
                                    onChange={(value) => {
                                        setSelectedProvince(value)
                                        addressForm.setFieldsValue({ ward_id: null })
                                    }}
                                >
                                    {Array.isArray(provincesData) ? provincesData.map((province) => (
                                        <Select.Option key={province._id} value={province._id}>
                                            {province.name}
                                        </Select.Option>
                                    )) : null}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Phường/Xã" 
                                name="ward_id"
                                rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                            >
                                <Select
                                    placeholder="Chọn phường/xã"
                                    loading={wardsLoading}
                                    disabled={!selectedProvince}
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {Array.isArray(wardsData) ? wardsData.map((ward) => (
                                        <Select.Option key={ward._id} value={ward._id}>
                                            {ward.name}
                                        </Select.Option>
                                    )) : null}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Loại địa chỉ" name="address_type">
                                <Select placeholder="Chọn loại">
                                    <Select.Option value="home">Nhà riêng</Select.Option>
                                    <Select.Option value="office">Văn phòng</Select.Option>
                                    <Select.Option value="other">Khác</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Ghi chú" name="address_note">
                                <Input
                                    placeholder="Ghi chú thêm (tùy chọn)"
                                    prefix={<MessageOutlined />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item 
                                label="Địa chỉ chi tiết" 
                                name="address_line"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết' }]}
                            >
                                <Input
                                    placeholder="Số nhà, tên đường..."
                                    prefix={<HomeOutlined />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                title="Đổi mật khẩu"
                open={passwordModalOpen}
                onCancel={() => {
                    setPasswordModalOpen(false)
                    passwordForm.resetFields()
                }}
                onOk={() => passwordForm.submit()}
                confirmLoading={changingPassword}
                width={500}
            >
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                >
                    <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                            { 
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số!'
                            }
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu mới"
                            disabled={changingPassword}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
                                },
                            }),
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu mới"
                            disabled={changingPassword}
                        />
                    </Form.Item>

                    <div style={{ color: '#666', fontSize: 12, marginTop: 16 }}>
                        <p style={{ marginBottom: 4 }}>
                            <strong>Yêu cầu mật khẩu:</strong>
                        </p>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                            <li>Ít nhất 6 ký tự</li>
                            <li>Ít nhất 1 chữ cái viết hoa</li>
                            <li>Ít nhất 1 chữ cái viết thường</li>
                            <li>Ít nhất 1 chữ số</li>
                        </ul>
                    </div>
                </Form>
            </Modal>
            </div>
        </SmoothTransition>
    )
}

export default Profile
