import { Injectable, inject, signal } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Global error surface. As of ML10 errors are surfaced as non-blocking toasts
 * (see {@link ToastService}); the root component no longer renders a blocking
 * modal for them. The `error` signal + `clear()`/`message()` remain for
 * backward compatibility with the many callers of `show()`.
 */
@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly toast = inject(ToastService);

  readonly error = signal<unknown>(undefined);

  show = (e: unknown): void => {
    this.error.set(e);
    this.toast.error(this.messageFor(e));
  };

  clear(): void {
    this.error.set(undefined);
  }

  message(): string {
    return this.messageFor(this.error());
  }

  /** Normalises any thrown value into a human-readable string. */
  private messageFor(e: unknown): string {
    if (e == null) return '';
    if (e instanceof Error) return e.message;
    return String(e);
  }
}
