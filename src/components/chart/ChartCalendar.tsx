import { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical } from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isSaturday, isSunday, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { isHoliday, isNonWorkday } from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { TaskBar } from './TaskBar';
import type { Project, Task, Trade, ScaleBasedSchedule } from '@/types';
import { DEFAULT_SCALE_SCHEDULE, DEFAULT_HOUR_SCALE_SETTINGS, DEFAULT_DAY_SCALE_SETTINGS, minutesToTimeString } from '@/types';

interface ChartCalendarProps {
  project: Project;
  tasks: Task[];
  trades: Trade[];
}

export function ChartCalendar({ project, tasks, trades }: ChartCalendarProps) {
  const { addTask, updateTask, deleteTask } = useStore();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [colorPickerTaskId, setColorPickerTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // 色のパレット
  const colorPalette = [
    '#3B82F6', // 青
    '#10B981', // 緑
    '#F59E0B', // オレンジ
    '#EF4444', // 赤
    '#8B5CF6', // 紫
    '#EC4899', // ピンク
    '#06B6D4', // シアン
    '#84CC16', // ライム
    '#F97316', // オレンジ
    '#6366F1', // インディゴ
    '#14B8A6', // ティール
    '#A855F7', // バイオレット
  ];

  // 時間スケール設定を取得
  const hourSettings = project.hourScaleSettings || DEFAULT_HOUR_SCALE_SETTINGS;
  const startMinutes = hourSettings.startHour * 60;
  const endMinutes = hourSettings.endHour * 60;

  // 日数スケール設定を取得
  const daySettings = project.dayScaleSettings || DEFAULT_DAY_SCALE_SETTINGS;

  // 外側クリックで色選択パネルを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-color-picker]')) {
        setColorPickerTaskId(null);
      }
    };

    if (colorPickerTaskId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [colorPickerTaskId]);

  // 現在のスケールに応じた値を取得
  const getScaleValue = (task: Task, field: 'start' | 'end'): number => {
    const schedule = task.scaleSchedule || DEFAULT_SCALE_SCHEDULE;
    const scale = project.viewScale;
    return schedule[scale]?.[field] ?? DEFAULT_SCALE_SCHEDULE[scale][field];
  };

  // スケール別の値を更新
  const updateScaleValue = (task: Task, field: 'start' | 'end', value: number) => {
    const currentSchedule = task.scaleSchedule || { ...DEFAULT_SCALE_SCHEDULE };
    const scale = project.viewScale;
    
    const newSchedule: ScaleBasedSchedule = {
      ...currentSchedule,
      [scale]: {
        ...currentSchedule[scale],
        [field]: value
      }
    };
    
    updateTask(task.id, { scaleSchedule: newSchedule });
  };

  // スケールに応じた単位ラベル
  const getUnitLabel = () => {
    switch (project.viewScale) {
      case 'hour': return '';
      case 'day': return '日';
      case 'week': return '日';
      case 'month': return '日';
      default: return '日';
    }
  };

  // 入力欄の最小値・最大値（分単位 or 日単位）
  const getMinValue = () => project.viewScale === 'hour' ? startMinutes : 1;
  const getMaxValue = () => {
    switch (project.viewScale) {
      case 'hour': return endMinutes;
      case 'day': return daySettings.dayCount;
      case 'week': return daySettings.weekCount;
      case 'month': return daySettings.monthCount;
      default: return undefined;
    }
  };

  // 分を時間と分に分解
  const minutesToHoursAndMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { hours: h, minutes: m };
  };

  // 時間と分を分に変換（5分刻みに丸める）
  const hoursAndMinutesToMinutes = (hours: number, minutes: number) => {
    const roundedMinutes = Math.round(minutes / 5) * 5;
    return hours * 60 + roundedMinutes;
  };

  // 時間スロットを生成（5分刻み）
  const timeSlots = useMemo(() => {
    const slots: number[] = [];
    for (let m = startMinutes; m <= endMinutes; m += 5) {
      slots.push(m);
    }
    return slots;
  }, [startMinutes, endMinutes]);

  // 日付リストを生成（スケールごとに設定された期間）
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

  // 月のグループを計算（日表示・週表示・月表示の場合）
  const monthGroups = useMemo(() => {
    if (project.viewScale === 'hour') return [];
    
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
  }, [dates, project.viewScale]);

  // セル幅を計算
  const cellWidth = useMemo(() => {
    switch (project.viewScale) {
      case 'hour': return 24; // 5分刻みなので小さく
      case 'day': return 32;
      case 'week': return 20;  // 30日分なので小さく
      case 'month': return 14; // 60日分なのでさらに小さく
      default: return 32;
    }
  }, [project.viewScale]);

  // タスクバーの位置を計算（スケール別の値を使用）
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
      left: `${startOffset * cellWidth}px`,
      width: `${Math.max(duration, 1) * cellWidth - 4}px`,
    };
  };

  // ドラッグ&ドロップでタスクの順序を変更
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId && draggedTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    setDragOverTaskId(null);
    
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      return;
    }

    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    const targetTask = tasks.find(t => t.id === targetTaskId);
    
    if (!draggedTask || !targetTask) {
      setDraggedTaskId(null);
      return;
    }

    // タスクの順序を更新
    const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = sortedTasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTaskId(null);
      return;
    }

    // 新しい順序を計算
    const newTasks = [...sortedTasks];
    const [removed] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, removed);

    // 全タスクのorderを更新
    newTasks.forEach((task, index) => {
      if (task.order !== index) {
        updateTask(task.id, { order: index });
      }
    });

    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // 新規タスク追加
  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    
    // 時間モードの場合、最後のタスクの終了時間を取得
    let scaleSchedule = undefined;
    if (project.viewScale === 'hour' && tasks.length > 0) {
      const lastTask = tasks[tasks.length - 1];
      const lastSchedule = lastTask.scaleSchedule || DEFAULT_SCALE_SCHEDULE;
      const lastEndTime = lastSchedule.hour?.end || DEFAULT_SCALE_SCHEDULE.hour.end;
      // 最後のタスクの終了時間を開始時間とし、終了時間は開始時間+1時間（60分）
      scaleSchedule = {
        ...DEFAULT_SCALE_SCHEDULE,
        hour: {
          start: lastEndTime,
          end: lastEndTime + 60, // 1時間後
        },
      };
    }
    
    addTask({
      projectId: project.id,
      name: newTaskName.trim(),
      assignee: '',
      startDate: project.startDate,
      endDate: project.startDate,
      order: tasks.length,
      scaleSchedule,
    });
    setNewTaskName('');
  };

  // 日付セルのスタイル
  const getDateCellClass = (date: Date) => {
    const classes = ['border-r border-b text-center text-xs'];
    
    if (project.viewScale === 'day') {
      if (isSunday(date) || isHoliday(date)) {
        classes.push('bg-red-50 text-red-600');
      } else if (isSaturday(date)) {
        classes.push('bg-blue-50 text-blue-600');
      }
      
      if (isNonWorkday(date, project.workdaySettings)) {
        classes.push('opacity-50');
      }
    }
    
    return cn(classes);
  };

  // 業種の色を取得
  const getTaskColor = (task: Task) => {
    if (task.color) return task.color;
    if (task.tradeId) {
      const trade = trades.find(t => t.id === task.tradeId);
      if (trade) return trade.color;
    }
    return '#3B82F6';
  };

  return (
    <div className="relative">
      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="border-collapse min-w-full">
          <thead>
            {/* 月ヘッダー（日・週・月表示の場合、日程未定でない場合のみ） */}
            {monthGroups.length > 0 && !project.isProvisional && (
              <tr>
                <th className="sticky left-0 bg-white z-10 border-r border-b w-[200px] min-w-[200px]"></th>
                <th className="sticky left-[200px] bg-white z-10 border-r border-b w-[80px] min-w-[80px]"></th>
                <th className="sticky left-[280px] bg-white z-10 border-r border-b w-[80px] min-w-[80px]"></th>
                <th className="sticky left-[360px] bg-white z-10 border-r border-b w-[80px] min-w-[80px]"></th>
                {monthGroups.map((group, i) => (
                  <th
                    key={i}
                    colSpan={group.count}
                    className="border-r border-b bg-gray-100 text-sm font-medium py-1"
                  >
                    {group.month}
                  </th>
                ))}
              </tr>
            )}
            
            {/* 日付ヘッダー */}
            <tr>
              <th className="sticky left-0 bg-gray-100 z-10 border-r border-b px-2 py-2 text-left text-sm font-medium w-[200px] min-w-[200px]">
                工程名
              </th>
              <th className="sticky left-[200px] bg-gray-100 z-10 border-r border-b px-2 py-2 text-center text-sm font-medium w-[80px] min-w-[80px]">
                担当
              </th>
              <th className="sticky left-[280px] bg-gray-100 z-10 border-r border-b px-2 py-2 text-center text-sm font-medium w-[80px] min-w-[80px]">
                {project.viewScale === 'hour' ? '開始時間' : (project.isProvisional ? '開始日' : '開始')}
              </th>
              <th className="sticky left-[360px] bg-gray-100 z-10 border-r border-b px-2 py-2 text-center text-sm font-medium w-[80px] min-w-[80px]">
                {project.viewScale === 'hour' ? '終了時間' : (project.isProvisional ? '終了日' : '終了')}
              </th>
              {/* 時間スケールの場合 */}
              {project.viewScale === 'hour' && timeSlots.map((minutes, i) => {
                const isHourMark = minutes % 60 === 0;
                return (
                  <th
                    key={i}
                    className={cn(
                      'border-b py-1 font-normal text-[10px]',
                      isHourMark ? 'bg-gray-50' : ''
                    )}
                    style={{ width: cellWidth, minWidth: cellWidth }}
                  >
                    {isHourMark ? `${minutes / 60}時` : ''}
                  </th>
                );
              })}
              {/* 日・週・月スケールの場合 */}
              {project.viewScale !== 'hour' && dates.map((date, i) => {
                // 日程未定の場合は1から始まる日数で表示
                const dayNumber = i + 1;
                const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
                const provisionalWeekday = weekdays[i % 7];
                
                return (
                  <th
                    key={i}
                    className={cn(
                      'border-b py-1 font-normal',
                      project.isProvisional 
                        ? (provisionalWeekday === '土' ? 'bg-blue-50 text-blue-600' : provisionalWeekday === '日' ? 'bg-red-50 text-red-600' : '')
                        : getDateCellClass(date)
                    )}
                    style={{ width: cellWidth, minWidth: cellWidth }}
                  >
                    <div>
                      <div>{project.isProvisional ? dayNumber : format(date, 'd')}</div>
                      <div className="text-[10px]">{project.isProvisional ? provisionalWeekday : format(date, 'E', { locale: ja })}</div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[...tasks].sort((a, b) => a.order - b.order).map((task) => (
              <tr 
                key={task.id} 
                className={cn(
                  'hover:bg-gray-50',
                  draggedTaskId === task.id && 'opacity-50',
                  dragOverTaskId === task.id && 'bg-blue-50 border-t-2 border-blue-500'
                )}
                onDragOver={(e) => {
                  if (draggedTaskId) {
                    handleDragOver(e, task.id);
                  }
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  if (draggedTaskId) {
                    handleDrop(e, task.id);
                  }
                }}
              >
                <td className="sticky left-0 bg-white z-10 border-r border-b px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, task.id);
                      }}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="relative" data-color-picker>
                      <div
                        className="w-3 h-3 rounded border cursor-pointer hover:ring-2 hover:ring-gray-300"
                        style={{ backgroundColor: getTaskColor(task) }}
                        title="色を変更"
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorPickerTaskId(colorPickerTaskId === task.id ? null : task.id);
                        }}
                      />
                      {colorPickerTaskId === task.id && (
                        <div className="absolute top-0 left-full ml-2 bg-white border rounded-lg shadow-lg p-2 z-50" data-color-picker>
                          <div className="text-[10px] font-medium mb-2 text-gray-700">色を選択</div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {colorPalette.map((color) => (
                              <button
                                key={color}
                                className={cn(
                                  'w-7 h-7 rounded border hover:ring-2 hover:ring-gray-300 transition-all',
                                  getTaskColor(task) === color && 'ring-2 ring-gray-500'
                                )}
                                style={{ backgroundColor: color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTask(task.id, { color });
                                  setColorPickerTaskId(null);
                                }}
                                title={color}
                              />
                            ))}
                          </div>
                          <button
                            className="mt-2 text-[10px] text-gray-500 hover:text-gray-700 w-full text-center py-1 border-t pt-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTask(task.id, { color: undefined });
                              setColorPickerTaskId(null);
                            }}
                          >
                            業種の色
                          </button>
                        </div>
                      )}
                    </div>
                    {editingTaskId === task.id ? (
                      <div className="flex-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={task.name}
                          onChange={(e) => updateTask(task.id, { name: e.target.value })}
                          onBlur={() => setEditingTaskId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setEditingTaskId(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingTaskId(null);
                            }
                          }}
                          className="h-7 text-sm flex-1"
                          autoFocus
                        />
                        <Select
                          value={task.tradeId || ''}
                          onValueChange={(value) => updateTask(task.id, { tradeId: value || undefined })}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue placeholder="業種" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">未設定</SelectItem>
                            {trades.map((trade) => (
                              <SelectItem key={trade.id} value={trade.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded border"
                                    style={{ backgroundColor: trade.color }}
                                  />
                                  {trade.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <span
                        className="text-sm cursor-pointer hover:text-primary flex-1 min-w-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingTaskId(task.id);
                        }}
                        onMouseDown={(e) => {
                          // ドラッグ開始を防ぐ
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {task.name || '(工程名なし)'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="sticky left-[200px] bg-white z-10 border-r border-b px-2 py-2 text-center">
                  <Input
                    value={task.assignee}
                    onChange={(e) => updateTask(task.id, { assignee: e.target.value })}
                    className="h-7 text-sm text-center"
                    placeholder="-"
                  />
                </td>
                <td className="sticky left-[280px] bg-white z-10 border-r border-b px-1 py-2 text-center">
                  {project.viewScale === 'hour' ? (
                    <div className="flex items-center justify-center gap-0.5">
                      {(() => {
                        const { hours, minutes } = minutesToHoursAndMinutes(getScaleValue(task, 'start'));
                        return (
                          <>
                            <Input
                              type="number"
                              min={hourSettings.startHour}
                              max={hourSettings.endHour}
                              value={hours}
                              onChange={(e) => {
                                const h = parseInt(e.target.value) || hourSettings.startHour;
                                const clampedH = Math.max(hourSettings.startHour, Math.min(hourSettings.endHour, h));
                                const newMinutes = hoursAndMinutesToMinutes(clampedH, minutes);
                                updateScaleValue(task, 'start', Math.max(startMinutes, Math.min(endMinutes, newMinutes)));
                              }}
                              className="h-7 text-xs w-10 text-center p-0"
                            />
                            <span className="text-xs">:</span>
                            <Input
                              type="number"
                              min="0"
                              max="55"
                              step="5"
                              value={minutes}
                              onChange={(e) => {
                                const m = parseInt(e.target.value) || 0;
                                const roundedM = Math.round(m / 5) * 5;
                                const clampedM = Math.max(0, Math.min(55, roundedM));
                                const newMinutes = hoursAndMinutesToMinutes(hours, clampedM);
                                updateScaleValue(task, 'start', Math.max(startMinutes, Math.min(endMinutes, newMinutes)));
                              }}
                              className="h-7 text-xs w-10 text-center p-0"
                              placeholder="00"
                            />
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        min={getMinValue()}
                        max={getMaxValue()}
                        value={getScaleValue(task, 'start')}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || getMinValue();
                          updateScaleValue(task, 'start', Math.max(getMinValue(), Math.min(getMaxValue() || 999, value)));
                        }}
                        className="h-7 text-xs w-12 text-center"
                      />
                      <span className="text-xs text-gray-500">{getUnitLabel()}</span>
                    </div>
                  )}
                </td>
                <td className="sticky left-[360px] bg-white z-10 border-r border-b px-1 py-2 text-center">
                  {project.viewScale === 'hour' ? (
                    <div className="flex items-center justify-center gap-0.5">
                      {(() => {
                        const { hours, minutes } = minutesToHoursAndMinutes(getScaleValue(task, 'end'));
                        return (
                          <>
                            <Input
                              type="number"
                              min={hourSettings.startHour}
                              max={hourSettings.endHour}
                              value={hours}
                              onChange={(e) => {
                                const h = parseInt(e.target.value) || hourSettings.startHour;
                                const clampedH = Math.max(hourSettings.startHour, Math.min(hourSettings.endHour, h));
                                const newMinutes = hoursAndMinutesToMinutes(clampedH, minutes);
                                updateScaleValue(task, 'end', Math.max(startMinutes, Math.min(endMinutes, newMinutes)));
                              }}
                              className="h-7 text-xs w-10 text-center p-0"
                            />
                            <span className="text-xs">:</span>
                            <Input
                              type="number"
                              min="0"
                              max="55"
                              step="5"
                              value={minutes}
                              onChange={(e) => {
                                const m = parseInt(e.target.value) || 0;
                                const roundedM = Math.round(m / 5) * 5;
                                const clampedM = Math.max(0, Math.min(55, roundedM));
                                const newMinutes = hoursAndMinutesToMinutes(hours, clampedM);
                                updateScaleValue(task, 'end', Math.max(startMinutes, Math.min(endMinutes, newMinutes)));
                              }}
                              className="h-7 text-xs w-10 text-center p-0"
                              placeholder="00"
                            />
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        min={getMinValue()}
                        max={getMaxValue()}
                        value={getScaleValue(task, 'end')}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || getMinValue();
                          updateScaleValue(task, 'end', Math.max(getMinValue(), Math.min(getMaxValue() || 999, value)));
                        }}
                        className="h-7 text-xs w-12 text-center"
                      />
                      <span className="text-xs text-gray-500">{getUnitLabel()}</span>
                    </div>
                  )}
                </td>
                
                {/* バーチャート部分 */}
                <td colSpan={project.viewScale === 'hour' ? timeSlots.length : dates.length} className="relative border-b h-10 p-0">
                  <div className="absolute inset-0 flex items-center">
                    {/* グリッド線 */}
                    <div className="absolute inset-0 flex">
                      {project.viewScale === 'hour' ? (
                        timeSlots.map((minutes, i) => {
                          const isHourMark = minutes % 60 === 0;
                          return (
                            <div
                              key={i}
                              className={cn(
                                'border-r h-full',
                                isHourMark ? 'bg-gray-50' : ''
                              )}
                              style={{ width: cellWidth, minWidth: cellWidth }}
                            />
                          );
                        })
                      ) : (
                        dates.map((date, i) => (
                          <div
                            key={i}
                            className={cn(
                              'border-r h-full',
                              getDateCellClass(date)
                            )}
                            style={{ width: cellWidth, minWidth: cellWidth }}
                          />
                        ))
                      )}
                    </div>
                    
                    {/* タスクバー */}
                    <TaskBar
                      task={task}
                      project={project}
                      cellWidth={cellWidth}
                      color={getTaskColor(task)}
                      onUpdate={updateTask}
                      timeSlots={timeSlots}
                    />
                  </div>
                </td>
              </tr>
            ))}
            
            {/* 新規タスク追加行 */}
            <tr>
              <td colSpan={4 + (project.viewScale === 'hour' ? timeSlots.length : dates.length)} className="border-b px-2 py-2">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-gray-400" />
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="新しい工程を追加..."
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0"
                  />
                  {newTaskName && (
                    <Button size="sm" onClick={handleAddTask}>
                      追加
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
