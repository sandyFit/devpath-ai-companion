const projectRepository = require('../src/repositories/projectRepository');

async function testProjectRepository() {
  console.log('🗂️ Starting Project Repository Testing...\n');

  let testProjectId = null;
  const testUserId = 'test-user-repo-123';

  // Test 1: Create Project
  console.log('1️⃣ Test: createProject()');
  try {
    const result = await projectRepository.createProject({
      userId: testUserId,
      projectName: 'Test Repository Project'
    });
    
    console.log('✅ Status:', result.success);
    console.log('✅ Project ID:', result.data.projectId);
    console.log('✅ User ID:', result.data.userId);
    console.log('✅ Project Name:', result.data.projectName);
    console.log('✅ Status:', result.data.status);
    
    testProjectId = result.data.projectId;
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 2: Create Project with Validation Error
  console.log('2️⃣ Test: createProject() - Validation Error');
  try {
    await projectRepository.createProject({
      // Missing required fields
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Validation working:', error.message);
  }
  console.log('');

  // Test 3: Create Project with Invalid Status
  console.log('3️⃣ Test: createProject() - Invalid Status');
  try {
    await projectRepository.createProject({
      userId: testUserId,
      projectName: 'Invalid Status Project',
      status: 'INVALID_STATUS'
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Status validation working:', error.message);
  }
  console.log('');

  // Test 4: Get Project by ID
  console.log('4️⃣ Test: getProjectById()');
  if (testProjectId) {
    try {
      const result = await projectRepository.getProjectById(testProjectId);
      
      if (result) {
        console.log('✅ Status:', result.success);
        console.log('✅ Project found:', result.data.projectId);
        console.log('✅ Project name:', result.data.projectName);
        console.log('✅ User ID:', result.data.userId);
        console.log('✅ Status:', result.data.status);
      } else {
        console.log('❌ Project not found');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  } else {
    console.log('⏭️ Skipped - No test project ID available');
  }
  console.log('');

  // Test 5: Get Project by ID - Not Found
  console.log('5️⃣ Test: getProjectById() - Not Found');
  try {
    const result = await projectRepository.getProjectById('non-existent-id');
    
    if (result === null) {
      console.log('✅ Correctly returned null for non-existent project');
    } else {
      console.log('❌ Should have returned null');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 6: Get Projects by User ID
  console.log('6️⃣ Test: getProjectsByUserId()');
  try {
    const result = await projectRepository.getProjectsByUserId(testUserId);
    
    console.log('✅ Status:', result.success);
    console.log('✅ Projects found:', result.data.length);
    console.log('✅ Total count:', result.metadata.totalCount);
    console.log('✅ Has more:', result.metadata.hasMore);
    console.log('✅ Current page:', result.metadata.currentPage);
    
    if (result.data.length > 0) {
      console.log('✅ First project:', result.data[0].projectName);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 7: Get Projects by User ID with Options
  console.log('7️⃣ Test: getProjectsByUserId() - With Options');
  try {
    const result = await projectRepository.getProjectsByUserId(testUserId, {
      status: 'PENDING',
      limit: 10,
      offset: 0,
      orderBy: 'PROJECT_NAME',
      orderDirection: 'ASC'
    });
    
    console.log('✅ Status:', result.success);
    console.log('✅ Filtered projects:', result.data.length);
    console.log('✅ Metadata:', result.metadata);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 8: Update Project Status
  console.log('8️⃣ Test: updateProjectStatus()');
  if (testProjectId) {
    try {
      const result = await projectRepository.updateProjectStatus(testProjectId, 'PROCESSING');
      
      console.log('✅ Status:', result.success);
      console.log('✅ Project ID:', result.data.projectId);
      console.log('✅ New status:', result.data.status);
      console.log('✅ Updated at:', result.data.updatedAt);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  } else {
    console.log('⏭️ Skipped - No test project ID available');
  }
  console.log('');

  // Test 9: Update Project Status - Invalid Status
  console.log('9️⃣ Test: updateProjectStatus() - Invalid Status');
  if (testProjectId) {
    try {
      await projectRepository.updateProjectStatus(testProjectId, 'INVALID_STATUS');
      console.log('❌ Should have failed validation');
    } catch (error) {
      console.log('✅ Status validation working:', error.message);
    }
  } else {
    console.log('⏭️ Skipped - No test project ID available');
  }
  console.log('');

  // Test 10: Update Project File Count
  console.log('🔟 Test: updateProjectFileCount()');
  if (testProjectId) {
    try {
      const result = await projectRepository.updateProjectFileCount(testProjectId, 5);
      
      console.log('✅ Status:', result.success);
      console.log('✅ Project ID:', result.data.projectId);
      console.log('✅ Total files:', result.data.totalFiles);
      console.log('✅ Updated at:', result.data.updatedAt);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  } else {
    console.log('⏭️ Skipped - No test project ID available');
  }
  console.log('');

  // Test 11: Check Project Exists
  console.log('1️⃣1️⃣ Test: projectExists()');
  if (testProjectId) {
    try {
      const exists = await projectRepository.projectExists(testProjectId);
      console.log('✅ Project exists:', exists);
      
      const notExists = await projectRepository.projectExists('non-existent-id');
      console.log('✅ Non-existent project exists:', notExists);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  } else {
    console.log('⏭️ Skipped - No test project ID available');
  }
  console.log('');

  // Test 12: Get Projects by Status
  console.log('1️⃣2️⃣ Test: getProjectsByStatus()');
  try {
    const result = await projectRepository.getProjectsByStatus('PROCESSING');
    
    console.log('✅ Status:', result.success);
    console.log('✅ Projects with PROCESSING status:', result.data.length);
    console.log('✅ Metadata:', result.metadata);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 13: Get Project Summary
  console.log('1️⃣3️⃣ Test: getProjectSummary()');
  if (testProjectId) {
    try {
      const result = await projectRepository.getProjectSummary(testProjectId);
      
      if (result) {
        console.log('✅ Status:', result.success);
        console.log('✅ Project name:', result.data.projectName);
        console.log('✅ Total files:', result.data.totalFiles);
        console.log('✅ Actual file count:', result.data.actualFileCount);
        console.log('✅ Analyzed file count:', result.data.analyzedFileCount);
        console.log('✅ Learning paths count:', result.data.learningPathsCount);
      } else {
        console.log('❌ Project summary not found');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  } else {
    console.log('⏭️ Skipped - No test project ID available');
  }
  console.log('');

  // Test 14: Soft Delete Project
  console.log('1️⃣4️⃣ Test: deleteProject() - Soft Delete');
  if (testProjectId) {
    try {
      const result = await projectRepository.deleteProject(testProjectId, false);
      
      console.log('✅ Status:', result.success);
      console.log('✅ Project ID:', result.data.projectId);
      console.log('✅ Archived:', result.data.archived);
      console.log('✅ Type:', result.data.type);
      console.log('✅ Archived at:', result.data.archivedAt);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  } else {
    console.log('⏭️ Skipped - No test project ID available');
  }
  console.log('');

  // Test 15: Validation Tests
  console.log('1️⃣5️⃣ Test: Validation Tests');
  
  // Test missing project ID
  try {
    await projectRepository.getProjectById('');
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Empty project ID validation:', error.message);
  }

  // Test missing user ID
  try {
    await projectRepository.getProjectsByUserId('');
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Empty user ID validation:', error.message);
  }

  // Test invalid order field
  try {
    await projectRepository.getProjectsByUserId(testUserId, {
      orderBy: 'INVALID_FIELD'
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Invalid orderBy validation:', error.message);
  }

  // Test negative file count
  try {
    await projectRepository.updateProjectFileCount(testProjectId, -1);
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Negative file count validation:', error.message);
  }

  console.log('');

  console.log('🎉 Project Repository Testing Complete!\n');
}

// Run tests
testProjectRepository().catch(console.error);
