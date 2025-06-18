// JavaScript test script that doesn't rely on TypeScript compiler
// We'll use raw HTTP requests to test the webhook endpoints

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 3001; // The port our server runs on

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

// Helper for HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// Wait for the server to be ready
async function waitForServer(maxAttempts = 10, delayMs = 1000) {
  console.log(`${colors.blue}Waiting for server to be ready...${colors.reset}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await makeRequest('GET', '/api/omi/webhook/status');
      if (res.statusCode === 200) {
        console.log(`${colors.green}Server is ready!${colors.reset}`);
        return true;
      }
      console.log(`${colors.yellow}Attempt ${attempt}/${maxAttempts}: Server not ready (status ${res.statusCode})${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}Attempt ${attempt}/${maxAttempts}: Server not responding${colors.reset}`);
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('Server failed to start in time');
}

// Run a test against a webhook endpoint
async function testWebhook(name, path, payload) {
  console.log(`\n${colors.blue}Testing ${name} webhook...${colors.reset}`);
  try {
    const response = await makeRequest('POST', path, payload);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log(`${colors.green}✓ ${name} webhook test passed${colors.reset}`);
      console.log(`${colors.cyan}Response:${colors.reset}`, response.data);
      return true;
    } else {
      console.log(`${colors.red}✗ ${name} webhook test failed${colors.reset}`);
      console.log(`${colors.cyan}Status:${colors.reset} ${response.statusCode}`);
      console.log(`${colors.cyan}Response:${colors.reset}`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ ${name} webhook test failed with error${colors.reset}`);
    console.error(error);
    return false;
  }
}

// Check webhook status
async function checkWebhookStatus() {
  console.log(`\n${colors.blue}Checking webhook status...${colors.reset}`);
  try {
    const response = await makeRequest('GET', '/api/omi/webhook/status');
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Webhook status check passed${colors.reset}`);
      console.log(`${colors.cyan}Response:${colors.reset}`, response.data);
      return response.data;
    } else {
      console.log(`${colors.red}✗ Webhook status check failed${colors.reset}`);
      console.log(`${colors.cyan}Status:${colors.reset} ${response.statusCode}`);
      console.log(`${colors.cyan}Response:${colors.reset}`, response.data);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Webhook status check failed with error${colors.reset}`);
    console.error(error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.magenta}Starting Cognos webhook endpoint tests${colors.reset}`);
  
  try {
    // Wait for the server to be ready
    await waitForServer();
    
    // Get initial webhook status
    const initialStatus = await checkWebhookStatus();
    
    // Test real-time transcript webhook
    await testWebhook(
      'Real-time transcript',
      '/api/omi/webhook/realtime-transcript',
      {
        transcript: "This is a test transcript from the automated test",
        confidence: 0.95,
        device_id: "test-device-002",
        segment_id: "segment-456"
      }
    );
    
    // Test conversation events webhook
    await testWebhook(
      'Conversation events',
      '/api/omi/webhook/conversation-events',
      {
        event_type: "conversation_start",
        conversation_id: "conv-789",
        device_id: "test-device-002",
        user_id: "user-456",
        metadata: {
          location: "office",
          time_of_day: "morning",
          test_origin: "automated test"
        }
      }
    );
    
    // Test day summary webhook
    await testWebhook(
      'Day summary',
      '/api/omi/webhook/day-summary',
      {
        day: "2025-06-18",
        summary: {
          total_conversations: 3,
          total_duration_minutes: 28,
          key_topics: ["automated testing", "integration", "cognos platform"],
          sentiment: "neutral",
          energy_level: "medium"
        },
        user_id: "user-456"
      }
    );
    
    // Test audio bytes webhook
    await testWebhook(
      'Audio bytes',
      '/api/omi/webhook/audio-bytes',
      {
        audio: "VGhpcyBpcyBhIHRlc3QgYXVkaW8gYnl0ZXMgc3RyaW5nIGZvciB0aGUgYXV0b21hdGVkIHRlc3Q=",
        format: "wav",
        metadata: {
          device_id: "test-device-002",
          recording_id: "rec-456",
          duration_ms: 2000,
          test_origin: "automated test"
        }
      }
    );
    
    // Get updated webhook status to verify counts
    const updatedStatus = await checkWebhookStatus();
    
    // Verify that counts have increased
    if (initialStatus && updatedStatus) {
      console.log(`\n${colors.blue}Verifying webhook counters...${colors.reset}`);
      const rtcDiff = (updatedStatus.stats.realtime_transcript_count || 0) - (initialStatus.stats.realtime_transcript_count || 0);
      const convDiff = (updatedStatus.stats.conversation_events_count || 0) - (initialStatus.stats.conversation_events_count || 0);
      const daysDiff = (updatedStatus.stats.days_summary_count || 0) - (initialStatus.stats.days_summary_count || 0);
      const audioDiff = (updatedStatus.stats.audio_storage_chunks || 0) - (initialStatus.stats.audio_storage_chunks || 0);
      
      console.log(`${colors.cyan}Real-time transcript count:${colors.reset} ${rtcDiff > 0 ? colors.green : colors.red}${rtcDiff > 0 ? '+' : ''}${rtcDiff}${colors.reset}`);
      console.log(`${colors.cyan}Conversation events count:${colors.reset} ${convDiff > 0 ? colors.green : colors.red}${convDiff > 0 ? '+' : ''}${convDiff}${colors.reset}`);
      console.log(`${colors.cyan}Days summary count:${colors.reset} ${daysDiff > 0 ? colors.green : colors.red}${daysDiff > 0 ? '+' : ''}${daysDiff}${colors.reset}`);
      console.log(`${colors.cyan}Audio storage chunks:${colors.reset} ${audioDiff > 0 ? colors.green : colors.red}${audioDiff > 0 ? '+' : ''}${audioDiff}${colors.reset}`);
      
      if (rtcDiff > 0 && convDiff > 0 && daysDiff > 0 && audioDiff > 0) {
        console.log(`\n${colors.green}✓ All webhook counters verified${colors.reset}`);
      } else {
        console.log(`\n${colors.red}✗ Some webhook counters did not increase as expected${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}All webhook tests completed!${colors.reset}`);
  } catch (error) {
    console.log(`\n${colors.red}Error during tests:${colors.reset}`, error);
  }
}

// Run the tests
runTests().catch(console.error);
