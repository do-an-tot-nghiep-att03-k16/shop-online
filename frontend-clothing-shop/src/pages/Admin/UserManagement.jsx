import { useState } from 'react'
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    Row,
    Col,
    Card,
    Typography,
    Tooltip,
    Popconfirm,
    message,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
} from '../../hooks/useUsers'

const { Title, Text } = Typography
const { Option } = Select

const UserManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()
    const [editingUser, setEditingUser] = useState(null)
    const [searchText, setSearchText] = useState('')

    // API hooks
    const {
        data: usersData,
        isLoading: isLoadingUsers,
        error: usersError,
    } = useUsers({ search: searchText })

    const createMutation = useCreateUser()
    const updateMutation = useUpdateUser()
    const deleteMutation = useDeleteUser()

    // Open create modal
    const handleCreate = () => {
        setEditingUser(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    // Open edit modal
    const handleEdit = (record) => {
        setEditingUser(record)
        form.setFieldsValue({
            name: record.usr_name,
            email: record.usr_email,
            role: record.usr_role,
            status: record.usr_status,
        })
        setIsModalOpen(true)
    }

    // Handle form submit
    const handleSubmit = async (values) => {
        try {
            if (editingUser) {
                await updateMutation.mutateAsync({
                    userId: editingUser._id,
                    data: values,
                })
                message.success('Cập nhật user thành công!')
            } else {
                await createMutation.mutateAsync(values)
                message.success('Tạo user mới thành công!')
            }

            setIsModalOpen(false)
            form.resetFields()
            setEditingUser(null)
        } catch (error) {
            console.error('Error saving user:', error)
        }
    }

    // Handle delete
    const handleDelete = async (userId) => {
        try {
            await deleteMutation.mutateAsync(userId)
            message.success('Xóa user thành công!')
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }

    // Handle search
    const handleSearch = () => {
        // Search is automatic via useUsers hook
    }

    // Table columns
    const columns = [
        {
            title: 'Tên',
            dataIndex: 'usr_name',
            key: 'usr_name',
            render: (name) => <Text strong>{name || 'Chưa có tên'}</Text>,
        },
        {
            title: 'Email',
            dataIndex: 'usr_email',
            key: 'usr_email',
            render: (email) => <Text>{email}</Text>,
        },
        {
            title: 'Vai trò',
            dataIndex: 'usr_role',
            key: 'usr_role',
            render: (role) => {
                const roleConfig = {
                    admin: { color: 'red', text: 'Admin' },
                    shop: { color: 'blue', text: 'Shop' },
                    user: { color: 'green', text: 'User' },
                }
                const config = roleConfig[role] || {
                    color: 'default',
                    text: role,
                }
                return <Tag color={config.color}>{config.text}</Tag>
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'usr_status',
            key: 'usr_status',
            render: (status) => {
                const statusConfig = {
                    active: { color: 'success', text: 'Hoạt động' },
                    block: { color: 'error', text: 'Không hoạt động' },
                    pending: { color: 'warning', text: 'Chờ duyệt' },
                }
                const config = statusConfig[status] || {
                    color: 'default',
                    text: status,
                }
                return <Tag color={config.color}>{config.text}</Tag>
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Xóa user">
                        <Popconfirm
                            title="Xác nhận xóa"
                            description="Bạn có chắc chắn muốn xóa user này?"
                            onConfirm={() => handleDelete(record._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okType="danger"
                        >
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                loading={deleteMutation.isLoading}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    if (usersError) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Text type="danger">Lỗi tải dữ liệu: {usersError.message}</Text>
            </div>
        )
    }

    // Đảm bảo users luôn là array, tránh lỗi map
    const users = Array.isArray(usersData?.users) ? usersData.users : []
    
    // Debug: kiểm tra dữ liệu users
        // Debug info removed for production

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: 24 }}
            >
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        Quản lý User
                    </Title>
                    <Text type="secondary">
                        Quản lý tài khoản người dùng hệ thống
                    </Text>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        size="large"
                    >
                        Thêm user mới
                    </Button>
                </Col>
            </Row>

            {/* Search */}
            <Card
                style={{ marginBottom: 16 }}
                styles={{ body: { padding: '16px 24px' } }}
            >
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Input
                            placeholder="Tìm kiếm user theo tên hoặc email..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="large"
                        />
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            size="large"
                        >
                            Tìm kiếm
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={users}
                    loading={isLoadingUsers}
                    rowKey="_id"
                    pagination={{
                        total: usersData?.pagination?.total || 0,
                        pageSize: usersData?.pagination?.limit || 10,
                        current: usersData?.pagination?.page || 1,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Tổng ${total} users`,
                    }}
                    scroll={{ x: 1000 }}
                    size="middle"
                />
            </Card>

            {/* Form Modal */}
            <Modal
                title={editingUser ? 'Chỉnh sửa user' : 'Thêm user mới'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false)
                    form.resetFields()
                    setEditingUser(null)
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setIsModalOpen(false)
                            form.resetFields()
                            setEditingUser(null)
                        }}
                    >
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={
                            createMutation.isLoading || updateMutation.isLoading
                        }
                        onClick={() => form.submit()}
                    >
                        {editingUser ? 'Cập nhật' : 'Tạo mới'}
                    </Button>,
                ]}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Tên"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tên!',
                            },
                        ]}
                    >
                        <Input placeholder="VD: Nguyễn Văn A" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập email!',
                            },
                            {
                                type: 'email',
                                message: 'Email không hợp lệ!',
                            },
                        ]}
                    >
                        <Input
                            placeholder="VD: user@example.com"
                            size="large"
                            disabled={!!editingUser} // Không cho edit email
                        />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mật khẩu!',
                                },
                                {
                                    min: 6,
                                    message:
                                        'Mật khẩu phải có ít nhất 6 ký tự!',
                                },
                            ]}
                        >
                            <Input.Password
                                placeholder="Nhập mật khẩu"
                                size="large"
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Vai trò"
                        name="role"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng chọn vai trò!',
                            },
                        ]}
                    >
                        <Select placeholder="Chọn vai trò" size="large">
                            <Option value="user">User</Option>
                            <Option value="shop">Shop</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="status"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng chọn trạng thái!',
                            },
                        ]}
                    >
                        <Select placeholder="Chọn trạng thái" size="large">
                            <Option value="active">Hoạt động</Option>
                            <Option value="inactive">Không hoạt động</Option>
                            <Option value="pending">Chờ duyệt</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default UserManagement
