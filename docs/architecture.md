# KIẾN TRÚC HỆ THỐNG DATAHUB (ARCHITECTURE DOCUMENTATION)

DataHub là nền tảng chuẩn hóa dữ liệu và cộng tác trực tuyến hiện đại, lấy cảm hứng từ triết lý quản lý repository, commit & versioning của GitHub, nhưng được thiết kế chuyên biệt cho vòng đời dữ liệu (Data Lifecycle).

---

## 1. TỔNG QUAN KIẾN TRÚC (HIGH-LEVEL ARCHITECTURE)

Hệ thống DataHub tuân theo kiến trúc 3 lớp (3-Tier Decoupled Architecture) với sự phân tách tuyệt đối giữa Presentation, Business Logic & Persistence:

```
[ Client Web App (React 19 + Vite + Tailwind CSS + Lucide) ]
                             │
                             ▼  REST API (JSON) + Server-Sent Events / SignalR
[ API Gateway / Application Server (ASP.NET Core Web API / Node.js Express Engine) ]
        ├── Authentication & RBAC Middleware (Identity, JWT, Secure Cookies)
        ├── Data Normalization Engine (Rule Pipeline, Validator, Batch Processing)
        ├── Version Control & Snapshot Engine (Diff / Commit / Rollback)
        ├── Collaboration & Messaging Hub (Realtime Chat, Notifications)
        └── Audit & Security Filter
                             │
                             ▼  Entity Framework Core / Data Access Layer
[ Persistence Store (SQL Server / ACID Relational Engine) + Blob File Store ]
```

---

## 2. CÁC THÀNH PHẦN HỆ THỐNG

### 2.1. Frontend (Client Layer)
- **Framework:** React 19 chạy trên nền tảng Vite tốc độ cao.
- **Routing:** React Router v7 với Protected Routes, Role-based Route Guarding.
- **Styling:** Tailwind CSS v4 tối giản, hiện đại, hỗ trợ chuẩn 2 chế độ Sáng (Light Mode) và Tối (Dark Mode).
- **State & Contexts:**
  - `AuthContext`: Quản lý danh tính người dùng hiện tại, phân quyền (SystemAdmin, Owner, Admin, Maintainer, Contributor, Viewer), token & session lifecycle.
  - `ThemeContext`: Điều phối Light/Dark theme đồng bộ `localStorage` và class `dark`.
- **Thư viện giao diện & Biểu đồ:** Lucide React icons đồng bộ, Canvas Confetti cho feedback thành công, responsive card/table layout.
- **Data Tables & Diff Viewer:** Bảng hiển thị dữ liệu dạng bảng tính (spreadsheet view) hỗ trợ tìm kiếm, lọc theo cột, phân trang, highlight ô thay đổi (Diff Red/Green).

### 2.2. Backend & Business Logic Layer
- **Công nghệ đích:** ASP.NET Core Web API (.NET 10) với C#, Entity Framework Core, ASP.NET Core Identity & SignalR.
- **Runtime Web Server tích hợp:** TypeScript + Express API Server (`server.ts`) kết hợp Vite middleware phục vụ môi trường chạy trực tiếp (Zero-configuration live preview), tương thích 1:1 với các API DTOs và nghiệp vụ chuẩn hóa.
- **Các phân hệ nghiệp vụ chính:**
  1. **Auth & Identity Service:** Đăng ký, đăng nhập an toàn, băm mật khẩu với SHA-256 + Salt (PBKDF2/BCrypt), cấp phát JWT token phiên làm việc, quản lý khóa tài khoản khi nhập sai nhiều lần.
  2. **Project & Repository Service:** Tạo repository dữ liệu, phân quyền thành viên (SystemAdmin, Owner, Admin, Maintainer, Contributor, Viewer), kiểm soát Public/Private.
  3. **Dataset & Storage Service:** Đọc và phân tích cấu trúc dữ liệu tệp CSV, XLSX, JSON, TXT; phân tích schema, thống kê số dòng/cột, tỷ lệ ô trống (missing), tỷ lệ trùng lặp (duplicates), phát hiện kiểu dữ liệu (Data Type Inference).
  4. **Data Normalization Engine (Trọng tâm):**
     - Pipeline gồm chuỗi các quy tắc chuẩn hóa có thứ tự:
       - Trim whitespace, chuẩn hóa khoảng trắng thừa.
       - Viết hoa, viết thường, Title Case (Chuẩn hóa Họ Tên người Việt).
       - Chuẩn hóa Email (lower-case, loại bỏ ký tự lạ, validate regex).
       - Chuẩn hóa Số điện thoại (format chuẩn quốc tế +84 / số 0 đầu, lọc ký tự đặc biệt).
       - Chuẩn hóa Ngày tháng (ISO 8601 `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`).
       - Xử lý NULL & giá trị rỗng (Điền giá trị mặc định, điền trung vị/trung bình, hoặc drop dòng).
       - Phát hiện và khử trùng lặp (Deduplication theo khóa chính hoặc toàn bộ thuộc tính).
       - Tìm kiếm và Thay thế (Search & Replace / Regex Replace).
       - Chuyển đổi kiểu dữ liệu an toàn (Type Casting với error-flagging).
  5. **Version Control Engine (Data Git):**
     - Lưu trữ snapshot trạng thái dữ liệu qua các lần chuẩn hóa.
     - So sánh Diff giữa 2 phiên bản: hiển thị hàng Added, Modified, Removed, và cột thay đổi.
     - Khả năng Revert / Rollback về bất kỳ phiên bản nào và tạo ra commit phiên bản mới.
  6. **Real-time Chat & Collaboration:**
     - Phòng chat chung (Public Community Hub) cho toàn hệ thống.
     - Phòng chat riêng theo từng Dự án (Project Work Chat) cho các thành viên dự án.
     - Hội thoại trực tiếp 1-1 (Direct Messages).
     - Hỗ trợ tin nhắn văn bản, emoji, trạng thái typing, thông báo tin mới.
  7. **Notification & Audit System:**
     - Thông báo theo thời gian thực khi có người mời vào dự án, commit version mới, hoàn thành chuẩn hóa dữ liệu.
     - Nhật ký kiểm toán (Activity Logs) ghi lại mọi thao tác quan trọng để đảm bảo an ninh dữ liệu.

---

## 3. MÔ HÌNH PHÂN QUYỀN (RBAC - ROLE BASED ACCESS CONTROL)

Hệ thống áp dụng 6 cấp độ phân quyền nghiêm ngặt:

| Cấp vai trò | Mô tả phạm vi quyền hạn |
| :--- | :--- |
| **SystemAdmin** | Quản trị viên tối cao: Quản lý toàn bộ người dùng, khóa/mở khóa tài khoản, xem tất cả dự án, kiểm toán hệ thống. |
| **Owner** | Chủ sở hữu dự án: Toàn quyền cấu hình, mời/xóa thành viên, phân vai trò, xóa hoặc lưu trữ dự án. |
| **Admin** | Quản trị dự án: Thêm/sửa/xóa datasets, chạy chuẩn hóa dữ liệu, quản lý thành viên cấp dưới. |
| **Maintainer** | Người bảo trì dữ liệu: Duyệt dữ liệu, tạo phiên bản ổn định (Stable Tag), khôi phục phiên bản. |
| **Contributor** | Người đóng góp: Tải lên tập dữ liệu mới, chạy thử nghiệm quy tắc chuẩn hóa, gửi tin nhắn trao đổi. |
| **Viewer** | Người xem: Chỉ có quyền đọc và tải xuống dữ liệu công khai hoặc được cấp phép xem. |

Mọi thao tác đều được kiểm tra phân quyền tại Backend API trước khi xử lý nghiệp vụ.
