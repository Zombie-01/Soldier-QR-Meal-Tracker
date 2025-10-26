export interface PendingScan {
  soldier_id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  timestamp: string;
}

const STORAGE_KEY = 'pending_scans';

export function savePendingScan(scan: PendingScan): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getPendingScans();
    existing.push(scan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving pending scan:', error);
  }
}

export function getPendingScans(): PendingScan[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pending scans:', error);
    return [];
  }
}

export function clearPendingScans(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing pending scans:', error);
  }
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}
