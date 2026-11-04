// DATAHUB TYPES & DATA TRANSFER OBJECTS (DTOs)

export type SystemRole = 'SystemAdmin' | 'User';

export type ProjectRole = 'Owner' | 'Admin' | 'Maintainer' | 'Contributor' | 'Viewer';

export interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  systemRole: SystemRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  isPublic: boolean;
  ownerId: string;
  ownerName?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  membersCount?: number;
  datasetsCount?: number;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  sampleValues: any[];
  missingCount: number;
}

export interface Dataset {
  id: string;
  projectId: string;
  projectName?: string;
  name: string;
  description?: string;
  originalFileName: string;
  fileFormat: 'CSV' | 'XLSX' | 'JSON' | 'TXT';
  fileSizeBytes: number;
  rowCount: number;
  columnCount: number;
  schema: DataColumn[];
  currentVersionNumber: number;
  currentVersionTag: string;
  createdByUserId: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type RuleType = 
  | 'TrimWhitespace'
  | 'NormalizeMultipleSpaces'
  | 'UpperCase'
  | 'LowerCase'
  | 'TitleCase'
  | 'NormalizeEmail'
  | 'NormalizePhone'
  | 'NormalizeDate'
  | 'HandleNullEmpty'
  | 'Deduplicate'
  | 'SearchAndReplace'
  | 'RegexReplace'
  | 'TypeCasting';

export interface NormalizationRule {
  id: string;
  name: string;
  description: string;
  ruleType: RuleType;
  targetColumn?: string; // empty means all applicable columns
  configuration?: {
    dateFormat?: string; // 'YYYY-MM-DD', 'DD/MM/YYYY'
    replaceSearch?: string;
    replaceWith?: string;
    nullValueDefault?: string;
    dropNullRows?: boolean;
    phoneFormat?: 'VN_10_DIGITS' | 'INTERNATIONAL';
    targetType?: 'string' | 'number' | 'date';
  };
  isSystemPreset: boolean;
  createdByUserId?: string;
  createdAt: string;
}

export interface NormalizationPreviewResult {
  totalRows: number;
  changedRowsCount: number;
  duplicatesFound: number;
  errorsCount: number;
  originalSample: Record<string, any>[];
  cleanedSample: Record<string, any>[];
  logs: string[];
}

export interface DatasetVersion {
  id: string;
  datasetId: string;
  versionTag: string;
  versionNumber: number;
  commitMessage: string;
  appliedRulesSummary?: string;
  rowCount: number;
  columnCount: number;
  isStable: boolean;
  diffSummary?: {
    addedRows: number;
    modifiedRows: number;
    removedRows: number;
    changedColumns: string[];
  };
  snapshotData: Record<string, any>[];
  createdByUserId: string;
  createdByName?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'Text' | 'DatasetRef' | 'SystemAlert';
  metadata?: {
    datasetId?: string;
    datasetName?: string;
    versionTag?: string;
    projectId?: string;
  };
  isEdited: boolean;
  createdAt: string;
}

export interface ConversationChannel {
  id: string;
  type: 'Public' | 'Direct' | 'Project';
  title: string;
  projectId?: string;
  projectName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ProjectInvite' | 'NewVersion' | 'NormalizationComplete' | 'ChatMessage' | 'System';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    details: string;
  };
  timestamp: string;
}
