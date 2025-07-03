<template>
  <div class="pdf-viewer">
    <iframe v-if="pdfUrl" :src="pdfUrl" style="width:100%;height:400px;border:none;"></iframe>
    <div v-else style="color:#888;">No PDF selected.</div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ pdfBlob: Object });
const pdfUrl = ref('');
watch(() => props.pdfBlob, (blob) => {
  if (blob) {
    pdfUrl.value = URL.createObjectURL(blob);
  } else {
    pdfUrl.value = '';
  }
});
</script> 