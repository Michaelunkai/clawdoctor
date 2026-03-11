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
    
    const sendProgress = (msg: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message: msg })}\n\n`);
    };
    
    try {
      // Step 1: Observe
      sendProgress('🔍 Collecting system information...');
      const observation = await observe(sendProgress);
      
      // Step 2: Diagnose
      sendProgress('🤔 Analyzing with AI...');
      const diagnosis = await diagnose(observation, sendProgress);
      
      // Send diagnosis result
      res.write(`data: ${JSON.stringify({ type: 'diagnosis', data: diagnosis })}\n\n`);
      
      // If healthy, we're done
      if (diagnosis.healthy) {
        res.write(`data: ${JSON.stringify({ type: 'complete', success: true })}\n\n`);
        res.end();
        return;
      }
      
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error.message || 'Unknown error' 
      })}\n\n`);
      res.end();
    }
  });
  
  // Execute fix endpoint
  app.post('/api/execute', async (req, res) => {
    try {
      const { optionId, steps } = req.body;
      
      const sendProgress = (msg: string) => {
        // Can't use SSE here, just log
        console.log(msg);
      };
      
      const result = await execute(steps, sendProgress);
      
      // Verify the fix
      const verification = await verify(sendProgress);
      
      res.json({ success: result.success, verification });
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
