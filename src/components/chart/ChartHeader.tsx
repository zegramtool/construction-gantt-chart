import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import type { Project } from '@/types';

interface ChartHeaderProps {
  project: Project;
  onUpdate: (data: Partial<Project>) => void;
}

export function ChartHeader({ project, onUpdate }: ChartHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card>
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="font-semibold">工事情報</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工事名称
              </label>
              <Input
                value={project.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="工事名称を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                現場住所
              </label>
              <Input
                value={project.address}
                onChange={(e) => onUpdate({ address: e.target.value })}
                placeholder="現場住所を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                現場管理者
              </label>
              <Input
                value={project.manager}
                onChange={(e) => onUpdate({ manager: e.target.value })}
                placeholder="管理者名を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工期開始
              </label>
              <Input
                type="date"
                value={project.startDate}
                onChange={(e) => onUpdate({ startDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工期終了
              </label>
              <Input
                type="date"
                value={project.endDate}
                onChange={(e) => onUpdate({ endDate: e.target.value })}
              />
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.isProvisional}
                  onChange={(e) => onUpdate({ isProvisional: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">仮日程</span>
              </label>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備考
              </label>
              <Input
                value={project.remarks}
                onChange={(e) => onUpdate({ remarks: e.target.value })}
                placeholder="備考を入力"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
