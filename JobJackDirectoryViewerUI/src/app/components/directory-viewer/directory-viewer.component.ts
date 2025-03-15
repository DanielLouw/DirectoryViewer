import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DirectoryService } from '../../services/directory.service';
import { File, SortField, SortOrder, SortOption, FilterOption } from '../../models/file.model';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import { environment } from '../../../environments/environment';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-directory-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FileSizePipe],
  templateUrl: './directory-viewer.component.html',
  styleUrls: ['./directory-viewer.component.scss']
})
export class DirectoryViewerComponent implements OnInit, OnDestroy {
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
  sortOptions: SortOption = {
    field: SortField.IS_DIRECTORY,
    order: SortOrder.DESC
  };
  
  // Filtering
  filterForm: FormGroup;
  private searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Toggle filter panel
  isFilterPanelVisible: boolean = false;
  
  // Performance metrics
  loadTime: number = 0;
  
  // Available sort fields for the dropdown
  sortFields = [
    { value: SortField.NAME, label: 'Name' },
    { value: SortField.SIZE, label: 'Size' },
    { value: SortField.CREATED_AT, label: 'Created Date' },
    { value: SortField.EXTENSION, label: 'Extension' },
    { value: SortField.IS_DIRECTORY, label: 'Type (Directory/File)' }
  ];
  
  // Available sort orders for the dropdown
  sortOrders = [
    { value: SortOrder.ASC, label: 'Ascending' },
    { value: SortOrder.DESC, label: 'Descending' }
  ];

  constructor(
    private directoryService: DirectoryService,
    private fb: FormBuilder
  ) {
    // Initialize filter form
    this.filterForm = this.fb.group({
      nameContains: [''],
      isDirectory: [null],
      minSize: [null],
      maxSize: [null],
      extension: ['']
    });
  }

  ngOnInit(): void {
    // Detect if user is likely on Windows
    this.isWindowsPath = navigator.platform.indexOf('Win') > -1;
    
    // Use the environment flag to determine if running in Docker
    this.isRunningInDocker = this.detectDockerEnvironment();
    console.log(`Running in Docker: ${this.isRunningInDocker}`);
    
    // Start with user's home directory or a default path
    this.currentPath = this.getDefaultPath();
    
    // Set up debounced search
    this.searchTerms.pipe(
      takeUntil(this.destroy$),
      debounceTime(300), // Wait for 300ms after the last event
      distinctUntilChanged() // Only emit if value is different from previous
    ).subscribe(term => {
      this.filterForm.patchValue({ nameContains: term });
      this.applyFilters();
    });
    
    // Load initial directory
    this.loadDirectory();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Detect if we're running in a Docker environment
   * Uses the explicit flag from environment configuration
   */
  detectDockerEnvironment(): boolean {
    // Use the explicit isDocker flag from environment
    const isDocker = environment.isDocker;
    
    // Log environment details for debugging
    console.log(`Environment: ${environment.production ? 'Production' : 'Development'}`);
    console.log(`API URL: ${environment.apiUrl}`);
    console.log(`Docker flag: ${isDocker}`);
    
    return isDocker;
  }

  getDefaultPath(): string {
    // If running in Docker, always default to Linux paths
    if (this.isRunningInDocker) {
      return '/';
    }
    
    // Otherwise, provide OS-appropriate default paths
    if (this.isWindowsPath) {
      return 'C:\\Users';
    } else {
      return '/home';
    }
  }

  /**
   * Returns a hint string for the path format based on the current environment
   */
  getPathFormatHint(): string {
    if (this.isRunningInDocker) {
      return 'Enter Linux path (e.g., /)';
    }
    
    return this.isWindowsPath ? 
      'Enter Windows path (e.g., C:\\Users\\Public)' : 
      'Enter Linux path (e.g., /home/user)';
  }

  loadDirectory(): void {
    this.isLoading = true;
    this.error = null;
    const skip = (this.currentPage - 1) * this.pageSize;
    const startTime = performance.now();

    // If running in Docker and the path is a Windows path, convert it to a Linux path
    if (this.isRunningInDocker && this.currentPath.includes('\\')) {
      console.log('Windows paths are not supported in Docker environment');
      this.error = 'Windows paths are not directly accessible in Docker. Please use Linux paths (e.g., /)';
      this.isLoading = false;
      return;
    }

    // Display a hint about path format
    console.log(`Sending path to API: ${this.currentPath}`);
    
    // Get current filter values
    const filter: FilterOption = this.getFilterValues();
    
    this.directoryService.getDirectoryListing(
      this.currentPath, 
      skip, 
      this.pageSize, 
      this.sortOptions, 
      Object.keys(filter).length > 0 ? filter : undefined
    )
      .subscribe({
        next: (result) => {
          this.items = result.items;
          this.totalItems = result.totalCount;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.isLoading = false;
          this.loadTime = performance.now() - startTime;
          console.log(`Directory loaded in ${this.loadTime.toFixed(2)}ms`);
          
          if (result.error) {
            this.error = result.error;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.error = 'Failed to load directory contents: ' + (error.message || 'Unknown error');
          console.error('Error loading directory:', error);
        }
      });
  }

  navigateToDirectory(item: File): void {
    if (item.isDirectory) {
      this.currentPath = item.path;
      this.currentPage = 1; // Reset to first page when navigating
      this.loadDirectory();
    }
  }

  navigateToParent(): void {
    // If running in Docker, always use Linux path format
    if (this.isRunningInDocker) {
      if (this.currentPath === '/') {
        return; // Already at root
      }
      
      // Remove trailing slash if present
      let path = this.currentPath;
      if (path.endsWith('/')) {
        path = path.slice(0, -1);
      }
      
      // Get parent directory
      const lastSeparatorIndex = path.lastIndexOf('/');
      if (lastSeparatorIndex > 0) {
        this.currentPath = path.substring(0, lastSeparatorIndex);
      } else {
        this.currentPath = '/';
      }
      
      this.currentPage = 1;
      this.loadDirectory();
      return;
    }
    
    // Use the appropriate separator based on the path format
    const isWindowsPath = this.currentPath.includes('\\');
    const separator = isWindowsPath ? '\\' : '/';
    
    // Handle root directory cases
    if (this.currentPath === '/' || 
        (isWindowsPath && this.currentPath.match(/^[A-Z]:\\$/i))) {
      return; // Already at root
    }
    
    // Remove trailing slash if present
    let path = this.currentPath;
    if (path.endsWith(separator)) {
      path = path.slice(0, -1);
    }
    
    // Get parent directory
    const lastSeparatorIndex = path.lastIndexOf(separator);
    if (lastSeparatorIndex > 0) {
      this.currentPath = path.substring(0, lastSeparatorIndex);
      // For Windows, ensure drive letter has trailing backslash
      if (isWindowsPath && this.currentPath.match(/^[A-Z]:$/i)) {
        this.currentPath += '\\';
      }
    } else if (isWindowsPath) {
      // If we're at a drive root (e.g., C:\Users), go to drive list
      this.currentPath = 'C:\\';
    } else {
      // If we're at a Unix path like /home, go to root
      this.currentPath = '/';
    }
    
    this.currentPage = 1;
    this.loadDirectory();
  }

  navigateToRoot(): void {
    // If running in Docker, always use Linux root
    if (this.isRunningInDocker) {
      this.currentPath = '/';
    } else {
      // Use the appropriate root path based on detected OS
      this.currentPath = this.isWindowsPath ? 'C:\\' : '/';
    }
    
    this.currentPage = 1;
    this.loadDirectory();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDirectory();
    }
  }
  
  // Handle sorting
  setSortField(field: SortField): void {
    if (this.sortOptions.field === field) {
      // Toggle order if same field
      this.sortOptions.order = this.sortOptions.order === SortOrder.ASC ? 
        SortOrder.DESC : SortOrder.ASC;
    } else {
      // Set new field with default order
      this.sortOptions.field = field;
      this.sortOptions.order = SortOrder.ASC;
    }
    
    this.currentPage = 1; // Reset to first page
    this.loadDirectory();
  }
  
  // Get sort icon
  getSortIcon(field: SortField): string {
    if (this.sortOptions.field !== field) {
      return '';
    }
    return this.sortOptions.order === SortOrder.ASC ? '↑' : '↓';
  }
  
  // Handle search input
  onSearch(term: string): void {
    this.searchTerms.next(term);
  }
  
  // Apply filters
  applyFilters(): void {
    this.currentPage = 1; // Reset to first page
    this.loadDirectory();
  }
  
  // Reset filters
  resetFilters(): void {
    this.filterForm.reset({
      nameContains: '',
      isDirectory: null,
      minSize: null,
      maxSize: null,
      extension: ''
    });
    this.currentPage = 1;
    this.loadDirectory();
  }
  
  // Get filter values
  getFilterValues(): FilterOption {
    const formValues = this.filterForm.value;
    const filter: FilterOption = {};
    
    if (formValues.nameContains) {
      filter.nameContains = formValues.nameContains;
    }
    
    if (formValues.isDirectory !== null) {
      filter.isDirectory = formValues.isDirectory;
    }
    
    if (formValues.minSize) {
      filter.minSize = Number(formValues.minSize);
    }
    
    if (formValues.maxSize) {
      filter.maxSize = Number(formValues.maxSize);
    }
    
    if (formValues.extension) {
      filter.extension = formValues.extension;
    }
    
    return filter;
  }

  formatFileSize(size: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }
    return `${size.toFixed(2)} ${units[index]}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  // Toggle filter panel
  toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }
} 