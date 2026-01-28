import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartHeader } from './ChartHeader';
import { ChartCalendar } from './ChartCalendar';
import { ScaleSelector } from './ScaleSelector';
import { WorkdaySettings } from './WorkdaySettings';
import { TradeManager } from './TradeManager';
import { ExportModal } from './ExportModal';
import { PrintPreview } from './PrintPreview';
import { ArrowLeft, FileDown } from 'lucide-react';
import type { ViewScale, HourScaleSettings, DayScaleSettings } from '@/types';

interface ChartEditorProps {
  projectId: string;
  onBack: () => void;
}

export function ChartEditor({ projectId, onBack }: ChartEditorProps) {
  const { projects, updateProject, tasks, trades } = useStore();
  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
  const [showExportModal, setShowExportModal] = useState(false);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">プロジェクトが見つかりません</p>
          <Button onClick={onBack}>戻る</Button>
        </div>
      </div>
    );
  }

  const handleScaleChange = (scale: ViewScale) => {
    updateProject(projectId, { viewScale: scale });
  };

  const handleHourSettingsChange = (settings: HourScaleSettings) => {
    updateProject(projectId, { hourScaleSettings: settings });
  };

  const handleDaySettingsChange = (settings: DayScaleSettings) => {
    updateProject(projectId, { dayScaleSettings: settings });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダーバー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-full px-2 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2 mb-2 md:mb-0">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-base md:text-xl font-semibold truncate">
                {project.name || '無題のプロジェクト'}
              </h1>
              {project.isProvisional && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded shrink-0">
                  仮日程
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <div className="hidden md:block">
                <ScaleSelector
                  value={project.viewScale}
                  onChange={handleScaleChange}
                  hourSettings={project.hourScaleSettings}
                  onHourSettingsChange={handleHourSettingsChange}
                  daySettings={project.dayScaleSettings}
                  onDaySettingsChange={handleDaySettingsChange}
                />
              </div>
              <WorkdaySettings
                project={project}
                onUpdate={(settings) => updateProject(projectId, { workdaySettings: { ...project.workdaySettings, ...settings } })}
              />
              <div className="relative hidden md:block">
                <TradeManager />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1 md:gap-2 text-xs md:text-sm" 
                onClick={() => setShowExportModal(true)}
              >
                <FileDown className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">エクスポート</span>
              </Button>
            </div>
          </div>
          {/* モバイル用スケールセレクター */}
          <div className="md:hidden">
            <ScaleSelector
              value={project.viewScale}
              onChange={handleScaleChange}
              hourSettings={project.hourScaleSettings}
              onHourSettingsChange={handleHourSettingsChange}
              daySettings={project.dayScaleSettings}
              onDaySettingsChange={handleDaySettingsChange}
            />
          </div>
        </div>
      </div>

      <div className="p-2 md:p-4">
        {/* プロジェクト情報 */}
        <ChartHeader project={project} onUpdate={(data) => updateProject(projectId, data)} />

        {/* バーチャート */}
        <Card className="mt-2 md:mt-4">
          <CardContent className="p-0 overflow-x-auto">
            <ChartCalendar
              project={project}
              tasks={projectTasks}
              trades={trades}
            />
          </CardContent>
        </Card>

        {/* 印刷プレビュー */}
        <div className="mt-4">
          <PrintPreview
            project={project}
            tasks={projectTasks}
            trades={trades}
          />
        </div>
      </div>

      {/* エクスポートモーダル */}
      {showExportModal && project && (
        <ExportModal
          project={project}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
