import ExcelJS from 'exceljs';
import { format, parseISO, eachDayOfInterval, isSaturday, isSunday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { isHoliday } from '@/lib/holidays';
import type { Project, Task, Trade, ExportSettings } from '@/types';

export async function exportToExcel(
  project: Project,
  tasks: Task[],
  trades: Trade[],
  settings: ExportSettings
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('工程表');

  // 用紙サイズ設定
  const paperSizes = {
    A4: { width: 8.27, height: 11.69 },
    A3: { width: 11.69, height: 16.54 },
    B4: { width: 9.84, height: 13.9 },
  };

  const paper = paperSizes[settings.paperSize];
  worksheet.pageSetup = {
    paperSize: (settings.paperSize === 'A4' ? 9 : settings.paperSize === 'A3' ? 8 : 10) as any,
    orientation: settings.orientation === 'landscape' ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  let rowIndex = 1;

  // ヘッダー
  if (settings.showHeader) {
    worksheet.mergeCells(rowIndex, 1, rowIndex, 10);
    worksheet.getCell(rowIndex, 1).value = '工 程 管 理 表';
    worksheet.getCell(rowIndex, 1).font = { size: 16, bold: true };
    worksheet.getCell(rowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    rowIndex++;

    worksheet.getCell(rowIndex, 1).value = '工事名称:';
    worksheet.getCell(rowIndex, 2).value = project.name || '-';
    worksheet.getCell(rowIndex, 5).value = '現場住所:';
    worksheet.getCell(rowIndex, 6).value = project.address || '-';
    rowIndex++;

    worksheet.getCell(rowIndex, 1).value = '全体工期:';
    worksheet.getCell(rowIndex, 2).value = `${project.startDate} 〜 ${project.endDate}`;
    worksheet.getCell(rowIndex, 5).value = '現場管理者:';
    worksheet.getCell(rowIndex, 6).value = project.manager || '-';
    rowIndex++;

    if (project.remarks) {
      worksheet.getCell(rowIndex, 1).value = '備考:';
      worksheet.mergeCells(rowIndex, 2, rowIndex, 10);
      worksheet.getCell(rowIndex, 2).value = project.remarks;
      rowIndex++;
    }

    rowIndex++;
  }

  // 日付リスト生成
  const startDate = parseISO(project.startDate);
  const endDate = parseISO(project.endDate);
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  // テーブルヘッダー
  const headerRow = worksheet.getRow(rowIndex);
  headerRow.getCell(1).value = '工程名';
  headerRow.getCell(2).value = '担当';
  headerRow.getCell(3).value = '開始日';
  headerRow.getCell(4).value = '終了日';
  
  dates.forEach((date, i) => {
    const cell = headerRow.getCell(5 + i);
    cell.value = format(date, 'd');
    cell.alignment = { horizontal: 'center' };
    
    // 土日祝の色分け
    if (isSunday(date) || isHoliday(date)) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0E0' },
      };
    } else if (isSaturday(date)) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0FF' },
      };
    }
  });

  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle' };
  rowIndex++;

  // 工程データ
  tasks.forEach((task) => {
    const taskRow = worksheet.getRow(rowIndex);
    taskRow.getCell(1).value = task.name;
    taskRow.getCell(2).value = task.assignee || '-';
    taskRow.getCell(3).value = task.startDate;
    taskRow.getCell(4).value = task.endDate;

    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.endDate);

    dates.forEach((date, i) => {
      if (date >= taskStart && date <= taskEnd) {
        const cell = taskRow.getCell(5 + i);
        const trade = trades.find(t => t.id === task.tradeId);
        const color = task.color || trade?.color || '#3B82F6';
        
        // HEXをRGBに変換
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `FF${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` },
        };
      }
    });

    rowIndex++;
  });

  // 列幅調整
  worksheet.getColumn(1).width = 20;
  worksheet.getColumn(2).width = 12;
  worksheet.getColumn(3).width = 12;
  worksheet.getColumn(4).width = 12;
  dates.forEach((_, i) => {
    worksheet.getColumn(5 + i).width = 3;
  });

  // 罫線
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // 凡例
  if (settings.showLegend && trades.length > 0) {
    rowIndex++;
    worksheet.mergeCells(rowIndex, 1, rowIndex, 10);
    worksheet.getCell(rowIndex, 1).value = '凡例';
    worksheet.getCell(rowIndex, 1).font = { bold: true };
    rowIndex++;

    trades.forEach((trade) => {
      const legendRow = worksheet.getRow(rowIndex);
      legendRow.getCell(1).value = trade.name;
      const hex = trade.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      legendRow.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` },
      };
      rowIndex++;
    });
  }

  // ファイル保存
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name || '工程管理表'}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
