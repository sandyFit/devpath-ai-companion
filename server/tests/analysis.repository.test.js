const result = await analysisRepository.createAnalysis({
    fileId: 'abc123',
    qualityScore: 8,
    complexityScore: 6,
    securityScore: 7,
    issuesFound: [],
    suggestions: [],
    strengths: [],
    learningRecommendations: [],
    projectId: 'your-project-id-here'
  });
  
  console.log('Result:', result);
  