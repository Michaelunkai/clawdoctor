import { execSync } from 'child_process';
import { DiagnosticAction } from './diagnose';

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
  
  for (const step of steps) {
    log(`Executing: ${step.description}`);
    
    try {
      const output = execSync(step.command, {
        encoding: 'utf-8',
        timeout: 30000,
        stdio: 'pipe'
      });
      
      outputs.push(output || '(completed)');
      log(`✓ ${step.description} completed`);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      errors.push(errorMsg);
      log(`✗ ${step.description} failed: ${errorMsg}`);
    }
  }
  
  return {
    success: errors.length === 0,
    outputs,
    errors
  };
}
