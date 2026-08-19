import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * All supported IANA timezones grouped by region.
 * We keep a curated list for usability — covering major cities.
 */
export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Europe/Amsterdam',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Zurich',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Bangkok',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Jakarta',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Africa/Nairobi',
];

/**
 * Format a UTC date in a specific timezone.
 */
export const formatInTimezone = (date, tz, format = 'MMM D, YYYY h:mm A') => {
  if (!date) return '';
  return dayjs.utc(date).tz(tz).format(format);
};

/**
 * Format just the time portion.
 */
export const formatTimeInTimezone = (date, tz) => {
  return formatInTimezone(date, tz, 'h:mm A');
};

/**
 * Format just the date portion.
 */
export const formatDateInTimezone = (date, tz) => {
  return formatInTimezone(date, tz, 'MMM D, YYYY');
};

/**
 * Get UTC offset label for a timezone, e.g. "UTC+5:30"
 */
export const getTimezoneOffset = (tz) => {
  const offset = dayjs().tz(tz).utcOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${hours}${minutes ? ':' + String(minutes).padStart(2, '0') : ''}`;
};

/**
 * Convert a local date/time string in a given timezone to a UTC ISO string.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} timeStr - "HH:mm"
 * @param {string} tz - IANA timezone
 * @returns {string} ISO UTC string
 */
export const localToUTC = (dateStr, timeStr, tz) => {
  const localString = `${dateStr} ${timeStr}`;
  return dayjs.tz(localString, 'YYYY-MM-DD HH:mm', tz).utc().toISOString();
};

/**
 * Convert a UTC date to local date + time strings in a given timezone.
 * @returns {{ date: string, time: string }}
 */
export const utcToLocal = (utcDate, tz) => {
  const d = dayjs.utc(utcDate).tz(tz);
  return {
    date: d.format('YYYY-MM-DD'),
    time: d.format('HH:mm'),
  };
};

/**
 * Get the month abbreviation and day for a date in a timezone.
 */
export const getDateBadge = (utcDate, tz) => {
  const d = dayjs.utc(utcDate).tz(tz);
  return {
    month: d.format('MMM'),
    day: d.format('D'),
  };
};

/**
 * Check if an event is happening today in a given timezone.
 */
export const isToday = (utcDate, tz) => {
  const eventDay = dayjs.utc(utcDate).tz(tz).startOf('day');
  const today = dayjs().tz(tz).startOf('day');
  return eventDay.isSame(today);
};

/**
 * Check if a UTC date is in the future relative to now.
 */
export const isFuture = (utcDate) => {
  return dayjs.utc(utcDate).isAfter(dayjs.utc());
};

/**
 * Format a relative "time ago" label.
 */
export const timeAgo = (utcDate) => {
  const now = dayjs.utc();
  const d = dayjs.utc(utcDate);
  const diffMin = now.diff(d, 'minute');
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = now.diff(d, 'hour');
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = now.diff(d, 'day');
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatInTimezone(utcDate, 'UTC', 'MMM D, YYYY');
};

export { dayjs };
