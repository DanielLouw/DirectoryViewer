import * as fs from 'fs/promises';
import * as path from 'path';

interface CacheEntry {
  timestamp: number;
  totalCount: number;
  fileNames: string[];
}

/**
 * Simple in-memory cache for directory listings
 * This improves performance for frequently accessed directories
 */
class DirectoryCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of directories to cache
  private readonly CACHE_TTL = 30 * 1000; // Cache time-to-live in milliseconds (30 seconds)

  /**
   * Get cached directory listing if available and not expired
   */
  public async getCachedDirectoryListing(dirPath: string): Promise<string[] | null> {
    const entry = this.cache.get(dirPath);
    
    if (!entry) {
      return null; // Not in cache
    }
    
    // Check if cache entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(dirPath);
      return null;
    }
    
    // Check if directory has been modified since caching
    try {
      const stats = await fs.stat(dirPath);
      const modifiedTime = stats.mtime.getTime();
      
      if (modifiedTime > entry.timestamp) {
        // Directory has been modified, invalidate cache
        this.cache.delete(dirPath);
        return null;
      }
    } catch (error) {
      // If we can't access the directory, invalidate cache
      this.cache.delete(dirPath);
      return null;
    }
    
    return entry.fileNames;
  }
  
  /**
   * Cache directory listing
   */
  public cacheDirectoryListing(dirPath: string, fileNames: string[]): void {
    // Manage cache size - if we've reached the limit, remove the oldest entry
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Add new entry to cache
    this.cache.set(dirPath, {
      timestamp: Date.now(),
      totalCount: fileNames.length,
      fileNames
    });
  }
  
  /**
   * Clear the entire cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number, entries: { path: string, count: number, age: number }[] } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([path, entry]) => ({
      path,
      count: entry.totalCount,
      age: Math.round((now - entry.timestamp) / 1000) // Age in seconds
    }));
    
    return {
      size: this.cache.size,
      entries
    };
  }
}

// Export a singleton instance
export const directoryCacheService = new DirectoryCacheService(); 