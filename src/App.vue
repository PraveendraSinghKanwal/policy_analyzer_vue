<template>
  <router-view
    v-slot="{ Component, route }"
    :processing="processing"
    :processingMessage="processingMessage"
    :initialUploadedFile="uploadedFile"
    :backendResult="backendResult"
    @file-selected="onFileSelected"
  >
    <component
      :is="Component"
      :processing="processing"
      :processingMessage="processingMessage"
      :initialUploadedFile="uploadedFile"
      :backendResult="backendResult"
      @file-selected="onFileSelected"
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

async function onFileSelected(file) {
  processing.value = true;
  processingMessage.value = 'Processing Policy...';
  try {
    // Call backend API to process PDF
    const result = await uploadPdf(file);
    uploadedFile.value = file;
    backendResult.value = result;
    // Navigate to main UI, passing file and backendResult as prop
    router.push({ name: 'Main', state: { uploadedFile: file, backendResult: result } });
  } catch (e) {
    processingMessage.value = 'Upload failed. Please try again.';
    processing.value = false;
  }
  processing.value = false;
  processingMessage.value = '';
}
</script> 