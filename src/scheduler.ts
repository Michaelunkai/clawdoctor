import { observe } from './observe';
import { diagnose } from './diagnose';
import { saveReport, generateReport } from './report';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ScheduleConfig {
  enabled: boolean;
  interval: number; // minutes
  emailOnIssues: boolean;
  emailAddress?: string;
  autoFix: boolean;
}

export class HealthCheckScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private config: ScheduleConfig;
  private configPath: string;
  
  constructor() {
    this.configPath = path.join(os.homedir(), '.openclaw', 'clawdoctor-schedule.json');
    this.config = this.loadConfig();
  }
  
  private loadConfig(): ScheduleConfig {
    if (fs.existsSync(this.configPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      } catch {}
    }
    
    return {
      enabled: false,
      interval: 60, // 1 hour default
      emailOnIssues: false,
      autoFix: false
    };
  }
  
  private saveConfig(): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }
  
  async runHealthCheck(): Promise<void> {
    console.log('[Scheduler] Running scheduled health check...');
    
    try {
      const observation = await observe();
      const diagnosis = await diagnose(observation);
      
      if (!diagnosis.healthy) {
        console.log('[Scheduler] Issues detected:', diagnosis.diagnosis.length, 'issues');
        
        // Save report
        const report = generateReport(observation, diagnosis);
        const reportPath = saveReport(report);
        console.log('[Scheduler] Report saved:', reportPath);
        
        // Email notification (if configured)
        if (this.config.emailOnIssues && this.config.emailAddress) {
          // TODO: Implement email notification
          console.log('[Scheduler] Would send email to:', this.config.emailAddress);
        }
      } else {
        console.log('[Scheduler] System healthy');
      }
    } catch (error) {
      console.error('[Scheduler] Health check failed:', error);
    }
  }
  
  start(): void {
    if (this.intervalId) {
      this.stop();
    }
    
    if (!this.config.enabled) {
      console.log('[Scheduler] Scheduled health checks disabled');
      return;
    }
    
    console.log(`[Scheduler] Starting health checks every ${this.config.interval} minutes`);
    
    // Run immediately
    this.runHealthCheck();
    
    // Schedule recurring
    this.intervalId = setInterval(() => {
      this.runHealthCheck();
    }, this.config.interval * 60 * 1000);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Scheduler] Stopped health checks');
    }
  }
  
  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    if (this.config.enabled) {
      this.start();
    } else {
      this.stop();
    }
  }
  
  getConfig(): ScheduleConfig {
    return { ...this.config };
  }
}

export const scheduler = new HealthCheckScheduler();
