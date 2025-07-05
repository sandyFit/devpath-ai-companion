const fs = require('fs');
const path = require('path');

const corruptedZipPath = path.join(__dirname, 'corrupted.zip');

// Create a corrupted ZIP file by writing random data
const corruptedData = Buffer.from('This is not a valid zip file content', 'utf-8');

fs.writeFileSync(corruptedZipPath, corruptedData);

console.log('Corrupted ZIP file created at:', corruptedZipPath);
