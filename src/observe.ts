import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ObservationData {
  timestamp: string;
  platform: string;
  nodeVersion: string;
  npmVersion: string;
  openclawVersion: string;
  openclawStatus: string;
  gatewayStatus: string;
  configExists: boolean;
  configContent?: string;
  configValid?: boolean;
  recentLogs: string;
  errorLogs: string[];
  portCheck: string;
  processCheck: string;
  doctorOutput?: string;
  diskSpace: string;
  memoryUsage: string;
  environmentVars: Record<string, string>;
  packageJsonExists: boolean;
  openclawInstalled: boolean;
  permissions: string;
  launchAgent?: string; // macOS only
  windowsService?: string; // Windows only
  networkCheck?: string;
  dnsCheck?: string;
  extensionCount?: number;
  skillCount?: number;
  cpuUsage?: string;
  systemUptime?: string;
  gitStatus?: string;
  cacheSize?: number;
  workspaceSize?: number;
  openrouterTest?: string;
  lastGatewayRestart?: string;
}

function safeExec(command: string, silent: boolean = false): string {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8', 
      timeout: 10000,
      stdio: silent ? 'pipe' : undefined,
      shell: os.platform() === 'win32' ? 'powershell.exe' : undefined
    });
    return result || '(no output)';
  } catch (error: any) {
    const stderr = error.stderr?.toString() || '';
    const stdout = error.stdout?.toString() || '';
    return stderr || stdout || `Error: ${error.message}`;
  }
}

export async function observe(onProgress?: (msg: string) => void): Promise<ObservationData> {
  const log = (msg: string) => {
    if (onProgress) onProgress(msg);
  };
  
  log('🔍 Collecting system information...');
  const platform = os.platform();
  
  log('Checking Node.js and npm versions...');
  const nodeVersion = process.version;
  const npmVersion = safeExec('npm --version', true).trim();
  
  log('Checking OpenClaw installation...');
  const openclawVersion = safeExec('openclaw --version', true);
  const openclawInstalled = !openclawVersion.includes('not recognized') && 
                           !openclawVersion.includes('command not found');
  
  log('Running openclaw status...');
  const openclawStatus = safeExec('openclaw status', true);
  
  log('Checking gateway status...');
  const gatewayStatus = safeExec('openclaw gateway status', true);
  
  log('Running openclaw doctor...');
  const doctorOutput = safeExec('openclaw doctor', true);
  
  log('Checking configuration file...');
  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  const configExists = fs.existsSync(configPath);
  let configContent = undefined;
  let configValid = false;
  
  if (configExists) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      // Try to parse as JSON5/JSON
      JSON.parse(raw.replace(/\/\/.*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      configValid = true;
      // Redact sensitive info
      configContent = raw.replace(/(apiKey|token|password)"\s*:\s*"[^"]+"/gi, '$1": "***REDACTED***"');
    } catch (e) {
      configContent = 'Invalid JSON';
      configValid = false;
    }
  }
  
  log('Checking recent logs...');
  const logDir = path.join(os.tmpdir(), 'openclaw');
  let recentLogs = 'No logs found';
  const errorLogs: string[] = [];
  
  if (fs.existsSync(logDir)) {
    try {
      const logFiles = fs.readdirSync(logDir)
        .filter(f => f.startsWith('openclaw-'))
        .sort()
        .reverse();
      
      if (logFiles.length > 0) {
        const latestLog = path.join(logDir, logFiles[0]);
        let logs = fs.readFileSync(latestLog, 'utf-8');
        const lines = logs.split('\n');
        
        // Filter to only important lines (warnings, errors, config issues)
        const importantLines = lines.filter(line => {
          return line.match(/warning|error|fail|crash|exception|CRITICAL|Config warnings|Doctor warnings|Failed to load/i) &&
                 !line.includes('Registering') &&
                 !line.includes('Registered') &&
                 !line.includes('Service started') &&
                 !line.includes('listening on');
        });
        
        recentLogs = importantLines.slice(-20).join('\n') || 'No warnings or errors found';
        
        // Extract error lines
        lines.forEach(line => {
          if (line.match(/error|fail|crash|exception/i) && !line.includes('NODE_TLS')) {
            errorLogs.push(line.trim());
          }
        });
      }
    } catch (e) {
      recentLogs = 'Error reading logs';
    }
  }
  
  log('Checking port 18789...');
  const portCheck = platform === 'win32' 
    ? safeExec('netstat -ano | findstr ":18789"', true)
    : safeExec('lsof -i :18789 2>/dev/null', true);
  
  log('Checking openclaw processes...');
  const processCheck = platform === 'win32'
    ? safeExec('tasklist | findstr node', true)
    : safeExec('ps aux | grep -i openclaw | grep -v grep', true);
  
  log('Checking network connectivity...');
  const networkCheck = safeExec(platform === 'win32' ? 'ping -n 1 8.8.8.8' : 'ping -c 1 8.8.8.8', true);
  
  log('Checking DNS resolution...');
  const dnsCheck = safeExec(platform === 'win32' ? 'nslookup google.com' : 'nslookup google.com', true);
  
  log('Checking OpenClaw extensions...');
  const extensionsDir = path.join(os.homedir(), '.openclaw', 'extensions');
  const extensionCount = fs.existsSync(extensionsDir) 
    ? fs.readdirSync(extensionsDir).filter(f => fs.statSync(path.join(extensionsDir, f)).isDirectory()).length
    : 0;
  
  log('Checking OpenClaw skills...');
  const skillsDir = path.join(os.homedir(), '.openclaw', 'skills');
  const skillCount = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory()).length
    : 0;
  
  log('Checking disk space...');
  const diskSpace = platform === 'win32'
    ? safeExec('wmic logicaldisk get caption,freespace,size', true)
    : safeExec('df -h /', true);
  
  log('Checking memory usage...');
  const memoryUsage = platform === 'win32'
    ? safeExec('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize', true)
    : safeExec('free -h', true);
  
  log('Checking environment variables...');
  const environmentVars: Record<string, string> = {};
  const relevantEnvVars = ['PATH', 'NODE_ENV', 'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'HOME', 'USERPROFILE'];
  relevantEnvVars.forEach(key => {
    if (process.env[key]) {
      environmentVars[key] = process.env[key]!;
    }
  });
  
  log('Checking package.json...');
  const packageJsonPath = path.join(os.homedir(), '.openclaw', 'package.json');
  const packageJsonExists = fs.existsSync(packageJsonPath);
  
  log('Checking file permissions...');
  const openclawDir = path.join(os.homedir(), '.openclaw');
  const permissions = fs.existsSync(openclawDir)
    ? safeExec(platform === 'win32' 
        ? `icacls "${openclawDir}"` 
        : `ls -la "${openclawDir}"`, true)
    : 'Directory not found';
  
  // Platform-specific checks
  let launchAgent = undefined;
  let windowsService = undefined;
  
  if (platform === 'darwin') {
    log('Checking macOS LaunchAgent...');
    const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'ai.openclaw.gateway.plist');
    if (fs.existsSync(plistPath)) {
      launchAgent = fs.readFileSync(plistPath, 'utf-8');
    }
  } else if (platform === 'win32') {
    log('Checking Windows service...');
    windowsService = safeExec('sc query openclaw', true);
  }
  
  log('Checking CPU usage...');
  const cpuUsage = platform === 'win32'
    ? safeExec('wmic cpu get loadpercentage', true)
    : safeExec('top -bn1 | grep "Cpu(s)"', true);
  
  log('Checking system uptime...');
  const systemUptime = platform === 'win32'
    ? safeExec('net statistics workstation | findstr "Statistics"', true)
    : safeExec('uptime -p', true);
  
  log('Checking OpenClaw git status...');
  const openclawGitDir = path.join(os.homedir(), '.openclaw');
  const gitStatus = fs.existsSync(path.join(openclawGitDir, '.git'))
    ? safeExec(`git -C "${openclawGitDir}" status --short`, true)
    : 'Not a git repository';
  
  log('Checking cache size...');
  const cacheDir = path.join(os.homedir(), '.openclaw', 'cache');
  let cacheSize = 0;
  if (fs.existsSync(cacheDir)) {
    try {
      const getCacheSize = (dir: string): number => {
        let size = 0;
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            size += stats.size;
          } else if (stats.isDirectory()) {
            size += getCacheSize(filePath);
          }
        });
        return size;
      };
      cacheSize = getCacheSize(cacheDir);
    } catch {}
  }
  
  log('Checking workspace size...');
  const workspaceDir = path.join(os.homedir(), '.openclaw', 'workspace-openclaw');
  let workspaceSize = 0;
  if (fs.existsSync(workspaceDir)) {
    try {
      const getDirSize = (dir: string): number => {
        let size = 0;
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              size += stats.size;
            }
          } catch {}
        });
        return size;
      };
      workspaceSize = getDirSize(workspaceDir);
    } catch {}
  }
  
  log('Testing OpenRouter API connection...');
  const openrouterTest = safeExec('curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://openrouter.ai', true);
  
  log('Checking last gateway restart...');
  const gatewayLogFiles = fs.existsSync(logDir) 
    ? fs.readdirSync(logDir).filter(f => f.startsWith('openclaw-')).sort().reverse()
    : [];
  let lastGatewayRestart = 'Unknown';
  if (gatewayLogFiles.length > 0) {
    const latestLog = path.join(logDir, gatewayLogFiles[0]);
    try {
      const logs = fs.readFileSync(latestLog, 'utf-8');
      const restartMatch = logs.match(/gateway.*start/i);
      if (restartMatch) {
        lastGatewayRestart = 'Recently (check logs for exact time)';
      }
    } catch {}
  }
  
  log('✅ Data collection complete');
  
  return {
    timestamp: new Date().toISOString(),
    platform,
    nodeVersion,
    npmVersion,
    openclawVersion,
    openclawStatus,
    gatewayStatus,
    configExists,
    configContent,
    configValid,
    recentLogs,
    errorLogs,
    portCheck,
    processCheck,
    doctorOutput,
    diskSpace,
    memoryUsage,
    environmentVars,
    packageJsonExists,
    openclawInstalled,
    permissions,
    launchAgent,
    windowsService,
    networkCheck,
    dnsCheck,
    extensionCount,
    skillCount,
    cpuUsage,
    systemUptime,
    gitStatus,
    cacheSize,
    workspaceSize,
    openrouterTest,
    lastGatewayRestart
  };
}
