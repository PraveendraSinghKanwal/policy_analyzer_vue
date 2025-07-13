<template>
  <div class="tab-navigation">
    <!-- Main Category Tabs -->
    <div class="main-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ 
          'main-tab': true,
          'active': activeCategory === category.id 
        }"
        @click="selectCategory(category.id)"
        :disabled="!enabled"
      >
        {{ category.label }}
        <span v-if="category.count > 0" class="file-count">({{ category.count }})</span>
      </button>
    </div>

    <!-- Sub-tabs for files within the selected category -->
    <div v-if="activeCategory && getCategoryFiles(activeCategory).length > 0" class="sub-tabs">
      <button
        v-for="file in getCategoryFiles(activeCategory)"
        :key="file.name"
        :class="{ 
          'sub-tab': true,
          'active': isFileActive(file, activeCategory)
        }"
        @click="selectFile(file, activeCategory)"
        :disabled="!enabled"
      >
        {{ getDisplayName(file.name, activeCategory) }}
      </button>
    </div>

    <!-- No files message -->
    <div v-else-if="activeCategory && getCategoryFiles(activeCategory).length === 0" class="no-files-message">
      No files available in {{ getCategoryLabel(activeCategory) }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  enabled: Boolean,
  activeFile: Object,
  standardAnalyses: Array,
  gapAnalyses: Array,
  summaryFile: Object
});

const emit = defineEmits(['select-category', 'select-file']);

const activeCategory = ref(null);

const categories = computed(() => [
  {
    id: 'standard',
    label: 'Standard Analyses',
    count: props.standardAnalyses?.length || 0
  },
  {
    id: 'gap',
    label: 'Gap Analyses', 
    count: props.gapAnalyses?.length || 0
  },
  {
    id: 'summary',
    label: 'Summary',
    count: props.summaryFile ? 1 : 0
  }
]);

function getCategoryFiles(categoryId) {
  switch (categoryId) {
    case 'standard':
      return props.standardAnalyses || [];
    case 'gap':
      return props.gapAnalyses || [];
    case 'summary':
      return props.summaryFile ? [props.summaryFile] : [];
    default:
      return [];
  }
}

function getCategoryLabel(categoryId) {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.label : '';
}

function isFileActive(file, categoryId) {
  return props.activeFile && 
         props.activeFile.type === categoryId && 
         props.activeFile.file.name === file.name;
}

function selectCategory(categoryId) {
  activeCategory.value = categoryId;
  emit('select-category', categoryId);
  
  // Auto-select first file in the category
  const files = getCategoryFiles(categoryId);
  if (files.length > 0) {
    selectFile(files[0], categoryId);
  }
}

// Auto-select first category with files when component mounts
watch(() => props.standardAnalyses, (newVal) => {
  if (newVal && newVal.length > 0 && !activeCategory.value) {
    selectCategory('standard');
  }
}, { immediate: true });

watch(() => props.gapAnalyses, (newVal) => {
  if (newVal && newVal.length > 0 && !activeCategory.value) {
    selectCategory('gap');
  }
}, { immediate: true });

watch(() => props.summaryFile, (newVal) => {
  if (newVal && !activeCategory.value) {
    selectCategory('summary');
  }
}, { immediate: true });

function selectFile(file, categoryId) {
  emit('select-file', { type: categoryId, file });
}

function getDisplayName(filename, categoryId = null) {
  // Remove the prefix and extension for display
  let displayName = filename;

  if (categoryId === 'gap') {
    // Remove 'Gap Analyses' (case-insensitive) from anywhere in the filename
    displayName = displayName.replace(/gap[_\s-]*analyses[_\s-]*/i, '');
  } else if (filename.startsWith('Standard_Analyses_')) {
    displayName = filename.replace('Standard_Analyses_', '');
  } else if (filename.startsWith('Gap_analyses_')) {
    displayName = filename.replace('Gap_analyses_', '');
  }

  // Remove file extension
  displayName = displayName.replace(/\.(xlsx|xls|pdf|docx)$/i, '');

  // Replace underscores with spaces and capitalize
  displayName = displayName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return displayName.trim() || filename;
}
</script>

<style scoped>
.tab-navigation {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}

.main-tab {
  flex: 1;
  padding: var(--spacing-4) var(--spacing-6);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.main-tab:hover:not(:disabled) {
  background: var(--gray-50);
  color: var(--primary-color);
}

.main-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background: white;
  font-weight: 600;
}

.main-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-count {
  background: var(--gray-200);
  color: var(--gray-600);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}

.main-tab.active .file-count {
  background: var(--primary-color);
  color: white;
}

.sub-tabs {
  display: flex;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  overflow-x: auto;
  padding: 0 var(--spacing-4);
  gap: var(--spacing-1);
}

.sub-tab {
  padding: var(--spacing-3) var(--spacing-4);
  background: transparent;
  border: none;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
  position: relative;
}

.sub-tab:hover:not(:disabled) {
  background: white;
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.sub-tab.active {
  color: var(--primary-color);
  background: white;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
}

.sub-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-files-message {
  padding: 24px;
  text-align: center;
  color: #888;
  font-style: italic;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

/* Scrollbar styling for sub-tabs */
.sub-tabs::-webkit-scrollbar {
  height: 4px;
}

.sub-tabs::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sub-tabs::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.sub-tabs::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 