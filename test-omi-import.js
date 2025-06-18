// Test script for the Omi conversation importer
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Set up test parameters
const SERVER_URL = 'http://localhost:3001';
const ENDPOINT = '/api/omi/import/conversations';
const TEST_FILE = path.join(__dirname, 'test-conversations.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function testOmiImport() {
  console.log(`${colors.magenta}Testing Omi conversation importer endpoint${colors.reset}`);
  console.log(`${colors.blue}File:${colors.reset} ${TEST_FILE}`);
  
  // Verify file exists
  if (!fs.existsSync(TEST_FILE)) {
    console.error(`${colors.red}Error: Test file not found${colors.reset}`);
    process.exit(1);
  }
  
  try {
    // Create a form data object with the file
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_FILE), {
      filename: 'test-conversations.json',
      contentType: 'application/json'
    });
    
    console.log(`${colors.blue}Uploading file to ${SERVER_URL}${ENDPOINT}...${colors.reset}`);
    
    // Make the HTTP POST request
    const response = await axios.post(`${SERVER_URL}${ENDPOINT}`, form, {
      headers: {
        ...form.getHeaders()
      }
    });
    
    // Check response
    if (response.status === 200 && response.data.success) {
      console.log(`${colors.green}✓ Import successful!${colors.reset}`);
      console.log(`${colors.cyan}Response:${colors.reset}`, response.data);
      
      // Print stats
      if (response.data.processed && response.data.total) {
        console.log(`${colors.cyan}Processed:${colors.reset} ${response.data.processed} of ${response.data.total} conversations`);
      }
    } else {
      console.log(`${colors.red}✗ Import failed${colors.reset}`);
      console.log(`${colors.cyan}Status:${colors.reset} ${response.status}`);
      console.log(`${colors.cyan}Response:${colors.reset}`, response.data);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Import failed with error${colors.reset}`);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`${colors.cyan}Status:${colors.reset} ${error.response.status}`);
      console.log(`${colors.cyan}Error message:${colors.reset}`, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(`${colors.red}No response received from server. Is the server running?${colors.reset}`);
    } else {
      // Something happened in setting up the request
      console.log(`${colors.red}Error:${colors.reset} ${error.message}`);
    }
  }
}

testOmiImport().catch(console.error);
