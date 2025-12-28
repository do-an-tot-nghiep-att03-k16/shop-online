# 2.4. YÊU CẦU PHI CHỨC NĂNG

## 2.4.1. Bảo mật (Security)

### Xác thực và phân quyền
- **JWT Authentication**: 
  - Hệ thống sử dụng JWT (JSON Web Token) để xác thực người dùng
  - Access token (thời gian sống ngắn) và Refresh token (thời gian sống dài)
  - Token được lưu trữ trong Redis với TTL tự động expire
  - Token blacklist khi logout để vô hiệu hóa token cũ
  
- **Role-Based Access Control (RBAC)**: 
  - Phân quyền rõ ràng cho 3 vai trò: User, Shop, Admin
  - Sử dụng thư viện `accesscontrol` (v2.2.1) để quản lý permissions
  - Mỗi endpoint được bảo vệ bởi middleware kiểm tra quyền truy cập (grantAccess)
  - Permissions chi tiết cho từng resource: product, order, user, analytics, inventory
  - Phân biệt quyền Own (của user) và Any (của admin) cho từng action (read, create, update, delete)

### Mã hóa dữ liệu
- **Password Hashing**: 
  - Mật khẩu được mã hóa bằng bcrypt (v6.0.0) với salt rounds = 10
  - Không lưu trữ mật khẩu dạng plain text trong database
  - Password invalidation khi đổi mật khẩu (lưu timestamp trong Redis)
  
- **Secure Communication**:
  - API Key authentication cho external services (SePay webhook)
  - CORS configuration với whitelist origins cụ thể
  - Helmet middleware để set security headers (CSP, HSTS, X-Frame-Options...)
  - Webhook signature verification cho SePay payment webhook

### Bảo vệ API
- **API Key Management**:
  - Phân cấp API Key (0000 = public, 1111 = external services, 2222 = admin only)
  - Middleware kiểm tra API key trước khi xử lý request
  - Lưu trữ API keys trong database với status và permissions
  
- **HTTP Security Headers**: 
  - Sử dụng Helmet middleware để bảo vệ khỏi các lỗ hổng phổ biến
  - Content Security Policy, X-Content-Type-Options, X-Frame-Options
  - Strict-Transport-Security cho HTTPS

### Bảo vệ dữ liệu nhạy cảm
- **Email Verification**: 
  - Yêu cầu xác thực email khi đăng ký tài khoản
  - Token xác thực có thời hạn và chỉ sử dụng một lần
  
- **OTP for sensitive operations**: 
  - Mã OTP (One-Time Password) cho các thao tác nhạy cảm
  - OTP có thời gian hết hạn (5 phút)
  - Lưu trữ OTP trong MongoDB với TTL index tự động xóa

---

## 2.4.2. Hiệu năng (Performance)

### Tối ưu hóa Database
- **MongoDB Indexing** (Đã triển khai đầy đủ):
  - **Product**: slug, category_ids, status, SKU (unique), timestamps, text search (name + description)
  - **Order**: order_number, user_id + createdAt (compound), status, payment_status, items.product_id
  - **Review**: product + user (unique compound), product + rating, user, createdAt, status
  - **Cart**: user_id, status, updatedAt
  - **Coupon**: code, is_active + start_date + end_date (compound), type + visibility
  - **Transaction**: id (unique), content, order_id, createdAt
  - **Payment**: order_id + status, user_id + createdAt, transaction_code + status
  - **Category**: is_active, parentId
  
- **Query Optimization**:
  - Sử dụng projection để chỉ lấy các trường cần thiết
  - Populate references một cách thông minh (chỉ populate khi cần)
  - Pagination mặc định: 20 items/page cho products, orders
  - Select/Unselect helper functions để tối ưu query

### Caching Strategy
- **Redis Infrastructure** (Đã có nhưng dùng limited):
  - ✅ Cache JWT refresh tokens với TTL
  - ✅ Token blacklist khi logout
  - ✅ SSE session management cho realtime payment
  - ✅ Password invalidation timestamps
  - ⚠️ Chưa cache products/categories data (có thể mở rộng trong tương lai)

### Response Optimization
- **Compression Middleware**:
  - Sử dụng compression middleware để giảm response size
  - Exclude SSE endpoints (text/event-stream) khỏi compression
  - Giảm bandwidth và tăng tốc độ tải trang
  
- **Pagination & Filtering**:
  - Phân trang cho danh sách sản phẩm, đơn hàng
  - Lazy loading cho images ở frontend
  - Query string parsing với qs library (depth: 10, arrayLimit: 100)

### File Upload Optimization
- **Multiple Storage Providers**:
  - Cloudinary: Image hosting với CDN tích hợp
  - AWS S3 + CloudFront: Alternative storage với CDN
  - Multer middleware để xử lý multipart/form-data
  
- **Upload Constraints**:
  - File size limits để tránh overload server
  - Hỗ trợ multiple files upload (max 10 ảnh/sản phẩm)
  - Streamifier để upload buffer lên cloud storage

---

## 2.4.3. Khả năng mở rộng (Scalability)

### Kiến trúc hệ thống
- **Microservices Architecture**:
  - Backend Commerce (Node.js/Express) tách biệt với CMS (Strapi)
  - Frontend (React) giao tiếp với backend qua REST API
  - Dễ dàng scale từng service độc lập

### Database Scalability
- **MongoDB Replica Set**:
  - Hỗ trợ replication để tăng availability
  - Có thể scale horizontally bằng sharding khi cần
  
- **Redis Cluster**:
  - Redis hỗ trợ clustering cho high availability
  - Pub/Sub mechanism cho realtime features

### Horizontal Scaling
- **Stateless API**:
  - API server không lưu trữ state, dễ dàng scale horizontal
  - Session data lưu trong Redis
  - JWT authentication giúp distribute load dễ dàng
  
- **Load Balancer Ready**:
  - Hệ thống có thể deploy multiple instances
  - CORS configuration hỗ trợ multiple origins

### Extensibility
- **Plugin Architecture**:
  - Strapi CMS hỗ trợ custom plugins
  - Dễ dàng thêm payment gateway mới
  
- **Webhook Integration**:
  - Hỗ trợ webhook cho payment (SePay)
  - Có thể tích hợp thêm shipping providers
  - N8N workflow automation integration

---

## 2.4.4. Khả dụng (Usability)

### Giao diện người dùng
- **Responsive Design**:
  - Giao diện tương thích với mọi thiết bị (desktop, tablet, mobile)
  - Sử dụng TailwindCSS cho UI components
  - Ant Design components cho admin dashboard
  
- **User-Friendly Navigation**:
  - Menu navigation rõ ràng, dễ sử dụng
  - Breadcrumb navigation
  - Search và filter trực quan

### User Experience
- **Realtime Feedback**:
  - Loading states và skeleton screens
  - Toast notifications cho user actions
  - SSE (Server-Sent Events) cho realtime payment updates
  
- **Error Handling**:
  - Error messages rõ ràng, dễ hiểu
  - Validation messages cho form inputs
  - Error boundary component để catch runtime errors
  
- **Accessibility**:
  - Semantic HTML
  - Keyboard navigation support
  - Screen reader friendly

### Admin Experience
- **Dashboard Analytics**:
  - Visualize data với charts và graphs
  - Real-time statistics
  - Export data functionality
  
- **Batch Operations**:
  - Bulk update cho inventory
  - Bulk approve cho reviews
  - Bulk cancel orders

---

## 2.4.5. Độ tin cậy (Reliability)

### Error Handling & Recovery
- **Comprehensive Error Handling**:
  - AsyncHandler wrapper cho tất cả async route handlers
  - Try-catch blocks trong services và repositories
  - Centralized error handling middleware với 404 và 500 handlers
  - Structured error responses (BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError...)
  - Custom error classes extend từ base Error class
  
- **Validation & Business Rules**:
  - Cart validation trước khi checkout (stock, price sync)
  - Coupon validation với business rules phức tạp
  - Order review mechanism để verify trước khi tạo order
  - Stock quantity checks để tránh overselling

### Data Integrity
- **Schema Validation**:
  - MongoDB schema validation với required fields, enums, min/max values
  - Unique constraints (email, slug, SKU, order_number)
  - Data type enforcement (String, Number, Date, ObjectId)
  - Match patterns (color_code: /^#[0-9A-F]{6}$/i)
  
- **Referential Integrity**:
  - MongoDB ObjectId references với populate
  - Manual validation khi delete (check có orders liên quan không)
  - Soft delete pattern cho một số entities
  
- **Business Logic Validation**:
  - Stock quantity >= 0
  - Discount percent 0-100%
  - Rating 0-5 stars
  - Order status transitions (pending → confirmed → shipping → delivered)
  - Payment status validation

### Data Consistency
- **Optimistic Concurrency Control**:
  - Version field trong schema để detect conflicts
  - Retry mechanism khi có conflicts
  
- **Data Synchronization**:
  - Cart price sync với product base_price
  - Stock update khi đặt hàng (deduct stock)
  - Auto-cancel pending orders sau timeout

---

## 2.4.6. Khả năng bảo trì (Maintainability)

### Code Quality
- **Clean Code Practices**:
  - Separation of concerns (Controllers, Services, Repositories)
  - DRY (Don't Repeat Yourself) principles
  - Consistent naming conventions
  
- **Modular Architecture**:
  - Feature-based folder structure
  - Reusable components và services
  - Utility functions tách biệt

### Documentation
- **Code Documentation**:
  - Comments cho business logic phức tạp
  - JSDoc cho functions và classes
  
- **API Documentation**:
  - RESTful API endpoints documentation
  - Request/Response examples
  - Error codes và meanings

### Version Control
- **Git Workflow**:
  - Feature branches
  - Pull request reviews
  - Semantic versioning
  
- **Environment Configuration**:
  - Separate configs cho dev/staging/production
  - Environment variables cho sensitive data (.env files)

---

## 2.4.7. Tính tương thích (Compatibility)

### Browser Compatibility
- **Modern Browsers**:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
  
- **Responsive Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### API Compatibility
- **RESTful Standards**:
  - HTTP methods chuẩn (GET, POST, PUT, PATCH, DELETE)
  - JSON format cho request/response
  - HTTP status codes chuẩn
  
- **Versioning**:
  - API versioning (/v1/api/)
  - Backward compatibility cho API changes

### Third-party Integration
- **Payment Gateway**:
  - SePay QR payment integration
  - Webhook handler cho payment confirmation
  
- **Cloud Services**:
  - Cloudinary cho image management
  - AWS S3 cho file storage
  
- **CMS Integration**:
  - Strapi headless CMS
  - REST API communication giữa frontend và CMS

---

## 2.4.8. Tính tuân thủ (Compliance)

### Security Best Practices
- **OWASP Guidelines**:
  - NoSQL injection prevention (MongoDB query sanitization)
  - XSS protection (Helmet middleware)
  - CSRF protection thông qua CORS policy
  - Secure headers configuration
  - Input validation và sanitization

### Data Protection
- **Password Security**:
  - Bcrypt hashing với salt rounds = 10
  - Không log passwords
  - Password change invalidates old tokens
  
- **Sensitive Data Handling**:
  - Environment variables cho credentials (.env files)
  - Không commit secrets vào Git (.gitignore configured)
  - API keys stored securely trong database

---

## 2.5. YÊU CẦU TƯƠNG LAI (Future Requirements)

Các yêu cầu phi chức năng sau có thể được bổ sung trong các phiên bản tiếp theo:

### 2.5.1. Testing & Quality Assurance
- **Unit Testing**: Jest/Mocha cho services và repositories
- **Integration Testing**: Test API endpoints
- **E2E Testing**: Cypress/Playwright cho frontend flows
- **Code Coverage**: Mục tiêu > 80%

### 2.5.2. Monitoring & Logging
- **Application Monitoring**: New Relic, DataDog hoặc Prometheus
- **Structured Logging**: Winston hoặc Pino logger
- **Error Tracking**: Sentry cho error reporting
- **Performance Metrics**: Response time, throughput, error rates

### 2.5.3. Enhanced Performance
- **Rate Limiting**: Express-rate-limit middleware để chống DDoS
- **Advanced Caching**: Redis cache cho products, categories, settings
- **Query Caching**: MongoDB query result caching
- **Image Optimization**: Automatic resize và format conversion

### 2.5.4. Backup & Disaster Recovery
- **Automated Backups**: Daily MongoDB backups với retention policy
- **Point-in-time Recovery**: Backup strategy cho critical data
- **Disaster Recovery Plan**: Documented procedures
- **Redis Persistence**: Configure RDB + AOF for data durability

### 2.5.5. Compliance & Governance
- **GDPR Compliance**: 
  - User data export functionality
  - Right to be forgotten (data deletion)
  - Privacy policy management in CMS
- **Audit Logging**: Track admin actions và data changes
- **Data Retention Policy**: Auto-delete old data theo quy định

### 2.5.6. Documentation
- **API Documentation**: Swagger/OpenAPI specification
- **Architecture Documentation**: System design diagrams
- **Deployment Guide**: Step-by-step deployment instructions
- **Development Guide**: Setup hướng dẫn cho developers mới

### 2.5.7. Advanced Features
- **GraphQL API**: Alternative to REST API
- **Microservices Orchestration**: Kubernetes hoặc Docker Swarm
- **Message Queue**: RabbitMQ hoặc Kafka cho async processing
- **Search Engine**: Elasticsearch cho full-text search nâng cao
