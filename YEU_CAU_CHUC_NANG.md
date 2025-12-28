# 2.3. YÊU CẦU CHỨC NĂNG

## 2.3.1. Nhóm chức năng dành cho Guest (Khách truy cập)

### Xem và tìm kiếm sản phẩm
- **Xem danh sách sản phẩm**: Hiển thị sản phẩm với phân trang, hỗ trợ lọc theo danh mục, giá, giới tính, trạng thái còn hàng
- **Xem chi tiết sản phẩm**: Xem thông tin chi tiết sản phẩm bao gồm mô tả, giá, biến thể (màu sắc, kích thước), hình ảnh, đánh giá
- **Tìm kiếm sản phẩm**: Tìm kiếm theo từ khóa với các bộ lọc nâng cao (giá, danh mục, giới tính, sale)
- **Sắp xếp sản phẩm**: Hỗ trợ sắp xếp theo giá (tăng/giảm dần), mới nhất, bán chạy

### Xem thông tin hỗ trợ
- **Xem danh mục sản phẩm**: Duyệt sản phẩm theo cây danh mục phân cấp (danh mục cha - danh mục con)
- **Xem đánh giá sản phẩm**: Xem đánh giá, rating, thống kê đánh giá của sản phẩm
- **Xem blog**: Đọc các bài viết blog, tin tức, hướng dẫn
- **Xem banner và cấu hình trang chủ**: Xem banner, sản phẩm nổi bật, danh mục nổi bật

### Đăng ký tài khoản
- **Đăng ký**: Tạo tài khoản mới với email và mật khẩu
- **Xác thực email**: Xác nhận email thông qua link gửi đến hộp thư

---

## 2.3.2. Nhóm chức năng dành cho User (Người dùng đã đăng nhập)

### Xác thực và quản lý tài khoản
- **Đăng nhập**: Đăng nhập bằng email/password với JWT authentication
- **Đăng xuất**: Đăng xuất an toàn, hủy token
- **Quản lý hồ sơ cá nhân**: 
  - Xem và cập nhật thông tin cá nhân (tên, số điện thoại, địa chỉ)
  - Thay đổi mật khẩu
  - Cập nhật ảnh đại diện

### Quản lý địa chỉ
- **Quản lý địa chỉ giao hàng**:
  - Thêm, sửa, xóa địa chỉ
  - Đặt địa chỉ mặc định
  - Tìm kiếm và chọn tỉnh/thành phố, quận/huyện/xã

### Quản lý giỏ hàng
- **Thao tác giỏ hàng**:
  - Thêm sản phẩm vào giỏ (chọn biến thể: màu, size)
  - Cập nhật số lượng sản phẩm
  - Xóa sản phẩm khỏi giỏ
  - Xóa toàn bộ giỏ hàng
- **Áp dụng mã giảm giá**:
  - Áp dụng/gỡ mã giảm giá
  - Kiểm tra tính hợp lệ của mã
  - Xem lịch sử sử dụng mã giảm giá
- **Xác thực giỏ hàng**: Kiểm tra số lượng tồn kho, đồng bộ giá sản phẩm

### Đặt hàng và thanh toán
- **Quy trình đặt hàng**:
  - Xem lại đơn hàng (review order)
  - Chọn địa chỉ giao hàng
  - Chọn phương thức thanh toán (COD, QR SePay)
  - Xác nhận đặt hàng
- **Thanh toán**:
  - Thanh toán bằng QR SePay
  - Theo dõi trạng thái thanh toán realtime (Server-Sent Events)
  - Kiểm tra trạng thái thanh toán

### Quản lý đơn hàng cá nhân
- **Theo dõi đơn hàng**:
  - Xem danh sách đơn hàng của bản thân
  - Xem chi tiết đơn hàng
  - Tìm đơn hàng theo mã
  - Theo dõi trạng thái vận chuyển
- **Thao tác đơn hàng**:
  - Hủy đơn hàng (nếu đơn còn ở trạng thái pending/confirmed)
  - Hủy nhiều đơn hàng cùng lúc
  - Yêu cầu trả hàng/hoàn tiền
- **Thống kê cá nhân**: Xem thống kê đơn hàng, lịch sử mua hàng

### Đánh giá sản phẩm
- **Viết và quản lý đánh giá**:
  - Viết đánh giá sản phẩm (sau khi mua hàng và nhận hàng thành công)
  - Cập nhật/xóa đánh giá của mình
  - Upload ảnh kèm đánh giá
  - Like/Unlike đánh giá của người khác
- **Kiểm tra quyền đánh giá**: Hệ thống tự động kiểm tra user có quyền đánh giá sản phẩm hay không

### Tương tác với AI Chatbot
- **Hỗ trợ tư vấn**:
  - Chat với AI chatbot để nhận tư vấn sản phẩm
  - Xem lịch sử chat
  - Realtime chat với N8N webhook integration

---

## 2.3.3. Nhóm chức năng dành cho Shop (Quản lý cửa hàng)

### Xem thống kê và báo cáo
- **Dashboard analytics**:
  - Xem tổng quan doanh thu, đơn hàng
  - Phân bố trạng thái đơn hàng
  - Sản phẩm bán chạy
  - Hoạt động gần đây
  - Tăng trưởng người dùng
  - Hiệu suất danh mục

### Quản lý sản phẩm
- **CRUD sản phẩm**:
  - Thêm sản phẩm mới với đầy đủ thông tin (tên, giá, mô tả, danh mục, giới tính)
  - Cập nhật thông tin sản phẩm
  - Xóa sản phẩm
  - Xuất bản/Ẩn sản phẩm
- **Quản lý biến thể sản phẩm**:
  - Thêm/sửa/xóa biến thể (màu sắc, kích thước)
  - Quản lý SKU cho từng biến thể
  - Quản lý giá và số lượng tồn kho cho từng biến thể
- **Upload và quản lý hình ảnh**:
  - Upload nhiều ảnh sản phẩm (tối đa 10 ảnh)
  - Hỗ trợ upload lên Cloudinary và AWS S3
  - Quản lý thứ tự hiển thị ảnh

### Quản lý tồn kho
- **Quản lý inventory**:
  - Cập nhật tồn kho cho từng biến thể sản phẩm
  - Cập nhật tồn kho hàng loạt (bulk update)
  - Xem tổng quan tồn kho
  - Cảnh báo sản phẩm sắp hết hàng (low stock alerts)
- **Kiểm tra tồn kho**:
  - Kiểm tra tồn kho theo biến thể
  - Xem size có sẵn theo màu sắc

### Quản lý đơn hàng
- **Xem và xử lý đơn hàng**:
  - Xem danh sách tất cả đơn hàng với bộ lọc
  - Xem chi tiết đơn hàng
  - Cập nhật trạng thái đơn hàng (confirmed, shipping, delivered, cancelled)
  - Cập nhật thông tin vận chuyển (mã tracking, nhà vận chuyển)
  - Cập nhật trạng thái thanh toán
- **Thống kê đơn hàng**:
  - Xem thống kê đơn hàng theo thời gian
  - Xem doanh thu
  - Tự động hủy đơn hàng pending quá hạn

### Quản lý danh mục sản phẩm
- **CRUD danh mục**:
  - Thêm/sửa/xóa danh mục
  - Quản lý danh mục phân cấp (cha - con)
  - Xuất bản/Ẩn danh mục
  - Upload ảnh đại diện danh mục

### Quản lý mã giảm giá
- **CRUD coupon**:
  - Tạo mã giảm giá với các loại: giảm theo phần trăm, giảm cố định, freeship
  - Cấu hình điều kiện áp dụng (giá trị đơn hàng tối thiểu, danh mục, sản phẩm cụ thể)
  - Giới hạn số lần sử dụng
  - Cài đặt thời gian hiệu lực
  - Xem danh sách và chi tiết mã giảm giá

### Xem lịch sử giao dịch
- **Transaction history**:
  - Xem danh sách giao dịch thanh toán
  - Xem chi tiết giao dịch (SePay webhook data)
  - Thống kê giao dịch

### Quản lý đánh giá
- **Kiểm duyệt đánh giá**:
  - Xem đánh giá chờ duyệt
  - Duyệt/Từ chối đánh giá
  - Duyệt nhiều đánh giá cùng lúc
  - Xem thống kê đánh giá

---

## 2.3.4. Nhóm chức năng dành cho Admin (Quản trị viên)

### Tất cả quyền của Shop, cộng thêm:

### Quản trị người dùng
- **CRUD người dùng**:
  - Tạo tài khoản người dùng mới
  - Xem danh sách người dùng với phân trang và lọc
  - Cập nhật thông tin người dùng
  - Xóa/Khóa tài khoản người dùng
  - Phân quyền người dùng (user, shop, admin) với RBAC (Role-Based Access Control)

### Quản lý địa điểm
- **Quản lý location data**:
  - Thêm/sửa/xóa tỉnh/thành phố
  - Thêm/sửa/xóa quận/huyện/xã
  - Quản lý cơ sở dữ liệu địa điểm Việt Nam

### Quản lý API Key
- **API Key management**:
  - Tạo API Key cho external integration
  - Vô hiệu hóa API Key
  - Xem danh sách API Key
  - Phân quyền API Key (0000, 1111, 2222)

### Giám sát hệ thống
- **System monitoring**:
  - Xem log hoạt động hệ thống
  - Giám sát hoạt động của Shop
  - Quản lý job scheduler (stock update jobs)
  - Xem và quản lý SSE connections (Server-Sent Events)

---

## 2.3.5. Nhóm chức năng CMS (Strapi) - Dành cho Admin và Shop

### Quản lý nội dung Blog
- **Blog management**:
  - Tạo/sửa/xóa bài viết blog
  - Quản lý danh mục blog
  - Xuất bản/Ẩn bài viết
  - Upload ảnh cho blog
  - Rich text editor hỗ trợ markdown

### Quản trị cấu hình trang chủ
- **Home configuration**:
  - Cấu hình banner trang chủ
  - Chọn danh mục nổi bật
  - Chọn sản phẩm nổi bật
  - Chọn mã giảm giá nổi bật
  - Sắp xếp thứ tự hiển thị

### Quản trị thông tin website
- **Website settings**:
  - Cập nhật thông tin liên hệ (địa chỉ, SĐT, email)
  - Quản lý chính sách bảo mật
  - Quản lý điều khoản sử dụng
  - Cấu hình SEO metadata
  - Cài đặt social media links
