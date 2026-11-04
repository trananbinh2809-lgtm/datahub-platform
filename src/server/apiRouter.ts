import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { executeNormalizationPipeline, computeDatasetDiff } from './normalizationEngine.js';
import type { 
  User, Project, Dataset, DatasetVersion, NormalizationRule, 
  ChatMessage, ProjectMember, NotificationItem 
} from '../types/index.js';

export const apiRouter = Router();

// Helper to authenticate request from Authorization Bearer token, query param, or cookie
function getAuthenticatedUser(req: Request): (User & { passwordHash?: string }) | null {
  const authHeader = req.headers.authorization;
  let token = authHeader ? authHeader.replace(/^Bearer\s+/, '').trim() : '';
  if (!token && req.query.token) {
    token = String(req.query.token).trim();
  }
  if (!token) return null;
  
  // In our lightweight token format: userId:timestamp:signature
  const parts = token.split(':');
  const userId = parts[0];
  const user = db.users.get(userId);
  if (!user || !user.isActive) return null;
  return user;
}

// Middleware: Require Auth
function requireAuth(req: Request, res: Response, next: () => void) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập.',
      timestamp: new Date().toISOString()
    });
  }
  (req as any).user = user;
  next();
}

// Middleware: Require SystemAdmin
function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = (req as any).user as User;
  if (!user || user.systemRole !== 'SystemAdmin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền quản trị tối cao (SystemAdmin).',
      timestamp: new Date().toISOString()
    });
  }
  next();
}

// -------------------------------------------------------------------------
// 1. AUTHENTICATION ROUTES (/api/auth)
// -------------------------------------------------------------------------

apiRouter.post('/auth/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin đăng nhập.' });
  }

  const query = usernameOrEmail.toLowerCase().trim();
  let foundUser: (User & { passwordHash: string }) | undefined;

  for (const user of db.users.values()) {
    if (user.userName.toLowerCase() === query || user.email.toLowerCase() === query) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    return res.status(401).json({ success: false, message: 'Email, tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  if (!foundUser.isActive) {
    return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa bởi Quản trị viên.' });
  }

  const hashedInput = db.hashPassword(password);
  if (foundUser.passwordHash !== hashedInput) {
    return res.status(401).json({ success: false, message: 'Email, tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  const token = `${foundUser.id}:${Date.now()}:token_sig`;
  db.logActivity(foundUser.id, foundUser.fullName, 'LOGIN', 'Đăng nhập thành công vào hệ thống DataHub');

  const { passwordHash, ...userClean } = foundUser;
  return res.json({
    success: true,
    message: 'Đăng nhập thành công',
    data: { token, user: userClean },
    timestamp: new Date().toISOString()
  });
});

apiRouter.post('/auth/register', (req, res) => {
  const { fullName, userName, email, password } = req.body;
  if (!fullName || !userName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanUserName = userName.toLowerCase().trim();

  for (const u of db.users.values()) {
    if (u.userName.toLowerCase() === cleanUserName) {
      return res.status(400).json({ success: false, message: 'Tên người dùng (username) này đã tồn tại.' });
    }
    if (u.email.toLowerCase() === cleanEmail) {
      return res.status(400).json({ success: false, message: 'Địa chỉ Email này đã được sử dụng.' });
    }
  }

  const newId = 'u_' + Date.now();
  const newUser = {
    id: newId,
    userName: cleanUserName,
    email: cleanEmail,
    fullName: fullName.trim(),
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
    bio: 'Thành viên mới tại nền tảng DataHub',
    systemRole: 'User' as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordHash: db.hashPassword(password)
  };

  db.users.set(newId, newUser);
  db.notifications.set(newId, [{
    id: 'notif_welcome_' + newId,
    userId: newId,
    title: 'Chào mừng bạn đến với DataHub',
    message: 'Khởi tạo dự án đầu tiên hoặc khám phá các bộ dataset chuẩn hóa ngay hôm nay!',
    type: 'System',
    isRead: false,
    createdAt: new Date().toISOString()
  }]);

  db.logActivity(newId, newUser.fullName, 'REGISTER', 'Đăng ký tài khoản mới thành công');

  const token = `${newId}:${Date.now()}:token_sig`;
  const { passwordHash, ...userClean } = newUser;

  return res.json({
    success: true,
    message: 'Đăng ký tài khoản thành công',
    data: { token, user: userClean },
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { passwordHash, ...clean } = user;
  return res.json({ success: true, data: clean });
});

apiRouter.put('/auth/profile', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { fullName, bio, avatarUrl } = req.body;
  if (fullName) user.fullName = fullName.trim();
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  
  db.users.set(user.id, user);
  const { passwordHash, ...clean } = user;
  return res.json({ success: true, message: 'Cập nhật hồ sơ thành công', data: clean });
});

// -------------------------------------------------------------------------
// 2. PROJECT ROUTES (/api/projects)
// -------------------------------------------------------------------------

apiRouter.get('/projects', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const allProjects = Array.from(db.projects.values());

  // Filter projects accessible to user (public OR member)
  const accessible = allProjects.filter(p => {
    if (p.isPublic || user.systemRole === 'SystemAdmin') return true;
    const members = db.projectMembers.get(p.id) || [];
    return members.some(m => m.userId === user.id);
  });

  return res.json({ success: true, data: accessible });
});

apiRouter.post('/projects', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { name, description, isPublic, icon } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Tên dự án không được để trống.' });
  }

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const id = 'proj_' + Date.now();

  const newProject: Project = {
    id,
    name: name.trim(),
    slug,
    description: description || '',
    icon: icon || 'database',
    isPublic: Boolean(isPublic),
    ownerId: user.id,
    ownerName: user.fullName,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    membersCount: 1,
    datasetsCount: 0
  };

  db.projects.set(id, newProject);
  db.projectMembers.set(id, [{
    id: 'pm_' + Date.now(),
    projectId: id,
    userId: user.id,
    userName: user.userName,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: 'Owner',
    joinedAt: new Date().toISOString()
  }]);

  // Create Project Chat Channel
  const convId = `conv_proj_${id}`;
  db.conversations.set(convId, {
    id: convId,
    type: 'Project',
    title: `Kênh dự án: ${newProject.name}`,
    projectId: id,
    projectName: newProject.name,
    lastMessage: 'Kênh thảo luận dự án vừa được tạo.',
    lastMessageAt: new Date().toISOString()
  });

  db.messages.set(convId, [{
    id: 'msg_welcome_' + id,
    conversationId: convId,
    senderId: user.id,
    senderName: user.fullName,
    content: `Chào mừng các thành viên đến với không gian làm việc của dự án "${newProject.name}"!`,
    messageType: 'Text',
    isEdited: false,
    createdAt: new Date().toISOString()
  }]);

  db.logActivity(user.id, user.fullName, 'CREATE_PROJECT', `Tạo repository dự án mới: "${newProject.name}"`);

  return res.json({ success: true, message: 'Tạo dự án thành công', data: newProject });
});

apiRouter.get('/projects/:id', requireAuth, (req, res) => {
  const project = db.projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Dự án không tồn tại.' });
  }
  const members = db.projectMembers.get(project.id) || [];
  const datasets = Array.from(db.datasets.values()).filter(d => d.projectId === project.id);

  return res.json({
    success: true,
    data: {
      ...project,
      members,
      datasets
    }
  });
});

apiRouter.post('/projects/:id/members', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { emailOrUsername, role } = req.body;
  const project = db.projects.get(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Dự án không tồn tại.' });

  // Find user to invite
  const targetUser = Array.from(db.users.values()).find(
    u => u.email.toLowerCase() === emailOrUsername.toLowerCase().trim() ||
         u.userName.toLowerCase() === emailOrUsername.toLowerCase().trim()
  );

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng với email hoặc username này.' });
  }

  const members = db.projectMembers.get(project.id) || [];
  if (members.some(m => m.userId === targetUser.id)) {
    return res.status(400).json({ success: false, message: 'Người dùng đã là thành viên của dự án.' });
  }

  const newMember: ProjectMember = {
    id: 'pm_' + Date.now(),
    projectId: project.id,
    userId: targetUser.id,
    userName: targetUser.userName,
    fullName: targetUser.fullName,
    email: targetUser.email,
    avatarUrl: targetUser.avatarUrl,
    role: role || 'Contributor',
    joinedAt: new Date().toISOString()
  };

  members.push(newMember);
  db.projectMembers.set(project.id, members);
  project.membersCount = members.length;

  // Add Notification to invited user
  const userNotifs = db.notifications.get(targetUser.id) || [];
  userNotifs.unshift({
    id: 'notif_invite_' + Date.now(),
    userId: targetUser.id,
    title: 'Lời mời tham gia dự án',
    message: `${user.fullName} đã thêm bạn vào dự án "${project.name}" với vai trò ${role || 'Contributor'}.`,
    type: 'ProjectInvite',
    linkUrl: `/projects/${project.id}`,
    isRead: false,
    createdAt: new Date().toISOString()
  });
  db.notifications.set(targetUser.id, userNotifs);

  db.logActivity(user.id, user.fullName, 'INVITE_MEMBER', `Thêm thành viên ${targetUser.fullName} vào dự án ${project.name}`);

  return res.json({ success: true, message: 'Đã thêm thành viên vào dự án.', data: newMember });
});

// -------------------------------------------------------------------------
// 3. DATASETS ROUTES (/api/datasets)
// -------------------------------------------------------------------------

apiRouter.get('/datasets', requireAuth, (req, res) => {
  const { projectId } = req.query;
  let list = Array.from(db.datasets.values());
  if (projectId) {
    list = list.filter(d => d.projectId === projectId);
  }
  return res.json({ success: true, data: list });
});

apiRouter.get('/datasets/:id', requireAuth, (req, res) => {
  const dataset = db.datasets.get(req.params.id);
  if (!dataset) return res.status(404).json({ success: false, message: 'Dataset không tồn tại.' });
  return res.json({ success: true, data: dataset });
});

apiRouter.get('/datasets/:id/preview', requireAuth, (req, res) => {
  const dataset = db.datasets.get(req.params.id);
  if (!dataset) return res.status(404).json({ success: false, message: 'Dataset không tồn tại.' });

  const rows = db.datasetData.get(dataset.id) || [];
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 15;
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  let filtered = rows;
  if (search) {
    filtered = rows.filter(r => 
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(search))
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pagedRows = filtered.slice(start, start + pageSize);

  return res.json({
    success: true,
    data: {
      rows: pagedRows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  });
});

apiRouter.post('/datasets/upload', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { projectId, name, description, fileName, fileFormat, rawContent, rows } = req.body;

  if (!projectId || !name) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Project ID và tên tập dữ liệu.' });
  }

  const project = db.projects.get(projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Dự án không tồn tại.' });

  let parsedRows: Record<string, any>[] = rows || [];

  // Parse if raw CSV content provided
  if ((!parsedRows || parsedRows.length === 0) && rawContent) {
    const lines = rawContent.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    if (lines.length > 0) {
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
      parsedRows = lines.slice(1).map((line: string, idx: number) => {
        const values = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, any> = { id: idx + 1 };
        headers.forEach((h: string, i: number) => {
          obj[h] = values[i] !== undefined ? values[i] : null;
        });
        return obj;
      });
    }
  }

  if (parsedRows.length === 0) {
    return res.status(400).json({ success: false, message: 'Dữ liệu tệp tải lên rỗng hoặc định dạng không hợp lệ.' });
  }

  // Schema analysis
  const firstRow = parsedRows[0];
  const columns = Object.keys(firstRow).filter(k => k !== 'id');
  const schema = columns.map(col => {
    let missing = 0;
    const samples: any[] = [];
    parsedRows.forEach(r => {
      const val = r[col];
      if (val === null || val === undefined || String(val).trim() === '') missing++;
      else if (samples.length < 3) samples.push(val);
    });
    return {
      name: col,
      type: typeof samples[0] === 'number' ? 'number' : 'string',
      sampleValues: samples,
      missingCount: missing
    };
  });

  const datasetId = 'ds_' + Date.now();
  const newDataset: Dataset = {
    id: datasetId,
    projectId,
    projectName: project.name,
    name: name.trim(),
    description: description || '',
    originalFileName: fileName || `${name.toLowerCase().replace(/\s+/g, '_')}.csv`,
    fileFormat: fileFormat || 'CSV',
    fileSizeBytes: rawContent ? rawContent.length : parsedRows.length * 150,
    rowCount: parsedRows.length,
    columnCount: columns.length,
    schema: schema as any,
    currentVersionNumber: 1,
    currentVersionTag: 'v1.0.0-initial',
    createdByUserId: user.id,
    createdByName: user.fullName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.datasets.set(datasetId, newDataset);
  db.datasetData.set(datasetId, parsedRows);

  // Initial version
  const initialVersion: DatasetVersion = {
    id: 'ver_' + Date.now(),
    datasetId,
    versionTag: 'v1.0.0-initial',
    versionNumber: 1,
    commitMessage: 'Initial commit: Tải lên dữ liệu thô ban đầu',
    appliedRulesSummary: 'Bản ghi gốc chưa qua chuẩn hóa',
    rowCount: parsedRows.length,
    columnCount: columns.length,
    isStable: false,
    snapshotData: JSON.parse(JSON.stringify(parsedRows)),
    createdByUserId: user.id,
    createdByName: user.fullName,
    createdAt: new Date().toISOString()
  };
  db.datasetVersions.set(datasetId, [initialVersion]);

  project.datasetsCount = (project.datasetsCount || 0) + 1;
  db.logActivity(user.id, user.fullName, 'UPLOAD_DATASET', `Tải lên dataset mới: "${newDataset.name}" (${newDataset.rowCount} dòng)`);

  return res.json({ success: true, message: 'Tải lên dataset thành công', data: newDataset });
});

apiRouter.get('/datasets/:id/download', requireAuth, (req, res) => {
  const dataset = db.datasets.get(req.params.id);
  if (!dataset) return res.status(404).json({ success: false, message: 'Dataset không tồn tại.' });

  const rows = db.datasetData.get(dataset.id) || [];
  if (rows.length === 0) {
    return res.status(400).json({ success: false, message: 'Không có dữ liệu để xuất file.' });
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const val = r[h] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','))
  ];

  const csvContent = csvLines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${dataset.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dataset.currentVersionTag}.csv"`);
  return res.send(csvContent);
});

// -------------------------------------------------------------------------
// 4. NORMALIZATION ROUTES (/api/normalization)
// -------------------------------------------------------------------------

apiRouter.get('/normalization/rules', requireAuth, (req, res) => {
  const rules = Array.from(db.normalizationRules.values());
  return res.json({ success: true, data: rules });
});

apiRouter.post('/normalization/preview', requireAuth, (req, res) => {
  const { datasetId, ruleIds, customRules } = req.body;
  const dataset = db.datasets.get(datasetId);
  if (!dataset) return res.status(404).json({ success: false, message: 'Dataset không tồn tại.' });

  const rows = db.datasetData.get(datasetId) || [];
  
  // Resolve rules to apply
  const rulesToApply: NormalizationRule[] = [];
  if (Array.isArray(ruleIds)) {
    ruleIds.forEach(id => {
      const r = db.normalizationRules.get(id);
      if (r) rulesToApply.push(r);
    });
  }
  if (Array.isArray(customRules)) {
    rulesToApply.push(...customRules);
  }

  if (rulesToApply.length === 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một quy tắc chuẩn hóa.' });
  }

  const { cleanedRows, totalChanged, duplicatesRemoved, report } = executeNormalizationPipeline(rows, rulesToApply);
  const sampleOriginal = rows.slice(0, 10);
  const sampleCleaned = cleanedRows.slice(0, 10);

  return res.json({
    success: true,
    data: {
      totalRows: rows.length,
      changedRowsCount: totalChanged,
      duplicatesFound: duplicatesRemoved,
      errorsCount: 0,
      originalSample: sampleOriginal,
      cleanedSample: sampleCleaned,
      logs: report
    }
  });
});

apiRouter.post('/normalization/apply', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { datasetId, ruleIds, customRules, commitMessage, versionTag } = req.body;

  const dataset = db.datasets.get(datasetId);
  if (!dataset) return res.status(404).json({ success: false, message: 'Dataset không tồn tại.' });

  const currentRows = db.datasetData.get(datasetId) || [];

  const rulesToApply: NormalizationRule[] = [];
  if (Array.isArray(ruleIds)) {
    ruleIds.forEach(id => {
      const r = db.normalizationRules.get(id);
      if (r) rulesToApply.push(r);
    });
  }
  if (Array.isArray(customRules)) {
    rulesToApply.push(...customRules);
  }

  if (rulesToApply.length === 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một quy tắc để áp dụng.' });
  }

  const { cleanedRows, totalChanged, duplicatesRemoved, report } = executeNormalizationPipeline(currentRows, rulesToApply);

  // Compute Diff between old snapshot and cleaned rows
  const diff = computeDatasetDiff(currentRows, cleanedRows);

  const nextVerNumber = dataset.currentVersionNumber + 1;
  const newTag = versionTag || `v1.0.${nextVerNumber - 1}-cleaned`;

  // Create new Version
  const newVersion: DatasetVersion = {
    id: 'ver_' + Date.now(),
    datasetId,
    versionTag: newTag,
    versionNumber: nextVerNumber,
    commitMessage: commitMessage || `Áp dụng ${rulesToApply.length} quy tắc chuẩn hóa dữ liệu`,
    appliedRulesSummary: rulesToApply.map(r => r.name).join(', '),
    rowCount: cleanedRows.length,
    columnCount: dataset.columnCount,
    isStable: false,
    diffSummary: {
      addedRows: diff.added,
      modifiedRows: diff.modified,
      removedRows: diff.removed,
      changedColumns: diff.changedColumns
    },
    snapshotData: JSON.parse(JSON.stringify(cleanedRows)),
    createdByUserId: user.id,
    createdByName: user.fullName,
    createdAt: new Date().toISOString()
  };

  // Update Dataset in DB
  db.datasetData.set(datasetId, cleanedRows);
  dataset.rowCount = cleanedRows.length;
  dataset.currentVersionNumber = nextVerNumber;
  dataset.currentVersionTag = newTag;
  dataset.updatedAt = new Date().toISOString();

  const versions = db.datasetVersions.get(datasetId) || [];
  versions.unshift(newVersion);
  db.datasetVersions.set(datasetId, versions);

  db.logActivity(user.id, user.fullName, 'APPLY_NORMALIZATION', `Chuẩn hóa dataset "${dataset.name}": thay đổi ${totalChanged} dòng, khử ${duplicatesRemoved} dòng trùng.`);

  // Broadcast to Project Channel if chat exists
  const projConvId = `conv_proj_${dataset.projectId}`;
  if (db.conversations.has(projConvId)) {
    const autoMsg: ChatMessage = {
      id: 'msg_auto_' + Date.now(),
      conversationId: projConvId,
      senderId: user.id,
      senderName: user.fullName,
      content: `Đã chuẩn hóa và tạo phiên bản mới [${newTag}] cho tập dữ liệu "${dataset.name}": ${commitMessage || 'Cập nhật chuẩn hóa'}.`,
      messageType: 'DatasetRef',
      metadata: {
        datasetId: dataset.id,
        datasetName: dataset.name,
        versionTag: newTag,
        projectId: dataset.projectId
      },
      isEdited: false,
      createdAt: new Date().toISOString()
    };
    const msgs = db.messages.get(projConvId) || [];
    msgs.push(autoMsg);
    db.messages.set(projConvId, msgs);
    db.broadcast('chat_message', autoMsg);
  }

  return res.json({
    success: true,
    message: 'Chuẩn hóa và tạo phiên bản mới thành công',
    data: {
      dataset,
      version: newVersion,
      stats: { totalChanged, duplicatesRemoved, report }
    }
  });
});

// -------------------------------------------------------------------------
// 5. VERSION MANAGEMENT ROUTES (/api/versions)
// -------------------------------------------------------------------------

apiRouter.get('/datasets/:id/versions', requireAuth, (req, res) => {
  const versions = db.datasetVersions.get(req.params.id) || [];
  return res.json({ success: true, data: versions });
});

apiRouter.get('/versions/compare', requireAuth, (req, res) => {
  const { datasetId, fromVersionId, toVersionId } = req.query;
  const versions = db.datasetVersions.get(datasetId as string) || [];

  const fromVer = versions.find(v => v.id === fromVersionId);
  const toVer = versions.find(v => v.id === toVersionId);

  if (!fromVer || !toVer) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy các phiên bản cần so sánh.' });
  }

  const diffResult = computeDatasetDiff(fromVer.snapshotData, toVer.snapshotData);

  return res.json({
    success: true,
    data: {
      fromVersion: fromVer,
      toVersion: toVer,
      diff: diffResult
    }
  });
});

apiRouter.post('/versions/:versionId/rollback', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { datasetId } = req.body;
  const versions = db.datasetVersions.get(datasetId) || [];
  const targetVer = versions.find(v => v.id === req.params.versionId);

  if (!targetVer) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên bản mục tiêu.' });
  const dataset = db.datasets.get(datasetId);
  if (!dataset) return res.status(404).json({ success: false, message: 'Dataset không tồn tại.' });

  // Rollback creates a new commit that restores snapshot
  const nextVerNumber = dataset.currentVersionNumber + 1;
  const rollbackTag = `v1.0.${nextVerNumber - 1}-revert-to-${targetVer.versionTag}`;
  const restoredRows = JSON.parse(JSON.stringify(targetVer.snapshotData));

  const rollbackVer: DatasetVersion = {
    id: 'ver_' + Date.now(),
    datasetId,
    versionTag: rollbackTag,
    versionNumber: nextVerNumber,
    commitMessage: `Rollback: Khôi phục lại trạng thái của phiên bản ${targetVer.versionTag}`,
    appliedRulesSummary: `Khôi phục từ commit [${targetVer.versionTag}]`,
    rowCount: restoredRows.length,
    columnCount: targetVer.columnCount,
    isStable: false,
    snapshotData: restoredRows,
    createdByUserId: user.id,
    createdByName: user.fullName,
    createdAt: new Date().toISOString()
  };

  db.datasetData.set(datasetId, restoredRows);
  dataset.rowCount = restoredRows.length;
  dataset.currentVersionNumber = nextVerNumber;
  dataset.currentVersionTag = rollbackTag;

  versions.unshift(rollbackVer);
  db.datasetVersions.set(datasetId, versions);

  db.logActivity(user.id, user.fullName, 'ROLLBACK_VERSION', `Khôi phục dataset "${dataset.name}" về phiên bản ${targetVer.versionTag}`);

  return res.json({
    success: true,
    message: `Đã khôi phục thành công về phiên bản ${targetVer.versionTag}`,
    data: { dataset, version: rollbackVer }
  });
});

apiRouter.put('/versions/:versionId/tag-stable', requireAuth, (req, res) => {
  const { datasetId, isStable } = req.body;
  const versions = db.datasetVersions.get(datasetId) || [];
  const ver = versions.find(v => v.id === req.params.versionId);
  if (!ver) return res.status(404).json({ success: false, message: 'Phiên bản không tồn tại.' });

  ver.isStable = isStable !== undefined ? isStable : true;
  return res.json({ success: true, message: 'Đã cập nhật trạng thái phiên bản chuẩn (Stable release).', data: ver });
});

// -------------------------------------------------------------------------
// 6. CHAT & REAL-TIME ROUTES (/api/chat)
// -------------------------------------------------------------------------

apiRouter.get('/chat/channels', requireAuth, (req, res) => {
  const channels = Array.from(db.conversations.values());
  return res.json({ success: true, data: channels });
});

apiRouter.get('/chat/channels/:id/messages', requireAuth, (req, res) => {
  const msgs = db.messages.get(req.params.id) || [];
  return res.json({ success: true, data: msgs });
});

apiRouter.post('/chat/channels/:id/messages', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { content, messageType, metadata } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được rỗng.' });
  }

  const conv = db.conversations.get(req.params.id);
  if (!conv) return res.status(404).json({ success: false, message: 'Phòng chat không tồn tại.' });

  const newMsg: ChatMessage = {
    id: 'msg_' + Date.now(),
    conversationId: conv.id,
    senderId: user.id,
    senderName: user.fullName,
    senderAvatar: user.avatarUrl,
    content: content.trim(),
    messageType: messageType || 'Text',
    metadata,
    isEdited: false,
    createdAt: new Date().toISOString()
  };

  const msgs = db.messages.get(conv.id) || [];
  msgs.push(newMsg);
  db.messages.set(conv.id, msgs);

  conv.lastMessage = newMsg.content;
  conv.lastMessageAt = newMsg.createdAt;

  // Broadcast real-time
  db.broadcast('chat_message', newMsg);

  return res.json({ success: true, data: newMsg });
});

// SSE endpoint for live real-time events
apiRouter.get('/chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: string) => {
    res.write(data);
  };

  db.sseClients.add(send);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    db.sseClients.delete(send);
  });
});

// -------------------------------------------------------------------------
// 7. NOTIFICATIONS & ADMIN ROUTES
// -------------------------------------------------------------------------

apiRouter.get('/notifications', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const notifs = db.notifications.get(user.id) || [];
  return res.json({ success: true, data: notifs });
});

apiRouter.put('/notifications/read-all', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const notifs = db.notifications.get(user.id) || [];
  notifs.forEach(n => n.isRead = true);
  return res.json({ success: true, message: 'Đã đánh dấu đọc tất cả thông báo.' });
});

apiRouter.get('/admin/overview', requireAuth, requireAdmin, (req, res) => {
  const users = Array.from(db.users.values());
  const projects = Array.from(db.projects.values());
  const datasets = Array.from(db.datasets.values());

  let totalRows = 0;
  datasets.forEach(d => totalRows += d.rowCount);

  return res.json({
    success: true,
    data: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalProjects: projects.length,
      totalDatasets: datasets.length,
      totalRowsProcessed: totalRows,
      totalRules: db.normalizationRules.size
    }
  });
});

apiRouter.get('/admin/users', requireAuth, requireAdmin, (req, res) => {
  const users = Array.from(db.users.values()).map(u => {
    const { passwordHash, ...clean } = u;
    return clean;
  });
  return res.json({ success: true, data: users });
});

apiRouter.put('/admin/users/:id/toggle-lock', requireAuth, requireAdmin, (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
  if (user.systemRole === 'SystemAdmin') {
    return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản SystemAdmin.' });
  }

  user.isActive = !user.isActive;
  db.logActivity((req as any).user.id, (req as any).user.fullName, 'TOGGLE_USER_LOCK', `${user.isActive ? 'Mở khóa' : 'Khóa'} tài khoản ${user.userName}`);
  return res.json({ success: true, message: `Đã ${user.isActive ? 'mở khóa' : 'khóa'} tài khoản thành công.`, data: user });
});

apiRouter.get('/admin/audit-logs', requireAuth, requireAdmin, (req, res) => {
  return res.json({ success: true, data: db.activityLogs });
});
