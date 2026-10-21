import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponente } from './app/app.component';

bootstrapApplication(AppComponente, appConfig).catch((err) => console.error(err));
