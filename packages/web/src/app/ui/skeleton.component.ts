import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Reusable shimmer placeholder block for loading states. Width/height accept any
 * CSS length (e.g. `'100%'`, `'12rem'`); `rounded` toggles a pill radius. The
 * shimmer keyframe is component-scoped and disabled under prefers-reduced-motion.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ds-skeleton" [style.width]="width()" [style.height]="height()" [style.borderRadius]="radius()" aria-hidden="true"></span>`,
  styles: [
    `
      :host {
        display: block;
      }
      .ds-skeleton {
        display: block;
        background: linear-gradient(
          100deg,
          var(--color-m-dark-6, #25262b) 30%,
          var(--color-m-dark-4, #373a40) 50%,
          var(--color-m-dark-6, #25262b) 70%
        );
        background-size: 200% 100%;
        animation: ds-skeleton-shimmer 1.4s ease-in-out infinite;
      }
      @keyframes ds-skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-skeleton {
          animation: none;
        }
      }
    `,
  ],
})
export class SkeletonComponent {
  /** Any CSS length for the block width. */
  readonly width = input<string>('100%');
  /** Any CSS length for the block height. */
  readonly height = input<string>('1rem');
  /** When true uses a pill radius, otherwise a subtle card radius. */
  readonly rounded = input<boolean>(false);

  protected readonly radius = computed(() => (this.rounded() ? '9999px' : '0.5rem'));
}
