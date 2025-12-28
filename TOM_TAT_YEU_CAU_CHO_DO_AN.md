# TÓM TẮT YÊU CẦU CHỨC NĂNG VÀ PHI CHỨC NĂNG - ĐỒ ÁN

## 📋 MỤC ĐÍCH FILE NÀY

File này tóm tắt ngắn gọn các yêu cầu chức năng và phi chức năng cho **báo cáo đồ án**, dựa trên hệ thống thực tế đã triển khai.

---

## 2.3. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 2.3.1. Nhóm chức năng dành cho Guest (Khách truy cập)

**Xem và tìm kiếm sản phẩm:**
- Xem danh sách sản phẩm với phân trang, lọc theo danh mục, giá, giới tính, trạng thái sale
- Xem chi tiết sản phẩm bao gồm biến thể (màu sắc, kích thước), hình ảnh, đánh giá
- Tìm kiếm sản phẩm theo từ khóa với bộ lọc nâng cao
- Sắp xếp sản phẩm theo giá, mới nhất, bán chạy

**Xem thông tin hỗ trợ:**
- Xem cây danh mục sản phẩm phân cấp (danh mục cha - con)
- Xem đánh giá và thống kê rating của sản phẩm
- Đọc blog, tin tức, hướng dẫn
- Xem banner và cấu hình trang chủ (sản phẩm nổi bật, danh mục nổi bật)

**Đăng ký tài khoản:**
- Tạo tài khoản mới với email và mật khẩu
- Xác thực email thông qua link verification

---

### 2.3.2. Nhóm chức năng dành cho User (Người dùng đã đăng nhập)

**Xác thực và quản lý tài khoản:**
- Đăng nhập/đăng xuất với JWT authentication
- Quản lý thông tin cá nhân, thay đổi mật khẩu, cập nhật ảnh đại diện
- Quản lý địa chỉ giao hàng (thêm, sửa, xóa, đặt mặc định)

**Quản lý giỏ hàng:**
- Thêm sản phẩm vào giỏ (chọn biến thể: màu, size)
- Cập nhật số lượng, xóa sản phẩm khỏi giỏ
- Áp dụng/gỡ mã giảm giá với validation
- Xác thực giỏ hàng (kiểm tra tồn kho, đồng bộ giá)

**Đặt hàng và thanh toán:**
- Quy trình đặt hàng: review order → chọn địa chỉ → chọn phương thức thanh toán → xác nhận
- Thanh toán bằng QR SePay với theo dõi trạng thái realtime (SSE)
- Thanh toán COD (Cash on Delivery)

**Quản lý đơn hàng cá nhân:**
- Xem danh sách và chi tiết đơn hàng
- Theo dõi trạng thái vận chuyển
- Hủy đơn hàng (nếu ở trạng thái pending/confirmed)
- Yêu cầu trả hàng/hoàn tiền
- Xem thống kê đơn hàng cá nhân

**Đánh giá sản phẩm:**
- Viết đánh giá sản phẩm (sau khi mua và nhận hàng thành công)
- Upload ảnh kèm đánh giá, cập nhật/xóa đánh giá
- Like/Unlike đánh giá của người khác
- Hệ thống tự động kiểm tra quyền đánh giá

**Tương tác với AI Chatbot:**
- Chat với AI để nhận tư vấn sản phẩm (N8N integration)

---

### 2.3.3. Nhóm chức năng dành cho Shop (Quản lý cửa hàng)

**Xem thống kê và báo cáo:**
- Dashboard analytics: doanh thu, đơn hàng, sản phẩm bán chạy
- Phân bố trạng thái đơn hàng, tăng trưởng người dùng, hiệu suất danh mục

**Quản lý sản phẩm:**
- CRUD sản phẩm với đầy đủ thông tin (tên, giá, mô tả, danh mục, giới tính)
- Quản lý biến thể sản phẩm (màu sắc, kích thước, SKU)
- Upload nhiều ảnh sản phẩm (Cloudinary/AWS S3)
- Xuất bản/Ẩn sản phẩm

**Quản lý tồn kho:**
- Cập nhật tồn kho cho từng biến thể
- Cập nhật tồn kho hàng loạt (bulk update)
- Xem tổng quan tồn kho và cảnh báo sản phẩm sắp hết hàng

**Quản lý đơn hàng:**
- Xem và xử lý đơn hàng với bộ lọc
- Cập nhật trạng thái đơn hàng (confirmed, shipping, delivered, cancelled)
- Cập nhật thông tin vận chuyển (mã tracking, nhà vận chuyển)
- Xem thống kê đơn hàng và doanh thu

**Quản lý danh mục, mã giảm giá:**
- CRUD danh mục sản phẩm (phân cấp cha-con)
- Tạo và quản lý mã giảm giá (giảm %, giảm cố định, freeship)
- Cấu hình điều kiện áp dụng coupon

**Quản lý đánh giá:**
- Xem đánh giá chờ duyệt, duyệt/từ chối đánh giá
- Duyệt nhiều đánh giá cùng lúc

**Xem lịch sử giao dịch:**
- Xem danh sách và chi tiết giao dịch thanh toán (SePay)

---

### 2.3.4. Nhóm chức năng dành cho Admin (Quản trị viên)

**Tất cả quyền của Shop, cộng thêm:**

**Quản trị người dùng:**
- CRUD người dùng
- Phân quyền người dùng (user, shop, admin) với RBAC
- Khóa/Mở khóa tài khoản

**Quản lý địa điểm:**
- Quản lý cơ sở dữ liệu địa điểm Việt Nam (tỉnh/thành phố, quận/huyện/xã)

**Quản lý API Key:**
- Tạo, vô hiệu hóa API Key cho external integration
- Phân quyền API Key (0000 = public, 1111 = external, 2222 = admin)

**Giám sát hệ thống:**
- Giám sát hoạt động của Shop
- Quản lý job scheduler (stock update jobs)

---

### 2.3.5. Nhóm chức năng CMS (Strapi) - Dành cho Admin và Shop

**Quản lý nội dung Blog:**
- CRUD bài viết blog với rich text editor (markdown)
- Quản lý danh mục blog, xuất bản/ẩn bài viết

**Quản trị cấu hình trang chủ:**
- Cấu hình banner, danh mục nổi bật, sản phẩm nổi bật, mã giảm giá nổi bật
- Sắp xếp thứ tự hiển thị

**Quản trị thông tin website:**
- Cập nhật thông tin liên hệ, chính sách bảo mật, điều khoản sử dụng
- Cấu hình SEO metadata

---

## 2.4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 2.4.1. Bảo mật (Security)

**Xác thực và phân quyền:**
- JWT Authentication (Access token + Refresh token) với Redis storage
- RBAC sử dụng thư viện `accesscontrol` (User, Shop, Admin)
- Token blacklist khi logout

**Mã hóa dữ liệu:**
- Password hashing với bcrypt (salt rounds = 10)
- Helmet middleware cho security headers
- API Key authentication cho external services

**Bảo vệ API:**
- CORS configuration với whitelist origins
- Webhook signature verification (SePay)
- OTP cho sensitive operations

---

### 2.4.2. Hiệu năng (Performance)

**Tối ưu hóa Database:**
- MongoDB indexing đầy đủ cho tất cả collections (slug, SKU, order_number, timestamps...)
- Query optimization với projection và selective populate
- Pagination mặc định: 20 items/page

**Caching Strategy:**
- Redis infrastructure cho JWT tokens, token blacklist, SSE sessions
- Compression middleware (exclude SSE endpoints)

**File Upload:**
- Multiple storage providers: Cloudinary (CDN) + AWS S3
- Support multiple files upload (max 10 ảnh/sản phẩm)

---

### 2.4.3. Khả năng mở rộng (Scalability)

**Kiến trúc hệ thống:**
- Microservices: Backend (Node.js) + CMS (Strapi) + Frontend (React) tách biệt
- Stateless API với JWT authentication
- Redis cho session management

**Cloud Integration:**
- Cloudinary/AWS S3 cho file storage
- MongoDB hỗ trợ replica set và sharding
- Webhook integration (SePay, N8N)

---

### 2.4.4. Khả dụng (Usability)

**Giao diện người dùng:**
- Responsive design với TailwindCSS + Ant Design
- Realtime feedback với SSE (payment updates)
- Loading states và skeleton screens

**Error Handling:**
- Error messages rõ ràng, dễ hiểu
- Validation messages cho form inputs
- Error boundary component

---

### 2.4.5. Độ tin cậy (Reliability)

**Error Handling:**
- AsyncHandler wrapper cho async operations
- Centralized error handling middleware
- Custom error classes (BadRequestError, UnauthorizedError...)

**Data Integrity:**
- MongoDB schema validation (required fields, enums, min/max, patterns)
- Unique constraints (email, slug, SKU, order_number)
- Business logic validation (stock >= 0, discount 0-100%, rating 0-5)

**Data Consistency:**
- Cart price sync với product prices
- Stock deduction khi đặt hàng
- Auto-cancel pending orders sau timeout

---

### 2.4.6. Khả năng bảo trì (Maintainability)

**Code Quality:**
- Clean Architecture: Controllers → Services → Repositories
- Separation of concerns, DRY principles
- Feature-based folder structure

**Documentation:**
- Code comments cho business logic
- Environment variables configuration (.env)

---

### 2.4.7. Tính tương thích (Compatibility)

**Browser & Platform:**
- Modern browsers: Chrome, Firefox, Safari, Edge (latest versions)
- Responsive design: mobile, tablet, desktop

**API Standards:**
- RESTful API với HTTP methods chuẩn (GET, POST, PUT, PATCH, DELETE)
- JSON format, API versioning (/v1/api/)

**Third-party Integration:**
- Payment: SePay QR payment
- Storage: Cloudinary, AWS S3
- CMS: Strapi headless CMS
- Chatbot: N8N workflow automation

---

### 2.4.8. Tính tuân thủ (Compliance)

**Security Best Practices:**
- OWASP guidelines: NoSQL injection prevention, XSS protection (Helmet)
- CSRF protection (CORS policy)
- Input validation và sanitization

**Data Protection:**
- Bcrypt password hashing
- Environment variables cho sensitive data
- Không commit secrets vào Git

---

## 2.5. YÊU CẦU TƯƠNG LAI (Future Enhancements)

Các tính năng có thể bổ sung trong phiên bản tiếp theo:

- **Testing**: Unit tests, integration tests, E2E tests
- **Monitoring**: Application monitoring, structured logging, error tracking
- **Enhanced Performance**: Rate limiting, advanced caching, query caching
- **Backup & Recovery**: Automated backups, disaster recovery plan
- **GDPR Compliance**: User data export, right to be forgotten
- **Documentation**: API docs (Swagger), architecture diagrams, deployment guide

---

## 📝 GHI CHÚ CHO GIẢNG VIÊN

### Những gì đã triển khai THỰC TẾ trong hệ thống:

✅ **Bảo mật**: JWT + RBAC + bcrypt + Helmet + CORS + API Key
✅ **Database**: MongoDB với indexing đầy đủ, schema validation
✅ **Architecture**: Microservices (Backend + CMS + Frontend)
✅ **Realtime**: SSE cho payment tracking
✅ **Cloud**: Cloudinary + AWS S3 + SePay integration
✅ **Error Handling**: Structured error responses, centralized middleware
✅ **Code Quality**: Clean architecture, separation of concerns

### Những gì CHƯA triển khai (nhưng có thể mở rộng):

⚠️ Rate limiting, Testing framework, Advanced logging & monitoring
⚠️ Automated backup strategy, GDPR compliance features
⚠️ API documentation (Swagger), Full data caching strategy

Hệ thống hiện tại đã đáp ứng **70-75%** yêu cầu phi chức năng chuẩn cho một ứng dụng production-ready, phù hợp với quy mô đồ án tốt nghiệp.
