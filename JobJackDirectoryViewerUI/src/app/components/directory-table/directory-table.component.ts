import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { File, SortField, SortOption, SortOrder } from '../../models/file.model';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-directory-table',
  standalone: true,
  imports: [CommonModule, FileSizePipe],
  templateUrl: './directory-table.component.html',
  styleUrls: ['./directory-table.component.scss']
})
export class DirectoryTableComponent {
  @Input() items: File[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() totalItems: number = 0;
  @Input() loadTime: number = 0;
  @Input() sortFields: { label: string; value: SortField }[] = [];
  @Input() currentSort: SortOption = { field: SortField.NAME, order: SortOrder.ASC };
  
  @Output() navigate = new EventEmitter<File>();
  @Output() sortChange = new EventEmitter<SortField>();

  // Make SortField enum available in the template
  SortField = SortField;

  getSortIcon(field: SortField): string {
    if (this.currentSort.field !== field) {
      return '';
    }
    
    return this.currentSort.order === SortOrder.ASC ? '↑' : '↓';
  }

  onNavigate(item: File) {
    this.navigate.emit(item);
  }

  onSort(field: SortField) {
    console.log('Sort clicked:', field);
    this.sortChange.emit(field);
  }
} 