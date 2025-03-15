import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';

// Enable production mode if in production environment
if (environment.production) {
  enableProdMode();
  console.log('Production mode enabled');
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
