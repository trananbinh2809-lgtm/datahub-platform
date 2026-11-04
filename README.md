# DATAHUB — NỀN TẢNG CHUẨN HÓA DỮ LIỆU VÀ CỘNG TÁC TRỰC TUYẾN

> **DataHub** là nền tảng quản lý repository dữ liệu, chuẩn hóa dữ liệu tự động, quản lý phiên bản snapshot kiểu Git và cộng tác chat nhóm theo thời gian thực chuẩn Enterprise.

---

## I. TỔNG QUAN KIẾN TRÚC VÀ CÔNG NGHỆ

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, React Router v7.
- **Backend API & Real-time:** Express REST API Server (`server.ts`) kết hợp Vite Middlewares (Zero-configuration live runtime) và mô hình ASP.NET Core 10 Web API (`backend/src/DataHub.Api`).
- **Data Persistence:** Cơ sở dữ liệu quan hệ với các bảng Users (Identity), Projects, Datasets, DatasetVersions, NormalizationRules, Conversations, Messages, Notifications, ActivityLogs.
- **Real-time Engine:** SignalR / Server-Sent Events (SSE) đồng bộ tin nhắn, thông báo và sự kiện tạo phiên bản mới tức thời.
- **Data Normalization Engine:** Bộ xử lý chuỗi quy tắc (Pipeline): Trim, Multiple Spaces, Title Case (Họ tên tiếng Việt), Email, Số điện thoại VN (+84/0), Ngày tháng (ISO 8601), Xử lý ô trống/NULL, Khử trùng lặp (Deduplicate), Tìm kiếm/Thay thế.

---

## II. CẤU TRÚC THƯ MỤC DỰ ÁN

```
DataHub/
├── docs/
│   ├── architecture.md          # Đặc tả kiến trúc hệ thống 3 lớp & luồng dữ liệu
│   ├── database.md              # Sơ đồ thực thể quan hệ ERD & từ điển dữ liệu
│   └── api.md                   # Tài liệu chi tiết các RESTful API endpoints & DTOs
│
├── database/
│   ├── scripts/
│   │   └── 01_create_tables.sql # DDL script tạo cơ sở dữ liệu trên SQL Server
│   └── seed/
│       └── 01_seed_initial_data.sql # Dữ liệu khởi tạo (Admin, Presets, Sample data)
│
├── backend/                     # Mã nguồn Backend ASP.NET Core Web API (.NET 10)
│   ├── DataHub.sln              # Solution file Visual Studio
│   └── src/DataHub.Api/
│       ├── DataHub.Api.csproj
│       ├── Program.cs           # Cấu hình DI, CORS, JWT, SignalR Hub, Swagger
│       ├── appsettings.json     # Chuỗi kết nối SQL Server và JWT Secret
│       ├── Data/
│       │   └── ApplicationDbContext.cs # Entity Framework Core DbContext
│       └── Models/Entities/     # Các thực thể C# mapping với Database
│
├── src/                         # Frontend React & Live Fullstack Runtime
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces cho Entities, DTOs & API
│   ├── services/
│   │   └── apiClient.ts         # HTTP Client với Token Interceptor & Error handler
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Quản lý phiên đăng nhập, RBAC & user profile
│   │   └── ThemeContext.tsx     # Điều phối Light / Dark mode
│   ├── components/common/       # Button, Input, Modal, Badge, Card, LoadingSpinner
│   ├── layouts/
│   │   ├── MainLayout.tsx       # Bố cục chính với Sidebar & Navbar
│   │   ├── AuthLayout.tsx       # Bố cục trang Đăng nhập / Đăng ký
│   │   ├── Navbar.tsx           # Thanh điều hướng trên: Tìm kiếm, Thông báo, User Menu
│   │   └── Sidebar.tsx          # Thanh bên: Dashboard, Projects, Datasets, Normalization...
│   ├── pages/
│   │   ├── auth/                # LoginPage, RegisterPage
│   │   ├── dashboard/           # DashboardPage (Thống kê thực tế từ DB)
│   │   ├── projects/            # ProjectsPage, ProjectDetailPage (Members RBAC)
│   │   ├── datasets/            # DatasetsPage (Trình xem bảng tính, tải CSV, xuất CSV)
│   │   ├── normalization/       # NormalizationPage (Quy tắc, so sánh Original vs Cleaned)
│   │   ├── versions/            # VersionsPage (Lịch sử commits, Diff viewer, Rollback)
│   │   ├── chat/                # ChatPage (Phòng chat chung & kênh dự án thời gian thực)
│   │   ├── notifications/       # NotificationsPage (Xem & đánh dấu đã đọc)
│   │   ├── profile/             # ProfilePage (Cập nhật họ tên, bio, avatar)
│   │   ├── settings/            # SettingsPage (Đổi mật khẩu, chuyển theme)
│   │   └── admin/               # AdminPage (SystemAdmin: Khóa/mở khóa user, Audit logs)
│   ├── server/                  # Bộ xử lý backend API phục vụ môi trường chạy trực tiếp
│   │   ├── db.ts                # In-memory & Transactional Store có seed dữ liệu
│   │   ├── normalizationEngine.ts # Thuật toán xử lý chuẩn hóa dữ liệu & tính toán Diff
│   │   └── apiRouter.ts         # Toàn bộ REST API routes & SSE Server-Sent Events
│   ├── routes/
│   │   └── AppRoutes.tsx        # Cấu hình Route Guards (Protected / Public Only)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # Tailwind CSS v4 styling
│
├── server.ts                    # Full-stack Server kết hợp Express + Vite middlewares
├── package.json
└── README.md
```

---

## III. TÀI KHOẢN MẪU KHỞI TẠO (TEST CREDENTIALS)

Hệ thống đã có sẵn 2 tài khoản mặc định và nút điền nhanh (Quick Fill) tại trang Đăng nhập:

| Vai trò | Email đăng nhập | Username | Mật khẩu mặc định | Ghi chú quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **SystemAdmin** | `admin@datahub.vn` | `admin` | `DataHub@2026` | Quản trị viên tối cao: Quyền mở/khóa tài khoản, xem toàn bộ audit log & quản trị |
| **Data Engineer** | `nguyenvana@datahub.vn` | `nguyenvana` | `DataHub@2026` | Thành viên kỹ thuật: Tải dataset, chạy chuẩn hóa, tạo phiên bản, trao đổi chat |

---

## IV. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18+ hoặc LTS mới nhất.
- **Trình duyệt**: Chrome, Edge, Firefox hoặc Safari phiên bản mới.
- *(Nếu phát triển Backend .NET)*: .NET SDK 10 và SQL Server (Developer hoặc Express Edition).

### 2. Chạy ứng dụng Full-Stack trực tiếp (Khuyên dùng)
Ứng dụng đã được tích hợp toàn bộ API backend, database store và giao diện React thông qua `server.ts`:

#### Trên Windows (PowerShell):
```powershell
# 1. Cài đặt các gói thư viện
npm install

# 2. Khởi động máy chủ full-stack
npm run dev
```

#### Trên Linux / macOS (Bash):
```bash
npm install
npm run dev
```

Truy cập trình duyệt tại địa chỉ: **`http://localhost:3000`**

### 3. Hướng dẫn chạy Backend ASP.NET Core với SQL Server (Khi triển khai riêng biệt)
Nếu bạn muốn chạy backend C# tách biệt trên Windows với Visual Studio:

1. **Khởi tạo cơ sở dữ liệu trên SQL Server Management Studio (SSMS):**
   - Mở SSMS, kết nối tới SQL Server Localhost.
   - Mở và chạy file: `database/scripts/01_create_tables.sql`.
   - Chạy tiếp file seed: `database/seed/01_seed_initial_data.sql`.

2. **Chạy dự án ASP.NET Core qua PowerShell:**
   Trước khi chạy, đặt khóa JWT riêng qua biến môi trường JwtSettings__Secret. Tạo khóa tạm cho phiên PowerShell hiện tại bằng lệnh sau; ở môi trường triển khai, cấu hình khóa trong phần quản lý bí mật của môi trường đó.
```powershell
$jwtBytes = New-Object byte[] 32
$jwtRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtRng.GetBytes($jwtBytes)
$env:JwtSettings__Secret = [Convert]::ToBase64String($jwtBytes)
$jwtRng.Dispose()
cd backend/src/DataHub.Api
dotnet restore
dotnet build
dotnet run
```
API Swagger sẽ khả dụng tại: `https://localhost:7001/swagger`

---

## V. CÁC KỊCH BẢN KIỂM THỬ TÍNH NĂNG (TEST CASES)

1. **Kiểm thử Đăng nhập & RBAC:**
   - Đăng nhập với tài khoản `admin@datahub.vn` -> Kiểm tra Dashboard hiển thị số liệu thực và thanh Sidebar có mục "Trang Quản trị (Admin)".
   - Đăng xuất -> Đăng nhập bằng `nguyenvana@datahub.vn` -> Mục Admin tự động ẩn theo đúng phân quyền.
2. **Kiểm thử Tập dữ liệu (Datasets):**
   - Vào menu **Tập dữ liệu** -> Nhấp vào dataset mẫu "Danh sách khách hàng thô (Raw Leads)".
   - Xem bảng tính (Spreadsheet), kiểm tra các ô rỗng được đánh dấu màu đỏ `[EMPTY/NULL]`.
   - Nhấp **Tải xuống CSV** để kiểm tra xuất file chuẩn UTF-8.
3. **Kiểm thử Bộ máy Chuẩn hóa (Normalization Engine):**
   - Vào menu **Chuẩn hóa dữ liệu** -> Nhấp **Chạy thử & Xem trước**.
   - Kiểm tra bảng đối chiếu trước và sau: Tên được chuyển sang Title Case ("nguyễn văn an" -> "Nguyễn Văn An"), SĐT được chuẩn hóa thành 10 số, Email về chữ thường, ô rỗng được điền `N/A`, dòng số 6 bị khử do trùng lặp!
   - Nhập thông điệp commit và bấm **Xác nhận Áp dụng & Tạo Phiên Bản**.
4. **Kiểm thử Lịch sử Phiên bản kiểu Git (Versions & Diff):**
   - Vào menu **Phiên bản & Diff (Git)** -> Kiểm tra commit mới đã được ghi nhận vào timeline.
   - Chọn 2 phiên bản và bấm **So sánh Diff** để xem chi tiết từng dòng Added, Modified và Removed.
   - Thử bấm **Rollback** để khôi phục phiên bản ban đầu một cách an toàn.
5. **Kiểm thử Chat thời gian thực:**
   - Vào menu **Phòng Chat & Cộng tác** -> Gửi tin nhắn -> Tin nhắn hiển thị tức thì qua luồng SSE.

---

## VI. BẢO MẬT VÀ NGUYÊN TẮC THIẾT KẾ
- Mật khẩu được băm an toàn một chiều (không bao giờ lưu mật khẩu dạng plaintext).
- Xác thực qua Bearer Token có thời hạn và kiểm tra quyền tại Backend API cho từng endpoint.
- Dữ liệu snapshot được giữ nguyên vẹn qua các commit, ngăn chặn tình trạng mất dữ liệu người dùng.
