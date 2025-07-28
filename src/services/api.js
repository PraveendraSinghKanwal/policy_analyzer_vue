import axios from 'axios';
import JSZip from 'jszip';
import logger from './logger.js';

// const API_BASE = import.meta.env.VITE_API_URL || '';
const API_BASE = '';

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('pdf_file', file);

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
    const excelJsonData = {}; // Store JSON data for Excel files

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
      } else if (lower.startsWith('excel_data/')) {
        // Extract JSON files from excel_data folder
        const jsonText = await zip.files[filename].async('string');
        try {
          const jsonData = JSON.parse(jsonText);
          // Store JSON data with the Excel filename (without .json extension)
          const excelFileName = filename.split('/').pop().replace('.json', '');
          excelJsonData[excelFileName] = jsonData;
        } catch (error) {
          console.error(`Error parsing JSON file ${filename}:`, error);
        }
      }
    }

    // console.log('gapAnalyses:', gapAnalyses);
    // console.log('summaryFiles:', summaryFiles);
    // console.log('excelJsonData:', excelJsonData);

    return {
      gapAnalyses,
      summaryFiles,
      totalScore: scoreData.totalScore,
      excelJsonData // Include the JSON data in the response
    };
  } catch (error) {
    logger.error('Upload failed', error);
    throw error;
  }
} 