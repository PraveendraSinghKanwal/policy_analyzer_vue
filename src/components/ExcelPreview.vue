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
  max-height: 400px;
  overflow-y: auto;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.excel-table th,
.excel-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.excel-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.excel-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.excel-table tr:hover {
  background-color: #f0f0f0;
}

.more-rows {
  text-align: center;
  padding: 10px;
  color: #666;
  font-style: italic;
}
</style> 