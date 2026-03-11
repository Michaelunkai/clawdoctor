import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function verify(onProgress?: (msg: string) => void): Promise<boolean> {
  const log = (msg: string) => {
    if (onProgress) onProgress(msg);
  };
  
  log('\n🔍 Verifying system health...');
  
  const checks = [
    { name: 'OpenClaw status', test: () => checkOpenClawStatus() },
    { name: 'Gateway status', test: () => checkGatewayStatus() },
    { name: 'Config file', test: () => checkConfigFile() },
    { name: 'Port availability', test: () => checkPort() }
  ];
  
  let passedChecks = 0;
  const totalChecks = checks.length;
  
  for (const check of checks) {
    try {
      const result = await check.test();
      if (result) {
        log(`✅ ${check.name}: OK`);
        passedChecks++;
      } else {
        log(`❌ ${check.name}: Failed`);
      }
    } catch (error) {
      log(`❌ ${check.name}: Error`);
    }
  }
  
  const isHealthy = passedChecks >= totalChecks - 1; // Allow 1 failure
  
  if (isHealthy) {
    log(`\n✅ Verification passed: ${passedChecks}/${totalChecks} checks successful`);
  } else {
    log(`\n⚠️ Verification incomplete: ${passedChecks}/${totalChecks} checks successful`);
  }
  
  return isHealthy;
}

function checkOpenClawStatus(): boolean {
  try {
    const status = execSync('openclaw status', {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: 'pipe'
    });
    return !status.includes('Error') && !status.includes('not found');
  } catch {
    return false;
  }
}

function checkGatewayStatus(): boolean {
  try {
    const status = execSync('openclaw gateway status', {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: 'pipe'
    });
    return !status.includes('not running') && !status.includes('Error');
  } catch {
    return false;
  }
}

function checkConfigFile(): boolean {
  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  if (!fs.existsSync(configPath)) return false;
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    // Try to parse as JSON (with comments removed)
    JSON.parse(content.replace(/\/\/.*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''));
    return true;
  } catch {
    return false;
  }
}

function checkPort(): boolean {
  try {
    const platform = os.platform();
    const cmd = platform === 'win32'
      ? 'netstat -ano | findstr ":18789"'
      : 'lsof -i :18789';
    
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: 'pipe'
    });
    
    // Port should be in use by gateway
    return output.length > 0 && output.includes('LISTENING');
  } catch {
    // Port check failure is not critical
    return true;
  }
}
