import {localeTag} from './locale';
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateParts = (dateStr: string): { year: number; month: number; day: number } => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
};

export const getPreviousDayString = (dateStr: string): string => {
  const { year, month, day } = parseDateParts(dateStr);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

export const getNextDayString = (dateStr: string): string => {
  const { year, month, day } = parseDateParts(dateStr);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

export const isDateToday = (dateStr: string): boolean => {
  return dateStr === getTodayDateString();
};

export const formatDateDisplay = (dateStr: string): string => {
  const { year, month, day } = parseDateParts(dateStr);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(localeTag(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};
