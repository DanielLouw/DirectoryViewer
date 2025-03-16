import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoryControlsComponent } from './directory-controls.component';

describe('DirectoryControlsComponent', () => {
  let component: DirectoryControlsComponent;
  let fixture: ComponentFixture<DirectoryControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoryControlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DirectoryControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
