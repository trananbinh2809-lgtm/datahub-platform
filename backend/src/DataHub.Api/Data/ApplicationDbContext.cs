using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataHub.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();
    public DbSet<ProjectMemberEntity> ProjectMembers => Set<ProjectMemberEntity>();
    public DbSet<DatasetEntity> Datasets => Set<DatasetEntity>();
    public DbSet<DatasetVersionEntity> DatasetVersions => Set<DatasetVersionEntity>();
    public DbSet<NormalizationRuleEntity> NormalizationRules => Set<NormalizationRuleEntity>();
    public DbSet<ConversationEntity> Conversations => Set<ConversationEntity>();
    public DbSet<MessageEntity> Messages => Set<MessageEntity>();
    public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();
    public DbSet<ActivityLogEntity> ActivityLogs => Set<ActivityLogEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ProjectMember Unique Constraint
        modelBuilder.Entity<ProjectMemberEntity>()
            .HasIndex(pm => new { pm.ProjectId, pm.UserId })
            .IsUnique();

        // Project Slug Index
        modelBuilder.Entity<ProjectEntity>()
            .HasIndex(p => p.Slug)
            .IsUnique();
    }
}

// -------------------------------------------------------------------------
// ENTITY DEFINITIONS
// -------------------------------------------------------------------------

[Table("Users")]
public class UserEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required, MaxLength(100)]
    public string UserName { get; set; } = string.Empty;
    [Required, MaxLength(100)]
    public string NormalizedUserName { get; set; } = string.Empty;
    [Required, MaxLength(256), EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Required, MaxLength(256)]
    public string NormalizedEmail { get; set; } = string.Empty;
    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    public string? SecurityStamp { get; set; }
    [MaxLength(50)]
    public string SystemRole { get; set; } = "User"; // SystemAdmin, User
    public bool IsActive { get; set; } = true;
    public int AccessFailedCount { get; set; } = 0;
    public DateTimeOffset? LockoutEnd { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("Projects")]
public class ProjectEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    [Required, MaxLength(250)]
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    [MaxLength(50)]
    public string Icon { get; set; } = "database";
    public bool IsPublic { get; set; } = false;
    [Required]
    public string OwnerId { get; set; } = string.Empty;
    public bool IsArchived { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("ProjectMembers")]
public class ProjectMemberEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string ProjectId { get; set; } = string.Empty;
    [Required]
    public string UserId { get; set; } = string.Empty;
    [Required, MaxLength(50)]
    public string Role { get; set; } = "Viewer"; // Owner, Admin, Maintainer, Contributor, Viewer
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

[Table("Datasets")]
public class DatasetEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string ProjectId { get; set; } = string.Empty;
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required, MaxLength(300)]
    public string OriginalFileName { get; set; } = string.Empty;
    [Required, MaxLength(20)]
    public string FileFormat { get; set; } = "CSV";
    public long FileSizeBytes { get; set; }
    public int RowCount { get; set; }
    public int ColumnCount { get; set; }
    public string SchemaMetadataJson { get; set; } = "[]";
    public int CurrentVersionNumber { get; set; } = 1;
    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("DatasetVersions")]
public class DatasetVersionEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string DatasetId { get; set; } = string.Empty;
    [Required, MaxLength(50)]
    public string VersionTag { get; set; } = "v1.0.0";
    public int VersionNumber { get; set; } = 1;
    [Required, MaxLength(500)]
    public string CommitMessage { get; set; } = string.Empty;
    public string? AppliedRulesSummary { get; set; }
    public int RowCount { get; set; }
    public int ColumnCount { get; set; }
    public bool IsStable { get; set; } = false;
    [Required]
    public string SnapshotDataJson { get; set; } = "[]";
    public string? DiffSummaryJson { get; set; }
    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("NormalizationRules")]
public class NormalizationRuleEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TargetColumn { get; set; }
    [Required, MaxLength(100)]
    public string RuleType { get; set; } = "TrimWhitespace";
    public string? ConfigurationJson { get; set; }
    public bool IsSystemPreset { get; set; } = false;
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("Conversations")]
public class ConversationEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required, MaxLength(50)]
    public string Type { get; set; } = "Public"; // Public, Direct, Project
    public string? Title { get; set; }
    public string? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("Messages")]
public class MessageEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string ConversationId { get; set; } = string.Empty;
    [Required]
    public string SenderId { get; set; } = string.Empty;
    [Required]
    public string Content { get; set; } = string.Empty;
    public string MessageType { get; set; } = "Text";
    public string? MetadataJson { get; set; }
    public bool IsEdited { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("Notifications")]
public class NotificationEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string UserId { get; set; } = string.Empty;
    [Required, MaxLength(250)]
    public string Title { get; set; } = string.Empty;
    [Required]
    public string Message { get; set; } = string.Empty;
    [Required, MaxLength(50)]
    public string Type { get; set; } = "System";
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("ActivityLogs")]
public class ActivityLogEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? UserId { get; set; }
    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
