import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/** Auto-dismiss durations (ms) per kind. Errors linger a little longer. */
const DURATION: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  error: 6000,
};

/**
 * Global, zoneless-safe toast surface. Pushes are plain signal updates and the
 * auto-dismiss timers just call `dismiss`, so Angular's zoneless change
 * detection reacts to the resulting signal mutation with no extra wiring.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  /** Monotonic id source — deterministic, no Date.now()/Math.random(). */
  private nextId = 0;

  success(message: string): number {
    return this.push('success', message);
  }

  error(message: string): number {
    return this.push('error', message);
  }

  info(message: string): number {
    return this.push('info', message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string): number {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), DURATION[kind]);
    return id;
  }
}
