<template>
  <div class="file-buttons">
    <!-- Standard Analyses Section -->
    <div class="file-section">
      <h3 class="section-title">Standard Analyses</h3>
      <div class="scrollable-container">
        <button
          v-for="file in standardAnalyses"
          :key="file.name"
          :disabled="!enabled"
          :class="{ active: activeFile && activeFile.name === file.name && activeFile.type === 'standard' }"
          @click="$emit('select', { type: 'standard', file })"
          class="file-button"
        >
          {{ getDisplayName(file.name) }}
        </button>
        <div v-if="standardAnalyses.length === 0" class="no-files">
          No Standard Analysis files
        </div>
      </div>
    </div>

    <!-- Gap Analyses Section -->
    <div class="file-section">
      <h3 class="section-title">Gap Analyses</h3>
      <div class="scrollable-container">
        <button
          v-for="file in gapAnalyses"
          :key="file.name"
          :disabled="!enabled"
          :class="{ active: activeFile && activeFile.name === file.name && activeFile.type === 'gap' }"
          @click="$emit('select', { type: 'gap', file })"
          class="file-button"
        >
          {{ getDisplayName(file.name) }}
        </button>
        <div v-if="gapAnalyses.length === 0" class="no-files">
          No Gap Analysis files
        </div>
      </div>
    </div>

    <!-- Summary Section -->
    <div class="file-section">
      <h3 class="section-title">Summary</h3>
      <button
        v-if="summaryFile"
        :disabled="!enabled"
        :class="{ active: activeFile && activeFile.type === 'summary' }"
        @click="$emit('select', { type: 'summary', file: summaryFile })"
        class="file-button summary-button"
      >
        {{ getDisplayName(summaryFile.name) }}
      </button>
      <div v-else class="no-files">
        No Summary file
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ 
  enabled: Boolean, 
  activeFile: Object,
  standardAnalyses: Array,
  gapAnalyses: Array,
  summaryFile: Object
});

function getDisplayName(filename) {
  // Remove the prefix and extension for display
  let displayName = filename;
  
  if (filename.startsWith('Standard_Analyses_')) {
    displayName = filename.replace('Standard_Analyses_', '');
  } else if (filename.startsWith('Gap_analyses_')) {
    displayName = filename.replace('Gap_analyses_', '');
  }
  
  // Remove file extension
  displayName = displayName.replace(/\.(xlsx|xls|pdf|docx)$/i, '');
  
  // Replace underscores with spaces and capitalize
  displayName = displayName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return displayName || filename;
}
</script>

<style scoped>
.file-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.scrollable-container {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px;
  background: #fafafa;
}

.file-button {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-button:last-child {
  margin-bottom: 0;
}

.file-button:hover:not(:disabled) {
  background: #f0f8ff;
  border-color: #1976d2;
}

.file-button.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.file-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary-button {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px 12px;
  background: white;
  color: #333;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.summary-button:hover:not(:disabled) {
  background: #f0f8ff;
  border-color: #1976d2;
}

.summary-button.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.no-files {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: 13px;
}

/* Scrollbar styling */
.scrollable-container::-webkit-scrollbar {
  width: 6px;
}

.scrollable-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.scrollable-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.scrollable-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 