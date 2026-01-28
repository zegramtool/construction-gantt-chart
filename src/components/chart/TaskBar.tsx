import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Task, Project, ScaleBasedSchedule } from '@/types';
import { DEFAULT_SCALE_SCHEDULE, DEFAULT_HOUR_SCALE_SETTINGS, DEFAULT_DAY_SCALE_SETTINGS, minutesToTimeString } from '@/types';

interface TaskBarProps {
  task: Task;
  project: Project;
  cellWidth: number;
  color: string;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  timeSlots?: number[];
}

export function TaskBar({ task, project, cellWidth, color, onUpdate, timeSlots = [] }: TaskBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValues, setDragStartValues] = useState<{ start: number; end: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // 時間スケール設定
  const hourSettings = project.hourScaleSettings || DEFAULT_HOUR_SCALE_SETTINGS;
  const startMinutes = hourSettings.startHour * 60;
  const endMinutes = hourSettings.endHour * 60;

  // 日数スケール設定
  const daySettings = project.dayScaleSettings || DEFAULT_DAY_SCALE_SETTINGS;

  // スケール別の値を取得
  const getScaleValue = (field: 'start' | 'end'): number => {
    const schedule = task.scaleSchedule || DEFAULT_SCALE_SCHEDULE;
    const scale = project.viewScale;
    return schedule[scale]?.[field] ?? DEFAULT_SCALE_SCHEDULE[scale][field];
  };

  // スケール別の最小値・最大値（分単位 or 日単位）
  const getMinValue = () => project.viewScale === 'hour' ? startMinutes : 1;
  const getMaxValue = () => {
    switch (project.viewScale) {
      case 'hour': return endMinutes;
      case 'day': return daySettings.dayCount;
      case 'week': return daySettings.weekCount;
      case 'month': return daySettings.monthCount;
      default: return 999;
    }
  };

  // バーの位置とサイズを計算（スケール別の値を使用）
  const getBarPosition = () => {
    const startValue = getScaleValue('start');
    const endValue = getScaleValue('end');
    
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
      left: Math.max(0, startOffset) * cellWidth,
      width: Math.max(1, duration) * cellWidth - 4,
    };
  };

  const position = getBarPosition();

  // スケール別の値を更新
  const updateScaleValue = (field: 'start' | 'end', value: number) => {
    const currentSchedule = task.scaleSchedule || { ...DEFAULT_SCALE_SCHEDULE };
    const scale = project.viewScale;
    
    const clampedValue = Math.max(getMinValue(), Math.min(getMaxValue(), value));
    
    const newSchedule: ScaleBasedSchedule = {
      ...currentSchedule,
      [scale]: {
        ...currentSchedule[scale],
        [field]: clampedValue
      }
    };
    
    onUpdate(task.id, { scaleSchedule: newSchedule });
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragStartValues({ start: getScaleValue('start'), end: getScaleValue('end') });
  };

  useEffect(() => {
    if (!isDragging || !dragType || !dragStartValues) return;

    const barElement = barRef.current;
    if (!barElement) return;

    const getRelativeX = (e: MouseEvent) => {
      const parentRect = barElement.parentElement?.getBoundingClientRect();
      if (!parentRect) return 0;
      return e.clientX - parentRect.left;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const relativeX = getRelativeX(e);
      const cellIndex = Math.floor(relativeX / cellWidth);
      
      // セルインデックスから値に変換
      const minValue = getMinValue();
      const maxValue = getMaxValue();
      // 時間スケールの場合は5分刻みの分単位、他は日単位
      const newValue = project.viewScale === 'hour' 
        ? startMinutes + cellIndex * 5  // 分単位（5分刻み）
        : cellIndex + 1;

      if (dragType === 'move') {
        const duration = dragStartValues.end - dragStartValues.start;
        const newStart = Math.max(minValue, Math.min(maxValue - duration, newValue));
        const newEnd = newStart + duration;
        
        const currentSchedule = task.scaleSchedule || { ...DEFAULT_SCALE_SCHEDULE };
        const newSchedule: ScaleBasedSchedule = {
          ...currentSchedule,
          [project.viewScale]: {
            start: newStart,
            end: newEnd
          }
        };
        onUpdate(task.id, { scaleSchedule: newSchedule });
      } else if (dragType === 'resize-start') {
        const currentEnd = getScaleValue('end');
        if (newValue < currentEnd && newValue >= minValue) {
          updateScaleValue('start', newValue);
        }
      } else if (dragType === 'resize-end') {
        const currentStart = getScaleValue('start');
        // 時間スケールは5分刻み、他は1単位
        const increment = project.viewScale === 'hour' ? 5 : 1;
        const endValue = newValue + increment;
        if (endValue > currentStart && endValue <= maxValue) {
          updateScaleValue('end', endValue);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragStartX, dragStartValues, cellWidth, task, onUpdate, project.viewScale]);

  return (
    <div
      ref={barRef}
      className={cn(
        'absolute h-6 rounded cursor-move hover:opacity-90 flex items-center justify-center text-white text-xs font-medium shadow-sm select-none',
        isDragging && 'opacity-80'
      )}
      style={{
        left: `${position.left + 2}px`,
        width: `${position.width}px`,
        backgroundColor: color,
        top: '50%',
        transform: 'translateY(-50%)',
      }}
      title={`${task.name}: ${project.viewScale === 'hour' ? minutesToTimeString(getScaleValue('start')) : getScaleValue('start') + '日'} 〜 ${project.viewScale === 'hour' ? minutesToTimeString(getScaleValue('end')) : getScaleValue('end') + '日'}`}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* リサイズハンドル（左） */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'resize-start');
        }}
      />
      
      {/* バー中央（ドラッグ可能） */}
      <div className="flex-1 text-center truncate px-2">
        {task.name}
      </div>
      
      {/* リサイズハンドル（右） */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'resize-end');
        }}
      />
    </div>
  );
}
