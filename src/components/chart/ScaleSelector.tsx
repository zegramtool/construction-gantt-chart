import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Calendar, CalendarDays, CalendarRange, Settings } from 'lucide-react';
import type { ViewScale, HourScaleSettings, DayScaleSettings } from '@/types';
import { DEFAULT_HOUR_SCALE_SETTINGS, DEFAULT_DAY_SCALE_SETTINGS } from '@/types';
import { cn } from '@/lib/utils';

interface ScaleSelectorProps {
  value: ViewScale;
  onChange: (scale: ViewScale) => void;
  hourSettings?: HourScaleSettings;
  onHourSettingsChange?: (settings: HourScaleSettings) => void;
  daySettings?: DayScaleSettings;
  onDaySettingsChange?: (settings: DayScaleSettings) => void;
}

const scales: { value: ViewScale; label: string; icon: typeof Clock }[] = [
  { value: 'hour', label: '時間', icon: Clock },
  { value: 'day', label: '日', icon: Calendar },
  { value: 'week', label: '週', icon: CalendarDays },
  { value: 'month', label: '月', icon: CalendarRange },
];

// 時間オプションを生成（0-24時）
const hourOptions = Array.from({ length: 25 }, (_, i) => i);

// 日数オプションを生成
const dayCountOptions = [3, 5, 7, 10, 14, 21, 28, 30];
const weekCountOptions = [7, 14, 21, 28, 30, 45, 60, 90];
const monthCountOptions = [30, 45, 60, 90, 120, 180, 365];

export function ScaleSelector({ 
  value, 
  onChange, 
  hourSettings, 
  onHourSettingsChange,
  daySettings,
  onDaySettingsChange
}: ScaleSelectorProps) {
  const [showSettings, setShowSettings] = useState(false);
  const hSettings = hourSettings || DEFAULT_HOUR_SCALE_SETTINGS;
  const dSettings = daySettings || DEFAULT_DAY_SCALE_SETTINGS;

  // 現在のスケールの設定ラベルを取得
  const getSettingsLabel = () => {
    switch (value) {
      case 'hour': return `${hSettings.startHour}時〜${hSettings.endHour}時`;
      case 'day': return `${dSettings.dayCount}日間`;
      case 'week': return `${dSettings.weekCount}日間`;
      case 'month': return `${dSettings.monthCount}日間`;
      default: return '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border rounded-lg overflow-hidden">
        {scales.map((scale) => {
          const Icon = scale.icon;
          return (
            <button
              key={scale.value}
              onClick={() => {
                onChange(scale.value);
                setShowSettings(false);
              }}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm transition-colors',
                value === scale.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{scale.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* スケール設定ボタン */}
      {(onHourSettingsChange || onDaySettingsChange) && (
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 text-sm border rounded-lg transition-colors',
              showSettings ? 'bg-gray-100' : 'hover:bg-gray-50'
            )}
            title="表示範囲設定"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs">{getSettingsLabel()}</span>
          </button>
          
          {showSettings && (
            <div className="absolute top-full mt-1 left-0 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-52">
              {/* 時間スケール設定 */}
              {value === 'hour' && onHourSettingsChange && (
                <>
                  <div className="text-sm font-medium mb-2">表示時間範囲</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={hSettings.startHour}
                      onChange={(e) => {
                        const newStart = parseInt(e.target.value);
                        if (newStart < hSettings.endHour) {
                          onHourSettingsChange({ ...hSettings, startHour: newStart });
                        }
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {hourOptions.slice(0, -1).map((h) => (
                        <option key={h} value={h}>{h}時</option>
                      ))}
                    </select>
                    <span className="text-gray-500">〜</span>
                    <select
                      value={hSettings.endHour}
                      onChange={(e) => {
                        const newEnd = parseInt(e.target.value);
                        if (newEnd > hSettings.startHour) {
                          onHourSettingsChange({ ...hSettings, endHour: newEnd });
                        }
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {hourOptions.slice(1).map((h) => (
                        <option key={h} value={h}>{h}時</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              {/* 日スケール設定 */}
              {value === 'day' && onDaySettingsChange && (
                <>
                  <div className="text-sm font-medium mb-2">表示日数</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={dSettings.dayCount}
                      onChange={(e) => {
                        onDaySettingsChange({ ...dSettings, dayCount: parseInt(e.target.value) });
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm flex-1"
                    >
                      {dayCountOptions.map((d) => (
                        <option key={d} value={d}>{d}日間</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              {/* 週スケール設定 */}
              {value === 'week' && onDaySettingsChange && (
                <>
                  <div className="text-sm font-medium mb-2">表示日数</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={dSettings.weekCount}
                      onChange={(e) => {
                        onDaySettingsChange({ ...dSettings, weekCount: parseInt(e.target.value) });
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm flex-1"
                    >
                      {weekCountOptions.map((d) => (
                        <option key={d} value={d}>{d}日間</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              {/* 月スケール設定 */}
              {value === 'month' && onDaySettingsChange && (
                <>
                  <div className="text-sm font-medium mb-2">表示日数</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={dSettings.monthCount}
                      onChange={(e) => {
                        onDaySettingsChange({ ...dSettings, monthCount: parseInt(e.target.value) });
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm flex-1"
                    >
                      {monthCountOptions.map((d) => (
                        <option key={d} value={d}>{d}日間</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
