import * as fs from 'fs/promises';
import * as path from 'path';
import { File, DirectoryResult, SortOption, FilterOption, SortField, SortOrder } from '../types/file';
import { directoryCacheService } from '../services/cache.service';
import { fileSystemWatcherService } from '../services/watcher.service';

// Helper function to get the correct path for Docker environment
function getDockerPath(inputPath: string): string {
    // Check if we're running in Docker (NODE_ENV=production)
    const isDocker = process.env.NODE_ENV === 'production';
    
    if (!isDocker) {
        return inputPath; // Return the original path if not in Docker
    }
    
    console.log(`Converting path: ${inputPath}`);
    
    // If the path is a Windows-style absolute path (e.g., C:\Users)
    if (/^[A-Za-z]:[\\\/]/.test(inputPath)) {
        // Convert Windows path to Linux path format for Docker
        const driveLetter = inputPath.charAt(0).toLowerCase();
        
        // Handle the case where the path is just a drive letter (e.g., "C:" or "C:\")
        if (inputPath.match(/^[A-Za-z]:[\\\/]?$/)) {
            return `/host/${driveLetter}`;
        }
        
        // Normalize the path to use forward slashes and remove any trailing slash
        let restOfPath = inputPath.slice(2).replace(/\\/g, '/');
        restOfPath = restOfPath.replace(/\/+$/, ''); // Remove trailing slashes
        
        const result = `/host/${driveLetter}${restOfPath}`;
        console.log(`Converted Windows path to: ${result}`);
        return result;
    }
    
    // For relative paths or already Linux-style paths
    let result = `/host${inputPath.startsWith('/') ? '' : '/'}${inputPath}`;
    result = result.replace(/\/+$/, ''); // Remove trailing slashes
    console.log(`Converted Linux path to: ${result}`);
    return result;
}

// Helper function to get file stats with error handling
async function getFileStats(fullPath: string, fileName: string, originalPath: string): Promise<File | null> {
    try {
        const stats = await fs.stat(fullPath);
        
        return {
            name: fileName,
            path: path.join(originalPath, fileName),
            size: stats.size,
            extension: path.extname(fileName),
            createdAt: stats.birthtime.toISOString(),
            permissions: stats.mode.toString(8),
            isDirectory: stats.isDirectory(),
        };
    } catch (error) {
        console.error(`Error processing file: ${fileName}`, error);
        return null; // Return null for files that can't be accessed
    }
}

// Apply filters to file list
function applyFilters(files: File[], filter?: FilterOption): File[] {
    if (!filter) return files;
    
    return files.filter(file => {
        // Filter by name
        if (filter.nameContains && !file.name.toLowerCase().includes(filter.nameContains.toLowerCase())) {
            return false;
        }
        
        // Filter by directory
        if (filter.isDirectory !== undefined && file.isDirectory !== filter.isDirectory) {
            return false;
        }
        
        // Filter by size (only for files)
        if (!file.isDirectory) {
            if (filter.minSize !== undefined && file.size < filter.minSize) {
                return false;
            }
            if (filter.maxSize !== undefined && file.size > filter.maxSize) {
                return false;
            }
        }
        
        // Filter by extension (only for files)
        if (!file.isDirectory && filter.extension && 
            (!file.extension || !file.extension.toLowerCase().endsWith(filter.extension.toLowerCase()))) {
            return false;
        }
        
        return true;
    });
}

// Sort file list
function sortFiles(files: File[], sortOption?: SortOption): File[] {
    if (!sortOption) {
        // Default sort: directories first, then by name
        return [...files].sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
    }
    
    return [...files].sort((a, b) => {
        let comparison = 0;
        
        switch (sortOption.field) {
            case SortField.NAME:
                comparison = a.name.localeCompare(b.name);
                break;
            case SortField.SIZE:
                // Directories are always "smaller" than files for sorting purposes
                if (a.isDirectory && !b.isDirectory) comparison = -1;
                else if (!a.isDirectory && b.isDirectory) comparison = 1;
                else comparison = a.size - b.size;
                break;
            case SortField.CREATED_AT:
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
            case SortField.EXTENSION:
                // Directories have no extension
                if (a.isDirectory && !b.isDirectory) comparison = -1;
                else if (!a.isDirectory && b.isDirectory) comparison = 1;
                else comparison = (a.extension || '').localeCompare(b.extension || '');
                break;
            case SortField.IS_DIRECTORY:
                comparison = a.isDirectory === b.isDirectory ? 0 : (a.isDirectory ? -1 : 1);
                break;
            default:
                comparison = a.name.localeCompare(b.name);
        }
        
        // Apply sort order
        return sortOption.order === SortOrder.ASC ? comparison : -comparison;
    });
}

// Process files in batches to avoid memory issues
async function processFilesBatch(
    files: string[], 
    dockerPath: string, 
    dirPath: string, 
    skip: number, 
    limit: number,
    sortBy?: SortOption,
    filter?: FilterOption
): Promise<{items: File[], totalCount: number}> {
    // Process all files to get their stats
    // For very large directories, this could be optimized further
    const fileDetailsPromises = files.map(file => 
        getFileStats(path.join(dockerPath, file), file, dirPath)
    );
    
    // Wait for all promises and filter out nulls
    const allFileDetails = (await Promise.all(fileDetailsPromises)).filter(file => file !== null) as File[];
    
    // Apply filters
    const filteredFiles = applyFilters(allFileDetails, filter);
    
    // Sort files
    const sortedFiles = sortFiles(filteredFiles, sortBy);
    
    // Apply pagination
    const paginatedItems = sortedFiles.slice(skip, skip + limit);
    
    return {
        items: paginatedItems,
        totalCount: filteredFiles.length
    };
}

// Track access frequency for directories
const directoryAccessCount = new Map<string, number>();

// Helper to increment access count and start watching frequently accessed directories
function trackDirectoryAccess(dirPath: string): void {
    const currentCount = directoryAccessCount.get(dirPath) || 0;
    const newCount = currentCount + 1;
    directoryAccessCount.set(dirPath, newCount);
    
    // If this directory is frequently accessed (more than 3 times), start watching it
    if (newCount === 3) {
        fileSystemWatcherService.watchDirectory(dirPath);
    }
}

export const resolvers = {
    Query: {
        directoryListing: async (
            _: any, 
            { 
                dirPath, 
                skip = 0, 
                limit = 100,
                sortBy,
                filter
            }: {
                dirPath: string, 
                skip?: number, 
                limit?: number,
                sortBy?: SortOption,
                filter?: FilterOption
            }
        ): Promise<DirectoryResult> => {
            try {
                // Convert the path for Docker environment
                const dockerPath = getDockerPath(dirPath);
                
                // Track directory access for frequently accessed directories
                trackDirectoryAccess(dockerPath);
                
                // Validate the directory path
                try {
                    const stats = await fs.stat(dockerPath);
                    if (!stats.isDirectory()) {
                        return {
                            items: [],
                            totalCount: 0,
                            error: `Path is not a directory: ${dirPath}`
                        };
                    }
                } catch (error: any) {
                    console.error(`Error accessing directory: ${dirPath}`, error);
                    return {
                        items: [],
                        totalCount: 0,
                        error: `Cannot access directory: ${error.code === 'ENOENT' ? 'Directory not found' : 'Permission denied'}`
                    };
                }
                
                // Try to get directory listing from cache first
                let files: string[] = [];
                const cachedFiles = await directoryCacheService.getCachedDirectoryListing(dockerPath);
                
                if (cachedFiles) {
                    console.log(`Using cached directory listing for ${dirPath}`);
                    files = cachedFiles;
                } else {
                    try {
                        // Use the more efficient readdir method
                        console.log(`Reading directory contents for ${dirPath}`);
                        files = await fs.readdir(dockerPath);
                        
                        // Cache the directory listing for future requests
                        directoryCacheService.cacheDirectoryListing(dockerPath, files);
                    } catch (error: any) {
                        console.error(`Failed to read directory: ${dirPath}`, error);
                        return {
                            items: [],
                            totalCount: 0,
                            error: `Cannot read directory: ${error.code === 'EPERM' ? 'Permission denied' : error.message}`
                        };
                    }
                }
                
                // Process files with sorting and filtering
                const result = await processFilesBatch(files, dockerPath, dirPath, skip, limit, sortBy, filter);
                
                return {
                    items: result.items,
                    totalCount: result.totalCount
                };
            } catch (error: any) {
                console.error("Failed to read directory:", error);
                return {
                    items: [],
                    totalCount: 0,
                    error: `Failed to read directory: ${error.message}`
                };
            }
        },
        
        // Add a new query to get cache statistics
        cacheStats: async (): Promise<any> => {
            return directoryCacheService.getCacheStats();
        },
        
        // Add a new query to get watcher statistics
        watcherStats: async (): Promise<any> => {
            return fileSystemWatcherService.getWatcherStats();
        }
    },    
}; 