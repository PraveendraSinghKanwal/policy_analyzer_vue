# Policy Extraction App (Vue 3 SPA)

This is a production-ready single-page application (SPA) built with Vue 3 and Vite. It allows users to upload a PDF or DOCX file, processes it via a backend API, and displays/downloads three analysis files.

## Features
- Upload PDF or DOCX and receive analysis files (Standard, Gap, Summary)
- View and download each file
- Responsive, modern UI
- Error handling and logging

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the development server:**
   ```sh
   npm run dev
   ```
3. **Build for production:**
   ```sh
   npm run build
   ```

## API
- Expects a backend endpoint `/api/v1/upload` that accepts both `pdf_file` and `docx_file` parameters.

## Project Structure
- `src/components/` — UI components
- `src/services/` — API and logging utilities
- `src/views/` — Main view(s)
- `src/assets/` — Static assets
- `logs/` — Client-side logs (optional)

---

For more details, see the code and comments in each file. 