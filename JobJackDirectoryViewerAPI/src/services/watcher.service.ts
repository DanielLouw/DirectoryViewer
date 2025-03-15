import * as fs from 'fs';
import * as path from 'path';
import { directoryCacheService } from './cache.service';

/**
 * Service to watch for file system changes in frequently accessed directories
 * This ensures the cache stays up-to-date with the actual file system
 */
class FileSystemWatcherService {
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private readonly MAX_WATCHERS = 20; // Maximum number of directories to watch

  /**
   * Start watching a directory for changes
   */
  public watchDirectory(dirPath: string): void {
    // Don't watch if already watching
    if (this.watchers.has(dirPath)) {
      return;
    }
    
    // Limit the number of watchers
    if (this.watchers.size >= this.MAX_WATCHERS) {
      // Remove the oldest watcher
      const oldestKey = Array.from(this.watchers.keys())[0];
      this.unwatchDirectory(oldestKey);
    }
    
    try {
      console.log(`Starting file system watcher for: ${dirPath}`);
      
      const watcher = fs.watch(dirPath, { persistent: false }, (eventType, filename) => {
        console.log(`File system change detected in ${dirPath}: ${eventType} - ${filename}`);
        
        // Invalidate the cache for this directory
        directoryCacheService.clearCache();
      });
      
      // Store the watcher
      this.watchers.set(dirPath, watcher);
      
      // Handle watcher errors
      watcher.on('error', (error) => {
        console.error(`Watcher error for ${dirPath}:`, error);
        this.unwatchDirectory(dirPath);
      });
    } catch (error) {
      console.error(`Failed to watch directory ${dirPath}:`, error);
    }
  }
  
  /**
   * Stop watching a directory
   */
  public unwatchDirectory(dirPath: string): void {
    const watcher = this.watchers.get(dirPath);
    if (watcher) {
      console.log(`Stopping file system watcher for: ${dirPath}`);
      watcher.close();
      this.watchers.delete(dirPath);
    }
  }
  
  /**
   * Stop all watchers
   */
  public stopAllWatchers(): void {
    console.log(`Stopping all file system watchers (${this.watchers.size} watchers)`);
    for (const [dirPath, watcher] of this.watchers.entries()) {
      watcher.close();
    }
    this.watchers.clear();
  }
  
  /**
   * Get watcher statistics
   */
  public getWatcherStats(): { count: number, paths: string[] } {
    return {
      count: this.watchers.size,
      paths: Array.from(this.watchers.keys())
    };
  }
}

// Export a singleton instance
export const fileSystemWatcherService = new FileSystemWatcherService(); 