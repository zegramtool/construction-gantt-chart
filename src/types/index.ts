// 表示スケール
export type ViewScale = 'hour' | 'day' | 'week' | 'month';

// 時間スケール設定
export interface HourScaleSettings {
  startHour: number;  // 開始時間（0-23）
  endHour: number;    // 終了時間（1-24）
}

// 日数スケール設定（日・週・月共通）
export interface DayScaleSettings {
  dayCount: number;   // 表示日数
  weekCount: number;  // 週スケール時の表示日数
  monthCount: number; // 月スケール時の表示日数
}

// プロジェクト
export interface Project {
  id: string;
  name: string;
  address: string;
  manager: string;
  startDate: string;
  endDate: string;
  remarks: string;
  isProvisional: boolean;
  viewScale: ViewScale;
  createdAt: string;
  updatedAt: string;
  workdaySettings: WorkdaySettings;
  hourScaleSettings?: HourScaleSettings;  // 時間スケール設定
  dayScaleSettings?: DayScaleSettings;    // 日数スケール設定
}

// デフォルト時間スケール設定（8時〜18時）
export const DEFAULT_HOUR_SCALE_SETTINGS: HourScaleSettings = {
  startHour: 8,
  endHour: 18,
};

// デフォルト日数スケール設定
export const DEFAULT_DAY_SCALE_SETTINGS: DayScaleSettings = {
  dayCount: 7,     // 日スケール: 7日
  weekCount: 30,   // 週スケール: 30日
  monthCount: 60,  // 月スケール: 60日
};

// 稼働日設定
export interface WorkdaySettings {
  skipSaturday: boolean;
  skipSunday: boolean;
  skipHolidays: boolean;
  customHolidays: string[];
  customWorkdays: string[];
  showOnlyWorkdays: boolean;
}

// 業種マスタ
export interface Trade {
  id: string;
  name: string;
  color: string;
  order: number;
}

// スケール別のタスク日程
export interface ScaleBasedSchedule {
  hour: { start: number; end: number };   // 分単位（0-1440、5分刻み）
  day: { start: number; end: number };    // 1-7 (日目)
  week: { start: number; end: number };   // 1-30 (日目)
  month: { start: number; end: number };  // 1-60 (日目)
}

// 工程（タスク）
export interface Task {
  id: string;
  projectId: string;
  tradeId?: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  color?: string;
  order: number;
  // スケール別の独立した値
  scaleSchedule?: ScaleBasedSchedule;
}

// デフォルトスケール別スケジュール
export const DEFAULT_SCALE_SCHEDULE: ScaleBasedSchedule = {
  hour: { start: 480, end: 540 },  // 8:00-9:00 (分単位)
  day: { start: 1, end: 3 },
  week: { start: 1, end: 7 },
  month: { start: 1, end: 14 },
};

// 分を時:分形式の文字列に変換
export const minutesToTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

// 時:分形式の文字列を分に変換
export const timeStringToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

// エクスポート設定
export interface ExportSettings {
  paperSize: 'A4' | 'A3' | 'B4';
  orientation: 'portrait' | 'landscape';
  scale: number;
  showHeader: boolean;
  showLegend: boolean;
}

// デフォルト値
export const DEFAULT_WORKDAY_SETTINGS: WorkdaySettings = {
  skipSaturday: false,
  skipSunday: true,
  skipHolidays: true,
  customHolidays: [],
  customWorkdays: [],
  showOnlyWorkdays: false,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  paperSize: 'A4',
  orientation: 'landscape',
  scale: 1,
  showHeader: true,
  showLegend: true,
};

export const DEFAULT_TRADES: Omit<Trade, 'id'>[] = [
  { name: '電気工事', color: '#3B82F6', order: 0 },
  { name: '配管工事', color: '#10B981', order: 1 },
  { name: '大工工事', color: '#F59E0B', order: 2 },
  { name: '塗装工事', color: '#EF4444', order: 3 },
  { name: '内装工事', color: '#8B5CF6', order: 4 },
  { name: '外構工事', color: '#EC4899', order: 5 },
  { name: 'その他', color: '#6B7280', order: 6 },
];
