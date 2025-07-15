<template>
  <div class="docx-viewer">
    <div v-if="loading" class="loading">Loading DOCX preview...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="content" class="content-container">
      <div class="docx-content" v-html="content"></div>
    </div>
    <div v-else class="no-data">No content to preview</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import mammoth from 'mammoth';

const props = defineProps({
  docxBlob: Object
});

const content = ref(null);
const loading = ref(false);
const error = ref(null);

watch(() => props.docxBlob, async (blob) => {
  if (!blob) {
    content.value = null;
    error.value = null;
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    content.value = result.value;
  } catch (err) {
    error.value = 'Failed to parse DOCX file';
    console.error('DOCX parsing error:', err);
  } finally {
    loading.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.docx-viewer {
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

.content-container {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  background: white;
}

.docx-content {
  font-size: 0.7rem; /* updated from 0.85rem */
}

.docx-content :deep(p) {
  margin: 0 0 12px 0;
  font-size: 0.7rem; /* updated from 0.85rem */
}

.docx-content :deep(p:first-of-type) {
  font-size: 0.7rem; /* updated from 0.85rem */
}

.docx-content :deep(h1),
.docx-content :deep(h2),
.docx-content :deep(h3),
.docx-content :deep(h4),
.docx-content :deep(h5),
.docx-content :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  font-size: 0.8rem; /* updated from inherit to 1rem */
}

.docx-content :deep(ul),
.docx-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.docx-content :deep(li) {
  margin: 4px 0;
}

.docx-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.docx-content :deep(th),
.docx-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.docx-content :deep(th) {
  background-color: #f5f5f5;
  font-weight: bold;
}
</style> 