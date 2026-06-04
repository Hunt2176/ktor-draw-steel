import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Modal } from './ui/modal';
import { AppShell } from './ui/app-shell';
import { ErrorService } from './core/error.service';

@Component({
  selector: 'ds-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Modal, AppShell],
  template: `
    <ds-shell>
      <router-outlet />
    </ds-shell>
    <ds-modal
      [opened]="errors.error() != null"
      title="Error"
      (closed)="errors.clear()"
    >
      <div class="whitespace-pre-wrap break-words">{{ errors.message() }}</div>
    </ds-modal>
  `,
})
export class App {
  protected readonly errors = inject(ErrorService);
}
