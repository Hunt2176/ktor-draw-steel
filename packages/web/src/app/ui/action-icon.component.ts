import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { PALETTE, type AccentColor } from './palette';
import { SpinnerComponent } from './spinner.component';

/** Square icon button (Mantine ActionIcon). */
@Component({
  selector: 'app-action-icon',
  standalone: true,
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="ds-action-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-m-dark-7"
      [class.ds-action-icon--outline]="variant() === 'outline'"
      [class.ds-action-icon--lg]="size() === 'lg'"
      [style]="styleVars()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      (click)="clicked.emit($event)"
    >
      @if (loading()) {
        <ds-spinner [size]="size() === 'lg' ? '1.25rem' : '1rem'" />
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class ActionIconComponent {
  readonly color = input<AccentColor>('blue');
  readonly variant = input<'filled' | 'outline'>('filled');
  readonly size = input<'md' | 'lg'>('md');
  readonly disabled = input(false);
  /** When true, replaces the icon with a spinner, disables the button, and sets aria-busy. Default off. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly clicked = output<MouseEvent>();

  readonly styleVars = computed(() => {
    const { base, hover } = PALETTE[this.color()];
    return {
      '--ai-bg': base,
      '--ai-bg-hover': hover,
      '--ai-accent': base,
    } as Record<string, string>;
  });
}
