import { Routes } from '@angular/router';
import { DirectoryViewerComponent } from './components/directory-viewer/directory-viewer.component';

export const routes: Routes = [
  { path: '', component: DirectoryViewerComponent },
  { path: '**', redirectTo: '' }
];
