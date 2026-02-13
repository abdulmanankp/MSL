import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const mainLogFile = path.join(logsDir, 'main.log');
const errorLogFile = path.join(logsDir, 'errors.log');

/**
 * Format log message with timestamp
 */
function formatLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  if (data) {
    logMessage += ` | ${JSON.stringify(data)}`;
  }
  return logMessage;
}

/**
 * Write to main log file
 */
export function logInfo(message, data = null) {
  const logMessage = formatLog('INFO', message, data);
  console.log(logMessage);
  fs.appendFileSync(mainLogFile, logMessage + '\n');
}

/**
 * Write to error log file (also goes to main)
 */
export function logError(message, error = null) {
  const errorData = error && (error instanceof Error) ? {
    message: error.message,
    stack: error.stack,
  } : error;
  
  const logMessage = formatLog('ERROR', message, errorData);
  console.error(logMessage);
  
  // Write to both files
  fs.appendFileSync(mainLogFile, logMessage + '\n');
  fs.appendFileSync(errorLogFile, logMessage + '\n');
}

/**
 * Write warning to log file
 */
export function logWarn(message, data = null) {
  const logMessage = formatLog('WARN', message, data);
  console.warn(logMessage);
  fs.appendFileSync(mainLogFile, logMessage + '\n');
}

/**
 * Get recent logs from file
 */
export function getRecentLogs(lines = 100) {
  try {
    const content = fs.readFileSync(mainLogFile, 'utf8');
    return content.split('\n').slice(-lines).join('\n');
  } catch (e) {
    return 'No logs available yet';
  }
}

export default {
  logInfo,
  logError,
  logWarn,
  getRecentLogs
};
