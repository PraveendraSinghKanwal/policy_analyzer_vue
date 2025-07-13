<template>
  <div class="download-buttons">
    <button 
      :disabled="!enabled" 
      @click="$emit('download')"
      class="btn btn-success btn-square"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </button>
    <div class="download-options" v-if="enabled">
      <button 
        @click="$emit('download')"
        class="btn btn-secondary btn-square"
        title="Download original file"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </button>
      <button 
        @click="$emit('download')"
        class="btn btn-secondary btn-square"
        title="Download as PDF"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({ enabled: Boolean });
</script>

<style scoped>
.download-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.btn-square {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  max-width: 40px;
  max-height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.download-options {
  display: flex;
  gap: var(--spacing-2);
}

@media (max-width: 768px) {
  .download-buttons {
    flex-direction: column;
    gap: var(--spacing-2);
  }
  .download-options {
    width: 100%;
    justify-content: center;
  }
}
</style> 