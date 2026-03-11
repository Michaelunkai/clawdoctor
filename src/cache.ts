import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export class DiagnosticCache {
  private cacheDir: string;
  
  constructor() {
    this.cacheDir = path.join(os.homedir(), '.openclaw', 'clawdoctor-cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
  
  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 min default
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    const filePath = path.join(this.cacheDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry));
  }
  
  get<T>(key: string): T | null {
    const filePath = path.join(this.cacheDir, `${key}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        fs.unlinkSync(filePath);
        return null;
      }
      
      return entry.data;
    } catch {
      return null;
    }
  }
  
  clear(): void {
    if (fs.existsSync(this.cacheDir)) {
      const files = fs.readdirSync(this.cacheDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(this.cacheDir, file));
      });
    }
  }
  
  clearExpired(): void {
    if (!fs.existsSync(this.cacheDir)) return;
    
    const files = fs.readdirSync(this.cacheDir);
    files.forEach(file => {
      const filePath = path.join(this.cacheDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const entry: CacheEntry<any> = JSON.parse(content);
        
        if (Date.now() - entry.timestamp > entry.ttl) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    });
  }
}

export const diagCache = new DiagnosticCache();
