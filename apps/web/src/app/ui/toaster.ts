import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

/**
 * Global toast stack — fixed bottom-right, above modals (z-index 200+).
 * Reads the `ToastService.toasts` signal and renders one card per toast with a
 * kind-coloured accent and a dismiss control.
 */
@Component({
  selector: 'ds-toaster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ds-toaster" role="status" aria-live="polite" aria-atomic="false">
      @for (t of toasts(); track t.id) {
        <div class="ds-toast glass" [attr.data-kind]="t.kind">
          <span class="ds-toast-accent" aria-hidden="true"></span>
          <div class="ds-toast-message">{{ t.message }}</div>
          <button
            class="ds-toast-close"
            type="button"
            aria-label="Dismiss notification"
            (click)="toast.dismiss(t.id)"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ds-toaster {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 400;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: min(360px, calc(100vw - 2rem));
        pointer-events: none;
      }
      .ds-toast {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.65rem 0.75rem 0.65rem 1rem;
        border-radius: 0.6rem;
        border: 1px solid var(--color-dark-4);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
        overflow: hidden;
        pointer-events: auto;
        animation: ds-toast-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      .ds-toast-accent {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: var(--color-dark-2);
      }
      .ds-toast[data-kind='success'] .ds-toast-accent {
        background: var(--color-brand-green);
      }
      .ds-toast[data-kind='error'] .ds-toast-accent {
        background: var(--color-brand-red);
      }
      .ds-toast[data-kind='info'] .ds-toast-accent {
        background: var(--color-brand-blue);
      }
      .ds-toast-message {
        flex: 1 1 auto;
        font-size: 0.9rem;
        line-height: 1.35;
        color: var(--color-dark-0);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .ds-toast-close {
        flex: 0 0 auto;
        background: transparent;
        border: none;
        color: var(--color-dark-1);
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        padding: 0 0.15rem;
      }
      .ds-toast-close:hover {
        color: #fff;
      }
      @keyframes ds-toast-in {
        from {
          opacity: 0;
          transform: translateX(0.75rem) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-toast {
          animation: ds-toast-fade-in 0.12s ease-out both;
        }
        @keyframes ds-toast-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      }
    `,
  ],
})
export class Toaster {
  protected readonly toast = inject(ToastService);
  protected readonly toasts = this.toast.toasts;
}
