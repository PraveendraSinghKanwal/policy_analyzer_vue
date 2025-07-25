<template>
  <div class="excel-preview">
    <div v-if="loading" class="loading">Loading Excel preview...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="data && data[0] && data[0].some(cell => cell !== '' && cell != null)" class="table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <th v-for="(cell, index) in data[0]" :key="index"
                :style="{ ...getColStyle(index), ...pickHeaderBg(getCellContainerStyle(0, index, true)) }">
              {{ cell !== undefined && cell !== null && cell !== '' ? (typeof cell === 'object' ? JSON.stringify(cell) : cell) : `Column ${index + 1}` }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in data.slice(1)" :key="rowIndex" :style="getRowStyle(rowIndex + 1)">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex" :style="{ ...getCellContainerStyle(rowIndex + 1, cellIndex), ...getColStyle(cellIndex) }">
              <span :style="getCellTextStyle(rowIndex + 1, cellIndex)">{{ cell || '' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="no-data">No data to preview</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import * as XLSX from 'xlsx-js-style';

const props = defineProps({
  excelBlob: Object
});

const data = ref(null);
const loading = ref(false);
const error = ref(null);
const columnWidths = ref({});
const rowHeights = ref({});
const cellStyles = ref([]); // stores cell styles

watch(() => props.excelBlob, async (blob) => {
  if (!blob) {
    data.value = null;
    error.value = null;
    columnWidths.value = {};
    rowHeights.value = {};
    cellStyles.value = [];
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
    
    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('No worksheet found in the Excel file');
    }
    
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }

    // Convert to JSON with styling information
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      raw: false
    });

    // Extract styles from the worksheet
    const stylesData = extractStylesFromWorksheet(worksheet, jsonData);
    
    // Extract column widths and row heights
    extractColumnWidthsAndRowHeights(worksheet, jsonData);
    
    data.value = jsonData;
    cellStyles.value = stylesData;
  } catch (err) {
    error.value = 'Failed to parse Excel file: ' + err.message;
    console.error('XLSX parsing error:', err);
  } finally {
    loading.value = false;
  }
}, { immediate: true });

function extractStylesFromWorksheet(worksheet, jsonData) {
  const stylesData = [];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    const rowStyles = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      rowStyles[col] = extractCellStyle(cell);
    }
    stylesData.push(rowStyles);
  }
  
  return stylesData;
}

function extractColumnWidthsAndRowHeights(worksheet, jsonData) {
  // Extract column widths
  if (worksheet['!cols']) {
    worksheet['!cols'].forEach((col, index) => {
      if (col && col.width) {
        // Convert Excel width to pixels (similar to ExcelJS formula)
        const excelWidth = Math.floor(col.width * 5 + 5);
        let headerText = jsonData[0]?.[index] || '';
        let headerTextWidth = measureTextWidth(headerText, '0.6rem Calibri, Arial, sans-serif');
        columnWidths.value[index] = Math.max(excelWidth, headerTextWidth + 24);
      }
    });
  }
  
  // Extract row heights
  if (worksheet['!rows']) {
    worksheet['!rows'].forEach((row, index) => {
      if (row && row.hpt) {
        // Convert points to pixels
        rowHeights.value[index + 1] = row.hpt * 0.75;
      }
    });
  }
}

function getColStyle(colIndex) {
  const style = {};
  if (columnWidths.value[colIndex]) {
    style.width = `${columnWidths.value[colIndex]}px`;
    style.minWidth = `${columnWidths.value[colIndex]}px`;
    style.maxWidth = `${columnWidths.value[colIndex]}px`;
  }
  return style;
}

function getRowStyle(rowIndex) {
  const style = {};
  if (rowHeights.value[rowIndex]) {
    style.height = `${rowHeights.value[rowIndex]}px`;
    style.minHeight = `${rowHeights.value[rowIndex]}px`;
  }
  return style;
}

// Extracts style from XLSX cell
function extractCellStyle(cell) {
  const style = {};
  
  if (!cell || !cell.s) {
    return style;
  }
  
  const cellStyle = cell.s;
  
  // Font color
  if (cellStyle.font && cellStyle.font.color && cellStyle.font.color.rgb) {
    style.color = '#' + cellStyle.font.color.rgb;
  }
  
  // Background color (fill)
  if (cellStyle.fill && cellStyle.fill.fgColor && cellStyle.fill.fgColor.rgb) {
    style.backgroundColor = '#' + cellStyle.fill.fgColor.rgb;
  }
  
  // Font weight
  if (cellStyle.font && cellStyle.font.bold) {
    style.fontWeight = 'bold';
  }
  
  // Italic
  if (cellStyle.font && cellStyle.font.italic) {
    style.fontStyle = 'italic';
  }
  
  // Underline
  if (cellStyle.font && cellStyle.font.underline) {
    style.textDecoration = 'underline';
  }
  
  // Font size
  if (cellStyle.font && cellStyle.font.sz) {
    style.fontSize = cellStyle.font.sz + 'pt';
  }
  
  // Font family
  if (cellStyle.font && cellStyle.font.name) {
    style.fontFamily = cellStyle.font.name;
  }
  
  // Text alignment
  if (cellStyle.alignment && cellStyle.alignment.horizontal) {
    style.textAlign = cellStyle.alignment.horizontal;
  }
  if (cellStyle.alignment && cellStyle.alignment.vertical) {
    style.verticalAlign = cellStyle.alignment.vertical;
  }
  
  return style;
}

// Split cell style into container (cell) and text styles
function getCellContainerStyle(rowIndex, colIndex, isHeader = false) {
  const style = cellStyles.value[rowIndex]?.[colIndex] || {};
  // Only use backgroundColor, textAlign, verticalAlign for cell container
  const cellStyle = {};
  if (style.backgroundColor) cellStyle.backgroundColor = style.backgroundColor + ' !important';
  if (style.textAlign) cellStyle.textAlign = style.textAlign;
  if (style.verticalAlign) cellStyle.verticalAlign = style.verticalAlign;
  return cellStyle;
}

function getCellTextStyle(rowIndex, colIndex, isHeader = false) {
  const style = cellStyles.value[rowIndex]?.[colIndex] || {};
  // Only use text styles for span, but DO NOT apply fontSize
  const textStyle = {};
  if (style.color) textStyle.color = style.color;
  if (style.fontWeight) textStyle.fontWeight = style.fontWeight;
  if (style.fontStyle) textStyle.fontStyle = style.fontStyle;
  if (style.textDecoration) textStyle.textDecoration = style.textDecoration;
  // Do NOT apply fontSize from Excel
  if (style.fontFamily) textStyle.fontFamily = style.fontFamily;
  return textStyle;
}

// Add a utility to pick only backgroundColor for header
function pickHeaderBg(cellStyle) {
  return cellStyle && cellStyle.backgroundColor ? { backgroundColor: cellStyle.backgroundColor } : {};
}

// Utility to measure text width in px for a given font
function measureTextWidth(text, font) {
  if (!measureTextWidth.canvas) {
    measureTextWidth.canvas = document.createElement('canvas');
  }
  const context = measureTextWidth.canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}
</script>

<style>
.table-container {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-y: auto;
  max-height: 62vh;
  background: #fff;
  border-bottom: 2px solid #eee;
  position: relative;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  font-family: Calibri, Arial, sans-serif;
}

.excel-table th {
  border: 1px solid #ccc;
  padding: 4px 4px;
  text-align: center;
  vertical-align: top;
  font-size: 0.6rem !important;
  color: #fff;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
  height: 25px !important;
  min-height: 25px !important;
  max-height: 25px !important;
  border-bottom: 2px solid #888 !important;
  background: #f5f5f5 !important;
}
.excel-table td {
  border: 1px solid #ccc;
  padding: 4px 4px;
  text-align: left !important;
  vertical-align: top;
  font-size: 0.6rem !important;
  color: #222;
}
</style> 