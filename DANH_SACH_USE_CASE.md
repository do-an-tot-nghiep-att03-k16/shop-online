# DANH SÁCH USE CASE - HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VÀ CMS

## 2.3. DANH SÁCH USE CASE

### A. CMS SYSTEM (Strapi)

| Mã UC | Tên Use Case | Actor |
|-------|-------------|-------|
| **UC-CMS-01** | **Quản lý Blog** | Admin, Shop |
| UC-CMS-01.1 | Thêm bài viết blog | Admin, Shop |
| UC-CMS-01.2 | Cập nhật bài viết blog | Admin, Shop |
| UC-CMS-01.3 | Xóa bài viết blog | Admin, Shop |
| UC-CMS-01.4 | Xem danh sách blog | Admin, Shop |
| UC-CMS-01.5 | Xuất bản/Ẩn bài viết blog | Admin, Shop |
| **UC-CMS-02** | **Quản lý danh mục Blog** | Admin, Shop |
| UC-CMS-02.1 | Thêm danh mục blog | Admin, Shop |
| UC-CMS-02.2 | Cập nhật danh mục blog | Admin, Shop |
| UC-CMS-02.3 | Xóa danh mục blog | Admin, Shop |
| **UC-CMS-03** | **Quản trị cấu hình trang chủ** | Admin, Shop |
| UC-CMS-03.1 | Cấu hình banner trang chủ | Admin, Shop |
| UC-CMS-03.2 | Cấu hình danh mục nổi bật | Admin, Shop |
| UC-CMS-03.3 | Cấu hình sản phẩm nổi bật | Admin, Shop |
| UC-CMS-03.4 | Cấu hình mã giảm giá nổi bật | Admin, Shop |
| **UC-CMS-04** | **Quản trị thông tin website** | Admin, Shop |
| UC-CMS-04.1 | Cập nhật thông tin liên hệ | Admin, Shop |
| UC-CMS-04.2 | Cập nhật chính sách | Admin, Shop |
| UC-CMS-04.3 | Cập nhật điều khoản sử dụng | Admin, Shop |
| **UC-CMS-05** | **Đăng nhập CMS** | Admin, Shop |
| **UC-CMS-06** | **Đăng xuất CMS** | Admin, Shop |

---

### B. COMMERCE SYSTEM - GUEST (Người dùng chưa đăng nhập)

| Mã UC | Tên Use Case | Actor |
|-------|-------------|-------|
| **UC-G-01** | **Xem sản phẩm** | Guest, User |
| UC-G-01.1 | Xem danh sách sản phẩm | Guest, User |
| UC-G-01.2 | Xem chi tiết sản phẩm | Guest, User |
| UC-G-01.3 | Xem sản phẩm theo danh mục | Guest, User |
| UC-G-01.4 | Xem sản phẩm đang sale | Guest, User |
| **UC-G-02** | **Tìm kiếm sản phẩm** | Guest, User |
| UC-G-02.1 | Tìm kiếm theo từ khóa | Guest, User |
| UC-G-02.2 | Lọc theo giá | Guest, User |
| UC-G-02.3 | Lọc theo danh mục | Guest, User |
| UC-G-02.4 | Lọc theo giới tính | Guest, User |
| UC-G-02.5 | Lọc sản phẩm còn hàng | Guest, User |
| UC-G-02.6 | Sắp xếp sản phẩm | Guest, User |
| **UC-G-03** | **Xem danh mục sản phẩm** | Guest, User |
| UC-G-03.1 | Xem danh sách danh mục | Guest, User |
| UC-G-03.2 | Xem danh mục cha | Guest, User |
| UC-G-03.3 | Xem danh mục con | Guest, User |
| UC-G-03.4 | Tìm kiếm danh mục | Guest, User |
| **UC-G-04** | **Xem đánh giá sản phẩm** | Guest, User |
| UC-G-04.1 | Xem danh sách đánh giá | Guest, User |
| UC-G-04.2 | Xem thống kê rating | Guest, User |
| UC-G-04.3 | Xem top đánh giá | Guest, User |
| **UC-G-05** | **Xem mã giảm giá** | Guest, User |
| UC-G-05.1 | Xem mã giảm giá đang hoạt động | Guest, User |
| UC-G-05.2 | Xem mã giảm giá theo danh mục | Guest, User |
| UC-G-05.3 | Xem mã giảm giá theo sản phẩm | Guest, User |
| **UC-G-06** | **Xem blog** | Guest, User |
| UC-G-06.1 | Xem danh sách blog | Guest, User |
| UC-G-06.2 | Xem chi tiết blog | Guest, User |
| UC-G-06.3 | Tìm kiếm blog | Guest, User |
| **UC-G-07** | **Đăng ký tài khoản** | Guest |
| UC-G-07.1 | Nhập thông tin đăng ký | Guest |
| UC-G-07.2 | Xác thực email | Guest |

---

### C. COMMERCE SYSTEM - USER (Người dùng đã đăng nhập)

| Mã UC | Tên Use Case | Actor |
|-------|-------------|-------|
| **UC-U-01** | **Đăng nhập hệ thống** | User |
| **UC-U-02** | **Đăng xuất hệ thống** | User |
| **UC-U-03** | **Quản lý hồ sơ cá nhân** | User |
| UC-U-03.1 | Xem thông tin cá nhân | User |
| UC-U-03.2 | Cập nhật thông tin cá nhân | User |
| UC-U-03.3 | Thay đổi mật khẩu | User |
| UC-U-03.4 | Cập nhật ảnh đại diện | User |
| **UC-U-04** | **Quản lý địa chỉ** | User |
| UC-U-04.1 | Thêm địa chỉ mới | User |
| UC-U-04.2 | Cập nhật địa chỉ | User |
| UC-U-04.3 | Xóa địa chỉ | User |
| UC-U-04.4 | Đặt địa chỉ mặc định | User |
| UC-U-04.5 | Tìm kiếm tỉnh/thành phố | User |
| UC-U-04.6 | Tìm kiếm quận/huyện/xã | User |
| **UC-U-05** | **Quản lý giỏ hàng** | User |
| UC-U-05.1 | Thêm sản phẩm vào giỏ | User |
| UC-U-05.2 | Cập nhật số lượng sản phẩm | User |
| UC-U-05.3 | Xóa sản phẩm khỏi giỏ | User |
| UC-U-05.4 | Xem giỏ hàng | User |
| UC-U-05.5 | Xóa toàn bộ giỏ hàng | User |
| UC-U-05.6 | Áp dụng mã giảm giá | User |
| UC-U-05.7 | Gỡ mã giảm giá | User |
| UC-U-05.8 | Kiểm tra số lượng sản phẩm | User |
| UC-U-05.9 | Xác thực giỏ hàng | User |
| UC-U-05.10 | Đồng bộ giá sản phẩm | User |
| **UC-U-06** | **Đặt hàng** | User |
| UC-U-06.1 | Xem lại đơn hàng | User |
| UC-U-06.2 | Chọn địa chỉ giao hàng | User |
| UC-U-06.3 | Chọn phương thức thanh toán | User |
| UC-U-06.4 | Xác nhận đặt hàng | User |
| **UC-U-07** | **Thanh toán đơn hàng** | User |
| UC-U-07.1 | Thanh toán bằng QR SePay | User |
| UC-U-07.2 | Kiểm tra trạng thái thanh toán | User |
| UC-U-07.3 | Nhận thông báo thanh toán realtime | User |
| **UC-U-08** | **Quản lý đơn hàng cá nhân** | User |
| UC-U-08.1 | Xem danh sách đơn hàng | User |
| UC-U-08.2 | Xem chi tiết đơn hàng | User |
| UC-U-08.3 | Xem đơn hàng theo mã | User |
| UC-U-08.4 | Hủy đơn hàng | User |
| UC-U-08.5 | Hủy nhiều đơn hàng cùng lúc | User |
| UC-U-08.6 | Yêu cầu trả hàng | User |
| UC-U-08.7 | Xem thống kê đơn hàng cá nhân | User |
| UC-U-08.8 | Theo dõi vận chuyển | User |
| **UC-U-09** | **Đánh giá sản phẩm** | User |
| UC-U-09.1 | Viết đánh giá sản phẩm | User |
| UC-U-09.2 | Cập nhật đánh giá | User |
| UC-U-09.3 | Xóa đánh giá | User |
| UC-U-09.4 | Xem đánh giá của mình | User |
| UC-U-09.5 | Like/Unlike đánh giá | User |
| UC-U-09.6 | Upload ảnh đánh giá | User |
| UC-U-09.7 | Kiểm tra quyền đánh giá | User |
| **UC-U-10** | **Kiểm tra mã giảm giá** | User |
| UC-U-10.1 | Kiểm tra tính hợp lệ mã giảm giá | User |
| UC-U-10.2 | Xem lịch sử sử dụng mã giảm giá | User |
| UC-U-10.3 | Kiểm tra mã có thể sử dụng | User |

---

### D. COMMERCE SYSTEM - SHOP (Quản lý cửa hàng)

| Mã UC | Tên Use Case | Actor |
|-------|-------------|-------|
| **UC-S-01** | **Đăng nhập hệ thống** | Shop |
| **UC-S-02** | **Đăng xuất hệ thống** | Shop |
| **UC-S-03** | **Xem thống kê** | Shop |
| UC-S-03.1 | Xem thống kê dashboard | Shop |
| UC-S-03.2 | Xem thống kê doanh thu | Shop |
| UC-S-03.3 | Xem phân bố trạng thái đơn hàng | Shop |
| UC-S-03.4 | Xem sản phẩm bán chạy | Shop |
| UC-S-03.5 | Xem hoạt động gần đây | Shop |
| UC-S-03.6 | Xem tăng trưởng người dùng | Shop |
| UC-S-03.7 | Xem hiệu suất danh mục | Shop |
| **UC-S-04** | **Quản lý sản phẩm** | Shop |
| UC-S-04.1 | Thêm sản phẩm mới | Shop |
| UC-S-04.2 | Cập nhật thông tin sản phẩm | Shop |
| UC-S-04.3 | Xóa sản phẩm | Shop |
| UC-S-04.4 | Xem danh sách sản phẩm (admin view) | Shop |
| UC-S-04.5 | Xuất bản sản phẩm | Shop |
| UC-S-04.6 | Ẩn sản phẩm | Shop |
| UC-S-04.7 | Upload ảnh sản phẩm | Shop |
| UC-S-04.8 | Quản lý biến thể sản phẩm | Shop |
| UC-S-04.9 | Kiểm tra tồn kho biến thể | Shop |
| UC-S-04.10 | Xem size có sẵn theo màu | Shop |
| **UC-S-05** | **Quản lý danh mục sản phẩm** | Shop |
| UC-S-05.1 | Thêm danh mục | Shop |
| UC-S-05.2 | Cập nhật danh mục | Shop |
| UC-S-05.3 | Xóa danh mục | Shop |
| UC-S-05.4 | Xuất bản/Ẩn danh mục | Shop |
| UC-S-05.5 | Upload ảnh danh mục | Shop |
| **UC-S-06** | **Quản lý mã giảm giá** | Shop |
| UC-S-06.1 | Tạo mã giảm giá | Shop |
| UC-S-06.2 | Cập nhật mã giảm giá | Shop |
| UC-S-06.3 | Xóa mã giảm giá | Shop |
| UC-S-06.4 | Xem danh sách mã giảm giá | Shop |
| UC-S-06.5 | Xem chi tiết mã giảm giá | Shop |
| **UC-S-07** | **Quản lý tồn kho** | Shop |
| UC-S-07.1 | Cập nhật tồn kho sản phẩm | Shop |
| UC-S-07.2 | Cập nhật tồn kho hàng loạt | Shop |
| UC-S-07.3 | Xem tổng quan tồn kho | Shop |
| UC-S-07.4 | Xem cảnh báo hàng sắp hết | Shop |
| **UC-S-08** | **Quản lý đơn hàng** | Shop |
| UC-S-08.1 | Xem danh sách đơn hàng | Shop |
| UC-S-08.2 | Xem chi tiết đơn hàng | Shop |
| UC-S-08.3 | Cập nhật trạng thái đơn hàng | Shop |
| UC-S-08.4 | Cập nhật thông tin vận chuyển | Shop |
| UC-S-08.5 | Cập nhật trạng thái thanh toán | Shop |
| UC-S-08.6 | Xem thống kê đơn hàng | Shop |
| UC-S-08.7 | Xem doanh thu | Shop |
| UC-S-08.8 | Tự động hủy đơn hàng pending | Shop |
| **UC-S-09** | **Xem lịch sử giao dịch** | Shop |
| UC-S-09.1 | Xem danh sách giao dịch | Shop |
| UC-S-09.2 | Xem chi tiết giao dịch | Shop |
| UC-S-09.3 | Xem thống kê giao dịch | Shop |
| **UC-S-10** | **Quản lý đánh giá** | Shop |
| UC-S-10.1 | Xem đánh giá chờ duyệt | Shop |
| UC-S-10.2 | Duyệt/Từ chối đánh giá | Shop |
| UC-S-10.3 | Xem thống kê đánh giá | Shop |
| UC-S-10.4 | Duyệt nhiều đánh giá cùng lúc | Shop |

---

### E. COMMERCE SYSTEM - ADMIN (Quản trị viên)

| Mã UC | Tên Use Case | Actor |
|-------|-------------|-------|
| **UC-A-01** | **Đăng nhập hệ thống** | Admin |
| **UC-A-02** | **Đăng xuất hệ thống** | Admin |
| **UC-A-03** | **Xem thống kê** | Admin |
| UC-A-03.1 | Xem thống kê dashboard | Admin |
| UC-A-03.2 | Xem thống kê doanh thu | Admin |
| UC-A-03.3 | Xem phân bố trạng thái đơn hàng | Admin |
| UC-A-03.4 | Xem sản phẩm bán chạy | Admin |
| UC-A-03.5 | Xem hoạt động gần đây | Admin |
| UC-A-03.6 | Xem tăng trưởng người dùng | Admin |
| UC-A-03.7 | Xem hiệu suất danh mục | Admin |
| **UC-A-04** | **Quản lý sản phẩm** | Admin |
| UC-A-04.1 | Thêm sản phẩm mới | Admin |
| UC-A-04.2 | Cập nhật thông tin sản phẩm | Admin |
| UC-A-04.3 | Xóa sản phẩm | Admin |
| UC-A-04.4 | Xem danh sách sản phẩm (admin view) | Admin |
| UC-A-04.5 | Xuất bản sản phẩm | Admin |
| UC-A-04.6 | Ẩn sản phẩm | Admin |
| UC-A-04.7 | Upload ảnh sản phẩm | Admin |
| UC-A-04.8 | Quản lý biến thể sản phẩm | Admin |
| UC-A-04.9 | Kiểm tra tồn kho biến thể | Admin |
| UC-A-04.10 | Xem size có sẵn theo màu | Admin |
| **UC-A-05** | **Quản lý danh mục sản phẩm** | Admin |
| UC-A-05.1 | Thêm danh mục | Admin |
| UC-A-05.2 | Cập nhật danh mục | Admin |
| UC-A-05.3 | Xóa danh mục | Admin |
| UC-A-05.4 | Xuất bản/Ẩn danh mục | Admin |
| UC-A-05.5 | Upload ảnh danh mục | Admin |
| **UC-A-06** | **Quản lý mã giảm giá** | Admin |
| UC-A-06.1 | Tạo mã giảm giá | Admin |
| UC-A-06.2 | Cập nhật mã giảm giá | Admin |
| UC-A-06.3 | Xóa mã giảm giá | Admin |
| UC-A-06.4 | Xem danh sách mã giảm giá | Admin |
| UC-A-06.5 | Xem chi tiết mã giảm giá | Admin |
| **UC-A-07** | **Quản lý tồn kho** | Admin |
| UC-A-07.1 | Cập nhật tồn kho sản phẩm | Admin |
| UC-A-07.2 | Cập nhật tồn kho hàng loạt | Admin |
| UC-A-07.3 | Xem tổng quan tồn kho | Admin |
| UC-A-07.4 | Xem cảnh báo hàng sắp hết | Admin |
| **UC-A-08** | **Quản lý đơn hàng** | Admin |
| UC-A-08.1 | Xem danh sách đơn hàng | Admin |
| UC-A-08.2 | Xem chi tiết đơn hàng | Admin |
| UC-A-08.3 | Cập nhật trạng thái đơn hàng | Admin |
| UC-A-08.4 | Cập nhật thông tin vận chuyển | Admin |
| UC-A-08.5 | Cập nhật trạng thái thanh toán | Admin |
| UC-A-08.6 | Xem thống kê đơn hàng | Admin |
| UC-A-08.7 | Xem doanh thu | Admin |
| UC-A-08.8 | Tự động hủy đơn hàng pending | Admin |
| **UC-A-09** | **Xem lịch sử giao dịch** | Admin |
| UC-A-09.1 | Xem danh sách giao dịch | Admin |
| UC-A-09.2 | Xem chi tiết giao dịch | Admin |
| UC-A-09.3 | Xem thống kê giao dịch | Admin |
| UC-A-09.4 | Xuất dữ liệu giao dịch | Admin |
| **UC-A-10** | **Quản trị người dùng** | Admin |
| UC-A-10.1 | Tạo người dùng mới | Admin |
| UC-A-10.2 | Xem danh sách người dùng | Admin |
| UC-A-10.3 | Cập nhật thông tin người dùng | Admin |
| UC-A-10.4 | Xóa người dùng | Admin |
| UC-A-10.5 | Phân quyền người dùng | Admin |
| **UC-A-11** | **Quản lý đánh giá** | Admin |
| UC-A-11.1 | Xem đánh giá chờ duyệt | Admin |
| UC-A-11.2 | Duyệt/Từ chối đánh giá | Admin |
| UC-A-11.3 | Xóa đánh giá | Admin |
| UC-A-11.4 | Xem thống kê đánh giá | Admin |
| UC-A-11.5 | Xem đánh giá theo người dùng | Admin |
| UC-A-11.6 | Duyệt nhiều đánh giá cùng lúc | Admin |
| **UC-A-12** | **Quản lý địa điểm** | Admin |
| UC-A-12.1 | Thêm tỉnh/thành phố | Admin |
| UC-A-12.2 | Thêm quận/huyện/xã | Admin |
| UC-A-12.3 | Cập nhật địa điểm | Admin |
| UC-A-12.4 | Xóa địa điểm | Admin |
| **UC-A-13** | **Quản lý API Key** | Admin |
| UC-A-13.1 | Tạo API Key | Admin |
| UC-A-13.2 | Vô hiệu hóa API Key | Admin |
| UC-A-13.3 | Xem danh sách API Key | Admin |

---

## TỔNG KẾT

### Số lượng Use Case theo nhóm:
- **CMS System**: 6 use case chính, 17 use case con
- **Guest**: 7 use case chính, 23 use case con
- **User**: 10 use case chính, 53 use case con
- **Shop**: 10 use case chính, 48 use case con
- **Admin**: 13 use case chính, 64 use case con

### Tổng cộng: 
- **46 use case chính**
- **205 use case con/chi tiết**

---

## GHI CHÚ

✅ **Đã tuân thủ quy tắc:**
1. Use case chính thể hiện nghiệp vụ tổng quát (vẽ trong Use Case Diagram)
2. Use case con thể hiện chi tiết chức năng (KHÔNG vẽ riêng, ghi trong đặc tả)
3. Phân cấp rõ ràng bằng ký hiệu thập phân (UC-XX.1, UC-XX.2...)
4. Actor được gán đúng theo phân quyền thực tế trong hệ thống
5. Danh sách đầy đủ hơn Use Case Diagram (không thiếu nghiệp vụ)

✅ **Dựa trên hệ thống thực tế:**
- Phân tích từ routes và controllers
- Bao gồm cả public và protected endpoints
- Phân quyền RBAC (Role-Based Access Control)
- Đầy đủ các chức năng CRUD và business logic

✅ **Không bao gồm:**
- Use case kỹ thuật (xác thực token, ghi log, đồng bộ...)
- Webhook và API internal
- System/Cron jobs (trừ khi admin trigger thủ công)
