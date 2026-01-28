import html2canvas from 'html2canvas';
import type { Project, Task, Trade, ExportSettings } from '@/types';

export async function exportToPNG(
  project: Project,
  tasks: Task[],
  trades: Trade[],
  settings: ExportSettings,
  element: HTMLElement | null
): Promise<void> {
  if (!element) {
    throw new Error('Preview element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name || '工程管理表'}.png`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, 'image/png');
}
