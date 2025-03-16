import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-directory-controls',
  standalone: true,
  imports: [],
  templateUrl: './directory-controls.component.html',
  styleUrl: './directory-controls.component.scss'
})

export class DirectoryControlsComponent {
  @Input() currentPath: string = '';
  @Input() isLoading: boolean = false;
  @Input() isRunningInDocker: boolean = false;

  @Output() pathChange = new EventEmitter<string>();
  @Output() loadDirectory = new EventEmitter<void>();
  @Output() navigateToParent = new EventEmitter<void>();
  @Output() navigateToRoot = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<any>();
  @Output() search = new EventEmitter<string>();

  filterForm: FormGroup;
  isFilterPanelVisible = false;
  
  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      nameContains: [''],
      isDirectory: [null],
      extension: [''],
      minSize: [null],
      maxSize: [null]
    });

    this.filterForm.get('nameContains')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((value) => {
      this.onSearch(value);
    });

  }  

  onSearch(value: string) {
    const filters = this.filterForm.value;
    filters.nameContains = value;
    this.filterChange.emit(filters);
  }

  onFilterChange() {
    this.filterChange.emit(this.filterForm.value);
  }

  onPathChange(value: string) {
    this.pathChange.emit(value);
  }

  onLoadDirectory() {
    this.loadDirectory.emit();
  }

  onNavigateToParent() {
    this.navigateToParent.emit();
  }

  onNavigateToRoot() {
    this.navigateToRoot.emit();
  }

  toggleFilterPanel() {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }

  resetFilters() {
    this.filterForm.reset();
    this.onFilterChange();
  }

  getPathFormationHint(): string {    
      return this.isRunningInDocker ? 'Enter Linux-style path (e.g., /etc' : 'Enter Windows-style path (e.g. c:\\Users)';    
  }  
}
