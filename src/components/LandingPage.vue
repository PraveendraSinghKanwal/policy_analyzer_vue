<template>
  <div class="landing-container">
    <!-- Processing overlay (conditionally rendered) -->
    <div v-if="props.processing" class="processing-overlay">
      <div class="processing-content">
        <span class="processing-spinner"></span>
        <span class="processing-message">{{ props.processingMessage || 'Processing Policy...' }}</span>
      </div>
    </div>
    <!-- Existing landing page content -->
    <div class="landing-header-row">
      <div>
        <h1 class="landing-title">
          Simplify your Travel Policy Management with AmexGBT
          <!-- <a href="https://www.amexglobalbusinesstravel.com/" target="_blank" class="amex-link">AmexGBT</a> -->
        </h1>
        <p class="landing-subtitle">
            Effortlessly align every Category and Subcategory of your travel policy with industry standards and your business goals.
        </p>
      </div>
      <img src="/amex-logo.jpg" alt="Amex GBT Logo" class="landing-logo" />
    </div>
    <div class="landing-content-row">
      <div class="landing-gain-list">
        <h2 class="gain-title">What You'll Gain</h2>
        <ul class="gain-list">
          <li>Automated extraction of Policy content for all categories and subcategories AmexGBT global standards</li>
          <!-- <li>Comparison against <a href="https://www.amexglobalbusinesstravel.com/" target="_blank" class="amex-link">AmexGBT</a> global standards</li> -->
          <li>Scoring your policy content for clarity and compliance</li>
          <li>Detailed gap analysis reports</li>
          <li>Recommended Policy generation or design your policy with your inputs</li>
          <li>Feedback options to capture your inputs</li>
          <li>Redesign Policy that aligns your business goals</li>
        </ul>
      </div>
      <img src="/amex-gbt-travelling.jpg" alt="Airport" class="landing-image" />
    </div>
    <div class="landing-upload-row">
      <div class="landing-how-row">
      <h2 class="how-title">How it works</h2>
      <div class="how-steps">
        <span class="how-step">Upload Policy →</span>
        <span class="how-step">Analyse Benchmarking and Gaps→</span>
        <span class="how-step">Provide your Feedback →</span>
        <span class="how-step">Submit to redesign new policy</span>
        <!-- <span class="how-step">1️⃣ Upload Policy →</span>
        <span class="how-step">2️⃣ Analyse Benchmarking and Gaps→</span>
        <span class="how-step">3️⃣ Provide your Feedback →</span>
        <span class="how-step">📥 Submit to redesign new policy</span> -->
      </div>
    </div>
      <div class="upload-btn-center-wrapper">
        <label class="upload-btn-label">
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf"
            @change="onFileChange"
            style="display:none"
          />
          <div class="upload-btn">
            Upload Travel Policy
            <img src="/pdf_upload.webp" alt="Upload" class="upload-icon" />
          </div>
        </label>
        <div v-if="props.errorMessage" class="error-message-fixed">
          <span>{{ props.errorMessage }}</span>
          <button class="error-dismiss" @click="onDismissError">&times;</button>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script setup>
import { ref } from 'vue';
const emit = defineEmits(['file-selected', 'dismiss-error']);
const props = defineProps({
  processing: Boolean,
  processingMessage: String,
  errorMessage: String
});
const fileInput = ref(null);
function onFileChange(e) {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    emit('file-selected', file);
  }
  // Reset input so the same file can be selected again
  e.target.value = '';
  // or: fileInput.value.value = '';
}
function onDismissError() {
  emit('dismiss-error');
}
</script>

<style scoped>
.landing-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 20px 0 0 0;
  font-family: 'Inter', Arial, sans-serif;
}
.landing-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 48px 0 48px;
  /* background: rgba(255,255,255,0.85); */
  background: transparent;
  border-radius: 18px;
  margin-bottom: 24px;
}
.landing-title {
  font-size: 2.0rem;
  font-weight: 700;
  color: #0a2e5d;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(37,99,235,0.04);
}
.amex-link {
  color: #2563eb;
  text-decoration: underline;
  font-weight: 700;
  transition: color 0.2s;
}
.amex-link:hover {
  color: #0a2e5d;
}
.landing-subtitle {
  font-size: 0.8rem;
  color: #333;
  margin: 0 0 0 0;
  padding-left: 10px;
  font-weight: 500;
  letter-spacing: 0.1px;
}
.landing-logo {
  width: 80px;
  height: auto;
  margin-top: 0px;
  border-radius: 10px;
  background: white;
  border: 2px solid #e0e7ef;
  transition: transform 0.2s;
}
.landing-logo:hover {
  transform: scale(1.05) rotate(-2deg);
}
.landing-content-row {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding: 0px 0px 0px 0px;
  margin-top: 0px;
  gap: 0px;
}
.landing-gain-list {
  flex: 1 1 0;
  max-width: 600px;
  /* background: rgba(255,255,255,0.92); */
  background: transparent;
  border-radius: 16px;
  padding: 5px 10px 5px 20px;
  margin-bottom: 0;
}
.gain-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #1f325b;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gain-list {
  list-style: none;
  padding: 0;
  margin: 0;
  color: #222;
  font-size: 0.8rem;
}
.gain-list li {
  margin-bottom: 5px;
  line-height: 1.0;
  display: flex;
  align-items: center;
  gap: 8px;
  background:transparent;
  border-radius: 8px;
  padding: 4px 6px;
  font-weight: 500;
}
.gain-list li::before {
  content: "\2714";
  color: #3b3b3b;
  font-weight: bold;
  margin-right: 8px;
  font-size: 1.1em;
}
.landing-image {
  width: 400px;
  height: 240px;
  object-fit: cover;
  border-radius: 16px;
  margin-left: 32px;
  background: #fff;
  border: 2px solid #e0e7ef;
  transition: transform 0.2s;
}
.landing-image:hover {
  transform: scale(1.03) rotate(1deg);
}
.landing-how-row {
  margin: 0px 0px 10px 0px;
  padding: 0px 0px;
  /* background: rgba(255,255,255,0.92); */
  background: transparent;
  border-radius: 16px;
  padding-bottom: 10px;
  padding-top: 5px;
}
.how-title {
  font-size: 1.18rem;
  font-weight: 700;
  color: #1e283d;
  margin-bottom: 10px;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.how-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  font-size: 0.8rem;
  color: #0a2e5d;
  font-weight: 500;
  letter-spacing: 0.1px;
  margin-top: 4px;
}
.how-step {
  margin-right: 5px;
  background: transparent;
  border-radius: 5px;
  padding: 0px 0px;
  display: flex;
  align-items: center;
  font-weight: 600;
  transition: background 0.2s;
}
.how-step:hover {
  background: #dbeafe;
}
.landing-upload-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 20px 0px 20px 0px;
  position: relative;
  width: 100%;
  min-height: 80px;
}
.upload-btn-center-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-btn-label {
  cursor: pointer;
}
.upload-btn {
  background: rgb(10, 10, 87);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 16px;
  padding: 20px 20px 20px 20px;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 6px;
  transition: background 0.2s, transform 0.2s;
  border: none;
  outline: none;
  letter-spacing: 0.2px;
}
.upload-btn:hover {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  transform: scale(1.04);
}
.upload-icon {
  width: 38px;
  height: 38px;
  object-fit: contain;
  margin-left: 8px;
  filter: drop-shadow(0 2px 6px rgba(37,99,235,0.10));
}
.error-message-fixed {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 24px;
  display: inline-flex;
  background: #ffeaea;
  color: #b71c1c;
  border: 1px solid #f44336;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 0.8rem;
  font-weight: 500;

  max-width: none;
  align-items: center;
  z-index: 2;
  white-space: nowrap;
}
.error-dismiss {
  background: none;
  border: none;
  color: #b71c1c;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  margin-left: 16px;
  line-height: 1;
  transition: color 0.2s;
}
.error-dismiss:hover {
  color: #f44336;
}
.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255,255,255,0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.processing-spinner {
  width: 64px;
  height: 64px;
  border: 8px solid #e0e7ef;
  border-top: 8px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.processing-message {
  font-size: 1.3rem;
  color: #0a2e5d;
  font-weight: 600;
  margin-top: 8px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (max-width: 900px) {
  .landing-header-row, .landing-content-row, .landing-how-row {
    padding: 0 12px;
  }
  .landing-header-row, .landing-content-row, .landing-how-row {
    border-radius: 10px;
  }
  .landing-content-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
  .landing-image {
    margin-left: 0;
    margin-top: 24px;
    width: 100%;
    max-width: 400px;
    height: auto;
  }
  .landing-upload-row {
    flex-direction: column;
    align-items: stretch;
    min-height: unset;
    margin-top: 24px;
  }
  .upload-btn-center-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  .error-message-fixed {
    position: static;
    transform: none;
    margin-left: 0;
    margin-top: 8px;
    max-width: 100%;
  }
}
@media (max-width: 600px) {
  .landing-title {
    font-size: 1.2rem;
  }
  .landing-logo {
    width: 70px;
  }
  .landing-image {
    max-width: 100%;
    height: auto;
  }
  .upload-btn {
    font-size: 1rem;
    padding: 18px 18px;
  }
}
</style> 