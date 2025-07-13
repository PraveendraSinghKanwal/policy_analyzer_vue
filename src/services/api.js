import axios from 'axios';
import JSZip from 'jszip';
import logger from './logger.js';

const API_BASE = '';

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Attempting to upload file:', file.name);
  console.log('Upload URL:', API_BASE + '/upload-pdf');
  console.log('Backend should be at: http://127.0.0.1:8000');

  try {
    const response = await axios.post(API_BASE + '/upload-pdf', formData, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Parse ZIP
    const zip = await JSZip.loadAsync(response.data);
    
    // Debug: Log all files in the ZIP
    console.log('Files in ZIP:', Object.keys(zip.files));
    
    const standardAnalyses = [];
    const gapAnalyses = [];
    let summaryFile = null;
    
    const files = Object.keys(zip.files);
    
    for (const filename of files) {
      const lower = filename.toLowerCase();
      // Case-insensitive prefix check
      if (lower.startsWith('standard_analyses') && (lower.endsWith('.xlsx') || lower.endsWith('.xls'))) {
        const blob = await zip.files[filename].async('blob');
        standardAnalyses.push({
          name: filename,
          blob: blob
        });
        console.log('Found Standard Analysis file:', filename);
      } else if (lower.startsWith('gap_analyses') && (lower.endsWith('.xlsx') || lower.endsWith('.xls'))) {
        const blob = await zip.files[filename].async('blob');
        gapAnalyses.push({
          name: filename,
          blob: blob
        });
        console.log('Found Gap Analysis file:', filename);
      } else if (lower.includes('summary') && (lower.endsWith('.pdf') || lower.endsWith('.docx'))) {
        let blob;
        if (lower.endsWith('.pdf')) {
          // Set correct MIME type for PDF
          const arrayBuffer = await zip.files[filename].async('arraybuffer');
          blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        } else {
          blob = await zip.files[filename].async('blob');
        }
        summaryFile = {
          name: filename,
          blob: blob,
          type: lower.endsWith('.pdf') ? 'pdf' : 'docx'
        };
        console.log('Found Summary file:', filename, 'Type:', summaryFile.type);
      }
    }
    
    console.log('Final result:', { 
      standardAnalyses: standardAnalyses.length, 
      gapAnalyses: gapAnalyses.length, 
      summaryFile: !!summaryFile 
    });
    
    return { 
      standardAnalyses, 
      gapAnalyses, 
      summaryFile 
    };
  } catch (error) {
    logger.error('API uploadPdf failed', error);
    throw error;
  }
} 