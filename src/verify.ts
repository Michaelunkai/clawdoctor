import { execSync } from 'child_process';

export async function verify(onProgress?: (msg: string) => void): Promise<boolean> {
  const log = (msg: string) => {
    if (onProgress) onProgress(msg);
  };
  
  log('Verifying fix...');
  
  try {
    const status = execSync('openclaw status', {
      encoding: 'utf-8',
      timeout: 10000
    });
    
    const gatewayStatus = execSync('openclaw gateway status', {
      encoding: 'utf-8',
      timeout: 10000
    });
    
    const isHealthy = !status.includes('Error') && !gatewayStatus.includes('not running');
    
    if (isHealthy) {
      log('✓ Verification passed: System is healthy');
    } else {
      log('✗ Verification failed: Issues still present');
    }
    
    return isHealthy;
  } catch (error) {
    log('✗ Verification failed with error');
    return false;
  }
}
