import { Injectable, signal, type Signal } from '@angular/core';

/** A single transient feedback message shown in the toast viewport. */
export interface Toast {
  id: number;
  kind: 'success' | 'info' | 'error';
  message: string;
}

/** Options accepted by the generic {@link ToastService.show} entry point. */
export interface ToastOptions {
  kind: Toast['kind'];
  message: string;
  /** Auto-dismiss delay in ms. Omit to use the per-kind default; 0 disables it. */
  duration?: number;
}

/** Default auto-dismiss delay for non-error toasts (ms). */
const DEFAULT_DURATION = 4000;

/**
 * Signal-based store of active toasts. Replaces the old blocking error modal as
 * the app-wide feedback surface: success/info toasts auto-dismiss, while error
 * toasts persist until the user dismisses them. The container component renders
 * whatever sits in the `toasts` signal.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);

  /** Read-only view of the currently visible toasts, in insertion order. */
  readonly toasts: Signal<readonly Toast[]> = this._toasts.asReadonly();

  private nextId = 0;
  /** Active auto-dismiss timers, keyed by toast id, so dismiss can cancel them. */
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Show a green success toast (auto-dismisses). */
  success(message: string): number {
    return this.show({ kind: 'success', message });
  }

  /** Show an accent-coloured info toast (auto-dismisses). */
  info(message: string): number {
    return this.show({ kind: 'info', message });
  }

  /** Show a danger-styled error toast (persists until dismissed). */
  error(message: string): number {
    return this.show({ kind: 'error', message });
  }

  /**
   * Push a toast onto the stack. Non-error kinds auto-dismiss after `duration`
   * (defaulting to {@link DEFAULT_DURATION}); errors never auto-dismiss unless
   * an explicit positive `duration` is supplied. Returns the new toast's id.
   */
  show({ kind, message, duration }: ToastOptions): number {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, kind, message }]);

    const delay = duration ?? (kind === 'error' ? 0 : DEFAULT_DURATION);
    if (delay > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), delay),
      );
    }
    return id;
  }

  /** Remove a toast by id and cancel any pending auto-dismiss timer. */
  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer != null) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
