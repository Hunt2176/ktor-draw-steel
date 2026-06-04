import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalComponent } from './ui/modal.component';
import { ErrorService } from './core/error.service';

/** Root shell: routed views plus the global error modal. */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ModalComponent],
  template: `
    <router-outlet />
    <app-modal title="Error" [opened]="hasError()" (closed)="errors.clear()">
      <p class="whitespace-pre-wrap break-words">{{ message() }}</p>
    </app-modal>
  `,
})
export class AppComponent {
  protected readonly errors = inject(ErrorService);
  protected readonly hasError = computed(() => this.errors.error() != null);
  protected readonly message = computed(() => {
    const err = this.errors.error();
    if (err == null) return '';
    if (err instanceof Error) return err.message;
    return String(err);
  });
}
