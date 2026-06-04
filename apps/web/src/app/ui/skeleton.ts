import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A shimmering placeholder block shown while content loads. */
@Component({
  selector: 'ds-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.borderRadius]': 'radius()',
    'aria-hidden': 'true',
  },
  styles: [
    `
      :host {
        display: block;
        position: relative;
        overflow: hidden;
        background: var(--color-dark-6);
      }
      :host::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          var(--color-dark-6) 0%,
          var(--color-dark-5) 50%,
          var(--color-dark-6) 100%
        );
        background-size: 200% 100%;
        animation: ds-skeleton-sweep 1.4s ease-in-out infinite;
      }
      @keyframes ds-skeleton-sweep {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        :host {
          background: var(--color-dark-6);
        }
        :host::after {
          animation: none;
          background: var(--color-dark-6);
        }
      }
    `,
  ],
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly radius = input('0.4rem');
}
