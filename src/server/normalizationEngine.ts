import type { NormalizationRule, NormalizationPreviewResult } from '../types/index.js';

// Capitalize Vietnamese Title Case (e.g., nguyễn văn an -> Nguyễn Văn An)
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Normalize Vietnamese Phone Number
export function normalizeVietnamesePhone(phone: any): string {
  if (phone === null || phone === undefined) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '').trim();
  
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // Format as 10 digits
  return cleaned;
}

// Normalize Dates to ISO YYYY-MM-DD
export function normalizeDate(dateVal: any, targetFormat: string = 'YYYY-MM-DD'): string {
  if (!dateVal) return '';
  const str = String(dateVal).trim();

  // Try parsing DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try parsing YYYY/MM/DD or YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

// Normalize Email
export function normalizeEmail(emailVal: any): string {
  if (!emailVal) return '';
  return String(emailVal).trim().toLowerCase();
}

// Apply single rule to a cell value
export function applyRuleToValue(val: any, rule: NormalizationRule): any {
  if (val === null || val === undefined) {
    if (rule.ruleType === 'HandleNullEmpty') {
      return rule.configuration?.nullValueDefault || 'N/A';
    }
    return val;
  }

  const str = String(val);

  switch (rule.ruleType) {
    case 'TrimWhitespace':
      return str.trim();

    case 'NormalizeMultipleSpaces':
      return str.trim().replace(/\s+/g, ' ');

    case 'UpperCase':
      return str.toUpperCase();

    case 'LowerCase':
      return str.toLowerCase();

    case 'TitleCase':
      return toTitleCase(str);

    case 'NormalizeEmail':
      return normalizeEmail(str);

    case 'NormalizePhone':
      return normalizeVietnamesePhone(str);

    case 'NormalizeDate':
      return normalizeDate(str, rule.configuration?.dateFormat || 'YYYY-MM-DD');

    case 'HandleNullEmpty':
      if (str.trim() === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
        return rule.configuration?.nullValueDefault || 'N/A';
      }
      return val;

    case 'SearchAndReplace':
      if (rule.configuration?.replaceSearch) {
        const search = rule.configuration.replaceSearch;
        const replace = rule.configuration.replaceWith || '';
        return str.split(search).join(replace);
      }
      return val;

    case 'TypeCasting':
      if (rule.configuration?.targetType === 'number') {
        const num = Number(str.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? val : num;
      }
      return str;

    default:
      return val;
  }
}

// Execute batch normalization pipeline on dataset
export function executeNormalizationPipeline(
  rows: Record<string, any>[],
  rules: NormalizationRule[]
): {
  cleanedRows: Record<string, any>[];
  totalChanged: number;
  duplicatesRemoved: number;
  report: string[];
} {
  let workingRows = JSON.parse(JSON.stringify(rows)) as Record<string, any>[];
  let totalChanged = 0;
  let duplicatesRemoved = 0;
  const report: string[] = [];

  for (const rule of rules) {
    report.push(`Áp dụng quy tắc: [${rule.name}] (Loại: ${rule.ruleType}${rule.targetColumn ? ` trên cột "${rule.targetColumn}"` : ' trên toàn bộ dữ liệu'})`);

    if (rule.ruleType === 'Deduplicate') {
      const initialCount = workingRows.length;
      const seen = new Set<string>();
      const deduped: Record<string, any>[] = [];

      for (const row of workingRows) {
        // If targetColumn is specified, dedup by that column; else by all columns except id
        const key = rule.targetColumn 
          ? String(row[rule.targetColumn] ?? '')
          : Object.entries(row)
              .filter(([k]) => k !== 'id')
              .map(([_, v]) => String(v ?? ''))
              .join('|');

        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(row);
        }
      }

      duplicatesRemoved += (initialCount - deduped.length);
      workingRows = deduped;
      report.push(`-> Khử trùng lặp: Đã loại bỏ ${initialCount - deduped.length} dòng trùng.`);
      continue;
    }

    // Apply value transformations row by row
    let ruleChangedCount = 0;

    workingRows = workingRows.map(row => {
      const newRow = { ...row };
      let rowModified = false;

      const allCols = Object.keys(row).filter(k => k !== 'id');
      let columnsToProcess = rule.targetColumn ? [rule.targetColumn] : allCols;

      // Smart column matching when targetColumn is not explicitly set
      if (!rule.targetColumn) {
        if (rule.ruleType === 'NormalizePhone') {
          columnsToProcess = allCols.filter(c => /phone|sdt|dien_thoai|mobile|tel/i.test(c));
        } else if (rule.ruleType === 'NormalizeEmail') {
          columnsToProcess = allCols.filter(c => /email|mail/i.test(c));
        } else if (rule.ruleType === 'NormalizeDate') {
          columnsToProcess = allCols.filter(c => /date|ngay|sinh|time|nam/i.test(c));
        } else if (rule.ruleType === 'TitleCase') {
          columnsToProcess = allCols.filter(c => /name|ten|ho|ho_ten|full_name|tinh|thanh|city/i.test(c));
        }
      }

      for (const col of columnsToProcess) {
        if (!(col in newRow)) continue;
        const oldVal = newRow[col];
        const newVal = applyRuleToValue(oldVal, rule);

        if (oldVal !== newVal) {
          newRow[col] = newVal;
          rowModified = true;
        }
      }

      if (rowModified) {
        ruleChangedCount++;
      }

      return newRow;
    });

    totalChanged += ruleChangedCount;
    report.push(`-> Đã chuẩn hóa thành công ${ruleChangedCount} dòng dữ liệu.`);
  }

  return {
    cleanedRows: workingRows,
    totalChanged,
    duplicatesRemoved,
    report
  };
}

// Compare two datasets snapshots and generate a detailed diff
export function computeDatasetDiff(
  oldRows: Record<string, any>[],
  newRows: Record<string, any>[]
): {
  added: number;
  modified: number;
  removed: number;
  changedColumns: string[];
  diffRows: {
    status: 'added' | 'modified' | 'removed' | 'unchanged';
    old?: Record<string, any>;
    new?: Record<string, any>;
    changedFields?: string[];
  }[];
} {
  const diffRows: any[] = [];
  const oldMap = new Map<string, Record<string, any>>();
  const changedColsSet = new Set<string>();

  let added = 0;
  let modified = 0;
  let removed = 0;

  oldRows.forEach((r, idx) => {
    const key = String(r.id !== undefined ? r.id : idx);
    oldMap.set(key, r);
  });

  const processedKeys = new Set<string>();

  newRows.forEach((newR, idx) => {
    const key = String(newR.id !== undefined ? newR.id : idx);
    processedKeys.add(key);

    const oldR = oldMap.get(key);

    if (!oldR) {
      added++;
      diffRows.push({ status: 'added', new: newR });
    } else {
      const changedFields: string[] = [];
      const allCols = Array.from(new Set([...Object.keys(oldR), ...Object.keys(newR)]));

      for (const col of allCols) {
        if (oldR[col] !== newR[col]) {
          changedFields.push(col);
          changedColsSet.add(col);
        }
      }

      if (changedFields.length > 0) {
        modified++;
        diffRows.push({
          status: 'modified',
          old: oldR,
          new: newR,
          changedFields
        });
      } else {
        diffRows.push({
          status: 'unchanged',
          old: oldR,
          new: newR
        });
      }
    }
  });

  // Check for removed rows
  oldMap.forEach((oldR, key) => {
    if (!processedKeys.has(key)) {
      removed++;
      diffRows.push({ status: 'removed', old: oldR });
    }
  });

  return {
    added,
    modified,
    removed,
    changedColumns: Array.from(changedColsSet),
    diffRows
  };
}
