import { useState, useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Task, ScaleBasedSchedule } from '@/types';
import { DEFAULT_SCALE_SCHEDULE, DEFAULT_HOUR_SCALE_SETTINGS, DEFAULT_DAY_SCALE_SETTINGS, minutesToTimeString, timeStringToMinutes } from '@/types';

interface TaskListProps {
  projectId: string;
}

export function TaskList({ projectId }: TaskListProps) {
  const { tasks, trades, addTask, updateTask, deleteTask, projects } = useStore();
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
  
  const [newTaskName, setNewTaskName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 時間スケール設定
  const hourSettings = project?.hourScaleSettings || DEFAULT_HOUR_SCALE_SETTINGS;
  const startMinutes = hourSettings.startHour * 60;
  const endMinutes = hourSettings.endHour * 60;

  // 日数スケール設定
  const daySettings = project?.dayScaleSettings || DEFAULT_DAY_SCALE_SETTINGS;

  // 5分刻みの時間オプションを生成
  const timeOptions = useMemo(() => {
    const options: { value: number; label: string }[] = [];
    for (let m = startMinutes; m <= endMinutes; m += 5) {
      options.push({ value: m, label: minutesToTimeString(m) });
    }
    return options;
  }, [startMinutes, endMinutes]);

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

  const handleAddTask = () => {
    if (!newTaskName.trim() || !project) return;
    
    addTask({
      projectId,
      name: newTaskName.trim(),
      assignee: '',
      startDate: project.startDate,
      endDate: project.startDate,
      order: projectTasks.length,
    });
    setNewTaskName('');
  };

  const getTradeColor = (tradeId?: string) => {
    if (!tradeId) return '#3B82F6';
    const trade = trades.find(t => t.id === tradeId);
    return trade?.color || '#3B82F6';
  };

  // 現在のスケールに応じた値を取得
  const getScaleValue = (task: Task, field: 'start' | 'end'): number => {
    if (!project) return 1;
    const schedule = task.scaleSchedule || DEFAULT_SCALE_SCHEDULE;
    const scale = project.viewScale;
    return schedule[scale]?.[field] ?? DEFAULT_SCALE_SCHEDULE[scale][field];
  };

  // スケール別の値を更新
  const updateScaleValue = (task: Task, field: 'start' | 'end', value: number) => {
    if (!project) return;
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
    switch (project?.viewScale) {
      case 'hour': return '';
      case 'day':
      case 'week':
      case 'month':
      default: return '日目';
    }
  };

  // スケールに応じた表示フォーマット
  const formatTaskDateDisplay = (task: Task, field: 'start' | 'end') => {
    if (!project) return '-';
    const value = getScaleValue(task, field);
    
    switch (project.viewScale) {
      case 'hour': return minutesToTimeString(value);
      case 'day':
      case 'week':
      case 'month':
      default:
        return `${value}日目`;
    }
  };

  // 入力欄の最小値
  const getMinValue = () => {
    return project?.viewScale === 'hour' ? startMinutes : 1;
  };

  // 入力欄の最大値
  const getMaxValue = () => {
    switch (project?.viewScale) {
      case 'hour': return endMinutes;
      case 'day': return daySettings.dayCount;
      case 'week': return daySettings.weekCount;
      case 'month': return daySettings.monthCount;
      default: return undefined;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          工程一覧
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {projectTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-2 p-3 rounded-lg border bg-white"
          >
            <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-grab" />
            <div
              className="w-1 self-stretch rounded"
              style={{ backgroundColor: task.color || getTradeColor(task.tradeId) }}
            />
            <div className="flex-1 min-w-0">
              {editingId === task.id ? (
                <Input
                  value={task.name}
                  onChange={(e) => updateTask(task.id, { name: e.target.value })}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  className="h-8 mb-2"
                  autoFocus
                />
              ) : (
                <div
                  className="font-medium cursor-pointer hover:text-primary"
                  onClick={() => setEditingId(task.id)}
                >
                  {task.name || '(工程名なし)'}
                </div>
              )}
              <div className="text-sm text-gray-500 mt-1">
                {formatTaskDateDisplay(task, 'start')} 〜 {formatTaskDateDisplay(task, 'end')}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={task.assignee}
                  onChange={(e) => updateTask(task.id, { assignee: e.target.value })}
                  placeholder="担当者"
                  className="h-8 text-sm flex-1"
                />
                {/* スケール別の入力欄 */}
                {project?.viewScale === 'hour' ? (
                  <>
                    <div className="flex items-center gap-0.5">
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
                              className="h-8 text-sm w-10 text-center p-0"
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
                              className="h-8 text-sm w-10 text-center p-0"
                              placeholder="00"
                            />
                          </>
                        );
                      })()}
                    </div>
                    <span className="text-gray-400">〜</span>
                    <div className="flex items-center gap-0.5">
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
                              className="h-8 text-sm w-10 text-center p-0"
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
                              className="h-8 text-sm w-10 text-center p-0"
                              placeholder="00"
                            />
                          </>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={getMinValue()}
                        max={getMaxValue()}
                        value={getScaleValue(task, 'start')}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || getMinValue();
                          updateScaleValue(task, 'start', Math.max(getMinValue(), Math.min(getMaxValue() || 999, value)));
                        }}
                        className="h-8 text-sm w-16 text-center"
                      />
                      <span className="text-xs text-gray-500">{getUnitLabel()}</span>
                    </div>
                    <span className="text-gray-400">〜</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={getMinValue()}
                        max={getMaxValue()}
                        value={getScaleValue(task, 'end')}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || getMinValue();
                          updateScaleValue(task, 'end', Math.max(getMinValue(), Math.min(getMaxValue() || 999, value)));
                        }}
                        className="h-8 text-sm w-16 text-center"
                      />
                      <span className="text-xs text-gray-500">{getUnitLabel()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        
        {/* 新規追加 */}
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="新しい工程を追加..."
            className="flex-1"
          />
          <Button onClick={handleAddTask} disabled={!newTaskName.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
