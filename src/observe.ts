import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ObservationData {
  timestamp: string;
  platform: string;
  nodeVersion: string;
  openclawStatus: string;
  gatewayStatus: string;
  configExists: boolean;
  configContent?: string;
  recentLogs: string;
  portCheck: string;
  processCheck: string;
  doctorOutput?: string;
}

function safeExec(command: string, silent: boolean = false): string {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8', 
      timeout: 10000,
      stdio: silent ? 'pipe' : undefined
    });
    return result || '(no output)';
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

export async function observe(onProgress?: (msg: string) => void): Promise<ObservationData> {
  const log = (msg: string) => {
    if (onProgress) onProgress(msg);
  };
  
  log('Checking platform info...');
  const platform = os.platform();
  const nodeVersion = process.version;
  
  log('Running openclaw status...');
  const openclawStatus = safeExec('openclaw status');
  
  log('Checking gateway status...');
  const gatewayStatus = safeExec('openclaw gateway status');
  
  log('Checking openclaw doctor...');
  const doctorOutput = safeExec('openclaw doctor');
  
  log('Reading config file...');
  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  const configExists = fs.existsSync(configPath);
  let configContent = undefined;
  
  if (configExists) {
    try {
      configContent = fs.readFileSync(configPath, 'utf-8');
      // Redact sensitive info
      configContent = configContent.replace(/(apiKey|token|password)"\s*:\s*"[^"]+"/gi, '$1": "***REDACTED***"');
    } catch (e) {
      configContent = 'Error reading config';
    }
  }
  
  log('Checking recent logs...');
  const logDir = path.join('/tmp', 'openclaw');
  let recentLogs = 'No logs found';
  
  if (fs.existsSync(logDir)) {
    const logFiles = fs.readdirSync(logDir)
      .filter(f => f.startsWith('openclaw-'))
      .sort()
      .reverse();
    
    if (logFiles.length > 0) {
      const latestLog = path.join(logDir, logFiles[0]);
      try {
        const logs = fs.readFileSync(latestLog, 'utf-8');
        recentLogs = logs.split('\n').slice(-50).join('\n');
      } catch (e) {
        recentLogs = 'Error reading logs';
      }
    }
  }
  
  log('Checking port 18789...');
  const portCheck = platform === 'win32' 
    ? safeExec('netstat -ano | findstr ":18789"', true)
    : safeExec('lsof -i :18789 2>/dev/null', true);
  
  log('Checking openclaw processes...');
  const processCheck = platform === 'win32'
    ? safeExec('tasklist | findstr node', true)
    : safeExec('ps aux | grep openclaw', true);
  
  return {
    timestamp: new Date().toISOString(),
    platform,
    nodeVersion,
    openclawStatus,
    gatewayStatus,
    configExists,
    configContent,
    recentLogs,
    portCheck,
    processCheck,
    doctorOutput
  };
}
