const analysisRepository = require('./repositories/analysisRepository');
const { v4: uuidv4 } = require('uuid');

async function testDatabaseInsert() {
  try {
    console.log('🧪 Testing database insert...');
    
    const testProjectId = '6214dc54-8db2-4664-8128-37e1a6472faa';
    const testFileId = uuidv4();
    
    const testAnalysisData = {
      fileId: testFileId,
      projectId: testProjectId,
      analysisType: 'code_quality',
      filename: 'test-file.js',
      language: 'javascript',
      issuesFound: [
        { type: 'code_quality', severity: 'medium', description: 'Test issue' }
      ],
      suggestions: ['Test suggestion'],
      qualityScore: 8,
      complexityScore: 6,
      securityScore: 9,
      strengths: ['Test strength'],
      learningRecommendations: ['Test learning recommendation']
    };
    
    console.log('📝 Inserting test analysis data:', testAnalysisData);
    const result = await analysisRepository.createAnalysis(testAnalysisData);
    console.log('✅ Insert result:', result);
    
    console.log('🔍 Fetching analyses for project:', testProjectId);
    const analyses = await analysisRepository.getAnalysesByProjectId(testProjectId);
    console.log('📊 Retrieved analyses:', analyses);
    
    console.log('🔍 Getting debug analyses...');
    const debugAnalyses = await analysisRepository.debugGetAnalyses();
    console.log('🐛 Debug analyses:', debugAnalyses);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseInsert();
