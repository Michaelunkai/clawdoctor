import { execSync } from 'child_process';

export interface ExecuteResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function execute(command: string): Promise<ExecuteResult> {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 60000,
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
    });
    
    return {
      success: true,
      output: output.trim()
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || error.stderr || '',
      error: error.message
    };
  }
}
