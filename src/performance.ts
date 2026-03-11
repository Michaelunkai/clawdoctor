export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTiming(label: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      const times = this.metrics.get(label)!;
      times.push(duration);
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
    };
  }
  
  getStats(label: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return null;
    
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { avg, min, max, count: times.length };
  }
  
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      if (times.length > 0) {
        const sum = times.reduce((a, b) => a + b, 0);
        stats[label] = {
          avg: Math.round(sum / times.length),
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length,
          last: times[times.length - 1]
        };
      }
    }
    
    return stats;
  }
  
  reset(): void {
    this.metrics.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();
