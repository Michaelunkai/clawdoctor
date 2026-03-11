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
  
  // Rule 1: Gateway not running (but not if it's a false positive from command output)
  const gatewayNotRunning = data.gatewayStatus.includes('not running') || 
                            (data.gatewayStatus.includes('Error') && 
                             !data.gatewayStatus.includes('STDIN'));
  
  if (gatewayNotRunning) {
    findings.push('CRITICAL: Gateway is not running');
    critical = true;
  }
  
  // Rule 2: Port conflict (only if actual process is found, not just error messages)
  if (data.portCheck && 
      !data.portCheck.includes('Error') && 
      !data.portCheck.includes('STDIN') &&
      data.portCheck.match(/LISTENING|ESTABLISHED|\d+\s+node/)) {
    findings.push('INFO: Port 18789 is in use (likely by gateway itself)');
  }
  
  // Rule 3: Config missing
  if (!data.configExists) {
    findings.push('CRITICAL: OpenClaw config file not found');
    critical = true;
  }
  
  // Rule 4: Doctor found issues
  if (data.doctorOutput && data.doctorOutput.includes('❌')) {
    findings.push('WARNING: openclaw doctor detected issues');
  }
  
  // Rule 5: Node version check
  const nodeVersionMatch = data.nodeVersion.match(/v(\d+)\./);
  if (nodeVersionMatch && parseInt(nodeVersionMatch[1]) < 18) {
    findings.push('CRITICAL: Node.js version too old (need v18+)');
    critical = true;
  }
  
  // Build diagnosis
  const diagnosis: DiagnosisResult = buildDiagnosis(findings, critical, data);
  
  return { critical, findings, diagnosis };
}

function buildDiagnosis(findings: string[], critical: boolean, data: ObservationData): DiagnosisResult {
  // Filter out INFO findings from critical check
  const criticalFindings = findings.filter(f => f.startsWith('CRITICAL'));
  const warningFindings = findings.filter(f => f.startsWith('WARNING'));
  const infoFindings = findings.filter(f => f.startsWith('INFO'));
  
  if (!critical && criticalFindings.length === 0) {
    return {
      healthy: true,
      diagnosis: 'OpenClaw appears to be running normally. No critical issues detected.',
      confidence: 0.9,
      rootCause: 'No issues found',
      reasoning: [
        'Gateway status check passed',
        'Configuration file exists',
        'Node.js version is compatible',
        ...infoFindings
      ],
      warnings: warningFindings,
      options: []
    };
  }
  
  const options = [];
  
  // Generate fix options based on findings
  if (findings.some(f => f.includes('Gateway is not running'))) {
    options.push({
      id: 'A',
      title: 'Restart OpenClaw Gateway',
      description: 'Start the OpenClaw gateway service',
      recommended: true,
      risk: 'low' as const,
      autoExecute: true,
      steps: [
        {
          description: 'Start the gateway',
          command: 'openclaw gateway start',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  if (findings.some(f => f.includes('openclaw doctor'))) {
    options.push({
      id: 'B',
      title: 'Run OpenClaw Doctor Auto-Fix',
      description: 'Let openclaw doctor automatically repair detected issues',
      recommended: !options.length, // Recommend if no other option
      risk: 'low' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Run doctor with auto-fix',
          command: 'openclaw doctor --yes',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  if (findings.some(f => f.includes('Config file not found'))) {
    options.push({
      id: 'C',
      title: 'Reinstall OpenClaw',
      description: 'OpenClaw configuration is missing. You may need to reinstall.',
      recommended: true,
      risk: 'medium' as const,
      autoExecute: false,
      steps: [
        {
          description: 'Check installation',
          command: 'openclaw status',
          type: 'cli' as const,
          risk: 'low' as const,
          backup: null
        }
      ]
    });
  }
  
  return {
    healthy: false,
    diagnosis: findings.join('. '),
    confidence: 0.9,
    rootCause: critical ? 'Critical system issue detected' : 'Minor configuration issues',
    reasoning: findings,
    warnings: findings.filter(f => f.startsWith('WARNING')),
    options
  };
}
