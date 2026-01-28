import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Project, Task, Trade, ExportSettings } from '@/types';

export async function exportToPDF(
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

  const imgData = canvas.toDataURL('image/png');
  
  // 用紙サイズをmmに変換
  const paperSizes = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
    B4: { width: 250, height: 353 },
  };

  const paper = paperSizes[settings.paperSize];
  const width = settings.orientation === 'landscape' ? paper.height : paper.width;
  const height = settings.orientation === 'landscape' ? paper.width : paper.height;

  const pdf = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: [width, height],
  });

  const imgWidth = width;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`${project.name || '工程管理表'}.pdf`);
}
