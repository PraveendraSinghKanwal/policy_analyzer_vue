<template>
  <div class="excel-preview">
    <div v-if="loading" class="loading">Loading Excel preview...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="filteredFileData && filteredFileData.data && filteredFileData.data.length > 0" class="table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <th v-for="(cell, index) in filteredFileData.data[0]" :key="index"
                :style="getCellStyle(0, index)">
              {{ getCellValue(0, index) || `Column ${index + 1}` }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in filteredFileData.data.slice(1)" :key="rowIndex" :style="getRowStyle(rowIndex + 1)">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex" :style="getCellStyle(rowIndex + 1, cellIndex)">
              <span :style="getTextStyle(rowIndex + 1, cellIndex)">{{ getCellValue(rowIndex + 1, cellIndex) || '' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="no-data">No data to preview</div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  jsonData: Object, // Single file JSON data from backend API
  currentFileName: String // Current file name to display (optional, for validation)
});

const loading = ref(false);
const error = ref(null);

// Read left-aligned columns from environment variable
// The .env file should contain: VITE_LEFT_ALIGNED_COLUMNS=5,9
const leftAlignedColumns = computed(() => {
  const envValue = import.meta.env.VITE_LEFT_ALIGNED_COLUMNS;
  if (!envValue) return [];
  
  // Parse comma-separated string into array of numbers
  return envValue.split(',').map(val => parseInt(val.trim())).filter(val => !isNaN(val));
});

// Single file data - simplified for separate JSON files
const fileData = computed(() => {
  // Check if jsonData has the required structure
  if (props.jsonData?.name && props.jsonData?.data) {
    // Validate filename if currentFileName is provided
    if (props.currentFileName && props.jsonData.name !== props.currentFileName) {
      return null;
    }
    return props.jsonData;
  }
  
  return null;
});

// Filtered data without 'Category' column
const filteredFileData = computed(() => {
  if (!fileData.value || !fileData.value.data || fileData.value.data.length === 0) {
    return null;
  }

  const originalData = fileData.value.data;
  const headerRow = originalData[0];
  
  // Find the index of the 'Category' column
  const categoryColumnIndex = headerRow.findIndex(cell => {
    const cellValue = Array.isArray(cell) && cell.length > 0 ? cell[0] : '';
    return cellValue === 'Category';
  });

  // If 'Category' column not found, return original data
  if (categoryColumnIndex === -1) {
    return fileData.value;
  }

  // Filter out the 'Category' column from all rows
  const filteredData = originalData.map(row => 
    row.filter((_, index) => index !== categoryColumnIndex)
  );

  return {
    ...fileData.value,
    data: filteredData
  };
});

// Debug: Log whenever jsonData prop changes
watch(() => props.jsonData, (val) => {
  console.log('jsonData prop:', val);
}, { immediate: true });

// Debug: Log whenever fileData changes
watch(fileData, (val) => {
  console.log('fileData:', val);
}, { immediate: true });

// Get cell value from the cell array
function getCellValue(rowIndex, colIndex) {
  const cell = filteredFileData.value?.data?.[rowIndex]?.[colIndex];
  if (!cell || !Array.isArray(cell) || cell.length === 0) return '';
  return cell[0]; // First element is the cell data
}

// Get complete cell style (container + text styles)
function getCellStyle(rowIndex, colIndex) {
  const cell = filteredFileData.value?.data?.[rowIndex]?.[colIndex];
  if (!cell || !Array.isArray(cell) || cell.length < 12) return {};
  
  const style = {};
  
  // Background color
  if (cell[2]) style.backgroundColor = cell[2];
  
  // Text alignment - Apply left alignment for specified columns (except header row)
  if (rowIndex === 0) {
    // Header row - use original alignment from JSON
    if (cell[8]) style.textAlign = cell[8];
  } else {
    // Data rows - check if this column should be left-aligned
    if (leftAlignedColumns.value.includes(colIndex)) {
      style.textAlign = 'left';
    } else {
      // Use original alignment from JSON for other columns
      if (cell[8]) style.textAlign = cell[8];
    }
  }
  
  // Vertical alignment
  if (cell[9]) style.verticalAlign = cell[9];
  
  // Column width
  if (cell[10]) {
    style.width = `${cell[10]}px`;
    style.minWidth = `${cell[10]}px`;
    style.maxWidth = `${cell[10]}px`;
  }
  
  // Debug: Log styles for first few cells
  if (rowIndex === 0 && colIndex < 3) {
    console.log(`Cell [${rowIndex}][${colIndex}] style:`, style);
  }
  
  return style;
}

// Get text-specific styles
function getTextStyle(rowIndex, colIndex) {
  const cell = filteredFileData.value?.data?.[rowIndex]?.[colIndex];
  if (!cell || !Array.isArray(cell) || cell.length < 12) return {};
  
  const style = {};
  
  // Font color
  if (cell[1]) style.color = cell[1];
  
  // Font weight
  if (cell[3]) style.fontWeight = cell[3];
  
  // Font style
  if (cell[4]) style.fontStyle = cell[4];
  
  // Text decoration
  if (cell[5]) style.textDecoration = cell[5];
  
  // Font size
  if (cell[6]) style.fontSize = cell[6];
  
  // Font family
  if (cell[7]) style.fontFamily = cell[7];
  
  // Debug: Log text styles for first few cells
  if (rowIndex === 0 && colIndex < 3) {
    console.log(`Cell [${rowIndex}][${colIndex}] text style:`, style);
  }
  
  return style;
}

// Get row style (height)
function getRowStyle(rowIndex) {
  const row = filteredFileData.value?.data?.[rowIndex];
  if (!row || !Array.isArray(row) || row.length === 0) return {};
  
  const firstCell = row[0];
  if (!Array.isArray(firstCell) || firstCell.length < 12) return {};
  
  const style = {};
  
  // Row height
  if (firstCell[11]) {
    style.height = `${firstCell[11]}px`;
    style.minHeight = `${firstCell[11]}px`;
  }
  
  return style;
}

// Watch for changes in props
watch(() => [props.jsonData, props.currentFileName], () => {
  if (!props.jsonData) {
    error.value = 'No JSON data provided';
    return;
  }
  
  // Validate single file format
  if (!props.jsonData.name || !props.jsonData.data) {
    error.value = 'Invalid JSON format. Expected single file format with "name" and "data" properties.';
    return;
  }
  
  // Validate filename if provided
  if (props.currentFileName && props.jsonData.name !== props.currentFileName) {
    error.value = `Expected file "${props.currentFileName}" but received "${props.jsonData.name}"`;
    return;
  }
  
  if (!fileData.value) {
    error.value = 'No valid file data found';
    return;
  }
  
  error.value = null;
}, { immediate: true });
</script>

<style>
/* CSS Custom Properties for global control */
.excel-preview {
  --excel-font-size: 0.6rem;
  --excel-cell-padding: 4px 8px;
  --excel-line-height: 1.2;
  --excel-border-color: #ccc;
  --excel-container-background: #fff;
  --excel-table-background: #fff;
  --excel-header-default-bg: #f5f5f5;
  --excel-text-color: #222;
  --excel-header-text-color: #fff;
  --excel-table-max-height: 62vh;
  --excel-border-bottom-color: #eee;
  --excel-header-border-bottom: #888;
  --excel-font-family: Calibri, Arial, sans-serif;
}


.table-container {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-y: auto;
  max-height: var(--excel-table-max-height);
  background: var(--excel-container-background);
  border-bottom: 2px solid var(--excel-border-bottom-color);
  position: relative;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--excel-table-background);
  font-family: var(--excel-font-family);
}

.excel-table th {
  border: 1px solid var(--excel-border-color);
  padding: 2px 0px 2px 0px;
  text-align: center;
  vertical-align: top;
  font-size: 0.8rem;
  color: var(--excel-header-text-color);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
  height: auto;
  min-height: 25px;
  border-bottom: 1px solid var(--excel-header-border-bottom);
  border-top: 1px solid var(--excel-header-border-bottom);
  background: var(--excel-header-default-bg);
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: var(--excel-line-height);
}

.excel-table td {
  border: 1px solid var(--excel-border-color);
  /* padding: var(--excel-cell-padding); */
  padding: 4px 4px;
  text-align: left;
  vertical-align: top;
  font-size: 0.6rem;
  color: var(--excel-text-color);
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: var(--excel-line-height);
  height: auto;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  text-align: center;
  padding: 20px;
  color: #d32f2f;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  margin: 10px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}
</style> 