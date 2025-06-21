// Using built-in fetch API available in Node.js v24+

// Test both local endpoint and various possible zrok URLs
const urlsToTest = [
  'http://localhost:3000',
  'https://gdvaz2raidu9.share.zrok.io',   // Previous zrok URL
  'https://share.zrok.io',               // Base domain
];

const pathsToTest = [
  '/',
  '/index.html',
  '/assets/index-2pqAMGNW.js',
  '/assets/index-CYU-caQd.css',
  '/api/status',
  '/client/debug.html'
];


async function testEndpoints() {
  console.log('Testing endpoint accessibility:');
  console.log('==============================');
  
  for (const baseUrl of urlsToTest) {
    console.log(`\n\nTesting base URL: ${baseUrl}\n`);
    console.log('------------------------------');
    
    for (const path of pathsToTest) {
      const url = `${baseUrl}${path}`;
      try {
        console.log(`Testing: ${url}`);
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        // Get content type and size
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length') || 'unknown size';
        console.log(`Content-Type: ${contentType}`);
        console.log(`Content-Length: ${contentLength}`);
        
        // For short responses or non-binary content, show a preview
        if (contentType && contentType.includes('text/') || contentType?.includes('application/json')) {
          const text = await response.text();
          console.log(`Preview (first 150 chars): ${text.substring(0, 150)}`);
        } else {
          console.log('Binary content, no preview');
        }
      } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
      }
      console.log('------------------------------');
    }
  }
}

testEndpoints();
