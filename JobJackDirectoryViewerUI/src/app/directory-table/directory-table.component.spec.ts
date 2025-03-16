import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoryTableComponent } from './directory-table.component';

describe('DirectoryTableComponent', () => {
  let component: DirectoryTableComponent;
  let fixture: ComponentFixture<DirectoryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoryTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DirectoryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
