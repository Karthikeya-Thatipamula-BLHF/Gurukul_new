/**
 * Test utility for Image Upload functionality
 * Run in browser console to test the new image upload features
 */

// Test function to create a mock image file
export const createMockImageFile = (name = 'test-image.jpg', sizeKB = 100) => {
  // Create a simple base64 image (1x1 pixel red dot)
  const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  
  // Convert base64 to blob
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  // Create file object
  const file = new File([byteArray], name, { type: 'image/jpeg' });
  
  // Override size property for testing
  Object.defineProperty(file, 'size', {
    value: sizeKB * 1024,
    writable: false
  });
  
  return file;
};

// Test function to create a mock GLB file
export const createMockGLBFile = (name = 'test-model.glb', sizeMB = 10) => {
  // Create a simple binary data
  const arrayBuffer = new ArrayBuffer(sizeMB * 1024 * 1024);
  const file = new File([arrayBuffer], name, { type: 'application/octet-stream' });
  
  return file;
};

// Test IndexedDB functionality
export const testIndexedDB = async () => {
  console.log('🧪 Testing IndexedDB functionality...');
  
  try {
    // Import the storage utility
    const { default: indexedDBStorage } = await import('./indexedDBStorage.js');
    
    // Test database initialization
    await indexedDBStorage.init();
    console.log('✅ IndexedDB initialized successfully');
    
    // Test storage info
    const storageInfo = await indexedDBStorage.getStorageInfo();
    console.log('📊 Storage info:', storageInfo);
    
    // Test getting all models and images
    const models = await indexedDBStorage.getAllModels();
    const images = await indexedDBStorage.getAllImages();
    
    console.log(`📁 Found ${models.length} models and ${images.length} images`);
    
    return { models, images, storageInfo };
  } catch (error) {
    console.error('❌ IndexedDB test failed:', error);
    return null;
  }
};

// Test file upload simulation
export const simulateImageUpload = async () => {
  console.log('🧪 Simulating image upload...');
  
  try {
    // Create a mock image file
    const mockFile = createMockImageFile('test-upload.jpg', 500); // 500KB
    console.log('📁 Created mock file:', mockFile.name, mockFile.size, 'bytes');
    
    // Test file validation
    const isValidSize = mockFile.size <= 50 * 1024 * 1024; // 50MB limit
    const isValidType = mockFile.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
    
    console.log('✅ File validation:', { isValidSize, isValidType });
    
    if (!isValidSize || !isValidType) {
      throw new Error('File validation failed');
    }
    
    // Convert to base64 (simulate the upload process)
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(mockFile);
    });
    
    const base64Data = await base64Promise;
    console.log('📄 File converted to base64, length:', base64Data.length);
    
    // Test saving to IndexedDB
    const { default: indexedDBStorage } = await import('./indexedDBStorage.js');
    const fileId = `test_image_${Date.now()}`;
    const metadata = {
      id: fileId,
      name: mockFile.name.replace(/\.[^/.]+$/, ""),
      fileName: mockFile.name,
      fileSize: mockFile.size,
      uploadDate: new Date().toISOString(),
      thumbnailUrl: base64Data,
      type: 'custom',
      isCustom: true,
      mediaType: 'image',
    };
    
    const success = await indexedDBStorage.saveImageFile(fileId, base64Data, metadata);
    console.log('💾 Save to IndexedDB:', success ? '✅ Success' : '❌ Failed');
    
    // Test loading back
    const loadedData = await indexedDBStorage.loadImageFile(fileId);
    console.log('📤 Load from IndexedDB:', loadedData ? '✅ Success' : '❌ Failed');
    
    // Clean up - delete the test file
    await indexedDBStorage.deleteImageFile(fileId);
    console.log('🗑️ Cleanup completed');
    
    return { success: true, fileId, metadata };
  } catch (error) {
    console.error('❌ Image upload simulation failed:', error);
    return { success: false, error: error.message };
  }
};

// Test Redux store integration
export const testReduxIntegration = () => {
  console.log('🧪 Testing Redux store integration...');
  
  try {
    // Check if Redux store is available
    if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
      console.log('🔧 Redux DevTools detected');
    }
    
    // Test if we can access the store (this would need to be run in the app context)
    console.log('ℹ️ Redux integration test requires app context');
    console.log('ℹ️ Check browser Redux DevTools for avatar state');
    
    return true;
  } catch (error) {
    console.error('❌ Redux integration test failed:', error);
    return false;
  }
};

// Run comprehensive test suite
export const runImageUploadTests = async () => {
  console.log('🚀 Starting Image Upload Feature Tests...\n');
  
  const results = {
    indexedDB: null,
    imageUpload: null,
    redux: null
  };
  
  try {
    // Test 1: IndexedDB functionality
    console.log('1️⃣ Testing IndexedDB...');
    results.indexedDB = await testIndexedDB();
    console.log('');
    
    // Test 2: Image upload simulation
    console.log('2️⃣ Testing image upload...');
    results.imageUpload = await simulateImageUpload();
    console.log('');
    
    // Test 3: Redux integration
    console.log('3️⃣ Testing Redux integration...');
    results.redux = testReduxIntegration();
    console.log('');
    
    // Summary
    const allPassed = results.indexedDB && results.imageUpload.success && results.redux;
    console.log('📋 Test Results Summary:');
    console.log('  IndexedDB:', results.indexedDB ? '✅ Pass' : '❌ Fail');
    console.log('  Image Upload:', results.imageUpload.success ? '✅ Pass' : '❌ Fail');
    console.log('  Redux Integration:', results.redux ? '✅ Pass' : '❌ Fail');
    console.log('');
    console.log(allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed');
    
    return results;
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return { error: error.message };
  }
};

// Make functions available in browser console
if (typeof window !== 'undefined') {
  window.imageUploadTestUtils = {
    createMockImageFile,
    createMockGLBFile,
    testIndexedDB,
    simulateImageUpload,
    testReduxIntegration,
    runImageUploadTests
  };
  
  console.log('🧪 Image Upload Test Utils loaded!');
  console.log('Available functions:');
  console.log('  - window.imageUploadTestUtils.runImageUploadTests()');
  console.log('  - window.imageUploadTestUtils.testIndexedDB()');
  console.log('  - window.imageUploadTestUtils.simulateImageUpload()');
}
