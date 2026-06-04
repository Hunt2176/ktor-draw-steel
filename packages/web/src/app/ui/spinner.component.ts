import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Small CSS spinner that inherits the surrounding font-size (`1em`) and colour
 * (`currentColor`) so it sits naturally inside buttons and icon buttons. The
 * spin animation is disabled under `prefers-reduced-motion: reduce`.
 */
@Component({
  selector: 'ds-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ds-spinner" role="status" aria-hidden="true" [style.--ds-spinner-size]="size()"></span>`,
  styles: [
    `
      .ds-spinner {
        display: inline-block;
        width: var(--ds-spinner-size, 1em);
        height: var(--ds-spinner-size, 1em);
        flex-shrink: 0;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-top-color: transparent;
        animation: ds-spinner-spin 0.6s linear infinite;
      }

      @keyframes ds-spinner-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ds-spinner {
          animation: none;
        }
      }
    `,
  ],
})
export class SpinnerComponent {
  /** Optional explicit size (any CSS length). Defaults to `1em` so it scales with font-size. */
  readonly size = input<string | undefined>(undefined);
}
