import * as fs from 'fs/promises';
import * as path from 'path';
import { File, DirectoryResult, SortOption, FilterOption, SortField, SortOrder } from '../types/file';

function getDockerPath(inputPath: string): string {
    const isDocker = process.env.NODE_ENV === 'production';
    
    if (!isDocker) {
        return inputPath; 
    }
        
    if (/^[A-Za-z]:[\\\/]/.test(inputPath)) {
        const driveLetter = inputPath.charAt(0).toLowerCase();
        
        if (inputPath.match(/^[A-Za-z]:[\\\/]?$/)) {
            return `/host/${driveLetter}`;
        }
        
        let restOfPath = inputPath.slice(2).replace(/\\/g, '/');
        restOfPath = restOfPath.replace(/\/+$/, ''); 
        
        const result = `/host/${driveLetter}${restOfPath}`;
        return result;
    }
    
    let result = `/host${inputPath.startsWith('/') ? '' : '/'}${inputPath}`;
    result = result.replace(/\/+$/, ''); 
    return result;
}

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
        return null;
    }
}

function applyFilters(files: File[], filter?: FilterOption): File[] {
    if (!filter) return files;
    
    return files.filter(file => {
        if (filter.nameContains && !file.name.toLowerCase().includes(filter.nameContains.toLowerCase())) {
            return false;
        }
        
        if (filter.isDirectory !== undefined && file.isDirectory !== filter.isDirectory) {
            return false;
        }
        
        if (!file.isDirectory) {
            if (filter.minSize !== undefined && file.size < filter.minSize) {
                return false;
            }
            if (filter.maxSize !== undefined && file.size > filter.maxSize) {
                return false;
            }
        }
        
        if (!file.isDirectory && filter.extension && 
            (!file.extension || !file.extension.toLowerCase().endsWith(filter.extension.toLowerCase()))) {
            return false;
        }
        
        return true;
    });
}

function sortFiles(files: File[], sortOption?: SortOption): File[] {
    console.log('Sorting files with option:', sortOption);
    
    if (!sortOption) {
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
                if (a.isDirectory && !b.isDirectory) comparison = -1;
                else if (!a.isDirectory && b.isDirectory) comparison = 1;
                else comparison = a.size - b.size;
                break;
            case SortField.CREATED_AT:
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
            case SortField.EXTENSION:
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
        
        const result = sortOption.order === SortOrder.ASC ? comparison : -comparison;
        return result;
    });
}

async function processFilesBatch(
    files: string[], 
    dockerPath: string, 
    dirPath: string, 
    skip: number, 
    limit: number,
    sortBy?: SortOption,
    filter?: FilterOption
): Promise<{items: File[], totalCount: number}> {
    console.log('Processing files batch with sort:', sortBy);
    
    const fileDetailsPromises = files.map(file => 
        getFileStats(path.join(dockerPath, file), file, dirPath)
    );
    
    const allFileDetails = (await Promise.all(fileDetailsPromises)).filter(file => file !== null) as File[];
    
    const filteredFiles = applyFilters(allFileDetails, filter);
    
    const sortedFiles = sortFiles(filteredFiles, sortBy);
    
    const paginatedItems = sortedFiles.slice(skip, skip + limit);
    
    return {
        items: paginatedItems,
        totalCount: filteredFiles.length
    };
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
            console.log('directoryListing called with:', { dirPath, skip, limit, sortBy, filter });
            
            try {
                const dockerPath = getDockerPath(dirPath);
                
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
                    return {
                        items: [],
                        totalCount: 0,
                        error: `Cannot access directory: ${error.code === 'ENOENT' ? 'Directory not found' : 'Permission denied'}`
                    };
                }
                
                let files: string[] = [];
                try {
                    files = await fs.readdir(dockerPath);
                } catch (error: any) {
                    return {
                        items: [],
                        totalCount: 0,
                        error: `Cannot read directory: ${error.code === 'EPERM' ? 'Permission denied' : error.message}`
                    };
                }
                
                const result = await processFilesBatch(files, dockerPath, dirPath, skip, limit, sortBy, filter);
                
                return {
                    items: result.items,
                    totalCount: result.totalCount
                };
            } catch (error: any) {
                return {
                    items: [],
                    totalCount: 0,
                    error: `Failed to read directory: ${error.message}`
                };
            }
        }
    }
}; 