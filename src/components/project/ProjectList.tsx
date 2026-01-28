import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Project, DEFAULT_WORKDAY_SETTINGS } from '@/types';

const DEFAULT_WORKDAY_SETTINGS_VALUE = {
  skipSaturday: false,
  skipSunday: true,
  skipHolidays: true,
  customHolidays: [],
  customWorkdays: [],
  showOnlyWorkdays: false,
};

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const { projects, addProject, deleteProject } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const id = addProject({
      name: newProjectName.trim(),
      address: '',
      manager: '',
      startDate: format(today, 'yyyy-MM-dd'),
      endDate: format(nextMonth, 'yyyy-MM-dd'),
      remarks: '',
      isProvisional: true,
      viewScale: 'day',
      workdaySettings: DEFAULT_WORKDAY_SETTINGS_VALUE,
    });
    
    setNewProjectName('');
    setIsCreating(false);
    onSelectProject(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">工程管理表</h1>
            <p className="text-gray-600 mt-1">プロジェクトを選択または新規作成</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            新規作成
          </Button>
        </div>

        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">新規プロジェクト</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="工事名称を入力..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
                <Button onClick={handleCreateProject}>作成</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                プロジェクトがありません
              </h3>
              <p className="text-gray-500 mb-4">
                新しい工程管理表を作成しましょう
              </p>
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                新規作成
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectProject(project.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {project.name || '無題のプロジェクト'}
                        {project.isProvisional && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            仮
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {project.address || '住所未設定'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">工期:</span>{' '}
                      {format(new Date(project.startDate), 'yyyy/M/d', { locale: ja })} 〜{' '}
                      {format(new Date(project.endDate), 'yyyy/M/d', { locale: ja })}
                    </div>
                    {project.manager && (
                      <div>
                        <span className="font-medium">管理者:</span> {project.manager}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
