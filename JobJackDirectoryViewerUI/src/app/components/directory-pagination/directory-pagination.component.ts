import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-directory-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directory-pagination.component.html',
  styleUrls: ['./directory-pagination.component.scss']
})
export class DirectoryPaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() isLoading: boolean = false;
  
  @Output() pageChange = new EventEmitter<number>();

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && !this.isLoading) {
      this.pageChange.emit(page);
    }
  }
} 