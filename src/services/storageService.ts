import { ScanRecord } from '../types';

const STORAGE_KEY = 'lifelens_scan_history_v1';
const USAGE_KEY = 'lifelens_daily_usage_v1';
const DAILY_LIMIT = 8; // generous free tier quota

export interface DailyUsage {
  date: string;
  count: number;
}

export function getScanHistory(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load scan history:', err);
    return [];
  }
}

export function saveScanRecord(record: ScanRecord): void {
  try {
    const history = getScanHistory();
    // Prepend new record, keep up to 40 records
    const updated = [record, ...history.filter((r) => r.id !== record.id)].slice(0, 40);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    incrementDailyScanCount();
  } catch (err) {
    console.error('Failed to save scan record:', err);
  }
}

export function updateScanRecord(record: ScanRecord): void {
  try {
    const history = getScanHistory();
    const updated = history.map((r) => (r.id === record.id ? record : r));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update scan record:', err);
  }
}

export function deleteScanRecord(id: string): void {
  try {
    const history = getScanHistory();
    const updated = history.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete scan record:', err);
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

export function getDailyScanCount(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return 0;
    const usage: DailyUsage = JSON.parse(raw);
    if (usage.date === today) {
      return usage.count;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function incrementDailyScanCount(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) {
      const usage: DailyUsage = JSON.parse(raw);
      if (usage.date === today) {
        count = usage.count;
      }
    }
    count += 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count }));
    return count;
  } catch {
    return 1;
  }
}

export function getDailyLimit(): number {
  return DAILY_LIMIT;
}
