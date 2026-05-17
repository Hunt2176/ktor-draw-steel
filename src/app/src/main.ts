import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from '@app/ng/app/app.component';
import { appRoutes } from '@app/ng/app/app.routes';

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(appRoutes),
		provideHttpClient(),
	],
}).catch((error) => {
	console.error('Angular bootstrap failed', error);
});
