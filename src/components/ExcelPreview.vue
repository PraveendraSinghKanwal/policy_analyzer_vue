<template>
  <div class="excel-preview">
    <div v-if="loading" class="loading">Loading Excel preview...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="data" class="table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <th v-for="(cell, index) in data[0]" :key="index" :style="getColStyle(index)">
              {{ cell || `Column ${index + 1}` }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in data.slice(1)" :key="rowIndex" :style="getRowStyle(rowIndex + 1)">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex">
              {{ cell || '' }}
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

watch(() => props.excelBlob, async (blob) => {
  if (!blob) {
    data.value = null;
    error.value = null;
    worksheet.value = null;
    workbook.value = null;
    columnWidths.value = {};
    rowHeights.value = {};
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
    worksheet.value.eachRow((row, rowNumber) => {
      const rowData = [];
      row.eachCell((cell, colNumber) => {
        rowData[colNumber - 1] = cell.value;
      });
      jsonData.push(rowData);
      // Store row height (convert points to px)
      if (row.height) {
        rowHeights.value[rowNumber] = row.height * 0.75;
      }
    });
    // Store column widths (convert Excel width to px)
    worksheet.value.columns.forEach((column, index) => {
      if (column.width) {
        const EXCEL_TO_PIXEL = 5;
        columnWidths.value[index] = column.width * EXCEL_TO_PIXEL;
      }
    });
    data.value = jsonData;
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
</script>

<style scoped>
.excel-preview {
  width: 100%;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #d32f2f;
}

.table-container {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: scroll !important;
  overflow-y: auto;
  min-height: 120px;
  max-height: 52vh;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  background: white;
  border-bottom: 2px solid #eee;
  position: relative;
}
.table-container::after {
  content: '';
  display: block;
  width: 1201px;
  height: 0;
}

.excel-table {
  min-width: 2000px;
  width: 2000px;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  font-family: Calibri, Arial, sans-serif;
  font-size: 11pt;
}

.excel-table th,
.excel-table td {
  border: 1px solid var(--gray-200);
  padding: var(--spacing-3);
  text-align: left;
  vertical-align: top;
}

.excel-table th {
  background-color: var(--gray-50);
  font-weight: 600;
  color: var(--gray-900);
  border-bottom: 2px solid var(--gray-300);
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-table tr:nth-child(even) {
  background-color: var(--gray-50);
}

.excel-table tr:hover {
  background-color: #eff6ff;
}

.table-container {
  scrollbar-width: auto;
  /* Force scrollbar to always show */
  scrollbar-width: thin;
}
.table-container::-webkit-scrollbar {
  height: 16px;
  width: 16px;
  /* Force scrollbar to always show */
  -webkit-appearance: none;
}
.table-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 8px;
  border: 2px solid #f1f1f1;
}
.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}
.table-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style> 