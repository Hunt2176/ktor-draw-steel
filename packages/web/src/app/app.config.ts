import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { DrawSteelTitleStrategy } from './core/title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    { provide: TitleStrategy, useClass: DrawSteelTitleStrategy },
  ],
};
