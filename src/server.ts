import express from 'express';
import * as path from 'path';
import { observe } from './observe';
import { diagnose } from './diagnose';
import { execute } from './execute';
import { verify } from './verify';
import { generateReport, saveReport, getRecentReports, exportReportAsMarkdown } from './report';
import { scheduler } from './scheduler';
import { perfMonitor } from './performance';
import { diagCache } from './cache';

export async function startServer(port: number): Promise<void> {
  const app = express();
  
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'web')));
  
  // SSE endpoint for real-time progress
  app.get('/api/diagnose', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const sendStep = (msg: string) => {
      res.write(`data: ${JSON.stringify({ type: 'step', data: msg })}\n\n`);
    };
    
    try {
      // Step 1: Observe
      sendStep('🔍 Checking OpenClaw installation');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      sendStep('⚙️ Verifying gateway status');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      sendStep('📝 Validating configuration files');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      sendStep('🔌 Testing network connectivity');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      sendStep('📊 Analyzing system resources');
      const observation = await observe();
      
      sendStep('🩺 Running diagnostics');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const diagnosis = await diagnose(observation);
      
      // Send diagnosis result
      res.write(`data: ${JSON.stringify({ type: 'diagnosis', data: diagnosis })}\n\n`);
      res.end();
      
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        data: error.message || 'Unknown error' 
      })}\n\n`);
      res.end();
    }
  });
  
  // Fix execution endpoint
  app.post('/api/fix', async (req, res) => {
    try {
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).json({ success: false, error: 'No command provided' });
      }
      
      // Execute the fix command
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: 60000,
          shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
        });
        
        res.json({ 
          success: true, 
          output: (stdout || stderr || 'Command executed successfully').trim()
        });
      } catch (execError: any) {
        res.json({
          success: false,
          error: execError.message,
          output: execError.stdout || execError.stderr
        });
      }
      
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

  
  // Export report endpoint
  app.post('/api/export', async (req, res) => {
    try {
      const { observation, diagnosis } = req.body;
      const report = generateReport(observation, diagnosis);
      const filepath = saveReport(report);
      res.json({ success: true, filepath });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Get recent reports
  app.get('/api/reports', async (req, res) => {
    try {
      const reports = getRecentReports(10);
      res.json({ success: true, reports });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Export report as markdown
  app.post('/api/export/markdown', async (req, res) => {
    try {
      const { observation, diagnosis } = req.body;
      const report = generateReport(observation, diagnosis);
      const markdown = exportReportAsMarkdown(report);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', 'attachment; filename="clawdoctor-report.md"');
      res.send(markdown);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Scheduler endpoints
  app.get('/api/scheduler/status', (req, res) => {
    res.json({ success: true, config: scheduler.getConfig() });
  });
  
  app.post('/api/scheduler/update', (req, res) => {
    try {
      scheduler.updateConfig(req.body);
      res.json({ success: true, config: scheduler.getConfig() });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Performance stats
  app.get('/api/performance', (req, res) => {
    res.json({ success: true, stats: perfMonitor.getAllStats() });
  });
  
  // Cache management
  app.post('/api/cache/clear', (req, res) => {
    try {
      diagCache.clear();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Start scheduler
  scheduler.start();
  
  return new Promise((resolve) => {
    app.listen(port, () => {
      resolve();
    });
  });
}
