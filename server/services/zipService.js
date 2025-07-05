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

  const allowedExtensions = ['.js', '.jsx', '.py'];
  let extractedFilesCount = 0;

  zipEntries.forEach((entry) => {
    if (!entry.isDirectory) {
      const ext = path.extname(entry.entryName).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        const outputPath = path.join(extractedDir, path.basename(entry.entryName));
        fs.writeFileSync(outputPath, entry.getData());
        extractedFilesCount++;
      }
    }
  });

  return { extractedFilesCount };
};

module.exports = { extractZipContents };
