import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StateContext } from "@services/state-context.ts";

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
	providers: [
		StateContext
	]
})
export class AppComponent {

}
