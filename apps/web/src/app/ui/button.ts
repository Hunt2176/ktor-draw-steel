import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { colorPair } from './colors';

export type ButtonVariant =
  | 'filled'
  | 'outline'
  | 'subtle'
  | 'light'
  | 'transparent';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/** Mantine `Button` approximation. */
@Component({
  selector: 'ds-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [attr.type]="type()"
      class="ds-btn"
      [class.ds-btn--filled]="variant() === 'filled'"
      [class.ds-btn--outline]="variant() === 'outline'"
      [class.ds-btn--subtle]="variant() === 'subtle'"
      [class.ds-btn--light]="variant() === 'light'"
      [class.ds-btn--transparent]="variant() === 'transparent'"
      [class.ds-btn--full]="fullWidth()"
      [class]="sizeClass()"
      [style.--c]="pair().c"
      [style.--ch]="pair().ch"
      [disabled]="disabled() || loading()"
    >
      @if (loading()) {
        <span class="ds-btn__spinner" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .ds-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        border-radius: 0.5rem;
        font-weight: 600;
        line-height: 1.2;
        cursor: pointer;
        border: 1px solid transparent;
        transition:
          background 0.12s,
          color 0.12s,
          border-color 0.12s,
          transform 0.06s ease;
        user-select: none;
        white-space: nowrap;
      }
      .ds-btn:active:not(:disabled) {
        transform: translateY(1px);
      }
      .ds-btn:focus-visible {
        outline-offset: 2px;
      }
      .ds-sz-xs {
        padding: 0.22rem 0.6rem;
        font-size: 0.72rem;
      }
      .ds-sz-sm {
        padding: 0.4rem 0.9rem;
        font-size: 0.85rem;
      }
      .ds-sz-md {
        padding: 0.5rem 1.1rem;
        font-size: 0.95rem;
      }
      .ds-sz-lg {
        padding: 0.62rem 1.4rem;
        font-size: 1.05rem;
      }
      .ds-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .ds-btn--full {
        width: 100%;
      }
      .ds-btn--filled {
        background: var(--c);
        color: #fff;
      }
      .ds-btn--filled:hover:not(:disabled) {
        background: var(--ch);
      }
      .ds-btn--outline {
        background: transparent;
        color: var(--c);
        border-color: var(--c);
      }
      .ds-btn--outline:hover:not(:disabled) {
        background: color-mix(in srgb, var(--c) 12%, transparent);
      }
      .ds-btn--subtle {
        background: transparent;
        color: var(--c);
      }
      .ds-btn--subtle:hover:not(:disabled) {
        background: color-mix(in srgb, var(--c) 14%, transparent);
      }
      .ds-btn--light {
        background: color-mix(in srgb, var(--c) 16%, transparent);
        color: var(--c);
      }
      .ds-btn--light:hover:not(:disabled) {
        background: color-mix(in srgb, var(--c) 24%, transparent);
      }
      .ds-btn--transparent {
        background: transparent;
        color: var(--c);
        padding-left: 0.4rem;
        padding-right: 0.4rem;
      }
      .ds-btn--transparent:hover:not(:disabled) {
        color: var(--ch);
      }
      .ds-btn--filled:active:not(:disabled) {
        background: var(--ch);
      }
      .ds-btn--outline:active:not(:disabled),
      .ds-btn--subtle:active:not(:disabled) {
        background: color-mix(in srgb, var(--c) 20%, transparent);
      }
      .ds-btn--light:active:not(:disabled) {
        background: color-mix(in srgb, var(--c) 30%, transparent);
      }
      .ds-btn__spinner {
        display: inline-block;
        width: 0.85em;
        height: 0.85em;
        flex: none;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-top-color: transparent;
        animation: ds-btn-spin 0.6s linear infinite;
      }
      @keyframes ds-btn-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-btn {
          transition: none;
        }
        .ds-btn:active:not(:disabled) {
          transform: none;
        }
        .ds-btn__spinner {
          animation-duration: 1.2s;
        }
      }
    `,
  ],
})
export class Button {
  readonly color = input<string>('blue');
  readonly variant = input<ButtonVariant>('filled');
  readonly size = input<ButtonSize>('sm');
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit'>('button');

  protected readonly pair = computed(() => colorPair(this.color()));
  protected readonly sizeClass = computed(() => `ds-sz-${this.size()}`);
}
