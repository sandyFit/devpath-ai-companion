const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const extractZipContents = (zipPath) => {
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  const extractedDir = path.join(__dirname, '..', 'extracted');

  if (!fs.existsSync(extractedDir)) {
    fs.mkdirSync(extractedDir);
  }

  const allowedExtensions = ['.js', '.jsx', '.py', '.ts', '.tsx'];
  let extractedFilesCount = 0;
  const extractedFiles = [];

  zipEntries.forEach((entry) => {
    if (!entry.isDirectory) {
      const ext = path.extname(entry.entryName).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        const outputPath = path.join(extractedDir, path.basename(entry.entryName));
        const content = entry.getData().toString('utf8');
        
        fs.writeFileSync(outputPath, content);
        extractedFilesCount++;
        
        // Store file metadata for analysis
        extractedFiles.push({
          filename: path.basename(entry.entryName),
          originalPath: entry.entryName,
          extractedPath: outputPath,
          extension: ext,
          size: content.length,
          language: detectLanguage(path.basename(entry.entryName))
        });
      }
    }
  });

  console.log(`[ZipService] Extracted ${extractedFilesCount} files to ${extractedDir}`);
  
  return { 
    extractedFilesCount,
    extractedFiles,
    extractedDir
  };
};

const detectLanguage = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python'
  };
  
  return languageMap[ext] || 'unknown';
};

const getExtractedFileContent = (filename) => {
  try {
    const extractedDir = path.join(__dirname, '..', 'extracted');
    const filePath = path.join(extractedDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      filename,
      content,
      language: detectLanguage(filename),
      size: content.length
    };
    
  } catch (error) {
    console.error(`[ZipService] Error reading file ${filename}:`, error);
    throw error;
  }
};

const listExtractedFiles = () => {
  try {
    const extractedDir = path.join(__dirname, '..', 'extracted');
    
    if (!fs.existsSync(extractedDir)) {
      return [];
    }
    
    const files = fs.readdirSync(extractedDir);
    const allowedExtensions = ['.js', '.jsx', '.py', '.ts', '.tsx'];
    
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return allowedExtensions.includes(ext);
      })
      .map(file => ({
        filename: file,
        path: path.join(extractedDir, file),
        extension: path.extname(file).toLowerCase(),
        language: detectLanguage(file),
        size: fs.statSync(path.join(extractedDir, file)).size
      }));
      
  } catch (error) {
    console.error('[ZipService] Error listing extracted files:', error);
    throw error;
  }
};

module.exports = { 
  extractZipContents,
  getExtractedFileContent,
  listExtractedFiles,
  detectLanguage
};
