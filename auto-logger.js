/**
 * Automated Console Logger for React Native
 * Captures all console.log, console.error, console.warn to memory buffer
 * Sends logs to backend API for GitHub Copilot to read
 * 
 * NO POLYFILLS - Hermes has everything we need!
 */

console.log('🤖 Auto-logger initializing (no polyfills needed)...');

const MAX_LOGS = 500; // Keep last 500 log entries in memory
const logs = [];

function writeLog(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  const logEntry = {
    timestamp,
    level,
    message
  };
  
  // Add to memory buffer
  logs.push(logEntry);
  
  // Keep only last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  
  // Send to backend API (non-blocking, silent fail)
  sendLogToBackend(logEntry).catch(() => {});
}

async function sendLogToBackend(logEntry) {
  try {
    // Only send errors and warnings to backend to reduce traffic
    if (logEntry.level !== 'ERROR' && logEntry.level !== 'WARN') {
      return;
    }
    
    const backend = global.BACKEND_URL || 'http://10.0.0.27:5000';
    await fetch(`${backend}/mobile-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    });
  } catch (error) {
    // Silent fail - don't break the app
  }
}

// Override console methods
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

console.log = function(...args) {
  writeLog('LOG', args);
  originalLog.apply(console, args);
};

console.error = function(...args) {
  writeLog('ERROR', args);
  originalError.apply(console, args);
};

console.warn = function(...args) {
  writeLog('WARN', args);
  originalWarn.apply(console, args);
};

console.info = function(...args) {
  writeLog('INFO', args);
  originalInfo.apply(console, args);
};

// Log startup
console.log('🤖 Auto-logger initialized - Capturing console output');

// Expose logs globally for debugging
global.getAppLogs = () => logs;
global.clearAppLogs = () => { logs.length = 0; };

module.exports = {
  getLogs: () => logs,
  clearLogs: () => { logs.length = 0; }
};
