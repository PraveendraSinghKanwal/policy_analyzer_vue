import * as XLSX from 'xlsx';

export function xlsxToLuckysheet(workbook) {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

  // Ensure all data is serializable by converting to plain values
  const cleanData = json.map(row => 
    row.map(cell => {
      if (cell === null || cell === undefined) return '';
      if (typeof cell === 'object') return String(cell);
      return cell;
    })
  );

  // Convert to Luckysheet data format
  const luckysheetData = [{
    name: sheetName,
    data: cleanData,
    color: '', // tab color
    status: '1', // active
    order: 0
  }];

  return luckysheetData;
} 