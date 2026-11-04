import crypto from 'crypto';
import type { 
  User, Project, ProjectMember, Dataset, DatasetVersion, 
  NormalizationRule, ChatMessage, ConversationChannel, NotificationItem, ActivityLog 
} from '../types/index.js';

// In-memory persistent database state for the live full-stack runtime
class DataHubStore {
  users: Map<string, User & { passwordHash: string }> = new Map();
  projects: Map<string, Project> = new Map();
  projectMembers: Map<string, ProjectMember[]> = new Map(); // projectId -> members
  datasets: Map<string, Dataset> = new Map();
  datasetData: Map<string, Record<string, any>[]> = new Map(); // datasetId -> current rows
  datasetVersions: Map<string, DatasetVersion[]> = new Map(); // datasetId -> versions list
  normalizationRules: Map<string, NormalizationRule> = new Map();
  conversations: Map<string, ConversationChannel> = new Map();
  messages: Map<string, ChatMessage[]> = new Map(); // conversationId -> messages
  notifications: Map<string, NotificationItem[]> = new Map(); // userId -> notifications
  activityLogs: ActivityLog[] = [];
  sseClients: Set<(data: any) => void> = new Set();

  constructor() {
    this.seedInitialData();
  }

  hashPassword(pwd: string): string {
    return crypto.createHash('sha256').update(pwd + '_datahub_salt_2026').digest('hex');
  }

  seedInitialData() {
    // 1. Seed SystemAdmin and Demo User
    const adminId = 'u_admin_001';
    const demoUserId = 'u_demo_002';

    this.users.set(adminId, {
      id: adminId,
      userName: 'admin',
      email: 'admin@datahub.vn',
      fullName: 'System Administrator',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      bio: 'Quản trị viên toàn hệ thống DataHub',
      systemRole: 'SystemAdmin',
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: this.hashPassword('DataHub@2026')
    });

    this.users.set(demoUserId, {
      id: demoUserId,
      userName: 'nguyenvana',
      email: 'nguyenvana@datahub.vn',
      fullName: 'Nguyễn Văn A',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      bio: 'Kỹ sư Dữ liệu & Xử lý chuẩn hóa tại DataHub Core',
      systemRole: 'User',
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: this.hashPassword('DataHub@2026')
    });

    // 2. Seed Default System Preset Rules
    const presetRules: NormalizationRule[] = [
      {
        id: 'rule_trim',
        name: 'Xóa khoảng trắng đầu & cuối',
        description: 'Loại bỏ ký tự khoảng trắng thừa ở hai đầu chuỗi dữ liệu văn bản',
        ruleType: 'TrimWhitespace',
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule_multi_space',
        name: 'Chuẩn hóa khoảng trắng liên tiếp',
        description: 'Rút gọn 2 hoặc nhiều dấu cách liên tục thành 1 khoảng trắng duy nhất',
        ruleType: 'NormalizeMultipleSpaces',
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule_title_case',
        name: 'Chuẩn hóa Họ Tên (Title Case)',
        description: 'Chuyển chữ cái đầu mỗi từ thành in hoa (ví dụ: "nguyễn văn an" -> "Nguyễn Văn An")',
        ruleType: 'TitleCase',
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule_email',
        name: 'Chuẩn hóa Email',
        description: 'Chuyển về chữ thường, cắt bỏ khoảng trắng, kiểm tra cú pháp email hợp lệ',
        ruleType: 'NormalizeEmail',
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule_phone_vn',
        name: 'Chuẩn hóa Số điện thoại VN',
        description: 'Lọc bỏ dấu gạch, chấm, khoảng trắng; chuẩn hóa đầu số +84 thành 0 và định dạng 10 số chuẩn',
        ruleType: 'NormalizePhone',
        configuration: { phoneFormat: 'VN_10_DIGITS' },
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule_date_iso',
        name: 'Chuẩn hóa Ngày tháng (ISO YYYY-MM-DD)',
        description: 'Phân tích các dạng ngày (dd/mm/yyyy, mm/dd/yyyy, text) và đưa về chuẩn ISO 8601 YYYY-MM-DD',
        ruleType: 'NormalizeDate',
        configuration: { dateFormat: 'YYYY-MM-DD' },
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule_null_na',
        name: 'Xử lý NULL / Ô trống',
        description: 'Điền giá trị mặc định [Chưa cung cấp] vào các ô trống rỗng hoặc NULL',
        ruleType: 'HandleNullEmpty',
        configuration: { nullValueDefault: 'N/A' },
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule_dedup',
        name: 'Khử dòng trùng lặp (Deduplicate)',
        description: 'Phát hiện và loại bỏ các dòng có toàn bộ nội dung trùng nhau hoàn toàn',
        ruleType: 'Deduplicate',
        isSystemPreset: true,
        createdAt: new Date().toISOString()
      }
    ];

    presetRules.forEach(r => this.normalizationRules.set(r.id, r));

    // 3. Seed Default Projects
    const proj1Id = 'proj_core_crm';
    const proj1: Project = {
      id: proj1Id,
      name: 'Khách hàng CRM & Thương mại điện tử',
      slug: 'khach-hang-crm-thuong-mai-dien-tu',
      description: 'Repository chuẩn hóa dữ liệu khách hàng đa kênh, xử lý trùng lặp và làm sạch số điện thoại, email.',
      icon: 'users',
      isPublic: true,
      ownerId: adminId,
      ownerName: 'System Administrator',
      isArchived: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
      membersCount: 2,
      datasetsCount: 1
    };
    this.projects.set(proj1Id, proj1);

    this.projectMembers.set(proj1Id, [
      {
        id: 'pm_1',
        projectId: proj1Id,
        userId: adminId,
        userName: 'admin',
        fullName: 'System Administrator',
        email: 'admin@datahub.vn',
        role: 'Owner',
        joinedAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'pm_2',
        projectId: proj1Id,
        userId: demoUserId,
        userName: 'nguyenvana',
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@datahub.vn',
        role: 'Admin',
        joinedAt: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ]);

    // 4. Seed Dataset with Realistic "Dirty" Data for immediate testing
    const dataset1Id = 'ds_customers_raw_001';
    const rawCustomerRows = [
      { id: 1, ho_ten: '  nguyễn  văn an ', email: ' AN.NGUYEN@gmail.com ', sdt: '+84 912 345 678', ngay_sinh: '25/12/1995', tinh_thanh: 'hà nội', chi_tieu: 1520000 },
      { id: 2, ho_ten: 'trần thị  bích', email: 'bich.tran@company.com.vn', sdt: '0988.123.456', ngay_sinh: '1998-05-14', tinh_thanh: 'TP.HCM', chi_tieu: 850000 },
      { id: 3, ho_ten: 'LÊ VĂN CƯỜNG', email: 'cuong.le@yahoo.com ', sdt: '090-333-8888', ngay_sinh: '03/09/1992', tinh_thanh: 'Đà Nẵng', chi_tieu: 3200000 },
      { id: 4, ho_ten: 'phạm hoàng dũng', email: '  DUNG_PHAM@GMAIL.COM', sdt: '0912345678', ngay_sinh: '1990/11/02', tinh_thanh: 'hà nội', chi_tieu: 980000 },
      { id: 5, ho_ten: 'Vũ Thị Mai', email: 'mai.vu@domain', sdt: '+84977654321', ngay_sinh: '18/07/2001', tinh_thanh: null, chi_tieu: 450000 },
      { id: 6, ho_ten: '  nguyễn  văn an ', email: ' AN.NGUYEN@gmail.com ', sdt: '+84 912 345 678', ngay_sinh: '25/12/1995', tinh_thanh: 'hà nội', chi_tieu: 1520000 }, // Duplicate of row 1
      { id: 7, ho_ten: 'ĐỖ MẠNH HÙNG  ', email: 'hung.do@gmail.com', sdt: '0934 567 890', ngay_sinh: '01/01/1988', tinh_thanh: 'Hải Phòng', chi_tieu: 2100000 },
      { id: 8, ho_ten: 'Hoàng  Thị Lan', email: 'lan.hoang@gmail.com', sdt: '+84 966-222-111', ngay_sinh: '15/08/1996', tinh_thanh: 'Cần Thơ', chi_tieu: 1250000 },
      { id: 9, ho_ten: 'bùi quốc tuấn', email: 'tuan.bui@hotmail.com', sdt: '0945678123', ngay_sinh: '1994-10-30', tinh_thanh: '', chi_tieu: null },
      { id: 10, ho_ten: 'Nguyễn Thị Hương Giang', email: 'giang.nguyen@outlook.com', sdt: '0918-999-777', ngay_sinh: '09/04/1997', tinh_thanh: 'Huế', chi_tieu: 1890000 }
    ];

    const ds1: Dataset = {
      id: dataset1Id,
      projectId: proj1Id,
      projectName: proj1.name,
      name: 'Danh sách khách hàng thô (Raw Leads)',
      description: 'Dữ liệu thu thập từ các chiến dịch tiếp thị và form đăng ký trực tuyến, cần làm sạch trước khi tích hợp CRM.',
      originalFileName: 'customers_raw_october.csv',
      fileFormat: 'CSV',
      fileSizeBytes: 4280,
      rowCount: rawCustomerRows.length,
      columnCount: 7,
      schema: [
        { name: 'id', type: 'number', sampleValues: [1, 2, 3], missingCount: 0 },
        { name: 'ho_ten', type: 'string', sampleValues: ['nguyễn văn an', 'trần thị bích'], missingCount: 0 },
        { name: 'email', type: 'string', sampleValues: ['an.nguyen@gmail.com'], missingCount: 0 },
        { name: 'sdt', type: 'string', sampleValues: ['+84 912 345 678'], missingCount: 0 },
        { name: 'ngay_sinh', type: 'date', sampleValues: ['25/12/1995'], missingCount: 0 },
        { name: 'tinh_thanh', type: 'string', sampleValues: ['hà nội', 'TP.HCM'], missingCount: 2 },
        { name: 'chi_tieu', type: 'number', sampleValues: [1520000, 850000], missingCount: 1 }
      ],
      currentVersionNumber: 1,
      currentVersionTag: 'v1.0.0-initial',
      createdByUserId: adminId,
      createdByName: 'System Administrator',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.datasets.set(dataset1Id, ds1);
    this.datasetData.set(dataset1Id, rawCustomerRows);

    // Initial Version snapshot
    const v1: DatasetVersion = {
      id: 'ver_init_001',
      datasetId: dataset1Id,
      versionTag: 'v1.0.0-initial',
      versionNumber: 1,
      commitMessage: 'Initial commit: Tải lên tập dữ liệu thô khách hàng',
      appliedRulesSummary: 'Bản ghi nguyên bản từ nguồn CSV',
      rowCount: rawCustomerRows.length,
      columnCount: 7,
      isStable: false,
      snapshotData: JSON.parse(JSON.stringify(rawCustomerRows)),
      createdByUserId: adminId,
      createdByName: 'System Administrator',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    };
    this.datasetVersions.set(dataset1Id, [v1]);

    // 5. Seed Conversations & Messages
    const publicConvId = 'conv_community';
    const projConvId = `conv_proj_${proj1Id}`;

    this.conversations.set(publicConvId, {
      id: publicConvId,
      type: 'Public',
      title: 'Phòng Chat Chung Toàn Hệ Thống',
      lastMessage: 'Chào mừng các bạn đến với DataHub!',
      lastMessageAt: new Date().toISOString()
    });

    this.conversations.set(projConvId, {
      id: projConvId,
      type: 'Project',
      title: 'Kênh dự án: Khách hàng CRM',
      projectId: proj1Id,
      projectName: proj1.name,
      lastMessage: 'Dataset khách hàng raw đã sẵn sàng chuẩn hóa!',
      lastMessageAt: new Date().toISOString()
    });

    this.messages.set(publicConvId, [
      {
        id: 'msg_1',
        conversationId: publicConvId,
        senderId: adminId,
        senderName: 'System Administrator',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        content: 'Chào mừng quý đồng nghiệp đến với DataHub — Nền tảng chuẩn hóa dữ liệu và cộng tác trực tuyến chuẩn Enterprise!',
        messageType: 'Text',
        isEdited: false,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'msg_2',
        conversationId: publicConvId,
        senderId: demoUserId,
        senderName: 'Nguyễn Văn A',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        content: 'Chào anh Admin! Tôi vừa chuẩn bị tập dữ liệu raw khách hàng có sẵn nhiều trường lỗi định dạng ngày tháng và số điện thoại để kiểm thử bộ engine chuẩn hóa.',
        messageType: 'Text',
        isEdited: false,
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ]);

    this.messages.set(projConvId, [
      {
        id: 'msg_p1',
        conversationId: projConvId,
        senderId: demoUserId,
        senderName: 'Nguyễn Văn A',
        content: 'Chào team! Mọi người kiểm tra dataset `Danh sách khách hàng thô (Raw Leads)` trong tab Datasets nhé.',
        messageType: 'Text',
        isEdited: false,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ]);

    // 6. Seed Notifications
    this.notifications.set(adminId, [
      {
        id: 'notif_1',
        userId: adminId,
        title: 'Chào mừng đến với DataHub',
        message: 'Tài khoản Quản trị viên hệ thống đã sẵn sàng hoạt động.',
        type: 'System',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);

    this.notifications.set(demoUserId, [
      {
        id: 'notif_2',
        userId: demoUserId,
        title: 'Lời mời tham gia dự án',
        message: 'Bạn đã được thêm vào dự án "Khách hàng CRM & Thương mại điện tử" với vai trò Admin.',
        type: 'ProjectInvite',
        linkUrl: `/projects/${proj1Id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);

    // 7. Seed Activity Log
    this.activityLogs.push({
      id: 'act_1',
      userId: adminId,
      userName: 'System Administrator',
      action: 'SYSTEM_BOOT',
      details: 'Khởi động hệ thống DataHub và khởi tạo cấu trúc dữ liệu nền tảng.',
      createdAt: new Date().toISOString()
    });
  }

  // Broadcast real-time message via SSE
  broadcast(event: string, payload: any) {
    const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    this.sseClients.forEach(client => {
      try {
        client(dataString);
      } catch (err) {
        this.sseClients.delete(client);
      }
    });
  }

  logActivity(userId: string | undefined, userName: string | undefined, action: string, details: string) {
    const log: ActivityLog = {
      id: 'act_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    this.activityLogs.unshift(log);
    if (this.activityLogs.length > 500) {
      this.activityLogs.pop();
    }
  }
}

export const db = new DataHubStore();
