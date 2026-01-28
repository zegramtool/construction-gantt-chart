import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Project, WorkdaySettings } from '@/types';

interface WorkdaySettingsProps {
  project: Project;
  onUpdate: (settings: Partial<WorkdaySettings>) => void;
}

export function WorkdaySettings({ project, onUpdate }: WorkdaySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState('');
  const [newWorkday, setNewWorkday] = useState('');

  const settings = project.workdaySettings;

  const handleAddHoliday = () => {
    if (!newHoliday) return;
    onUpdate({
      customHolidays: [...settings.customHolidays, newHoliday],
    });
    setNewHoliday('');
  };

  const handleRemoveHoliday = (date: string) => {
    onUpdate({
      customHolidays: settings.customHolidays.filter(d => d !== date),
    });
  };

  const handleAddWorkday = () => {
    if (!newWorkday) return;
    onUpdate({
      customWorkdays: [...settings.customWorkdays, newWorkday],
    });
    setNewWorkday('');
  };

  const handleRemoveWorkday = (date: string) => {
    onUpdate({
      customWorkdays: settings.customWorkdays.filter(d => d !== date),
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="稼働日設定"
      >
        <Calendar className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="absolute top-full right-0 mt-2 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">稼働日設定</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本設定 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">基本設定</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.skipSaturday}
              onChange={(e) => onUpdate({ skipSaturday: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">土曜日を休日にする</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.skipSunday}
              onChange={(e) => onUpdate({ skipSunday: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">日曜日を休日にする</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.skipHolidays}
              onChange={(e) => onUpdate({ skipHolidays: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">祝日を休日にする</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showOnlyWorkdays}
              onChange={(e) => onUpdate({ showOnlyWorkdays: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">稼働日のみ表示</span>
          </label>
        </div>

        {/* カスタム休日 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">追加の休日</h3>
          <div className="flex gap-2">
            <Input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="flex-1"
              placeholder="休日を追加"
            />
            <Button onClick={handleAddHoliday} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {settings.customHolidays.map((date) => (
              <div
                key={date}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <span>{format(new Date(date), 'yyyy年M月d日')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveHoliday(date)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* カスタム稼働日 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">休日だけど稼働する日</h3>
          <div className="flex gap-2">
            <Input
              type="date"
              value={newWorkday}
              onChange={(e) => setNewWorkday(e.target.value)}
              className="flex-1"
              placeholder="稼働日を追加"
            />
            <Button onClick={handleAddWorkday} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {settings.customWorkdays.map((date) => (
              <div
                key={date}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <span>{format(new Date(date), 'yyyy年M月d日')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveWorkday(date)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
