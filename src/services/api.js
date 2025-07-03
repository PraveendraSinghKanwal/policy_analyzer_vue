import axios from 'axios';
import JSZip from 'jszip';
import logger from './logger.js';

const API_BASE = '';

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_BASE}/upload-pdf`, formData, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Parse ZIP
    const zip = await JSZip.loadAsync(response.data);
    
    // Debug: Log all files in the ZIP
    console.log('Files in ZIP:', Object.keys(zip.files));
    
    let standard = null, gap = null, summary = null;
    const files = Object.keys(zip.files);
    
    for (const filename of files) {
      const lowerFilename = filename.toLowerCase();
      console.log('Processing file:', filename, 'lowercase:', lowerFilename);
      
      if (lowerFilename.includes('standard') && (lowerFilename.endsWith('.xlsx') || lowerFilename.endsWith('.xls'))) {
        standard = await zip.files[filename].async('blob');
        console.log('Found standard analysis file:', filename);
      } else if (lowerFilename.includes('gap') && (lowerFilename.endsWith('.xlsx') || lowerFilename.endsWith('.xls'))) {
        gap = await zip.files[filename].async('blob');
        console.log('Found gap analysis file:', filename);
      } else if (lowerFilename.includes('summary') && (lowerFilename.endsWith('.txt') || lowerFilename.endsWith('.text'))) {
        summary = await zip.files[filename].async('blob');
        console.log('Found summary file:', filename);
      }
    }
    
    // If no files matched by name, try to assign by position/index
    if (!standard && !gap && !summary && files.length >= 3) {
      console.log('No files matched by name, trying by position...');
      const excelFiles = files.filter(f => f.toLowerCase().endsWith('.xlsx') || f.toLowerCase().endsWith('.xls'));
      const textFiles = files.filter(f => f.toLowerCase().endsWith('.txt') || f.toLowerCase().endsWith('.text'));
      
      if (excelFiles.length >= 2) {
        standard = await zip.files[excelFiles[0]].async('blob');
        gap = await zip.files[excelFiles[1]].async('blob');
        console.log('Assigned Excel files by position:', excelFiles[0], excelFiles[1]);
      }
      
      if (textFiles.length >= 1) {
        summary = await zip.files[textFiles[0]].async('blob');
        console.log('Assigned text file by position:', textFiles[0]);
      }
    }
    
    console.log('Final result:', { standard: !!standard, gap: !!gap, summary: !!summary });
    return { standard, gap, summary };
  } catch (error) {
    logger.error('API uploadPdf failed', error);
    throw error;
  }
} 