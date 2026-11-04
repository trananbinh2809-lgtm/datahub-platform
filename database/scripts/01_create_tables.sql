-- =========================================================================
-- DATAHUB PLATFORM — DATABASE CREATION SCRIPT (SQL SERVER & EF CORE COMPATIBLE)
-- Generated for DataHub Enterprise Data Normalization & Collaboration
-- =========================================================================

-- Tạo Database nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'DataHubDb')
BEGIN
    CREATE DATABASE DataHubDb;
END
GO

USE DataHubDb;
GO

-- 1. Bảng Users (Hệ thống tài khoản người dùng Identity)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id NVARCHAR(450) PRIMARY KEY,
        UserName NVARCHAR(100) NOT NULL UNIQUE,
        NormalizedUserName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(256) NOT NULL UNIQUE,
        NormalizedEmail NVARCHAR(256) NOT NULL,
        FullName NVARCHAR(200) NOT NULL,
        AvatarUrl NVARCHAR(500) NULL,
        Bio NVARCHAR(1000) NULL,
        PasswordHash NVARCHAR(MAX) NOT NULL,
        SecurityStamp NVARCHAR(MAX) NULL,
        SystemRole NVARCHAR(50) NOT NULL DEFAULT 'User', -- 'SystemAdmin', 'User'
        IsActive BIT NOT NULL DEFAULT 1,
        AccessFailedCount INT NOT NULL DEFAULT 0,
        LockoutEnd DATETIMEOFFSET NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Users_NormalizedUserName ON Users(NormalizedUserName);
    CREATE INDEX IX_Users_NormalizedEmail ON Users(NormalizedEmail);
END
GO

-- 2. Bảng Projects (Repository dữ liệu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
BEGIN
    CREATE TABLE Projects (
        Id NVARCHAR(450) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Slug NVARCHAR(250) NOT NULL UNIQUE,
        Description NVARCHAR(MAX) NULL,
        Icon NVARCHAR(50) NOT NULL DEFAULT 'database',
        IsPublic BIT NOT NULL DEFAULT 0,
        OwnerId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
        IsArchived BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Projects_Slug ON Projects(Slug);
    CREATE INDEX IX_Projects_OwnerId ON Projects(OwnerId);
END
GO

-- 3. Bảng ProjectMembers (Thành viên tham gia dự án & Phân quyền)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectMembers')
BEGIN
    CREATE TABLE ProjectMembers (
        Id NVARCHAR(450) PRIMARY KEY,
        ProjectId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Projects(Id) ON DELETE CASCADE,
        UserId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE NO ACTION,
        Role NVARCHAR(50) NOT NULL DEFAULT 'Viewer', -- 'Owner', 'Admin', 'Maintainer', 'Contributor', 'Viewer'
        JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_ProjectMembers UNIQUE (ProjectId, UserId)
    );

    CREATE INDEX IX_ProjectMembers_ProjectId ON ProjectMembers(ProjectId);
    CREATE INDEX IX_ProjectMembers_UserId ON ProjectMembers(UserId);
END
GO

-- 4. Bảng Datasets (Tập dữ liệu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Datasets')
BEGIN
    CREATE TABLE Datasets (
        Id NVARCHAR(450) PRIMARY KEY,
        ProjectId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Projects(Id) ON DELETE CASCADE,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        OriginalFileName NVARCHAR(300) NOT NULL,
        FileFormat NVARCHAR(20) NOT NULL, -- 'CSV', 'XLSX', 'JSON', 'TXT'
        FileSizeBytes BIGINT NOT NULL,
        RowCount INT NOT NULL DEFAULT 0,
        ColumnCount INT NOT NULL DEFAULT 0,
        SchemaMetadataJson NVARCHAR(MAX) NOT NULL,
        CurrentVersionNumber INT NOT NULL DEFAULT 1,
        CreatedByUserId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE NO ACTION,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Datasets_ProjectId ON Datasets(ProjectId);
END
GO

-- 5. Bảng DatasetVersions (Quản lý phiên bản dữ liệu kiểu Git)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DatasetVersions')
BEGIN
    CREATE TABLE DatasetVersions (
        Id NVARCHAR(450) PRIMARY KEY,
        DatasetId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Datasets(Id) ON DELETE CASCADE,
        VersionTag NVARCHAR(50) NOT NULL,
        VersionNumber INT NOT NULL,
        CommitMessage NVARCHAR(500) NOT NULL,
        AppliedRulesSummary NVARCHAR(MAX) NULL,
        RowCount INT NOT NULL,
        ColumnCount INT NOT NULL,
        IsStable BIT NOT NULL DEFAULT 0,
        SnapshotDataJson NVARCHAR(MAX) NOT NULL,
        DiffSummaryJson NVARCHAR(MAX) NULL,
        CreatedByUserId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE NO ACTION,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_DatasetVersions_DatasetId ON DatasetVersions(DatasetId);
END
GO

-- 6. Bảng NormalizationRules (Quy tắc chuẩn hóa dữ liệu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NormalizationRules')
BEGIN
    CREATE TABLE NormalizationRules (
        Id NVARCHAR(450) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        TargetColumn NVARCHAR(150) NULL,
        RuleType NVARCHAR(100) NOT NULL,
        ConfigurationJson NVARCHAR(MAX) NULL,
        IsSystemPreset BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(450) NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- 7. Bảng Conversations & Messages (Hệ thống Chat thời gian thực)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Conversations')
BEGIN
    CREATE TABLE Conversations (
        Id NVARCHAR(450) PRIMARY KEY,
        Type NVARCHAR(50) NOT NULL, -- 'Public', 'Direct', 'Project'
        Title NVARCHAR(200) NULL,
        ProjectId NVARCHAR(450) NULL FOREIGN KEY REFERENCES Projects(Id) ON DELETE CASCADE,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
BEGIN
    CREATE TABLE Messages (
        Id NVARCHAR(450) PRIMARY KEY,
        ConversationId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Conversations(Id) ON DELETE CASCADE,
        SenderId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE NO ACTION,
        Content NVARCHAR(MAX) NOT NULL,
        MessageType NVARCHAR(50) NOT NULL DEFAULT 'Text',
        MetadataJson NVARCHAR(MAX) NULL,
        IsEdited BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Messages_ConversationId ON Messages(ConversationId);
    CREATE INDEX IX_Messages_SenderId ON Messages(SenderId);
END
GO

-- 8. Bảng Notifications & ActivityLogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        Id NVARCHAR(450) PRIMARY KEY,
        UserId NVARCHAR(450) NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
        Title NVARCHAR(250) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        Type NVARCHAR(50) NOT NULL,
        LinkUrl NVARCHAR(500) NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLogs')
BEGIN
    CREATE TABLE ActivityLogs (
        Id NVARCHAR(450) PRIMARY KEY,
        UserId NVARCHAR(450) NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
        Action NVARCHAR(100) NOT NULL,
        Details NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(50) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_ActivityLogs_UserId ON ActivityLogs(UserId);
    CREATE INDEX IX_ActivityLogs_CreatedAt ON ActivityLogs(CreatedAt DESC);
END
GO
