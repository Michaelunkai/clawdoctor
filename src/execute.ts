import { execSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { DiagnosticAction } from './diagnose';
import { backupManager } from './backup';

export interface ExecuteResult {
  success: boolean;
  outputs: string[];
  errors: string[];
}

export async function execute(
  steps: DiagnosticAction[],
  onProgress?: (msg: string) => void
): Promise<ExecuteResult> {
  const log = (msg: string) => {
    if (onProgress) onProgress(msg);
  };
  
  const outputs: string[] = [];
  const errors: string[] = [];
  const backupIds: string[] = [];
  let successCount = 0;
  
  log(`🔧 Starting execution of ${steps.length} step(s)...`);
  
  // Create backup of config file if it exists
  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  if (fs.existsSync(configPath)) {
    log('💾 Creating backup of openclaw.json...');
    const backupId = await backupManager.backupFile(configPath, {
      reason: 'Pre-execution backup',
      steps: steps.length
    });
    if (backupId) {
      backupIds.push(backupId);
      log(`✅ Backup created: ${backupId}`);
    }
  }
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;
    
    log(`\n[${stepNum}/${steps.length}] ${step.description}`);
    log(`Command: ${step.command}`);
    
    try {
      // Add timeout and proper shell handling
      const output = execSync(step.command, {
        encoding: 'utf-8',
        timeout: 60000, // 60 second timeout
        stdio: 'pipe',
        shell: os.platform() === 'win32' ? 'powershell.exe' : '/bin/sh'
      });
      
      const result = output || '(command completed successfully)';
      outputs.push(result);
      successCount++;
      
      log(`✅ Step ${stepNum} completed successfully`);
      
      // Show first few lines of output
      const lines = result.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        log(`Output: ${lines.slice(0, 3).join(' | ')}`);
        if (lines.length > 3) {
          log(`... (${lines.length - 3} more lines)`);
        }
      }
      
      // Wait a bit between steps
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      const stderr = error.stderr?.toString() || '';
      const stdout = error.stdout?.toString() || '';
      const errorMsg = stderr || stdout || error.message || 'Unknown error';
      
      errors.push(`Step ${stepNum}: ${errorMsg}`);
      log(`❌ Step ${stepNum} failed: ${errorMsg.split('\n')[0]}`);
      
      // Don't stop on error if risk is low
      if (step.risk !== 'low') {
        log(`🛑 Stopping execution due to ${step.risk} risk failure`);
        break;
      } else {
        log(`⚠️ Continuing despite error (low risk step)`);
      }
    }
  }
  
  const totalSuccess = successCount === steps.length;
  
  if (totalSuccess) {
    log(`\n✅ All ${steps.length} step(s) completed successfully!`);
  } else {
    log(`\n⚠️ Completed ${successCount}/${steps.length} steps`);
  }
  
  return {
    success: errors.length === 0,
    outputs,
    errors
  };
}
