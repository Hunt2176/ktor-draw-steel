import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  faCheck,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { IconComponent } from './icon.component';
import { ToastService, type Toast } from '../core/toast.service';

/** Maps a toast kind to its leading icon. */
const KIND_ICON: Record<Toast['kind'], IconDefinition> = {
  success: faCheck,
  info: faCircleInfo,
  error: faTriangleExclamation,
};

/**
 * Fixed, stacked toast viewport pinned to the bottom-right. Renders one glass
 * chip per active toast with a kind-coloured leading icon, the message, and a
 * dismiss control. The container is an `aria-live="polite"` status region so
 * assistive tech announces new toasts without stealing focus.
 */
@Component({
  selector: 'ds-toasts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      class="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-full max-w-sm flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      @for (toast of toasts(); track toast.id) {
        <div
          class="ds-toast glass pointer-events-auto flex items-start gap-3 rounded-lg border border-m-dark-4 p-3 shadow-ds-2"
          [class.ds-toast--error]="toast.kind === 'error'"
        >
          <span class="mt-0.5 shrink-0" [class]="iconClass(toast.kind)">
            <app-icon [name]="iconFor(toast.kind)" />
          </span>
          <p
            class="ds-toast__msg max-h-40 min-w-0 flex-1 overflow-auto whitespace-pre-wrap break-words text-sm text-m-dark-0"
          >
            {{ toast.message }}
          </p>
          <button
            type="button"
            class="shrink-0 text-m-dark-1 transition-colors hover:text-m-dark-0"
            aria-label="Dismiss notification"
            (click)="dismiss(toast.id)"
          >
            <app-icon [name]="xmark" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes ds-toast-in {
        from {
          opacity: 0;
          transform: translateY(0.5rem) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .ds-toast {
        animation: ds-toast-in 0.18s ease-out;
      }
      .ds-toast--error {
        border-color: color-mix(in srgb, var(--color-m-red) 55%, var(--color-m-dark-4));
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-toast {
          animation: none;
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  protected readonly toast = inject(ToastService);
  protected readonly toasts = computed(() => this.toast.toasts());
  protected readonly xmark = faXmark;

  /** Resolve the leading icon for a toast kind. */
  protected iconFor(kind: Toast['kind']): IconDefinition {
    return KIND_ICON[kind];
  }

  /** Kind-specific colour class for the leading icon. */
  protected iconClass(kind: Toast['kind']): string {
    switch (kind) {
      case 'success':
        return 'text-m-green';
      case 'error':
        return 'text-m-red';
      default:
        return 'text-ds-accent';
    }
  }

  /** Forward a dismiss request to the service. */
  protected dismiss(id: number): void {
    this.toast.dismiss(id);
  }
}
