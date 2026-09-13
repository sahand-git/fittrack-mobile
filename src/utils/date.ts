import {localeTag} from './locale';
import {parseDateParts} from './dateCore';
export * from './dateCore';

export const formatDateDisplay = (dateStr: string): string => {
  const { year, month, day } = parseDateParts(dateStr);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(localeTag(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};
