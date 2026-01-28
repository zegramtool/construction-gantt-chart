import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { ProjectList } from '@/components/project/ProjectList';
import { ChartEditor } from '@/components/chart/ChartEditor';

function App() {
  const { currentProjectId, setCurrentProject } = useStore();

  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId);
  };

  const handleBackToList = () => {
    setCurrentProject(null);
  };

  if (currentProjectId) {
    return (
      <ChartEditor
        projectId={currentProjectId}
        onBack={handleBackToList}
      />
    );
  }

  return <ProjectList onSelectProject={handleSelectProject} />;
}

export default App;
