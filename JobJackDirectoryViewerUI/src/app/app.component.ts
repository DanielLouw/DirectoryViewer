import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DirectoryViewerComponent } from './components/directory-viewer/directory-viewer.component';
import { FileSizePipe } from './pipes/file-size.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, DirectoryViewerComponent, FileSizePipe],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Directory Viewer</h1>
      </header>
      <main>
        <app-directory-viewer></app-directory-viewer>
      </main>
      <footer class="app-footer">
        <p>&copy; 2023 Directory Viewer App</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .app-header {
      background-color: #0078d4;
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .app-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    main {
      flex: 1;
      padding: 2rem;
      background-color: #f5f5f5;
    }
    
    .app-footer {
      background-color: #f0f0f0;
      padding: 1rem 2rem;
      text-align: center;
      color: #666;
      font-size: 0.9rem;
    }
  `]
})
export class AppComponent {
  title = 'Directory Viewer';
}
