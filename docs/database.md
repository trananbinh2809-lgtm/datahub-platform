# THIẾT KẾ CƠ SỞ DỮ LIỆU DATAHUB (DATABASE SCHEMA SPECIFICATION)

Cơ sở dữ liệu DataHub được thiết kế theo chuẩn quan hệ (Relational Database) tối ưu cho SQL Server và Entity Framework Core, tuân thủ nguyên tắc chuẩn hóa 3NF, đồng thời hỗ trợ lưu trữ snapshot phiên bản dữ liệu an toàn.

---

## 1. SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD - ENTITY RELATIONSHIP DIAGRAM)

```
[Users / AspNetUsers]
   │ 1
   ├──────────< [Projects] (OwnerId)
   │               │ 1
   │               ├──< [ProjectMembers] (ProjectId, UserId, Role)
   │               ├──< [ProjectInvitations]
   │               └──< [Datasets] (ProjectId)
   │                         │ 1
   │                         ├──< [DatasetVersions] (DatasetId)
   │                         │          │ 1
   │                         │          └──< [DatasetVersionSnapshots]
   │                         └──< [NormalizationJobs]
   │                                    │ 1
   │                                    └──< [NormalizationResults]
   │
   ├──────────< [NormalizationRules] (UserId / ProjectId)
   ├──────────< [ConversationMembers] >────── [Conversations]
   │                                                │ 1
   │                                                └──< [Messages] (SenderId)
   ├──────────< [Notifications] (UserId)
   └──────────< [ActivityLogs] (UserId)
```

---

## 2. ĐẶC TẢ CHI TIẾT CÁC BẢNG (TABLE DICTIONARY)

### 2.1. Bảng `Users` (Hệ thống tài khoản người dùng)
- `Id` (NVARCHAR(450), PK): Khóa chính UUID/GUID.
- `UserName` (NVARCHAR(100), UNIQUE, NOT NULL): Tên đăng nhập duy nhất.
- `NormalizedUserName` (NVARCHAR(100), INDEX): Tên chuẩn hóa chữ hoa.
- `Email` (NVARCHAR(256), UNIQUE, NOT NULL): Địa chỉ email.
- `NormalizedEmail` (NVARCHAR(256), INDEX): Email chuẩn hóa chữ hoa.
- `FullName` (NVARCHAR(200), NOT NULL): Họ và tên đầy đủ.
- `AvatarUrl` (NVARCHAR(500), NULL): Đường dẫn ảnh đại diện.
- `Bio` (NVARCHAR(1000), NULL): Giới thiệu bản thân.
- `PasswordHash` (NVARCHAR(MAX), NOT NULL): Chuỗi mật khẩu băm an toàn (PBKDF2/BCrypt).
- `SecurityStamp` (NVARCHAR(MAX), NULL): Dấu bảo mật khi đổi mật khẩu.
- `SystemRole` (NVARCHAR(50), NOT NULL, DEFAULT 'User'): 'SystemAdmin' | 'User'.
- `IsActive` (BIT, NOT NULL, DEFAULT 1): Trạng thái tài khoản (1: Hoạt động, 0: Bị khóa).
- `AccessFailedCount` (INT, NOT NULL, DEFAULT 0): Số lần đăng nhập sai.
- `LockoutEnd` (DATETIMEOFFSET, NULL): Thời điểm hết hạn khóa tài khoản.
- `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
- `UpdatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).

### 2.2. Bảng `Projects` (Dự án Repository Dữ liệu)
- `Id` (NVARCHAR(450), PK): GUID.
- `Name` (NVARCHAR(200), NOT NULL): Tên dự án.
- `Slug` (NVARCHAR(250), NOT NULL, INDEX): Đường dẫn thân thiện URL (`ten-du-an`).
- `Description` (NVARCHAR(MAX), NULL): Mô tả mục đích dữ liệu của dự án.
- `Icon` (NVARCHAR(50), DEFAULT 'database'): Biểu tượng giao diện.
- `IsPublic` (BIT, NOT NULL, DEFAULT 0): 0: Riêng tư (Private), 1: Công khai (Public).
- `OwnerId` (NVARCHAR(450), FK -> Users.Id, NOT NULL): ID người sở hữu.
- `IsArchived` (BIT, NOT NULL, DEFAULT 0): 1 nếu đã lưu trữ (đọc chỉ).
- `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
- `UpdatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).

### 2.3. Bảng `ProjectMembers` (Thành viên tham gia dự án)
- `Id` (NVARCHAR(450), PK): GUID.
- `ProjectId` (NVARCHAR(450), FK -> Projects.Id, NOT NULL): Khóa ngoại dự án.
- `UserId` (NVARCHAR(450), FK -> Users.Id, NOT NULL): Khóa ngoại thành viên.
- `Role` (NVARCHAR(50), NOT NULL): 'Owner' | 'Admin' | 'Maintainer' | 'Contributor' | 'Viewer'.
- `JoinedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
- *Ràng buộc:* UNIQUE(ProjectId, UserId).

### 2.4. Bảng `Datasets` (Tập dữ liệu trong dự án)
- `Id` (NVARCHAR(450), PK): GUID.
- `ProjectId` (NVARCHAR(450), FK -> Projects.Id, NOT NULL): Dự án chứa tập dữ liệu.
- `Name` (NVARCHAR(200), NOT NULL): Tên tập dữ liệu.
- `Description` (NVARCHAR(MAX), NULL): Mô tả dữ liệu.
- `OriginalFileName` (NVARCHAR(300), NOT NULL): Tên tệp gốc khi tải lên.
- `FileFormat` (NVARCHAR(20), NOT NULL): 'CSV' | 'XLSX' | 'JSON' | 'TXT'.
- `FileSizeBytes` (BIGINT, NOT NULL): Dung lượng tệp tính bằng byte.
- `RowCount` (INT, NOT NULL, DEFAULT 0): Số hàng ghi nhận được.
- `ColumnCount` (INT, NOT NULL, DEFAULT 0): Số cột.
- `SchemaMetadataJson` (NVARCHAR(MAX), NOT NULL): Danh sách các cột và kiểu dữ liệu phát hiện được.
- `CurrentVersionNumber` (INT, NOT NULL, DEFAULT 1): Số phiên bản hiện tại.
- `CreatedByUserId` (NVARCHAR(450), FK -> Users.Id, NOT NULL).
- `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
- `UpdatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).

### 2.5. Bảng `DatasetVersions` (Lịch sử phiên bản kiểu Git)
- `Id` (NVARCHAR(450), PK): GUID.
- `DatasetId` (NVARCHAR(450), FK -> Datasets.Id, NOT NULL): Khóa ngoại dataset.
- `VersionTag` (NVARCHAR(50), NOT NULL): Ví dụ: 'v1.0.0', 'v1.0.1-cleaned'.
- `VersionNumber` (INT, NOT NULL): Số thứ tự tăng dần.
- `CommitMessage` (NVARCHAR(500), NOT NULL): Thông điệp mô tả thay đổi.
- `AppliedRulesSummary` (NVARCHAR(MAX), NULL): Tóm tắt các quy tắc đã áp dụng.
- `RowCount` (INT, NOT NULL): Số dòng tại phiên bản này.
- `ColumnCount` (INT, NOT NULL): Số cột.
- `IsStable` (BIT, NOT NULL, DEFAULT 0): Đánh dấu phiên bản chuẩn ổn định.
- `SnapshotDataJson` (NVARCHAR(MAX), NOT NULL): Dữ liệu đầy đủ của snapshot (JSON hàng & cột).
- `DiffSummaryJson` (NVARCHAR(MAX), NULL): Thống kê số hàng Added, Modified, Removed so với phiên bản trước.
- `CreatedByUserId` (NVARCHAR(450), FK -> Users.Id, NOT NULL).
- `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).

### 2.6. Bảng `NormalizationRules` (Quy tắc chuẩn hóa dữ liệu)
- `Id` (NVARCHAR(450), PK): GUID.
- `Name` (NVARCHAR(200), NOT NULL): Tên quy tắc (ví dụ: 'Chuẩn hóa số điện thoại VN', 'Làm sạch Email').
- `Description` (NVARCHAR(MAX), NULL): Hướng dẫn tác vụ.
- `TargetColumn` (NVARCHAR(150), NULL): Cột áp dụng (hoặc áp dụng tất cả).
- `RuleType` (NVARCHAR(100), NOT NULL): 'TrimWhitespace' | 'NormalizeMultipleSpaces' | 'UpperCase' | 'LowerCase' | 'TitleCase' | 'NormalizeEmail' | 'NormalizePhone' | 'NormalizeDate' | 'HandleNullEmpty' | 'Deduplicate' | 'SearchAndReplace' | 'RegexReplace' | 'TypeCasting'.
- `ConfigurationJson` (NVARCHAR(MAX), NULL): Tham số chi tiết (định dạng ngày đích, giá trị thay thế, regex pattern...).
- `IsSystemPreset` (BIT, NOT NULL, DEFAULT 0): 1 nếu là quy tắc chuẩn của hệ thống có sẵn.
- `UserId` (NVARCHAR(450), FK -> Users.Id, NULL): Người tạo ra quy tắc nếu là custom rule.
- `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).

### 2.7. Bảng `NormalizationJobs` & `NormalizationResults` (Tác vụ chuẩn hóa)
- `Id` (NVARCHAR(450), PK): GUID.
- `DatasetId` (NVARCHAR(450), FK -> Datasets.Id, NOT NULL).
- `UserId` (NVARCHAR(450), FK -> Users.Id, NOT NULL).
- `Status` (NVARCHAR(50), NOT NULL): 'Pending' | 'Processing' | 'Completed' | 'Failed'.
- `TotalRowsProcessed` (INT, NOT NULL, DEFAULT 0).
- `TotalRowsChanged` (INT, NOT NULL, DEFAULT 0).
- `TotalDuplicatesFound` (INT, NOT NULL, DEFAULT 0).
- `TotalErrors` (INT, NOT NULL, DEFAULT 0).
- `ExecutionReportJson` (NVARCHAR(MAX), NULL): Báo cáo chi tiết từng bước.
- `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
- `FinishedAt` (DATETIME2, NULL).

### 2.8. Bảng `Conversations` & `Messages` (Hệ thống Chat)
- **Conversations:**
  - `Id` (NVARCHAR(450), PK): GUID.
  - `Type` (NVARCHAR(50), NOT NULL): 'Public' | 'Direct' | 'Project'.
  - `Title` (NVARCHAR(200), NULL): Tên nhóm/kênh.
  - `ProjectId` (NVARCHAR(450), FK -> Projects.Id, NULL): Khóa ngoại dự án nếu chat dự án.
  - `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
- **ConversationMembers:**
  - `ConversationId` (NVARCHAR(450), FK -> Conversations.Id).
  - `UserId` (NVARCHAR(450), FK -> Users.Id).
  - `LastReadAt` (DATETIME2, NULL).
- **Messages:**
  - `Id` (NVARCHAR(450), PK): GUID.
  - `ConversationId` (NVARCHAR(450), FK -> Conversations.Id, NOT NULL).
  - `SenderId` (NVARCHAR(450), FK -> Users.Id, NOT NULL).
  - `Content` (NVARCHAR(MAX), NOT NULL): Nội dung tin nhắn (đã qua sanitizer).
  - `MessageType` (NVARCHAR(50), NOT NULL, DEFAULT 'Text'): 'Text' | 'DatasetRef' | 'SystemAlert'.
  - `MetadataJson` (NVARCHAR(MAX), NULL): Thông tin đính kèm liên kết dự án hoặc dataset version.
  - `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
  - `IsEdited` (BIT, NOT NULL, DEFAULT 0).

### 2.9. Bảng `Notifications` & `ActivityLogs`
- **Notifications:**
  - `Id` (NVARCHAR(450), PK): GUID.
  - `UserId` (NVARCHAR(450), FK -> Users.Id, NOT NULL): Người nhận.
  - `Title` (NVARCHAR(250), NOT NULL).
  - `Message` (NVARCHAR(MAX), NOT NULL).
  - `Type` (NVARCHAR(50), NOT NULL): 'ProjectInvite' | 'NewVersion' | 'NormalizationComplete' | 'ChatMessage' | 'System'.
  - `LinkUrl` (NVARCHAR(500), NULL).
  - `IsRead` (BIT, NOT NULL, DEFAULT 0).
  - `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
- **ActivityLogs:**
  - `Id` (NVARCHAR(450), PK): GUID.
  - `UserId` (NVARCHAR(450), FK -> Users.Id, NULL).
  - `Action` (NVARCHAR(100), NOT NULL): 'CREATE_PROJECT' | 'UPLOAD_DATASET' | 'APPLY_NORMALIZATION' | 'COMMIT_VERSION' | 'INVITE_MEMBER'.
  - `Details` (NVARCHAR(MAX), NULL).
  - `IpAddress` (NVARCHAR(50), NULL).
  - `CreatedAt` (DATETIME2, NOT NULL, DEFAULT GETUTCDATE()).
