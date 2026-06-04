import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { DsHeaderComponent } from './ui/ds-header.component';
import { ToastContainerComponent } from './ui/toast-container.component';
import { ErrorService } from './core/error.service';
import { ToastService } from './core/toast.service';

/** Root shell: persistent header, routed views, and the global toast surface. */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, DsHeaderComponent, ToastContainerComponent],
  template: `
    @if (showHeader()) {
      <ds-header />
    }
    <router-outlet />
    <ds-toasts />
  `,
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly errors = inject(ErrorService);
  private readonly toasts = inject(ToastService);

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

  constructor() {
    // Surface global errors as persistent error toasts, then clear the source so
    // the same error is not re-shown on the next change-detection pass.
    effect(() => {
      const err = this.errors.error();
      if (err == null) return;
      const message = err instanceof Error ? err.message : String(err);
      this.toasts.error(message);
      this.errors.clear();
    });
  }
}
