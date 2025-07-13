<template>
  <div class="excel-preview">
    <div v-if="loading" class="loading">Loading Excel preview...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="data" class="table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <th v-for="(cell, index) in data[0]" :key="index">{{ cell || `Column ${index + 1}` }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in data.slice(1)" :key="rowIndex">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell || '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="no-data">No data to preview</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import * as XLSX from 'xlsx';

const props = defineProps({
  excelBlob: Object
});

const data = ref(null);
const loading = ref(false);
const error = ref(null);

watch(() => props.excelBlob, async (blob) => {
  if (!blob) {
    data.value = null;
    error.value = null;
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    data.value = jsonData;
  } catch (err) {
    error.value = 'Failed to parse Excel file';
    console.error('Excel parsing error:', err);
  } finally {
    loading.value = false;
  }
}, { immediate: true });
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
  overflow-x: auto;
  overflow-y: auto;
  min-height: 120px;
  max-height: 220px;
  width: 100%;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  background: white;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
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

.excel-table td {
  color: var(--gray-700);
  font-size: var(--font-size-sm);
}

.more-rows {
  text-align: center;
  padding: 10px;
  color: #666;
  font-style: italic;
}

.table-container {
  scrollbar-width: auto;
}
.table-container::-webkit-scrollbar {
  height: 12px;
}
.table-container::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 6px;
}
.table-container::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: 6px;
}
</style> 