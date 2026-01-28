import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, FileDown, Download } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { exportToPDF } from '@/lib/export/pdf';
import { exportToExcel } from '@/lib/export/excel';
import { exportToPNG } from '@/lib/export/image';
import { format, parseISO, eachDayOfInterval, eachHourOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSaturday, isSunday, differenceInDays, differenceInHours, differenceInWeeks, differenceInMonths, startOfDay, setHours, addDays, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { isHoliday, getWeekNumber } from '@/lib/holidays';
import type { Project, ExportSettings, Task, Trade } from '@/types';
import { DEFAULT_SCALE_SCHEDULE, DEFAULT_HOUR_SCALE_SETTINGS, DEFAULT_DAY_SCALE_SETTINGS, minutesToTimeString } from '@/types';

interface ExportModalProps {
  project: Project;
  onClose: () => void;
}

export function ExportModal({ project, onClose }: ExportModalProps) {
  const { tasks, trades } = useStore();
  const projectTasks = tasks.filter(t => t.projectId === project.id).sort((a, b) => a.order - b.order);
  const [settings, setSettings] = useState<ExportSettings>({
    paperSize: 'A4',
    orientation: 'landscape',
    scale: 1,
    showHeader: true,
    showLegend: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(project, projectTasks, trades, settings, previewRef.current);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDFのエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(project, projectTasks, trades, settings);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Excelのエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      await exportToPNG(project, projectTasks, trades, settings, previewRef.current);
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('PNGのエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">エクスポート・プレビュー</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {/* 設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">用紙サイズ</label>
              <select
                value={settings.paperSize}
                onChange={(e) => setSettings({ ...settings, paperSize: e.target.value as 'A4' | 'A3' | 'B4' })}
                className="w-full h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="B4">B4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">向き</label>
              <select
                value={settings.orientation}
                onChange={(e) => setSettings({ ...settings, orientation: e.target.value as 'portrait' | 'landscape' })}
                className="w-full h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="portrait">縦</option>
                <option value="landscape">横</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">拡大率 ({Math.round(settings.scale * 100)}%)</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.scale}
                onChange={(e) => setSettings({ ...settings, scale: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showHeader}
                  onChange={(e) => setSettings({ ...settings, showHeader: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">ヘッダー情報を表示</span>
              </label>
            </div>
          </div>

          {/* プレビュー */}
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-sm font-medium mb-2">プレビュー</h3>
            <div
              ref={previewRef}
              className="border rounded overflow-auto bg-white"
              style={{
                transform: `scale(${settings.scale})`,
                transformOrigin: 'top left',
                width: settings.orientation === 'landscape' ? '140%' : '100%',
                minHeight: '400px',
              }}
            >
              <PreviewChart
                project={project}
                tasks={projectTasks}
                trades={trades}
                settings={settings}
              />
            </div>
          </div>

          {/* エクスポートボタン */}
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex-1 gap-2"
            >
              <FileDown className="w-4 h-4" />
              PDF出力
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex-1 gap-2"
            >
              <FileDown className="w-4 h-4" />
              Excel出力
            </Button>
            <Button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              PNG出力
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// プレビュー用バーチャートコンポーネント
function PreviewChart({
  project,
  tasks,
  trades,
  settings,
}: {
  project: Project;
  tasks: Task[];
  trades: Trade[];
  settings: ExportSettings;
}) {
  // 時間スケール設定
  const hourSettings = project.hourScaleSettings || DEFAULT_HOUR_SCALE_SETTINGS;
  const startMinutes = hourSettings.startHour * 60;
  const endMinutes = hourSettings.endHour * 60;

  // 日数スケール設定
  const daySettings = project.dayScaleSettings || DEFAULT_DAY_SCALE_SETTINGS;

  // 時間スロットを生成（5分刻み）
  const timeSlots = useMemo(() => {
    const slots: number[] = [];
    for (let m = startMinutes; m <= endMinutes; m += 5) {
      slots.push(m);
    }
    return slots;
  }, [startMinutes, endMinutes]);

  // スケールに応じた日付リストを生成（スケールごとに設定された期間）
  const dates = useMemo(() => {
    const start = parseISO(project.startDate);
    
    switch (project.viewScale) {
      case 'hour':
        // 時間スケールはtimeSlotsを使用するので空配列を返す
        return [];
      case 'day':
        // 日スケール設定の日数表示
        return eachDayOfInterval({ start, end: addDays(start, daySettings.dayCount - 1) });
      case 'week':
        // 週スケール設定の日数表示
        return eachDayOfInterval({ start, end: addDays(start, daySettings.weekCount - 1) });
      case 'month':
        // 月スケール設定の日数表示
        return eachDayOfInterval({ start, end: addDays(start, daySettings.monthCount - 1) });
      default:
        return eachDayOfInterval({ start, end: addDays(start, daySettings.dayCount - 1) });
    }
  }, [project.startDate, project.viewScale, daySettings]);

  // 月のグループを計算（時間表示以外）
  const monthGroups = useMemo(() => {
    if (project.isProvisional || project.viewScale === 'hour') return [];
    
    const groups: { month: string; count: number }[] = [];
    let currentMonth = '';
    let count = 0;

    dates.forEach((date) => {
      const month = format(date, 'yyyy年M月', { locale: ja });
      if (month !== currentMonth) {
        if (currentMonth) {
          groups.push({ month: currentMonth, count });
        }
        currentMonth = month;
        count = 1;
      } else {
        count++;
      }
    });

    if (currentMonth) {
      groups.push({ month: currentMonth, count });
    }

    return groups;
  }, [dates, project.isProvisional, project.viewScale]);

  // スケールに応じたセル幅
  const cellWidth = useMemo(() => {
    switch (project.viewScale) {
      case 'hour': return 12; // 5分刻みなので小さく
      case 'day': return 24;
      case 'week': return 16;  // 30日分なので小さく
      case 'month': return 12; // 60日分なのでさらに小さく
      default: return 24;
    }
  }, [project.viewScale]);

  const getTaskColor = (task: Task) => {
    if (task.color) return task.color;
    if (task.tradeId) {
      const trade = trades.find(t => t.id === task.tradeId);
      if (trade) return trade.color;
    }
    return '#3B82F6';
  };

  // 現在のスケールに応じた値を取得
  const getScaleValue = (task: Task, field: 'start' | 'end'): number => {
    const schedule = task.scaleSchedule || DEFAULT_SCALE_SCHEDULE;
    const scale = project.viewScale;
    return schedule[scale]?.[field] ?? DEFAULT_SCALE_SCHEDULE[scale][field];
  };

  // スケールに応じたタスクバーのスタイル計算（スケール別の値を使用）
  const getTaskBarStyle = (task: Task) => {
    const startValue = getScaleValue(task, 'start');
    const endValue = getScaleValue(task, 'end');
    
    let startOffset: number;
    let duration: number;
    
    switch (project.viewScale) {
      case 'hour':
        // 5分刻みでオフセット計算（分単位からスロットインデックスに変換）
        startOffset = (startValue - startMinutes) / 5;
        duration = (endValue - startValue) / 5 + 1;
        break;
      case 'day':
      case 'week':
      case 'month':
        // 1日目を基準にオフセット計算
        startOffset = startValue - 1;
        duration = endValue - startValue + 1;
        break;
      default:
        startOffset = startValue - 1;
        duration = endValue - startValue + 1;
    }
    
    return {
      left: `${Math.max(0, startOffset) * cellWidth}px`,
      width: `${Math.max(1, duration) * cellWidth - 2}px`,
    };
  };

  const getDateCellClass = (date: Date) => {
    if (project.viewScale === 'hour') return '';
    if (isSunday(date) || isHoliday(date)) {
      return 'bg-red-50 text-red-600';
    } else if (isSaturday(date)) {
      return 'bg-blue-50 text-blue-600';
    }
    return '';
  };

  // スケールに応じた期間表示
  const getPeriodDisplay = () => {
    if (project.isProvisional) {
      switch (project.viewScale) {
        case 'hour': return `${hourSettings.startHour}時〜${hourSettings.endHour}時（日程未定）`;
        case 'day': return `${dates.length}日間（日程未定）`;
        case 'week': return `${dates.length}日間（日程未定）`;
        case 'month': return `${dates.length}日間（日程未定）`;
        default: return `${dates.length}日間（日程未定）`;
      }
    }
    if (project.viewScale === 'hour') {
      return `${format(parseISO(project.startDate), 'yyyy/M/d')} ${hourSettings.startHour}時〜${hourSettings.endHour}時`;
    }
    return `${format(parseISO(project.startDate), 'yyyy/M/d')} 〜 ${format(parseISO(project.endDate), 'yyyy/M/d')}`;
  };

  // 時間スロットのヘッダー表示
  const renderTimeSlotHeader = (minutes: number, index: number) => {
    const isHourMark = minutes % 60 === 0;
    return isHourMark ? (
      <div className="text-[8px] leading-tight">{minutes / 60}時</div>
    ) : null;
  };

  // スケールに応じた日付ヘッダー表示
  const renderDateHeader = (date: Date, index: number) => {
    const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
    const provisionalWeekday = weekdays[index % 7];
    
    if (project.isProvisional) {
      switch (project.viewScale) {
        case 'day':
        case 'week':
        case 'month':
          return (
            <>
              <div className="text-[9px]">{index + 1}</div>
              <div className="text-[8px]">{provisionalWeekday}</div>
            </>
          );
        default:
          return null;
      }
    }

    switch (project.viewScale) {
      case 'day':
      case 'week':
      case 'month':
        // 全て日単位で表示
        return (
          <>
            <div className="text-[9px]">{format(date, 'd')}</div>
            <div className="text-[8px]">{format(date, 'E', { locale: ja })}</div>
          </>
        );
      default:
        return format(date, 'd');
    }
  };

  // スケールに応じたタスク日付表示（スケール別の値を使用）
  const formatTaskDate = (task: Task, field: 'start' | 'end') => {
    const value = getScaleValue(task, field);
    
    switch (project.viewScale) {
      case 'hour': return minutesToTimeString(value);
      case 'day':
      case 'week':
      case 'month':
      default:
        return `${value}日`;
    }
  };

  return (
    <div className="p-4">
      {settings.showHeader && (
        <div className="mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold mb-2 text-center">工 程 管 理 表</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">工事名称:</span> {project.name || '-'}</div>
            <div><span className="font-medium">現場住所:</span> {project.address || '-'}</div>
            <div>
              <span className="font-medium">全体工期:</span> {getPeriodDisplay()}
            </div>
            <div><span className="font-medium">現場管理者:</span> {project.manager || '-'}</div>
            {project.remarks && <div className="col-span-2"><span className="font-medium">備考:</span> {project.remarks}</div>}
          </div>
        </div>
      )}

      {/* バーチャートテーブル */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs w-full">
          <thead>
            {/* 月ヘッダー（日表示で日程未定でない場合のみ） */}
            {monthGroups.length > 0 && (
              <tr>
                <th className="border bg-gray-100 px-2 py-1 text-left w-32 min-w-32">工程名</th>
                <th className="border bg-gray-100 px-1 py-1 text-center w-16 min-w-16">担当</th>
                <th className="border bg-gray-100 px-1 py-1 text-center w-20 min-w-20">開始</th>
                <th className="border bg-gray-100 px-1 py-1 text-center w-20 min-w-20">終了</th>
                {monthGroups.map((group, i) => (
                  <th
                    key={i}
                    colSpan={group.count}
                    className="border bg-gray-100 px-1 py-1 text-center text-xs"
                  >
                    {group.month}
                  </th>
                ))}
              </tr>
            )}
            {/* 日付ヘッダー */}
            <tr>
              {monthGroups.length === 0 && (
                <>
                  <th className="border bg-gray-100 px-2 py-1 text-left w-32 min-w-32">工程名</th>
                  <th className="border bg-gray-100 px-1 py-1 text-center w-16 min-w-16">担当</th>
                  <th className="border bg-gray-100 px-1 py-1 text-center w-20 min-w-20">開始</th>
                  <th className="border bg-gray-100 px-1 py-1 text-center w-20 min-w-20">終了</th>
                </>
              )}
              {monthGroups.length > 0 && (
                <>
                  <th className="border bg-gray-100"></th>
                  <th className="border bg-gray-100"></th>
                  <th className="border bg-gray-100"></th>
                  <th className="border bg-gray-100"></th>
                </>
              )}
              {/* 時間スケールの場合 */}
              {project.viewScale === 'hour' && timeSlots.map((minutes, i) => {
                const isHourMark = minutes % 60 === 0;
                return (
                  <th
                    key={i}
                    className={`border px-0 py-0.5 text-center ${isHourMark ? 'bg-gray-50' : ''}`}
                    style={{ width: cellWidth, minWidth: cellWidth }}
                  >
                    {renderTimeSlotHeader(minutes, i)}
                  </th>
                );
              })}
              {/* 日・週・月スケールの場合 */}
              {project.viewScale !== 'hour' && dates.map((date, i) => {
                const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
                const provisionalWeekday = weekdays[i % 7];
                
                let cellClass = '';
                if (project.isProvisional) {
                  cellClass = provisionalWeekday === '土' ? 'bg-blue-50 text-blue-600' : provisionalWeekday === '日' ? 'bg-red-50 text-red-600' : '';
                } else {
                  cellClass = getDateCellClass(date);
                }
                
                return (
                  <th
                    key={i}
                    className={`border px-0 py-0.5 text-center ${cellClass}`}
                    style={{ width: cellWidth, minWidth: cellWidth }}
                  >
                    {renderDateHeader(date, i)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="border px-2 py-1 truncate">{task.name || '-'}</td>
                <td className="border px-1 py-1 text-center">{task.assignee || '-'}</td>
                <td className="border px-1 py-1 text-center">{formatTaskDate(task, 'start')}</td>
                <td className="border px-1 py-1 text-center">{formatTaskDate(task, 'end')}</td>
                <td colSpan={project.viewScale === 'hour' ? timeSlots.length : dates.length} className="border p-0 relative h-6">
                  {/* グリッド背景 */}
                  <div className="absolute inset-0 flex">
                    {project.viewScale === 'hour' ? (
                      timeSlots.map((minutes, i) => {
                        const isHourMark = minutes % 60 === 0;
                        return (
                          <div
                            key={i}
                            className={`border-r h-full ${isHourMark ? 'bg-gray-50' : ''}`}
                            style={{ width: cellWidth, minWidth: cellWidth }}
                          />
                        );
                      })
                    ) : (
                      dates.map((date, i) => {
                        const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
                        const provisionalWeekday = weekdays[i % 7];
                        
                        let cellClass = '';
                        if (project.isProvisional) {
                          cellClass = provisionalWeekday === '土' ? 'bg-blue-50' : provisionalWeekday === '日' ? 'bg-red-50' : '';
                        } else {
                          cellClass = getDateCellClass(date);
                        }
                        
                        return (
                          <div
                            key={i}
                            className={`border-r h-full ${cellClass}`}
                            style={{ width: cellWidth, minWidth: cellWidth }}
                          />
                        );
                      })
                    )}
                  </div>
                  {/* タスクバー */}
                  <div
                    className="absolute h-4 rounded text-white text-[9px] flex items-center justify-center overflow-hidden"
                    style={{
                      ...getTaskBarStyle(task),
                      backgroundColor: getTaskColor(task),
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginLeft: '1px',
                    }}
                  >
                    {task.name}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
