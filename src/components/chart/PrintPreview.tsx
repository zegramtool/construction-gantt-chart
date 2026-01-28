import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, eachHourOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSaturday, isSunday, differenceInDays, differenceInHours, differenceInWeeks, differenceInMonths, startOfDay, setHours, addDays, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { isHoliday, getWeekNumber } from '@/lib/holidays';
import type { Project, Task, Trade } from '@/types';
import { DEFAULT_SCALE_SCHEDULE, DEFAULT_HOUR_SCALE_SETTINGS, DEFAULT_DAY_SCALE_SETTINGS, minutesToTimeString } from '@/types';

interface PrintPreviewProps {
  project: Project;
  tasks: Task[];
  trades: Trade[];
}

export function PrintPreview({ project, tasks, trades }: PrintPreviewProps) {
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
    // 日程未定の場合や時間表示は月ヘッダーを表示しない
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
  
  // 現在のスケールに応じた値を取得
  const getScaleValue = (task: Task, field: 'start' | 'end'): number => {
    const schedule = task.scaleSchedule || DEFAULT_SCALE_SCHEDULE;
    const scale = project.viewScale;
    return schedule[scale]?.[field] ?? DEFAULT_SCALE_SCHEDULE[scale][field];
  };

  // スケールに応じたセル幅
  const cellWidth = useMemo(() => {
    switch (project.viewScale) {
      case 'hour': return 12; // 5分刻みなので小さく
      case 'day': return 20;
      case 'week': return 14;  // 30日分なので小さく
      case 'month': return 10; // 60日分なのでさらに小さく
      default: return 20;
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

  // スケールに応じたヘッダーラベル
  const getScaleLabel = () => {
    switch (project.viewScale) {
      case 'hour': return '時間';
      case 'day': return '日';
      case 'week': return '週';
      case 'month': return '月';
      default: return '日';
    }
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
      <div className="text-[7px] leading-tight">{minutes / 60}時</div>
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
              <div className="text-[8px] leading-tight">{index + 1}</div>
              <div className="text-[7px] leading-tight">{provisionalWeekday}</div>
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
            <div className="text-[8px] leading-tight">{format(date, 'd')}</div>
            <div className="text-[7px] leading-tight">{format(date, 'E', { locale: ja })}</div>
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

  // A4横のアスペクト比（297:210 ≈ 1.414）
  const a4LandscapeRatio = 297 / 210;
  
  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">印刷プレビュー（A4横）</h3>
        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
          表示: {getScaleLabel()}単位 / {dates.length}日
        </span>
      </div>
      {/* A4横比率のコンテナ */}
      <div 
        className="relative bg-gray-100 overflow-hidden"
        style={{ 
          paddingBottom: `${100 / a4LandscapeRatio}%`, // A4横の比率を維持
          maxHeight: '60vh'
        }}
      >
        <div 
          className="absolute inset-2 bg-white border shadow-inner overflow-auto"
          style={{ 
            padding: '8px'
          }}
        >
          <div 
            className="origin-top-left"
            style={{ 
              transform: 'scale(0.6)',
              transformOrigin: 'top left',
              width: '166.67%' // 1/0.6 = 166.67% で元のサイズを維持
            }}
          >
          {/* ヘッダー */}
          <div className="mb-3 pb-3 border-b">
            <h2 className="text-lg font-bold mb-2 text-center">工 程 管 理 表</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="font-medium">工事名称:</span> {project.name || '-'}</div>
              <div><span className="font-medium">現場住所:</span> {project.address || '-'}</div>
              <div>
                <span className="font-medium">全体工期:</span> {getPeriodDisplay()}
              </div>
              <div><span className="font-medium">現場管理者:</span> {project.manager || '-'}</div>
              {project.remarks && <div className="col-span-2"><span className="font-medium">備考:</span> {project.remarks}</div>}
            </div>
          </div>

          {/* バーチャートテーブル */}
          <table className="border-collapse text-[10px]">
            <thead>
              {/* 月ヘッダー（日表示で日程未定でない場合のみ） */}
              {monthGroups.length > 0 && (
                <tr>
                  <th className="border bg-gray-100 px-2 py-1 text-left w-28 min-w-28">工程名</th>
                  <th className="border bg-gray-100 px-1 py-1 text-center w-12 min-w-12">担当</th>
                  <th className="border bg-gray-100 px-1 py-1 text-center w-14 min-w-14">開始</th>
                  <th className="border bg-gray-100 px-1 py-1 text-center w-14 min-w-14">終了</th>
                  {monthGroups.map((group, i) => (
                    <th
                      key={i}
                      colSpan={group.count}
                      className="border bg-gray-100 px-1 py-0.5 text-center"
                    >
                      {group.month}
                    </th>
                  ))}
                </tr>
              )}
              {/* 日付・時間ヘッダー */}
              <tr>
                {monthGroups.length === 0 && (
                  <>
                    <th className="border bg-gray-100 px-2 py-1 text-left w-28 min-w-28">工程名</th>
                    <th className="border bg-gray-100 px-1 py-1 text-center w-12 min-w-12">担当</th>
                    <th className="border bg-gray-100 px-1 py-1 text-center w-14 min-w-14">開始</th>
                    <th className="border bg-gray-100 px-1 py-1 text-center w-14 min-w-14">終了</th>
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
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={4 + (project.viewScale === 'hour' ? timeSlots.length : dates.length)} className="border px-4 py-8 text-center text-gray-400">
                    工程を追加してください
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="border px-2 py-1 truncate max-w-28">{task.name || '-'}</td>
                    <td className="border px-1 py-1 text-center">{task.assignee || '-'}</td>
                    <td className="border px-1 py-1 text-center">
                      {formatTaskDate(task, 'start')}
                    </td>
                    <td className="border px-1 py-1 text-center">
                      {formatTaskDate(task, 'end')}
                    </td>
                    <td colSpan={project.viewScale === 'hour' ? timeSlots.length : dates.length} className="border p-0 relative h-5">
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
                        className="absolute h-3 rounded text-white text-[7px] flex items-center justify-center overflow-hidden shadow-sm"
                        style={{
                          ...getTaskBarStyle(task),
                          backgroundColor: getTaskColor(task),
                          top: '50%',
                          transform: 'translateY(-50%)',
                          marginLeft: '1px',
                        }}
                      >
                        <span className="truncate px-0.5">{task.name}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          </div>
        </div>
      </div>
    </div>
  );
}
