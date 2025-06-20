const https = require('https');
const http = require('http');
const fs = require('fs');

// Start a new zrok share in a separate process
const { spawn } = require('child_process');
console.log('Starting zrok share...');
const zrokProcess = spawn('zrok', ['share', 'public', '--backend-mode', 'proxy', 'http://localhost:11434'], {
  stdio: 'pipe'
});

// Wait for zrok to output the URL
let zrokOutput = '';
zrokProcess.stdout.on('data', (data) => {
  const output = data.toString();
  zrokOutput += output;
  console.log('zrok output:', output);
  
  // Extract the zrok URL
  const match = output.match(/https:\/\/[a-zA-Z0-9]+\.share\.zrok\.io/);
  if (match) {
    const zrokUrl = match[0];
    console.log(`Found zrok URL: ${zrokUrl}`);
    
    // Test the connection using Node.js https module
    console.log(`Testing connection to ${zrokUrl}/api/tags...`);
    const req = https.request(`${zrokUrl}/api/tags`, {
      method: 'GET',
      rejectUnauthorized: true,
    }, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Response data:', responseData);
        console.log('Connection test completed successfully');
        
        // Write the working URL to .env file
        updateEnvFile(zrokUrl);
        
        // Clean up
        setTimeout(() => {
          console.log('Shutting down zrok process...');
          zrokProcess.kill();
          process.exit(0);
        }, 2000);
      });
    });
    
    req.on('error', (error) => {
      console.error('Connection error:', error);
      console.log('Will try alternative approach...');
      
      // Try a direct connection to local Ollama server to verify it's working
      testLocalOllama();
      
      // Clean up
      setTimeout(() => {
        zrokProcess.kill();
        process.exit(1);
      }, 2000);
    });
    
    req.end();
  }
});

zrokProcess.stderr.on('data', (data) => {
  console.error(`zrok stderr: ${data}`);
});

// Function to test local Ollama
function testLocalOllama() {
  console.log('Testing connection to local Ollama server at http://localhost:11434/api/tags...');
  const req = http.request('http://localhost:11434/api/tags', {
    method: 'GET'
  }, (res) => {
    console.log(`LOCAL OLLAMA STATUS: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Local Ollama response:', responseData.substring(0, 200) + '...');
      console.log('Local Ollama server is working properly');
      
      // Since zrok doesn't work, update .env to use localhost
      updateEnvFile('http://localhost:11434');
    });
  });
  
  req.on('error', (error) => {
    console.error('Local Ollama connection error:', error);
  });
  
  req.end();
}

// Function to update .env file
function updateEnvFile(url) {
  try {
    const envPath = '/Users/andresgomezsarmiento/Documents/GitHub/OllamaCognos/.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace OLLAMA_URL line
    envContent = envContent.replace(
      /OLLAMA_URL=.*$/m, 
      `OLLAMA_URL=${url}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env file with OLLAMA_URL=${url}`);
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down zrok process...');
  zrokProcess.kill();
  process.exit(0);
});

console.log('Waiting for zrok to start and output URL...');
