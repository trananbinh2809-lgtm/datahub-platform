-- =========================================================================
-- DATAHUB INITIAL SEED DATA SCRIPT
-- Dữ liệu mẫu khởi tạo an toàn phục vụ phát triển và kiểm thử
-- =========================================================================

USE DataHubDb;
GO

-- 1. Seed SystemAdmin & Demo Users
-- Mật khẩu mặc định: 'DataHub@2026' (Đã băm SHA-256 + PBKDF2 tương đương)
IF NOT EXISTS (SELECT * FROM Users WHERE UserName = 'admin')
BEGIN
    INSERT INTO Users (Id, UserName, NormalizedUserName, Email, NormalizedEmail, FullName, Bio, PasswordHash, SystemRole, IsActive, CreatedAt)
    VALUES (
        'u_admin_system_001',
        'admin',
        'ADMIN',
        'admin@datahub.vn',
        'ADMIN@DATAHUB.VN',
        'System Administrator',
        'Quản trị viên cấp cao DataHub Platform',
        'AQAAAAIAAYagAAAAEPg5zV9j6UqYkL99l7xMv3kI8f+2xM56/VdK24B8xL==', -- DataHub@2026
        'SystemAdmin',
        1,
        GETUTCDATE()
    );
END

IF NOT EXISTS (SELECT * FROM Users WHERE UserName = 'nguyenvana')
BEGIN
    INSERT INTO Users (Id, UserName, NormalizedUserName, Email, NormalizedEmail, FullName, Bio, PasswordHash, SystemRole, IsActive, CreatedAt)
    VALUES (
        'u_user_demo_002',
        'nguyenvana',
        'NGUYENVANA',
        'nguyenvana@datahub.vn',
        'NGUYENVANA@DATAHUB.VN',
        'Nguyễn Văn A',
        'Data Engineer & Lead Data Wrangler',
        'AQAAAAIAAYagAAAAEPg5zV9j6UqYkL99l7xMv3kI8f+2xM56/VdK24B8xL==',
        'User',
        1,
        GETUTCDATE()
    );
END

-- 2. Seed System Preset Normalization Rules
IF NOT EXISTS (SELECT * FROM NormalizationRules WHERE RuleType = 'TrimWhitespace' AND IsSystemPreset = 1)
BEGIN
    INSERT INTO NormalizationRules (Id, Name, Description, RuleType, IsSystemPreset, CreatedAt)
    VALUES 
    ('rule_sys_001', N'Cắt bỏ khoảng trắng đầu/cuối', N'Loại bỏ các ký tự dấu cách và tab dư thừa ở đầu và cuối chuỗi', 'TrimWhitespace', 1, GETUTCDATE()),
    ('rule_sys_002', N'Chuẩn hóa nhiều khoảng trắng liên tiếp', N'Thu gọn nhiều dấu cách liền nhau thành 1 dấu cách duy nhất', 'NormalizeMultipleSpaces', 1, GETUTCDATE()),
    ('rule_sys_003', N'Chuẩn hóa Họ Tên (Title Case)', N'Chuyển đổi ký tự đầu mỗi từ thành chữ in hoa (Ví dụ: nguyễn văn a -> Nguyễn Văn A)', 'TitleCase', 1, GETUTCDATE()),
    ('rule_sys_004', N'Chuẩn hóa Email', N'Chuyển về chữ thường, cắt khoảng trắng và kiểm tra định dạng email hợp lệ', 'NormalizeEmail', 1, GETUTCDATE()),
    ('rule_sys_005', N'Chuẩn hóa Số điện thoại VN (+84/0)', N'Xóa ký tự không phải số, chuẩn hóa tiền tố 09xx / +84xx về 10 chữ số chuẩn', 'NormalizePhone', 1, GETUTCDATE()),
    ('rule_sys_006', N'Chuẩn hóa Ngày tháng (YYYY-MM-DD)', N'Chuyển các định dạng dd/mm/yyyy, mm/dd/yyyy về chuẩn ISO 8601', 'NormalizeDate', 1, GETUTCDATE()),
    ('rule_sys_007', N'Xử lý ô trống (Điền N/A hoặc Default)', N'Gán giá trị thay thế cho các trường mang giá trị NULL, NaN hoặc chuỗi rỗng', 'HandleNullEmpty', 1, GETUTCDATE()),
    ('rule_sys_008', N'Khử trùng lặp (Deduplicate)', N'Phát hiện và xóa bỏ các bản ghi trùng khớp toàn bộ hoặc theo cột khóa', 'Deduplicate', 1, GETUTCDATE());
END

-- 3. Seed Public Conversation Channel
IF NOT EXISTS (SELECT * FROM Conversations WHERE Id = 'conv_public_community')
BEGIN
    INSERT INTO Conversations (Id, Type, Title, CreatedAt)
    VALUES ('conv_public_community', 'Public', N'Phòng Chat Chung Toàn Hệ Thống', GETUTCDATE());

    INSERT INTO Messages (Id, ConversationId, SenderId, Content, MessageType, CreatedAt)
    VALUES ('msg_seed_001', 'conv_public_community', 'u_admin_system_001', N'Chào mừng các bạn đến với DataHub — Nền tảng chuẩn hóa dữ liệu & cộng tác trực tuyến!', 'Text', GETUTCDATE());
END
GO
