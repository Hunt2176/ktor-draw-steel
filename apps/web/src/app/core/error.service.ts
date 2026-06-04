import { Injectable, signal } from '@angular/core';

/** Global error surface; the root component renders a modal when set (mirrors ErrorContext). */
@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly error = signal<unknown>(undefined);

  show = (e: unknown): void => {
    this.error.set(e);
  };

  clear(): void {
    this.error.set(undefined);
  }

  message(): string {
    const e = this.error();
    if (e == null) return '';
    if (e instanceof Error) return e.message;
    return String(e);
  }
}
