import axios from 'axios';
import JSZip from 'jszip';
import logger from './logger.js';

const API_BASE = '';

/**
 * Uploads a PDF file to the backend and parses the returned zip structure.
 * Expects a zip with two subfolders:
 *   - 'Analysis': files for the first tab
 *   - 'Summary': files for the second tab
 * Returns: { gapAnalyses: [...], summaryFiles: [...] }
 */
export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(API_BASE + '/api/v1/upload', formData, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Parse ZIP
    const zip = await JSZip.loadAsync(response.data);

    const gapAnalyses = [];
    const summaryFiles = [];

    // Loop through all files in the zip
    const files = Object.keys(zip.files);
    console.log('All files in zip:', files);
    files.forEach(f => console.log('Zip file path:', f));
    for (const filename of files) {
      // Only process files (not folders)
      if (zip.files[filename].dir) continue;
      const lower = filename.toLowerCase();
      if (lower.startsWith('analysis/')) {
        // File for the first tab
        const blob = await zip.files[filename].async('blob');
        gapAnalyses.push({
          name: filename.split('/').pop(),
          blob: blob
        });
      } else if (lower.startsWith('summary/')) {
        // File for the second tab
        const blob = await zip.files[filename].async('blob');
        summaryFiles.push({
          name: filename.split('/').pop(),
          blob: blob
        });
      }
    }

    return {
      gapAnalyses,
      summaryFiles
    };
  } catch (error) {
    logger.error('Upload failed', error);
    throw error;
  }
} 