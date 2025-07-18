<template>
  <router-view
    v-slot="{ Component, route }"
    :processing="processing"
    :processingMessage="processingMessage"
    :initialUploadedFile="uploadedFile"
    :backendResult="backendResult"
    :errorMessage="errorMessage"
    @file-selected="onFileSelected"
    @dismiss-error="onDismissError"
  >
    <component
      :is="Component"
      :processing="processing"
      :processingMessage="processingMessage"
      :initialUploadedFile="uploadedFile"
      :backendResult="backendResult"
      :errorMessage="errorMessage"
      @file-selected="onFileSelected"
      @dismiss-error="onDismissError"
    />
  </router-view>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { uploadPdf } from './services/api.js';

const router = useRouter();
const processing = ref(false);
const processingMessage = ref('');
const uploadedFile = ref(null);
const backendResult = ref(null);
const errorMessage = ref(''); // Add error state

async function onFileSelected(file) {
  processing.value = true;
  processingMessage.value = 'Processing Policy...';
  errorMessage.value = '';
  try {
    // Call backend API to process PDF
    const result = await uploadPdf(file);
    uploadedFile.value = file;
    backendResult.value = result;
    // Navigate to main UI, passing file and backendResult as prop
    router.push({ name: 'Main', state: { uploadedFile: file, backendResult: result } });
  } catch (e) {
    errorMessage.value = 'Upload failed. Please try again.';
    processing.value = false;
    processingMessage.value = '';
    return;
  }
  processing.value = false;
  processingMessage.value = '';
}

function onDismissError() {
  errorMessage.value = '';
}
</script> 