<template>
  <div ref="luckysheetContainer" class="luckysheet-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import luckysheet from 'luckysheet';

const props = defineProps({
  data: Array, // Luckysheet data format
  options: Object // Optional: pass additional Luckysheet options
});

const luckysheetContainer = ref(null);

onMounted(() => {
  luckysheet.create({
    container: luckysheetContainer.value,
    data: props.data,
    ...props.options
  });
});

onBeforeUnmount(() => {
  if (luckysheetContainer.value) {
    luckysheetContainer.value.innerHTML = '';
  }
});
</script>

<style scoped>
.luckysheet-container {
  width: 100%;
  height: 400px;
  min-height: 220px;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.04));
  overflow: hidden;
}
</style> 