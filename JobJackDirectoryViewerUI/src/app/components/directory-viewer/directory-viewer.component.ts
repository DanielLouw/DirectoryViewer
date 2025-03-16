import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DirectoryService } from '../../services/directory.service';
import { File, SortOption, FilterOption, SortField, SortOrder } from '../../models/file.model';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import { environment } from '../../../environments/environment';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectoryControlsComponent } from '../directory-controls/directory-controls.component';
import { DirectoryTableComponent } from '../directory-table/directory-table.component';
import { DirectoryPaginationComponent } from '../directory-pagination/directory-pagination.component';

@Component({
  selector: 'app-directory-viewer',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
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
  filterForm: FormGroup;
  private searchTerms = new Subject<string>();
  isFilterPanelVisible: boolean = false;
  currentFilters: FilterOption = {};
  
  // Performance metrics
  loadTime: number = 0;

  constructor(
    private directoryService: DirectoryService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      nameContains: [''],
      isDirectory: [null],
      minSize: [null],
      maxSize: [null],
      extension: ['']
    });

    this.searchTerms.pipe(      
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      this.filterForm.patchValue({ nameContains: term });
      this.applyFilters();
    });
  }

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
    if (this.currentSort.field === field) {
      this.currentSort.order = this.currentSort.order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    } else {
      this.currentSort = { field, order: SortOrder.ASC };
    }
    this.currentPage = 1;
    this.loadDirectory();
  }

  onSearch(term: string): void {
    this.searchTerms.next(term);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadDirectory();
  }

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

  getFilterValues(): FilterOption {
    const formValues = this.filterForm.value;
    const filter: FilterOption = {};
    
    if (formValues.nameContains) filter.nameContains = formValues.nameContains;
    if (formValues.isDirectory !== null) filter.isDirectory = formValues.isDirectory;
    if (formValues.minSize) filter.minSize = Number(formValues.minSize);
    if (formValues.maxSize) filter.maxSize = Number(formValues.maxSize);
    if (formValues.extension) filter.extension = formValues.extension;
    
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