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
import * as ExcelJS from 'exceljs';

const props = defineProps({
  excelBlob: Object
});

const data = ref(null);
const loading = ref(false);
const error = ref(null);
const worksheet = ref(null);
const workbook = ref(null);
const columnWidths = ref({});
const rowHeights = ref({});
const cellStyles = ref([]); // stores cell styles

watch(() => props.excelBlob, async (blob) => {
  if (!blob) {
    data.value = null;
    error.value = null;
    worksheet.value = null;
    workbook.value = null;
    columnWidths.value = {};
    rowHeights.value = {};
    cellStyles.value = [];
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    workbook.value = new ExcelJS.Workbook();
    await workbook.value.xlsx.load(blob);
    worksheet.value = workbook.value.getWorksheet(1);
    if (!worksheet.value) {
      throw new Error('No worksheet found in the Excel file');
    }
    const jsonData = [];
    const stylesData = [];
    worksheet.value.eachRow((row, rowNumber) => {
      const rowData = [];
      const rowStyles = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Always convert to string for header row
        rowData[colNumber - 1] = cell.value != null ? String(cell.value) : '';
        rowStyles[colNumber - 1] = extractCellStyle(cell);
      });
      jsonData.push(rowData);
      stylesData.push(rowStyles);
      // Store row height (convert points to px)
      if (row.height) {
        rowHeights.value[rowNumber] = row.height * 0.75;
      }
    });
    // Store column widths (convert Excel width to px)
    worksheet.value.columns.forEach((column, index) => {
      let excelWidth = 0;
      if (column.width) {
        // px = Math.floor(column.width * 5 + 5) (user's preferred formula)
        excelWidth = Math.floor(column.width * 5 + 5);
      }
      // Also consider the width of the header cell content
      let headerText = jsonData[0]?.[index] || '';
      let headerTextWidth = measureTextWidth(headerText, '0.6rem Calibri, Arial, sans-serif');
      // Use the maximum of Excel width and header text width + some padding
      columnWidths.value[index] = Math.max(excelWidth, headerTextWidth + 24); // 24px padding for cell
    });
    data.value = jsonData;
    cellStyles.value = stylesData;
  } catch (err) {
    error.value = 'Failed to parse Excel file: ' + err.message;
    console.error('ExcelJS parsing error:', err);
  } finally {
    loading.value = false;
  }
}, { immediate: true });

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

// Extracts style from ExcelJS cell
function extractCellStyle(cell) {
  const style = {};
  // Font color
  if (cell.font && cell.font.color && cell.font.color.argb) {
    style.color = argbToHex(cell.font.color.argb);
  }
  // Background color (fill)
  if (cell.fill && cell.fill.fgColor && cell.fill.fgColor.argb) {
    style.backgroundColor = argbToHex(cell.fill.fgColor.argb);
  }
  // Font weight
  if (cell.font && cell.font.bold) {
    style.fontWeight = 'bold';
  }
  // Italic
  if (cell.font && cell.font.italic) {
    style.fontStyle = 'italic';
  }
  // Underline
  if (cell.font && cell.font.underline) {
    style.textDecoration = 'underline';
  }
  // Font size
  if (cell.font && cell.font.size) {
    style.fontSize = cell.font.size + 'pt';
  }
  // Font family
  if (cell.font && cell.font.name) {
    style.fontFamily = cell.font.name;
  }
  // Text alignment
  if (cell.alignment && cell.alignment.horizontal) {
    style.textAlign = cell.alignment.horizontal;
  }
  if (cell.alignment && cell.alignment.vertical) {
    style.verticalAlign = cell.alignment.vertical;
  }
  return style;
}

// Converts ARGB to HEX
function argbToHex(argb) {
  // ARGB is like 'FF00FF00' (AARRGGBB)
  if (argb.length === 8) {
    return '#' + argb.slice(2);
  }
  return '#000000';
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