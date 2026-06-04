import { Injectable, signal } from '@angular/core';

/**
 * Global error surface. Mirrors the original `ErrorContext` + error modal:
 * mutations push an error here and the root component shows it in a modal.
 */
@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly error = signal<unknown>(undefined);

  set(error: unknown): void {
    this.error.set(error);
  }

  clear(): void {
    this.error.set(undefined);
  }
}
