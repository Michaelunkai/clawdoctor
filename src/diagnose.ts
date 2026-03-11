import { ObservationData } from './observe';

export interface DiagnosticIssue {
  message: string;
  details?: string;
  severity: 'critical' | 'warning' | 'info';
  fix?: {
    command: string;
    automatic: boolean;
    description: string;
  };
}

export interface DiagnosisResult {
  healthy: boolean;
  diagnosis: DiagnosticIssue[];
}

export async function diagnose(observation: ObservationData): Promise<DiagnosisResult> {
  const issues: DiagnosticIssue[] = [];
  
  // Check for memory-context-bridge warning
  if (observation.doctorOutput && observation.doctorOutput.includes('memory-context-bridge: plugin disabled')) {
    issues.push({
      message: 'Config warning: Disabled plugin has leftover config',
      details: 'The memory-context-bridge plugin is disabled but its configuration is still present. This causes warnings at startup.',
      severity: 'warning',
      fix: {
        command: 'openclaw config unset plugins.entries.memory-context-bridge',
        automatic: true,
        description: 'Remove unused plugin configuration'
      }
    });
  }
  
  // Check for state directory migration warning
  if (observation.doctorOutput && observation.doctorOutput.includes('State dir migration skipped')) {
    issues.push({
      message: 'State directory migration incomplete',
      details: 'OpenClaw detected an old state directory but could not migrate automatically. This is safe to ignore if everything works.',
      severity: 'info'
    });
  }
  
  // Check 1: OpenClaw installed
  if (!observation.openclawInstalled) {
    issues.push({
      message: 'OpenClaw is not installed',
      details: 'OpenClaw CLI not found in PATH. Install it first.',
      severity: 'critical',
      fix: {
        command: 'npm install -g openclaw',
        automatic: false,
        description: 'Install OpenClaw globally via npm'
      }
    });
  }
  
  // Check 2: Gateway not running
  const gatewayNotRunning = observation.gatewayStatus.includes('not running') || 
                            observation.gatewayStatus.includes('stopped');
  
  if (gatewayNotRunning && observation.openclawInstalled) {
    issues.push({
      message: 'OpenClaw gateway is not running',
      details: 'The OpenClaw gateway service needs to be started to use Claude.',
      severity: 'critical',
      fix: {
        command: 'openclaw gateway start',
        automatic: true,
        description: 'Start the OpenClaw gateway service'
      }
    });
  }
  
  // Check 3: Config file missing
  if (!observation.configExists && observation.openclawInstalled) {
    issues.push({
      message: 'OpenClaw config file not found',
      details: 'Configuration file missing at ~/.openclaw/openclaw.json',
      severity: 'critical',
      fix: {
        command: 'openclaw init',
        automatic: true,
        description: 'Initialize OpenClaw configuration'
      }
    });
  }
  
  // Check 4: Config invalid JSON
  if (observation.configExists && !observation.configValid) {
    issues.push({
      message: 'OpenClaw config file is corrupted',
      details: 'The configuration file contains invalid JSON and needs to be fixed.',
      severity: 'critical',
      fix: {
        command: 'openclaw doctor --yes',
        automatic: true,
        description: 'Repair configuration with OpenClaw doctor'
      }
    });
  }
  
  // Check 5: Node.js version
  const nodeVersionMatch = observation.nodeVersion.match(/v(\d+)\./);
  if (nodeVersionMatch && parseInt(nodeVersionMatch[1]) < 18) {
    issues.push({
      message: 'Node.js version is too old',
      details: `Current version: ${observation.nodeVersion}. Required: v18 or newer.`,
      severity: 'critical',
      fix: {
        command: 'nvm install 18 && nvm use 18',
        automatic: false,
        description: 'Update Node.js to v18 or newer'
      }
    });
  }
  
  // Check 6: Port conflicts
  if (observation.portCheck && observation.portCheck.includes('in use') && !gatewayNotRunning) {
    issues.push({
      message: 'Port 18789 is in use',
      details: 'The OpenClaw gateway port is occupied. This is normal if the gateway is running.',
      severity: 'info'
    });
  }
  
  // Check 7: Doctor has warnings
  if (observation.doctorOutput && observation.doctorOutput.match(/⚠️|warn|❌|error/i)) {
    issues.push({
      message: 'OpenClaw doctor detected issues',
      details: 'Some configuration issues were detected by openclaw doctor.',
      severity: 'warning',
      fix: {
        command: 'openclaw doctor --yes',
        automatic: true,
        description: 'Run OpenClaw doctor to fix issues'
      }
    });
  }
  
  // Check 8: Recent errors in logs
  if (observation.errorLogs && observation.errorLogs.length > 5) {
    issues.push({
      message: `Found ${observation.errorLogs.length} recent errors in logs`,
      details: 'Multiple errors detected in recent OpenClaw logs.',
      severity: 'warning',
      fix: {
        command: 'openclaw gateway restart',
        automatic: true,
        description: 'Restart the gateway to clear errors'
      }
    });
  }
  
  // Check 9: Disk space
  if (observation.diskSpace && observation.diskSpace.match(/9[0-9]%|100%/)) {
    issues.push({
      message: `Low disk space`,
      details: `Your disk is nearly full (${observation.diskSpace}). This can cause issues with OpenClaw.`,
      severity: 'warning'
    });
  }
  
  // Check 10: Network connectivity
  if (observation.networkCheck && observation.networkCheck.includes('fail')) {
    issues.push({
      message: 'No internet connection',
      details: 'OpenClaw requires internet access to communicate with AI providers.',
      severity: 'critical'
    });
  }
  
  // Check 11: DNS issues
  if (observation.dnsCheck && observation.dnsCheck.includes('fail')) {
    issues.push({
      message: 'DNS resolution failed',
      details: 'Unable to resolve domain names. Check your DNS settings.',
      severity: 'warning'
    });
  }
  
  // Check 12: Extensions
  if (observation.extensionCount === 0) {
    issues.push({
      message: 'No extensions installed',
      details: 'Consider installing OpenClaw extensions for additional features.',
      severity: 'info'
    });
  }
  
  // Check 13: Too many extensions
  if (observation.extensionCount && observation.extensionCount > 20) {
    issues.push({
      message: `Many extensions installed (${observation.extensionCount})`,
      details: 'Too many extensions can slow down OpenClaw startup.',
      severity: 'info'
    });
  }
  
  // Check 14: Hook loading failures
  if (observation.recentLogs && observation.recentLogs.includes('Failed to load hook')) {
    issues.push({
      message: 'Some hooks failed to load',
      details: 'One or more hooks have dependency or syntax errors. Check logs for details.',
      severity: 'warning',
      fix: {
        command: 'openclaw doctor --yes',
        automatic: true,
        description: 'Run doctor to identify and fix hook issues'
      }
    });
  }
  
  // Check 15: Unknown typed hooks
  if (observation.recentLogs && observation.recentLogs.includes('unknown typed hook')) {
    issues.push({
      message: 'Hooks using unsupported event types',
      details: 'Some hooks are trying to use event types that don\'t exist. These hooks will be ignored.',
      severity: 'info'
    });
  }
  
  // Check 16: TLS certificate warnings
  if (observation.recentLogs && observation.recentLogs.includes('NODE_TLS_REJECT_UNAUTHORIZED')) {
    issues.push({
      message: 'TLS certificate verification disabled',
      details: 'NODE_TLS_REJECT_UNAUTHORIZED is set to 0, which makes HTTPS connections insecure. This is usually safe for local development.',
      severity: 'info'
    });
  }
  
  // Check 17: Non-loopback binding warning
  if (observation.recentLogs && observation.recentLogs.includes('non-loopback address')) {
    issues.push({
      message: 'Gateway exposed on all network interfaces',
      details: 'The gateway is binding to 0.0.0.0, which exposes it to your local network. Ensure authentication is enabled if this is intentional.',
      severity: 'warning',
      fix: {
        command: 'openclaw config set gateway.host 127.0.0.1',
        automatic: false,
        description: 'Restrict gateway to localhost only'
      }
    });
  }
  
  // Check 18: npm outdated packages
  if (observation.npmVersion) {
    const npmMatch = observation.npmVersion.match(/(\d+)\./);
    if (npmMatch && parseInt(npmMatch[1]) < 9) {
      issues.push({
        message: 'npm is outdated',
        details: `You're using npm ${observation.npmVersion}. Updating to npm 9+ may improve performance.`,
        severity: 'info',
        fix: {
          command: 'npm install -g npm@latest',
          automatic: false,
          description: 'Update npm to the latest version'
        }
      });
    }
  }
  
  // Check 19: Workspace permissions
  if (observation.permissions && observation.permissions.includes('EACCES')) {
    issues.push({
      message: 'Permission denied errors detected',
      details: 'Some files or directories are not accessible. This may prevent OpenClaw from working correctly.',
      severity: 'critical',
      fix: {
        command: process.platform === 'win32' 
          ? 'icacls "%USERPROFILE%\\.openclaw" /grant %USERNAME%:F /T'
          : 'chmod -R u+rwX ~/.openclaw',
        automatic: false,
        description: 'Fix file permissions in OpenClaw directory'
      }
    });
  }
  
  return {
    healthy: issues.filter(i => i.severity === 'critical').length === 0,
    diagnosis: issues
  };
}
