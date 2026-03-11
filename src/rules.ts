import { ObservationData } from './observe';
import { DiagnosisResult } from './diagnose';

export interface RuleResult {
  critical: boolean;
  findings: string[];
  diagnosis: DiagnosisResult;
}

export function applyRules(data: ObservationData): RuleResult {
  const findings: string[] = [];
  let critical = false;
  
  // RULE 1: OpenClaw not installed
  if (!data.openclawInstalled) {
    findings.push('CRITICAL: OpenClaw is not installed or not in PATH');
    critical = true;
  }
  
  // RULE 2: Gateway not running
  const gatewayNotRunning = data.gatewayStatus.includes('not running') || 
                            (data.gatewayStatus.includes('Error') && 
                             !data.gatewayStatus.includes('STDIN'));
  
  if (gatewayNotRunning && data.openclawInstalled) {
    findings.push('CRITICAL: Gateway is not running');
    critical = true;
  }
  
  // RULE 3: Config missing
  if (!data.configExists && data.openclawInstalled) {
    findings.push('CRITICAL: OpenClaw config file not found at ~/.openclaw/openclaw.json');
    critical = true;
  }
  
  // RULE 4: Config invalid JSON
  if (data.configExists && !data.configValid) {
    findings.push('CRITICAL: Config file contains invalid JSON');
    critical = true;
  }
  
  // RULE 5: Node version check
  const nodeVersionMatch = data.nodeVersion.match(/v(\d+)\./);
  if (nodeVersionMatch && parseInt(nodeVersionMatch[1]) < 18) {
    findings.push('CRITICAL: Node.js version too old (need v18+, have ' + data.nodeVersion + ')');
    critical = true;
  }
  
  // RULE 6: Doctor found issues
  if (data.doctorOutput && data.doctorOutput.match(/❌|error|fail/i)) {
    const issues = data.doctorOutput.split('\n').filter(line => 
      line.includes('❌') || line.match(/error|fail/i)
    );
    if (issues.length > 0) {
      findings.push('WARNING: openclaw doctor detected ' + issues.length + ' issue(s)');
    }
  }
  
  // RULE 7: Port conflict (actual conflict, not just gateway)
  if (data.portCheck && 
      !data.portCheck.includes('Error') && 
      !data.portCheck.includes('STDIN') &&
      data.portCheck.match(/LISTENING|ESTABLISHED|\d+\s+node/)) {
    const lines = data.portCheck.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 1) {
      findings.push('WARNING: Multiple processes on port 18789 detected');
    } else {
      findings.push('INFO: Port 18789 is in use (gateway is running)');
    }
  }
  
  // RULE 8: Error logs present
  if (data.errorLogs.length > 0) {
    if (data.errorLogs.length > 10) {
      findings.push('WARNING: Many errors found in logs (' + data.errorLogs.length + ' error lines)');
    } else if (data.errorLogs.length > 0) {
      findings.push('INFO: ' + data.errorLogs.length + ' error(s) found in recent logs');
    }
  }
  
  // RULE 9: Low disk space
  if (data.diskSpace) {
    const match = data.diskSpace.match(/(\d+)%|(\d+)G.*?(\d+)G/);
    if (match) {
      const usage = match[1] ? parseInt(match[1]) : 0;
      if (usage > 90) {
        findings.push('WARNING: Disk space is low (' + usage + '% used)');
      }
    }
  }
  
  // RULE 10: Proxy environment variables
  if (data.environmentVars.HTTP_PROXY || data.environmentVars.HTTPS_PROXY) {
    findings.push('INFO: Proxy environment variables detected - may cause connection issues');
  }
  
  // RULE 11: No recent logs
  if (data.recentLogs === 'No logs found' && data.openclawInstalled) {
    findings.push('WARNING: No log files found - gateway may not be running or logging is disabled');
  }
  
  // RULE 12: Package.json missing
  if (!data.packageJsonExists && data.openclawInstalled) {
    findings.push('WARNING: package.json not found in ~/.openclaw - installation may be incomplete');
  }
  
  // RULE 13: Permission issues
  if (data.permissions.includes('Permission denied') || data.permissions.includes('Access is denied')) {
    findings.push('CRITICAL: Permission issues detected in .openclaw directory');
    critical = true;
  }
  
  // RULE 14: npm version check
  if (data.npmVersion && data.npmVersion.match(/^\d+/)) {
    const npmMajor = parseInt(data.npmVersion.match(/^(\d+)/)![1]);
    if (npmMajor < 8) {
      findings.push('WARNING: npm version is outdated (have ' + data.npmVersion + ', recommend 8+)');
    }
  }
  
  // RULE 15: macOS LaunchAgent issues
  if (data.platform === 'darwin' && !data.launchAgent && data.openclawInstalled) {
    findings.push('WARNING: LaunchAgent plist not found - gateway may not start on boot');
  }
  
  // RULE 16: Status command errors
  if (data.openclawStatus.includes('command not found') || data.openclawStatus.includes('not recognized')) {
    findings.push('CRITICAL: openclaw command not found in PATH');
    critical = true;
  }
  
  // RULE 17: Version mismatch
  if (data.openclawVersion && data.openclawStatus) {
    const statusVersion = data.openclawStatus.match(/version[:\s]+([0-9.]+)/i);
    const cliVersion = data.openclawVersion.match(/([0-9.]+)/);
    if (statusVersion && cliVersion && statusVersion[1] !== cliVersion[1]) {
      findings.push('WARNING: CLI version (' + cliVersion[1] + ') differs from gateway version (' + statusVersion[1] + ')');
    }
  }
  
  // RULE 18: Network connectivity
  if (data.networkCheck && data.networkCheck.includes('unreachable')) {
    findings.push('WARNING: Network connectivity issues detected');
  }
  
  // RULE 19: DNS resolution
  if (data.dnsCheck && (data.dnsCheck.includes('failed') || data.dnsCheck.includes('SERVFAIL'))) {
    findings.push('WARNING: DNS resolution issues detected - may affect OpenRouter API calls');
  }
  
  // RULE 20: No extensions installed
  if (data.extensionCount === 0 && data.openclawInstalled) {
    findings.push('INFO: No extensions installed - OpenClaw is using default configuration');
  }
  
  // RULE 21: No skills installed
  if (data.skillCount === 0 && data.openclawInstalled) {
    findings.push('INFO: No skills installed - consider adding skills for enhanced functionality');
  }
  
  // RULE 22: Many extensions (performance check)
  if (data.extensionCount && data.extensionCount > 20) {
    findings.push('INFO: ' + data.extensionCount + ' extensions installed - may impact startup time');
  }
  
  // RULE 23: Check for duplicate node processes
  if (data.processCheck) {
    const nodeProcesses = data.processCheck.split('\n').filter(l => l.includes('node'));
    if (nodeProcesses.length > 5) {
      findings.push('WARNING: ' + nodeProcesses.length + ' Node.js processes detected - possible memory leak');
    }
  }
  
  // RULE 24: Check OpenClaw log file size
  if (data.recentLogs && data.recentLogs.length > 100000) {
    findings.push('WARNING: Log file is very large - consider log rotation');
  }
  
  // RULE 25: Check for common error patterns
  if (data.errorLogs.some(log => log.includes('EADDRINUSE'))) {
    findings.push('CRITICAL: Port already in use - another service is using port 18789');
    critical = true;
  }
  
  // RULE 26: Check for out of memory errors
  if (data.errorLogs.some(log => log.includes('out of memory') || log.includes('ENOMEM'))) {
    findings.push('CRITICAL: Out of memory errors detected - system resources exhausted');
    critical = true;
  }
  
  // RULE 27: Check for SSL/certificate errors
  if (data.errorLogs.some(log => log.includes('certificate') || log.includes('SSL'))) {
    findings.push('WARNING: SSL/certificate errors detected - may affect API calls');
  }
  
  // RULE 28: Check for rate limiting
  if (data.errorLogs.some(log => log.includes('429') || log.includes('rate limit'))) {
    findings.push('WARNING: Rate limiting detected - reduce API request frequency');
  }
  
  // RULE 29: Check gateway uptime (if available in logs)
  const uptimeMatch = data.gatewayStatus.match(/uptime[:\s]+(\d+)/i);
  if (uptimeMatch && parseInt(uptimeMatch[1]) < 300) {
    findings.push('WARNING: Gateway recently restarted (uptime < 5 minutes) - may indicate instability');
  }
  
  // RULE 30: Check for workspace corruption
  if (data.configContent && data.configContent.includes('undefined') || data.configContent?.includes('NaN')) {
    findings.push('CRITICAL: Config file contains corrupted data');
    critical = true;
  }
  
  // RULE 31: High CPU usage
  if (data.cpuUsage) {
    const cpuMatch = data.cpuUsage.match(/(\d+)/);
    if (cpuMatch && parseInt(cpuMatch[1]) > 80) {
      findings.push('WARNING: High CPU usage detected (' + cpuMatch[1] + '%) - may affect performance');
    }
  }
  
  // RULE 32: Uncommitted changes in OpenClaw directory
  if (data.gitStatus && data.gitStatus.length > 0 && !data.gitStatus.includes('Not a git')) {
    findings.push('INFO: Uncommitted changes detected in OpenClaw directory');
  }
  
  // RULE 33: Large cache size (>100MB)
  if (data.cacheSize && data.cacheSize > 100 * 1024 * 1024) {
    const sizeMB = Math.round(data.cacheSize / (1024 * 1024));
    findings.push('WARNING: Cache size is large (' + sizeMB + 'MB) - consider clearing cache');
  }
  
  // RULE 34: Large workspace size (>500MB)
  if (data.workspaceSize && data.workspaceSize > 500 * 1024 * 1024) {
    const sizeMB = Math.round(data.workspaceSize / (1024 * 1024));
    findings.push('INFO: Workspace size is large (' + sizeMB + 'MB) - consider cleanup');
  }
  
  // RULE 35: OpenRouter API connectivity
  if (data.openrouterTest && data.openrouterTest !== '200') {
    findings.push('WARNING: OpenRouter API connection failed (HTTP ' + data.openrouterTest + ') - AI diagnosis may not work');
  }
  
  // RULE 36: Recent system uptime (possible reboot loop)
  if (data.systemUptime && data.systemUptime.match(/\d+\s+min/)) {
    findings.push('WARNING: System recently rebooted - check for stability issues');
  }
  
  // RULE 37: Check for orphaned node processes
  if (data.processCheck) {
    const zombieCheck = data.processCheck.toLowerCase();
    if (zombieCheck.includes('defunct') || zombieCheck.includes('<defunct>')) {
      findings.push('WARNING: Zombie/defunct processes detected - may indicate process management issues');
    }
  }
  
  // RULE 38: Check for firewall blocking
  if (data.portCheck && data.portCheck.includes('filtered')) {
    findings.push('WARNING: Port 18789 appears to be filtered by firewall');
  }
  
  // RULE 39: Check for multiple OpenClaw instances
  if (data.processCheck) {
    const openclawProcesses = data.processCheck.split('\n').filter(l => 
      l.toLowerCase().includes('openclaw') && !l.includes('grep')
    );
    if (openclawProcesses.length > 3) {
      findings.push('WARNING: Multiple OpenClaw processes detected (' + openclawProcesses.length + ') - possible duplicate instances');
    }
  }
  
  // RULE 40: Check for old Node.js LTS
  const nodeMajor = parseInt(data.nodeVersion.match(/v(\d+)/)![1]);
  if (nodeMajor === 18 || nodeMajor === 20) {
    findings.push('INFO: Consider upgrading to latest Node.js LTS (currently v' + nodeMajor + ')');
  }
  
  // Build diagnosis
  const diagnosis: DiagnosisResult = buildDiagnosis(findings, critical, data);
  
  return { critical, findings, diagnosis };
}

function buildDiagnosis(findings: string[], critical: boolean, data: ObservationData): DiagnosisResult {
  // Filter findings by severity
  const criticalFindings = findings.filter(f => f.startsWith('CRITICAL'));
  const warningFindings = findings.filter(f => f.startsWith('WARNING'));
  const infoFindings = findings.filter(f => f.startsWith('INFO'));
  
  if (!critical && criticalFindings.length === 0) {
    return {
      healthy: true,
      diagnosis: '✅ OpenClaw is healthy and running normally! All systems operational.',
      confidence: 0.95,
      rootCause: 'No critical issues found',
      reasoning: [
        '✓ Gateway is running',
        '✓ Configuration file exists and is valid',
        '✓ Node.js version is compatible (' + data.nodeVersion + ')',
        '✓ OpenClaw ' + data.openclawVersion.trim() + ' is installed',
        ...infoFindings
      ],
      warnings: warningFindings,
      options: []
    };
  }
  
  const options = [];
  
  // FIX 1: Gateway not running
  if (findings.some(f => f.includes('Gateway is not running'))) {
    options.push({
      id: 'A',
      title: 'Start OpenClaw Gateway',
      description: 'Start the gateway service to enable OpenClaw functionality',
      recommended: true,
      risk: 'low' as const,
      autoExecute: true,
      steps: [
        {
          description: 'Start the gateway service',
          command: 'openclaw gateway start',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  // FIX 2: Doctor found issues
  if (findings.some(f => f.includes('openclaw doctor'))) {
    options.push({
      id: 'B',
      title: 'Run OpenClaw Doctor Auto-Fix',
      description: 'Use openclaw doctor to automatically repair detected configuration issues',
      recommended: !options.length,
      risk: 'low' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Run doctor with auto-repair flag',
          command: 'openclaw doctor --yes',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  // FIX 3: Gateway restart (if running but has issues)
  if (!findings.some(f => f.includes('Gateway is not running')) && 
      (warningFindings.length > 0 || findings.some(f => f.includes('error')))) {
    options.push({
      id: 'C',
      title: 'Restart Gateway',
      description: 'Restart the gateway to clear any transient issues',
      recommended: false,
      risk: 'low' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Restart the gateway service',
          command: 'openclaw gateway restart',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  // FIX 4: Reinstall LaunchAgent (macOS)
  if (data.platform === 'darwin' && findings.some(f => f.includes('LaunchAgent'))) {
    options.push({
      id: 'D',
      title: 'Reinstall LaunchAgent',
      description: 'Reinstall the macOS LaunchAgent for automatic gateway startup',
      recommended: false,
      risk: 'low' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Force reinstall the LaunchAgent',
          command: 'openclaw gateway install --force',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  // FIX 5: Config not found - suggest reinstall
  if (findings.some(f => f.includes('config file not found'))) {
    options.push({
      id: 'E',
      title: 'Initialize Configuration',
      description: 'Run openclaw setup to create missing configuration file',
      recommended: true,
      risk: 'medium' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Check openclaw status first',
          command: 'openclaw status',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  // FIX 6: Permission issues
  if (findings.some(f => f.includes('Permission issues'))) {
    const fixCmd = data.platform === 'win32'
      ? 'icacls "%USERPROFILE%\\.openclaw" /grant %USERNAME%:F /T'
      : 'chmod -R 755 ~/.openclaw && chown -R $USER ~/.openclaw';
    
    options.push({
      id: 'F',
      title: 'Fix File Permissions',
      description: 'Reset permissions on .openclaw directory',
      recommended: true,
      risk: 'medium' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Reset directory permissions',
          command: fixCmd,
          type: 'system' as const,
          risk: 'medium' as const,
          backup: null
        }
      ]
    });
  }
  
  // FIX 7: Node version too old
  if (findings.some(f => f.includes('Node.js version too old'))) {
    options.push({
      id: 'G',
      title: 'Upgrade Node.js',
      description: 'OpenClaw requires Node.js v18 or later. Please upgrade Node.js.',
      recommended: true,
      risk: 'high' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Visit nodejs.org to download the latest LTS version',
          command: 'echo Visit https://nodejs.org',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  return {
    healthy: false,
    diagnosis: criticalFindings.join('. ') || warningFindings.join('. ') || 'Issues detected',
    confidence: 0.9,
    rootCause: critical ? 'Critical system issue detected' : 'Configuration issues detected',
    reasoning: [...criticalFindings, ...warningFindings.slice(0, 3)],
    warnings: warningFindings,
    options
  };
}
