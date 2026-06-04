import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { colorPair } from './colors';

export type IconButtonVariant = 'filled' | 'outline' | 'subtle' | 'transparent';

/** Mantine `ActionIcon` approximation — a square icon button. */
@Component({
  selector: 'ds-icon-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="ds-ab"
      [class.ds-ab--filled]="variant() === 'filled'"
      [class.ds-ab--outline]="variant() === 'outline'"
      [class.ds-ab--subtle]="variant() === 'subtle'"
      [class.ds-ab--transparent]="variant() === 'transparent'"
      [style.--c]="pair().c"
      [style.--ch]="pair().ch"
      [style.width.px]="dim()"
      [style.height.px]="dim()"
      [attr.aria-label]="ariaLabel() || null"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .ds-ab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        cursor: pointer;
        border: 1px solid transparent;
        transition:
          background 0.12s,
          color 0.12s,
          border-color 0.12s,
          transform 0.06s ease;
      }
      .ds-ab:active:not(:disabled) {
        transform: translateY(1px);
      }
      .ds-ab:focus-visible {
        outline-offset: 2px;
      }
      .ds-ab:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .ds-ab--filled {
        background: var(--c);
        color: #fff;
      }
      .ds-ab--filled:hover:not(:disabled) {
        background: var(--ch);
      }
      .ds-ab--outline {
        background: transparent;
        color: var(--c);
        border-color: var(--c);
      }
      .ds-ab--outline:hover:not(:disabled) {
        background: color-mix(in srgb, var(--c) 12%, transparent);
      }
      .ds-ab--subtle {
        background: transparent;
        color: var(--c);
      }
      .ds-ab--subtle:hover:not(:disabled) {
        background: color-mix(in srgb, var(--c) 14%, transparent);
      }
      .ds-ab--transparent {
        background: transparent;
        color: var(--c);
      }
      .ds-ab--filled:active:not(:disabled) {
        background: var(--ch);
      }
      .ds-ab--outline:active:not(:disabled),
      .ds-ab--subtle:active:not(:disabled) {
        background: color-mix(in srgb, var(--c) 20%, transparent);
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-ab {
          transition: none;
        }
        .ds-ab:active:not(:disabled) {
          transform: none;
        }
      }
    `,
  ],
})
export class IconButton {
  readonly color = input<string>('blue');
  readonly variant = input<IconButtonVariant>('filled');
  /** size in px (Mantine md ≈ 34). */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false);
  /** Accessible label for the icon-only button (sets aria-label when provided). */
  readonly ariaLabel = input<string>('');

  protected readonly pair = computed(() => colorPair(this.color()));
  protected readonly dim = computed(
    () => ({ sm: 28, md: 34, lg: 42 })[this.size()],
  );
}
