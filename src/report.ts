import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ObservationData } from './observe';
import { DiagnosisResult } from './diagnose';

export interface DiagnosticReport {
  timestamp: string;
  observation: ObservationData;
  diagnosis: DiagnosisResult;
}

export function generateReport(observation: ObservationData, diagnosis: DiagnosisResult): DiagnosticReport {
  return {
    timestamp: new Date().toISOString(),
    observation,
    diagnosis
  };
}

export function saveReport(report: DiagnosticReport): string {
  const reportsDir = path.join(os.homedir(), '.openclaw', 'clawdoctor-reports');
  
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
  const lines: string[] = [];
  
  lines.push('# ClawDoctor Diagnostic Report');
  lines.push('');
  lines.push(`**Generated:** ${report.timestamp}`);
  lines.push('');
  
  lines.push('## Health Status');
  lines.push('');
  lines.push(`**Status:** ${report.diagnosis.healthy ? '✅ Healthy' : '❌ Issues Detected'}`);
  lines.push('');
  
  if (!report.diagnosis.healthy) {
    lines.push('## Issues Found');
    lines.push('');
    
    const critical = report.diagnosis.diagnosis.filter(i => i.severity === 'critical');
    const warnings = report.diagnosis.diagnosis.filter(i => i.severity === 'warning');
    const info = report.diagnosis.diagnosis.filter(i => i.severity === 'info');
    
    if (critical.length > 0) {
      lines.push('### 🔴 Critical Issues');
      lines.push('');
      critical.forEach(issue => {
        lines.push(`- **${issue.message}**`);
        if (issue.details) lines.push(`  ${issue.details}`);
        if (issue.fix) lines.push(`  Fix: \`${issue.fix.command}\``);
        lines.push('');
      });
    }
    
    if (warnings.length > 0) {
      lines.push('### ⚠️ Warnings');
      lines.push('');
      warnings.forEach(issue => {
        lines.push(`- **${issue.message}**`);
        if (issue.details) lines.push(`  ${issue.details}`);
        if (issue.fix) lines.push(`  Fix: \`${issue.fix.command}\``);
        lines.push('');
      });
    }
    
    if (info.length > 0) {
      lines.push('### ℹ️ Information');
      lines.push('');
      info.forEach(issue => {
        lines.push(`- ${issue.message}`);
        if (issue.details) lines.push(`  ${issue.details}`);
        lines.push('');
      });
    }
  }
  
  lines.push('## System Information');
  lines.push('');
  lines.push(`- **Platform:** ${report.observation.platform}`);
  lines.push(`- **Node.js:** ${report.observation.nodeVersion}`);
  lines.push(`- **OpenClaw:** ${report.observation.openclawVersion}`);
  lines.push('');
  
  return lines.join('\n');
}
