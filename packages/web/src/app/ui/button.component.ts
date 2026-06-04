import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { PALETTE, type AccentColor } from './palette';

export type ButtonVariant = 'filled' | 'outline' | 'subtle' | 'transparent';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'compact';

/** Mantine-style button with colour + variant + size, driven by CSS vars. */
@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="ds-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-m-dark-7"
      [class.ds-btn--outline]="variant() === 'outline'"
      [class.ds-btn--subtle]="variant() === 'subtle'"
      [class.ds-btn--transparent]="variant() === 'transparent'"
      [class.ds-btn--sm]="size() === 'sm'"
      [class.ds-btn--lg]="size() === 'lg'"
      [class.ds-btn--compact]="size() === 'compact'"
      [class.ds-btn--block]="fullWidth()"
      [style]="styleVars()"
      [disabled]="disabled()"
      (click)="clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly color = input<AccentColor>('blue');
  readonly variant = input<ButtonVariant>('filled');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly clicked = output<MouseEvent>();

  readonly styleVars = computed(() => {
    const { base, hover } = PALETTE[this.color()];
    return {
      '--btn-bg': base,
      '--btn-bg-hover': hover,
      '--btn-accent': base,
    } as Record<string, string>;
  });
}
