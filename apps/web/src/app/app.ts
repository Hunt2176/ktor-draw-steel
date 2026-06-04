import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShell } from './ui/app-shell';
import { Toaster } from './ui/toaster';

@Component({
  selector: 'ds-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AppShell, Toaster],
  template: `
    <ds-shell>
      <router-outlet />
    </ds-shell>
    <ds-toaster />
  `,
})
export class App {}
