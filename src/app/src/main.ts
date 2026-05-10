import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AppComponent } from './ng/app.component';
import { appRoutes } from './ng/app.routes';

bootstrapApplication(AppComponent, {
    providers: [provideRouter(appRoutes), provideAnimations()],
}).catch((error) => {
    console.error('Angular bootstrap failed', error);
});
