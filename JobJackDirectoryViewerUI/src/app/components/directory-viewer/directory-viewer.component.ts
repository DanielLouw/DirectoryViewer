import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DirectoryService } from '../../services/directory.service';
import { File, SortOption, FilterOption, SortField, SortOrder } from '../../models/file.model';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectoryControlsComponent } from '../directory-controls/directory-controls.component';
import { DirectoryTableComponent } from '../directory-table/directory-table.component';
import { DirectoryPaginationComponent } from '../directory-pagination/directory-pagination.component';

@Component({
  selector: 'app-directory-viewer',
  standalone: true,
  imports: [
    CommonModule, 
    FileSizePipe,
    DirectoryControlsComponent,
    DirectoryTableComponent,
    DirectoryPaginationComponent
  ],
  templateUrl: './directory-viewer.component.html',
  styleUrls: ['./directory-viewer.component.scss'],
})
export class DirectoryViewerComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  currentPath: string = '';
  items: File[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalItems: number = 0;
  totalPages: number = 0;

  // Path format helper
  isWindowsPath: boolean = false;
  isRunningInDocker: boolean = false;
  
  // Sorting
  sortFields = [
    { label: 'Name', value: SortField.NAME },
    { label: 'Size', value: SortField.SIZE },
    { label: 'Created', value: SortField.CREATED_AT },
    { label: 'Type', value: SortField.EXTENSION },
    { label: 'Is Directory', value: SortField.IS_DIRECTORY }
  ];

  currentSort: SortOption = {
    field: SortField.IS_DIRECTORY,
    order: SortOrder.DESC
  };
  
  // Filtering
  isFilterPanelVisible: boolean = false;
  currentFilters: FilterOption = {};
  
  // Performance metrics
  loadTime: number = 0;

  constructor(
    private directoryService: DirectoryService
  ) {}

  ngOnInit(): void {
    this.isWindowsPath = navigator.platform.indexOf('Win') > -1;
    this.isRunningInDocker = this.detectDockerEnvironment();
    this.currentPath = this.getDefaultPath();
    this.loadDirectory();
  }

  detectDockerEnvironment(): boolean {
    return environment.isDocker;
  }

  getDefaultPath(): string {
    if (this.isRunningInDocker) {
      return '/';
    }
    return this.isWindowsPath ? 'C:\\Users' : '/home';
  }

  loadDirectory(): void {
    this.isLoading = true;
    this.error = null;
    const skip = (this.currentPage - 1) * this.pageSize;
    const startTime = performance.now();

    if (this.isRunningInDocker && this.currentPath.includes('\\')) {
      this.error = 'Windows paths are not directly accessible in Docker. Please use Linux paths (e.g., /)';
      this.isLoading = false;
      return;
    }

    const filter: FilterOption = this.getFilterValues();
    
    console.log('Loading directory with sort:', JSON.stringify(this.currentSort));
    
    this.directoryService.getDirectoryListing(
      this.currentPath, 
      skip, 
      this.pageSize, 
      this.currentSort,
      Object.keys(filter).length > 0 ? filter : undefined
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        console.log('API response:', result);
        this.items = result.items;
        this.totalItems = result.totalItems;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.isLoading = false;
        this.loadTime = performance.now() - startTime;
        
        if (result.error) {
          this.error = result.error;
        }
      },
      error: (error) => {
        console.error('API error:', error);
        this.isLoading = false;
        this.error = 'Failed to load directory contents: ' + (error.message || 'Unknown error');
      }
    });
  }

  navigateToDirectory(item: File): void {
    if (item.isDirectory) {
      this.currentPath = item.path;
      this.currentPage = 1;
      this.loadDirectory();
    }
  }

  navigateToParent(): void {
    if (this.isRunningInDocker) {
      if (this.currentPath === '/') return;
      
      let path = this.currentPath;
      if (path.endsWith('/')) {
        path = path.slice(0, -1);
      }
      
      const lastSeparatorIndex = path.lastIndexOf('/');
      if (lastSeparatorIndex > 0) {
        this.currentPath = path.substring(0, lastSeparatorIndex);
      } else {
        this.currentPath = '/';
      }
    } else {
      const isWindowsPath = this.currentPath.includes('\\');
      const separator = isWindowsPath ? '\\' : '/';
      
      if (this.currentPath === '/' || 
          (isWindowsPath && this.currentPath.match(/^[A-Z]:\\$/i))) {
        return;
      }
      
      let path = this.currentPath;
      if (path.endsWith(separator)) {
        path = path.slice(0, -1);
      }
      
      const lastSeparatorIndex = path.lastIndexOf(separator);
      if (lastSeparatorIndex > 0) {
        this.currentPath = path.substring(0, lastSeparatorIndex);
        if (isWindowsPath && this.currentPath.match(/^[A-Z]:$/i)) {
          this.currentPath += '\\';
        }
      } else if (isWindowsPath) {
        this.currentPath = 'C:\\';
      } else {
        this.currentPath = '/';
      }
    }
    
    this.currentPage = 1;
    this.loadDirectory();
  }

  navigateToRoot(): void {
    this.currentPath = this.isRunningInDocker ? '/' : (this.isWindowsPath ? 'C:\\' : '/');
    this.currentPage = 1;
    this.loadDirectory();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDirectory();
    }
  }

  setSortField(field: SortField): void {
    console.log('setSortField called with:', field);
    console.log('Current sort before update:', JSON.stringify(this.currentSort));
    
    if (this.currentSort.field === field) {
      this.currentSort.order = this.currentSort.order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    } else {
      this.currentSort = { field, order: SortOrder.ASC };
    }
    
    console.log('Current sort after update:', JSON.stringify(this.currentSort));
    this.currentPage = 1;
    this.loadDirectory();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadDirectory();
  }

  resetFilters(): void {
    this.currentFilters = {};
    this.currentPage = 1;
    this.loadDirectory();
  }

  getFilterValues(): FilterOption {
    const filter: FilterOption = {};
    
    if (this.currentFilters.nameContains) filter.nameContains = this.currentFilters.nameContains;
    if (this.currentFilters.isDirectory !== null) filter.isDirectory = this.currentFilters.isDirectory;
    if (this.currentFilters.minSize) filter.minSize = Number(this.currentFilters.minSize);
    if (this.currentFilters.maxSize) filter.maxSize = Number(this.currentFilters.maxSize);
    if (this.currentFilters.extension) filter.extension = this.currentFilters.extension;
    
    return filter;
  }

  onFilterChange(filters: FilterOption): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.loadDirectory();
  }

  onPathChange(path: string): void {
    this.currentPath = path;
  }
}