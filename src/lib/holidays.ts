import { isHoliday as jpIsHoliday, between } from '@holiday-jp/holiday_jp';
import { format, parseISO, isWeekend, isSaturday, isSunday, getWeek, eachDayOfInterval, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth, differenceInDays, differenceInHours, addHours, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { WorkdaySettings, ViewScale } from '../types';

// 日付が祝日かどうか
export function isHoliday(date: Date): boolean {
  return jpIsHoliday(date);
}

// 日付が休日かどうか（設定に基づく）
export function isNonWorkday(date: Date, settings: WorkdaySettings): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // カスタム稼働日なら稼働日
  if (settings.customWorkdays.includes(dateStr)) {
    return false;
  }
  
  // カスタム休日なら休日
  if (settings.customHolidays.includes(dateStr)) {
    return true;
  }
  
  // 土曜判定
  if (settings.skipSaturday && isSaturday(date)) {
    return true;
  }
  
  // 日曜判定
  if (settings.skipSunday && isSunday(date)) {
    return true;
  }
  
  // 祝日判定
  if (settings.skipHolidays && isHoliday(date)) {
    return true;
  }
  
  return false;
}

// 期間内の祝日リストを取得
export function getHolidaysInRange(start: Date, end: Date): { date: Date; name: string }[] {
  const holidays = between(start, end);
  return holidays.map(h => ({
    date: new Date(h.date),
    name: h.name,
  }));
}

// 稼働日数を計算
export function countWorkdays(start: Date, end: Date, settings: WorkdaySettings): number {
  const days = eachDayOfInterval({ start, end });
  return days.filter(d => !isNonWorkday(d, settings)).length;
}

// N稼働日後の日付を計算
export function addWorkdays(start: Date, workdays: number, settings: WorkdaySettings): Date {
  let current = start;
  let count = 0;
  
  while (count < workdays) {
    current = addDays(current, 1);
    if (!isNonWorkday(current, settings)) {
      count++;
    }
  }
  
  return current;
}

// 日付の曜日を取得（日本語）
export function getDayOfWeek(date: Date): string {
  return format(date, 'E', { locale: ja });
}

// 週番号を取得
export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 1 }); // 月曜始まり
}

// スケールに応じた日付リストを生成
export function generateDateRange(
  start: Date,
  end: Date,
  scale: ViewScale,
  settings: WorkdaySettings
): Date[] {
  const dates: Date[] = [];
  let current = start;
  
  while (current <= end) {
    // 稼働日のみ表示モードの場合
    if (settings.showOnlyWorkdays && scale === 'day') {
      if (!isNonWorkday(current, settings)) {
        dates.push(current);
      }
    } else {
      dates.push(current);
    }
    
    // スケールに応じて次の日付へ
    switch (scale) {
      case 'hour':
        current = addHours(current, 1);
        break;
      case 'day':
        current = addDays(current, 1);
        break;
      case 'week':
        current = addWeeks(current, 1);
        break;
      case 'month':
        current = addMonths(current, 1);
        break;
    }
  }
  
  return dates;
}

// 日付の表示フォーマット
export function formatDate(date: Date, scale: ViewScale): string {
  switch (scale) {
    case 'hour':
      return format(date, 'H:mm');
    case 'day':
      return format(date, 'd');
    case 'week':
      return `W${getWeekNumber(date)}`;
    case 'month':
      return format(date, 'M月', { locale: ja });
  }
}

// ヘッダー用の月表示
export function formatMonthHeader(date: Date): string {
  return format(date, 'yyyy年M月', { locale: ja });
}
