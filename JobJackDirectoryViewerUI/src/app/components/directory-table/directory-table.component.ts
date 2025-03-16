import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { File, SortField } from '../../models/file.model';
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
  
  @Output() navigate = new EventEmitter<File>();
  @Output() sortChange = new EventEmitter<SortField>();

  getSortIcon(field: SortField): string {
    // Implement sort icon logic here
    return ''; // Placeholder
  }

  onNavigate(item: File) {
    this.navigate.emit(item);
  }

  onSort(field: SortField) {
    this.sortChange.emit(field);
  }
} 