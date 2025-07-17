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
          Simplify your Travel Policy Management with
          <a href="https://www.amexglobalbusinesstravel.com/" target="_blank" class="amex-link">AmexGBT</a>
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
          <li>✔ Automated extraction of Policy content for all categories and subcategories</li>
          <li>✔ Comparison against <a href="https://www.amexglobalbusinesstravel.com/" target="_blank" class="amex-link">AmexGBT</a> global standards</li>
          <li>✔ Scoring your policy content for clarity and compliance</li>
          <li>✔ Detailed gap analysis reports</li>
          <li>✔ Recommended Policy generation or design your policy with your inputs</li>
          <li>✔ Feedback options to capture your inputs</li>
          <li>✔ Redesign Policy that aligns your business goals</li>
        </ul>
      </div>
      <img src="/amex-gbt-travelling.jpg" alt="Airport" class="landing-image" />
    </div>
    <div class="landing-how-row">
      <h2 class="how-title">How it works</h2>
      <div class="how-steps">
        <span class="how-step">1️⃣ Upload Policy →</span>
        <span class="how-step">2️⃣ Analyse Benchmarking and Gaps→</span>
        <span class="how-step">3️⃣ Provide your Feedback →</span>
        <span class="how-step">📥 Submit to redesign new policy</span>
      </div>
    </div>
    <div class="landing-upload-row">
      <label class="upload-btn-label">
        <input type="file" accept="application/pdf" @change="onFileChange" style="display:none" />
        <div class="upload-btn">
          Upload Travel Policy
          <img src="/pdf_upload.webp" alt="Upload" class="upload-icon" />
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['file-selected']);
const props = defineProps({
  processing: Boolean,
  processingMessage: String
});
function onFileChange(e) {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    emit('file-selected', file);
  }
}
</script>

<style scoped>
.landing-container {
  min-height: 100vh;
  background: #cbeafe;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 32px 0 0 0;
  font-family: 'Inter', Arial, sans-serif;
}
.landing-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 48px 0 48px;
}
.landing-title {
  font-size: 2rem;
  font-weight: 600;
  color: #222;
  margin: 0 0 8px 0;
}
.amex-link {
  color: #2563eb;
  text-decoration: underline;
}
.landing-subtitle {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 16px 0;
}
.landing-logo {
  width: 110px;
  height: auto;
  margin-top: 8px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  background: white;
}
.landing-content-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 48px 0 48px;
  margin-top: 16px;
}
.landing-gain-list {
  flex: 1 1 0;
  max-width: 520px;
}
.gain-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #222;
}
.gain-list {
  list-style: none;
  padding: 0;
  margin: 0;
  color: #222;
  font-size: 1rem;
}
.gain-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}
.landing-image {
  width: 380px;
  height: 220px;
  object-fit: cover;
  border-radius: 8px;
  margin-left: 32px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  background: #fff;
}
.landing-how-row {
  margin: 32px 0 0 0;
  padding: 0 48px;
}
.how-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #222;
  margin-bottom: 8px;
}
.how-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 1rem;
  color: #222;
}
.how-step {
  margin-right: 8px;
}
.landing-upload-row {
  display: flex;
  justify-content: center;
  margin: 32px 0 0 0;
}
.upload-btn-label {
  cursor: pointer;
}
.upload-btn {
  background: #0a2e5d;
  color: #fff;
  font-size: 1.3rem;
  font-weight: 500;
  border-radius: 20px;
  padding: 28px 48px 28px 48px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  transition: background 0.2s;
}
.upload-btn:hover {
  background: #2563eb;
}
.upload-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  margin-left: 8px;
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
  .landing-content-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .landing-image {
    margin-left: 0;
    margin-top: 24px;
    width: 100%;
    max-width: 380px;
    height: auto;
  }
}
@media (max-width: 600px) {
  .landing-header-row, .landing-content-row, .landing-how-row {
    padding: 0 12px;
  }
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