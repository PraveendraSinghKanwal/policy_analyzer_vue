import axios from 'axios';
import JSZip from 'jszip';
import logger from './logger.js';

const API_BASE = '';

/**
 * Uploads a PDF file to the backend and parses the returned zip structure.
 * Expects a zip with:
 *   - 'Analysis/': files for the first tab
 *   - 'Summary/': files for the second tab
 *   - 'score.json': contains scores for gapAnalyses and totalScore
 * Returns: { gapAnalyses: [...], summaryFiles: [...], totalScore }
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

    // Parse score.json if present
    let scoreData = { gapAnalyses: [], totalScore: undefined };
    for (const filename of Object.keys(zip.files)) {
      if (filename.toLowerCase() === 'score.json') {
        const jsonText = await zip.files[filename].async('string');
        scoreData = JSON.parse(jsonText);
        break;
      }
    }

    const gapAnalyses = [];
    const summaryFiles = [];

    // Loop through all files in the zip
    const files = Object.keys(zip.files);
    for (const filename of files) {
      if (zip.files[filename].dir) continue;
      const lower = filename.toLowerCase();
      if (lower.startsWith('analysis/')) {
        const blob = await zip.files[filename].async('blob');
        // Find score for this file
        let score = undefined;
        if (scoreData.gapAnalyses) {
          const scoreEntry = scoreData.gapAnalyses.find(f => f.name === filename.split('/').pop());
          if (scoreEntry) score = scoreEntry.score;
        }
        gapAnalyses.push({
          name: filename.split('/').pop(),
          blob: blob,
          score: score
        });
      } else if (lower.startsWith('summary/')) {
        const blob = await zip.files[filename].async('blob');
        summaryFiles.push({
          name: filename.split('/').pop(),
          blob: blob
        });
      }
    }

    return {
      gapAnalyses,
      summaryFiles,
      totalScore: scoreData.totalScore
    };
  } catch (error) {
    logger.error('Upload failed', error);
    throw error;
  }
} 