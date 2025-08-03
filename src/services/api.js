import axios from 'axios';
import JSZip from 'jszip';
import logger from './logger.js';

// const API_BASE = import.meta.env.VITE_API_URL || '';
const API_BASE = '';

export async function uploadPolicy(file) {
  const formData = new FormData();
  
  // Determine file type and use appropriate parameter name
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.toLowerCase().endsWith('.docx');
  
  if (isPdf) {
    formData.append('pdf_file', file);
  } else if (isDocx) {
    formData.append('docx_file', file);
  } else {
    throw new Error('Unsupported file type. Please upload PDF or DOCX files only.');
  }

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
        console.log('Score data loaded:', scoreData);
        break;
      }
    }

    const gapAnalyses = [];
    const summaryFiles = [];
    const excelJsonData = {}; // Store JSON data for Excel files
    let gapSummaryJsonData = null; // Store Gap Summary JSON data

    // Loop through all files in the zip
    const files = Object.keys(zip.files);
    for (const filename of files) {
      if (zip.files[filename].dir) continue;
      const lower = filename.toLowerCase();
      
      if (lower.startsWith('analysis/')) {
        const blob = await zip.files[filename].async('blob');
        // Find score for this file from score.json
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
        
        // Check if this is the Gap_Summary.json file
        if (filename.toLowerCase().includes('gap_summary.json')) {
          try {
            const jsonText = await zip.files[filename].async('string');
            gapSummaryJsonData = JSON.parse(jsonText);
            console.log('Gap Summary JSON data loaded:', gapSummaryJsonData);
          } catch (error) {
            console.error(`Error parsing Gap Summary JSON file ${filename}:`, error);
          }
        }
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
      scoreData, // Include the complete score data from score.json
      excelJsonData, // Include the JSON data in the response
      gapSummaryJsonData // Include the Gap Summary JSON data in the response
    };
  } catch (error) {
    logger.error('Upload failed', error);
    throw error;
  }
}

// Keep the old function name for backward compatibility
export async function uploadPdf(file) {
  return uploadPolicy(file);
} 