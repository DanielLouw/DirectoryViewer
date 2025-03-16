import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-directory-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './directory-controls.component.html',
  styleUrls: ['./directory-controls.component.scss']
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

    // Set up debounced search
    this.filterForm.get('nameContains')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.onSearch(value);
      });
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

  onSearch(value: string) {
    const filters = this.filterForm.value;
    filters.nameContains = value;
    this.filterChange.emit(filters);
  }

  applyFilters() {
    this.filterChange.emit(this.filterForm.value);
  }

  resetFilters() {
    this.filterForm.reset({
      nameContains: '',
      isDirectory: null,
      extension: '',
      minSize: null,
      maxSize: null
    });
    this.filterChange.emit(this.filterForm.value);
  }

  getPathFormatHint(): string {
    return this.isRunningInDocker
      ? 'Enter Linux-style path (e.g., /etc)'
      : 'Enter path (e.g., C:\\Windows)';
  }
} 