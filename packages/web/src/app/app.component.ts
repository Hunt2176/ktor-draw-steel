import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { ModalComponent } from './ui/modal.component';
import { ButtonComponent } from './ui/button.component';
import { IconComponent } from './ui/icon.component';
import { DsHeaderComponent } from './ui/ds-header.component';
import { ErrorService } from './core/error.service';

/** Root shell: persistent header, routed views, and the global error modal. */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ModalComponent, ButtonComponent, IconComponent, DsHeaderComponent],
  template: `
    @if (showHeader()) {
      <ds-header />
    }
    <router-outlet />
    <app-modal title="Error" [opened]="hasError()" (closed)="errors.clear()">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-ds-ember">
          <app-icon [name]="warningIcon" />
        </span>
        <p class="whitespace-pre-wrap break-words">{{ message() }}</p>
      </div>
      <div class="mt-4 flex justify-end">
        <app-button color="red" (clicked)="errors.clear()">Dismiss</app-button>
      </div>
    </app-modal>
  `,
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly errors = inject(ErrorService);
  protected readonly warningIcon = faTriangleExclamation;

  /** Current URL, kept in sync with navigation so the header can hide itself. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Hide the global header on the fullscreen display route. */
  protected readonly showHeader = computed(() => !this.url().split('?')[0].endsWith('/display'));

  protected readonly hasError = computed(() => this.errors.error() != null);
  protected readonly message = computed(() => {
    const err = this.errors.error();
    if (err == null) return '';
    if (err instanceof Error) return err.message;
    return String(err);
  });
}
