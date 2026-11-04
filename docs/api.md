# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API SPECIFICATION)

Tất cả các API của DataHub đều tuân theo chuẩn RESTful JSON, trả về cấu trúc đồng nhất, sử dụng mã trạng thái HTTP chuẩn và hỗ trợ xác thực qua Bearer Token / Secure Session Header.

---

## 1. CẤU TRÚC PHẢN HỒI CHUẨN (STANDARD API RESPONSE WRAPPER)

```json
{
  "success": true,
  "message": "Thông điệp thành công hoặc mô tả tác vụ",
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-28T01:00:00Z"
}
```

Khi có lỗi:
```json
{
  "success": false,
  "message": "Không tìm thấy tài nguyên yêu cầu",
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "details": "Dataset với ID указанный không tồn tại."
  },
  "timestamp": "2026-10-28T01:00:00Z"
}
```

---

## 2. DANH SÁCH ENDPOINTS CHI TIẾT THEO MODULE

### 2.1. Authentication Module (`/api/auth`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản người dùng mới |
| `POST` | `/api/auth/login` | Public | Đăng nhập bằng Email/Username & Mật khẩu |
| `POST` | `/api/auth/logout` | Authenticated | Hủy phiên làm việc |
| `GET` | `/api/auth/me` | Authenticated | Lấy thông tin tài khoản hiện tại |
| `PUT` | `/api/auth/profile` | Authenticated | Cập nhật họ tên, bio, avatar |
| `PUT` | `/api/auth/change-password`| Authenticated | Đổi mật khẩu tài khoản |

### 2.2. Projects Module (`/api/projects`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Authenticated | Lấy danh sách dự án (Public & dự án tham gia) |
| `POST` | `/api/projects` | Authenticated | Tạo repository dự án dữ liệu mới |
| `GET` | `/api/projects/{id}` | Member/Public | Lấy thông tin chi tiết dự án |
| `PUT` | `/api/projects/{id}` | Owner/Admin | Cập nhật thông tin dự án |
| `DELETE`| `/api/projects/{id}` | Owner | Xóa hoặc chuyển vào lưu trữ |
| `GET` | `/api/projects/{id}/members` | Member | Lấy danh sách thành viên dự án |
| `POST` | `/api/projects/{id}/members` | Owner/Admin | Mời thành viên mới vào dự án |
| `PUT` | `/api/projects/{id}/members/{userId}` | Owner | Thay đổi vai trò thành viên |
| `DELETE`| `/api/projects/{id}/members/{userId}` | Owner | Xóa thành viên khỏi dự án |

### 2.3. Datasets Module (`/api/datasets`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/datasets` | Authenticated | Lấy danh sách dataset theo project / toàn bộ |
| `POST` | `/api/datasets/upload` | Contributor+ | Tải lên tệp CSV, XLSX, JSON, TXT |
| `GET` | `/api/datasets/{id}` | Viewer+ | Xem chi tiết dataset và metadata |
| `GET` | `/api/datasets/{id}/preview` | Viewer+ | Xem trước dữ liệu dạng bảng (phân trang, lọc) |
| `GET` | `/api/datasets/{id}/statistics`| Viewer+ | Thống kê số lượng, missing value, duplicates |
| `GET` | `/api/datasets/{id}/download` | Viewer+ | Tải xuống tệp dữ liệu đã làm sạch |
| `DELETE`| `/api/datasets/{id}` | Admin+ | Xóa dataset khỏi dự án |

### 2.4. Data Normalization Module (`/api/normalization`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/normalization/rules` | Authenticated | Lấy danh sách quy tắc chuẩn hóa có sẵn |
| `POST` | `/api/normalization/preview`| Contributor+ | Xem trước kết quả chuẩn hóa (Original vs Cleaned) |
| `POST` | `/api/normalization/apply` | Maintainer+ | Chạy chuẩn hóa thực tế và tạo bản ghi version mới |
| `POST` | `/api/normalization/custom-rule`| Contributor+| Tạo bộ quy tắc chuẩn hóa tùy biến |

### 2.5. Version Management Module (`/api/versions`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/datasets/{id}/versions` | Viewer+ | Lấy lịch sử commits/phiên bản của dataset |
| `GET` | `/api/versions/{versionId}` | Viewer+ | Lấy snapshot chi tiết của một phiên bản |
| `GET` | `/api/versions/compare?from={v1}&to={v2}` | Viewer+ | So sánh Diff giữa 2 phiên bản (Added/Modified/Removed) |
| `POST` | `/api/versions/{versionId}/rollback` | Maintainer+ | Khôi phục phiên bản cũ thành phiên bản mới |
| `PUT` | `/api/versions/{versionId}/tag-stable`| Maintainer+ | Đánh dấu phiên bản chuẩn (Stable release) |

### 2.6. Real-time Chat Module (`/api/chat`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/channels` | Authenticated | Lấy danh sách kênh chat (Công cộng, Dự án, DM) |
| `GET` | `/api/chat/channels/{id}/messages`| Member | Lấy lịch sử tin nhắn của kênh |
| `POST` | `/api/chat/channels/{id}/messages`| Member | Gửi tin nhắn mới (kèm link dataset/version) |
| `GET` | `/api/chat/stream` (SSE/WS) | Authenticated | Luồng nhận tin nhắn và thông báo thời gian thực |

### 2.7. Notifications & Admin Module (`/api/notifications`, `/api/admin`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Lấy thông báo của người dùng |
| `PUT` | `/api/notifications/read-all`| Authenticated | Đánh dấu tất cả thông báo là đã đọc |
| `GET` | `/api/admin/overview` | SystemAdmin | Thống kê tổng thể toàn hệ thống |
| `GET` | `/api/admin/users` | SystemAdmin | Quản lý danh sách người dùng |
| `PUT` | `/api/admin/users/{id}/toggle-lock`| SystemAdmin | Khóa hoặc mở khóa tài khoản |
| `GET` | `/api/admin/audit-logs` | SystemAdmin | Xem nhật ký kiểm toán hệ thống |
