import axios from 'axios';
import JSZip from 'jszip';
import logger from './logger.js';

const API_BASE = '';

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
      } else if (lower.startsWith('gap_analyses') && (lower.endsWith('.xlsx') || lower.endsWith('.xls'))) {
        const blob = await zip.files[filename].async('blob');
        gapAnalyses.push({
          name: filename,
          blob: blob
        });
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
      }
    }
    
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