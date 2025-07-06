require('dotenv').config();
const storeGroqBatchAnalysis = require('../utils/storeGroqBatchAnalysis');
const batchData = require('./mock/batch.json'); // Or wherever your batch JSON is

(async () => {
  try {
    const result = await storeGroqBatchAnalysis(batchData.data);
    console.log('✅ Batch analysis storage complete:', result);
  } catch (error) {
    console.error('❌ Failed to store batch analysis:', error);
  }
})();
