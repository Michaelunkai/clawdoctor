import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ObservationData } from './observe';
import { DiagnosisResult } from './diagnose';

export interface DiagnosticReport {
  timestamp: string;
  version: string;
  system: {
    platform: string;
    nodeVersion: string;
    openclawVersion: string;
  };
  health: {
    healthy: boolean;
    confidence: number;
    diagnosis: string;
  };
  findings: {
    critical: string[];
    warnings: string[];
    info: string[];
  };
  rawData: ObservationData;
}

export function generateReport(data: ObservationData, diagnosis: DiagnosisResult): DiagnosticReport {
  const critical: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];
  
  // Categorize findings
  diagnosis.reasoning.forEach(finding => {
    if (finding.includes('CRITICAL') || finding.includes('❌')) {
      critical.push(finding);
    } else if (finding.includes('WARNING') || finding.includes('⚠️')) {
      warnings.push(finding);
    } else {
      info.push(finding);
    }
  });
  
  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    system: {
      platform: data.platform,
      nodeVersion: data.nodeVersion,
      openclawVersion: data.openclawVersion
    },
    health: {
      healthy: diagnosis.healthy,
      confidence: diagnosis.confidence,
      diagnosis: diagnosis.diagnosis
    },
    findings: {
      critical,
      warnings,
      info
    },
    rawData: data
  };
}

export function saveReport(report: DiagnosticReport): string {
  const reportsDir = path.join(os.homedir(), '.openclaw', 'clawdoctor-reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `clawdoctor-report-${timestamp}.json`;
  const filepath = path.join(reportsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  
  return filepath;
}

export function getRecentReports(limit: number = 10): DiagnosticReport[] {
  const reportsDir = path.join(os.homedir(), '.openclaw', 'clawdoctor-reports');
  
  if (!fs.existsSync(reportsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('clawdoctor-report-') && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, limit);
  
  return files.map(f => {
    const content = fs.readFileSync(path.join(reportsDir, f), 'utf-8');
    return JSON.parse(content);
  });
}

export function exportReportAsMarkdown(report: DiagnosticReport): string {
  let md = `# ClawDoctor Diagnostic Report\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
  md += `**Version:** ${report.version}\n\n`;
  
  md += `## System Information\n\n`;
  md += `- **Platform:** ${report.system.platform}\n`;
  md += `- **Node.js:** ${report.system.nodeVersion}\n`;
  md += `- **OpenClaw:** ${report.system.openclawVersion}\n\n`;
  
  md += `## Health Status\n\n`;
  md += `- **Status:** ${report.health.healthy ? '✅ Healthy' : '⚠️ Issues Detected'}\n`;
  md += `- **Confidence:** ${(report.health.confidence * 100).toFixed(0)}%\n`;
  md += `- **Diagnosis:** ${report.health.diagnosis}\n\n`;
  
  if (report.findings.critical.length > 0) {
    md += `## 🔴 Critical Issues\n\n`;
    report.findings.critical.forEach(f => md += `- ${f}\n`);
    md += `\n`;
  }
  
  if (report.findings.warnings.length > 0) {
    md += `## ⚠️ Warnings\n\n`;
    report.findings.warnings.forEach(f => md += `- ${f}\n`);
    md += `\n`;
  }
  
  if (report.findings.info.length > 0) {
    md += `## ℹ️ Information\n\n`;
    report.findings.info.forEach(f => md += `- ${f}\n`);
    md += `\n`;
  }
  
  md += `## Raw Data\n\n`;
  md += `<details>\n<summary>Click to expand</summary>\n\n`;
  md += `\`\`\`json\n${JSON.stringify(report.rawData, null, 2)}\n\`\`\`\n\n`;
  md += `</details>\n`;
  
  return md;
}
