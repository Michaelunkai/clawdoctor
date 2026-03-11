import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Backup {
  id: string;
  timestamp: string;
  type: 'file' | 'directory' | 'state';
  originalPath: string;
  backupPath: string;
  metadata?: Record<string, any>;
}

export class BackupManager {
  private backupDir: string;
  private backups: Map<string, Backup>;
  
  constructor() {
    this.backupDir = path.join(os.homedir(), '.openclaw', 'clawdoctor-backups');
    this.backups = new Map();
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  /**
   * Create a backup of a file before modifying it
   */
  async backupFile(filePath: string, metadata?: Record<string, any>): Promise<string | null> {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      const backupFilename = `${backupId}${path.extname(filePath)}`;
      const backupPath = path.join(this.backupDir, backupFilename);
      
      // Copy file to backup location
      fs.copyFileSync(filePath, backupPath);
      
      // Store backup metadata
      const backup: Backup = {
        id: backupId,
        timestamp,
        type: 'file',
        originalPath: filePath,
        backupPath,
        metadata
      };
      
      this.backups.set(backupId, backup);
      
      // Save manifest
      this.saveManifest();
      
      return backupId;
    } catch (error: any) {
      console.error('Backup failed:', error.message);
      return null;
    }
  }
  
  /**
   * Create a state backup (for non-file operations like service restarts)
   */
  async backupState(stateName: string, stateData: any): Promise<string> {
    const backupId = `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const backupPath = path.join(this.backupDir, `${backupId}.json`);
    
    const backup: Backup = {
      id: backupId,
      timestamp,
      type: 'state',
      originalPath: stateName,
      backupPath,
      metadata: stateData
    };
    
    // Save state to file
    fs.writeFileSync(backupPath, JSON.stringify(stateData, null, 2));
    
    this.backups.set(backupId, backup);
    this.saveManifest();
    
    return backupId;
  }
  
  /**
   * Restore from a backup
   */
  async restore(backupId: string): Promise<boolean> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      console.error('Backup not found:', backupId);
      return false;
    }
    
    try {
      if (backup.type === 'file') {
        // Restore file from backup
        if (fs.existsSync(backup.backupPath)) {
          fs.copyFileSync(backup.backupPath, backup.originalPath);
          return true;
        }
      } else if (backup.type === 'state') {
        // State restoration requires manual handling
        console.log('State backup - manual restoration required');
        console.log('Backup data:', backup.metadata);
        return false;
      }
      
      return false;
    } catch (error: any) {
      console.error('Restore failed:', error.message);
      return false;
    }
  }
  
  /**
   * Get all backups
   */
  getBackups(): Backup[] {
    return Array.from(this.backups.values());
  }
  
  /**
   * Clean up old backups (keep last 20)
   */
  async cleanup(): Promise<void> {
    const backups = this.getBackups()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Keep last 20, delete older ones
    const toDelete = backups.slice(20);
    
    for (const backup of toDelete) {
      try {
        if (fs.existsSync(backup.backupPath)) {
          fs.unlinkSync(backup.backupPath);
        }
        this.backups.delete(backup.id);
      } catch (error) {
        console.error('Failed to delete backup:', backup.id);
      }
    }
    
    this.saveManifest();
  }
  
  /**
   * Save backup manifest
   */
  private saveManifest(): void {
    const manifestPath = path.join(this.backupDir, 'manifest.json');
    const manifest = {
      version: '1.0.0',
      backups: Array.from(this.backups.values())
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
  
  /**
   * Load backup manifest
   */
  private loadManifest(): void {
    const manifestPath = path.join(this.backupDir, 'manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        this.backups.clear();
        
        if (manifest.backups) {
          manifest.backups.forEach((backup: Backup) => {
            this.backups.set(backup.id, backup);
          });
        }
      } catch (error) {
        console.error('Failed to load manifest:', error);
      }
    }
  }
}

// Singleton instance
export const backupManager = new BackupManager();
