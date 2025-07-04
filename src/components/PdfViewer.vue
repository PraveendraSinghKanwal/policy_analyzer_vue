<template>
  <div class="pdf-viewer">
    <iframe v-if="pdfUrl" :src="pdfUrl" style="width:100%;height:400px;border:none;"></iframe>
    <div v-else style="color:#888;">No PDF selected.</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ pdfBlob: Object });
const pdfBlob = props.pdfBlob;
const pdfUrl = ref('');

watch(
  () => pdfBlob,
  (blob) => {
    if (blob instanceof window.Blob && blob.size > 0) {
      if (pdfUrl.value) {
        URL.revokeObjectURL(pdfUrl.value);
      }
      pdfUrl.value = URL.createObjectURL(blob);
    } else {
      if (pdfUrl.value) {
        URL.revokeObjectURL(pdfUrl.value);
      }
      pdfUrl.value = '';
    }
  },
  { immediate: true }
);
</script> 