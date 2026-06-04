import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PALETTE, type AccentColor } from './palette';

/** Square icon button (Mantine ActionIcon). */
@Component({
  selector: 'app-action-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="ds-action-icon"
      [class.ds-action-icon--outline]="variant() === 'outline'"
      [class.ds-action-icon--lg]="size() === 'lg'"
      [style]="styleVars()"
      [disabled]="disabled()"
      (click)="clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
})
export class ActionIconComponent {
  readonly color = input<AccentColor>('blue');
  readonly variant = input<'filled' | 'outline'>('filled');
  readonly size = input<'md' | 'lg'>('md');
  readonly disabled = input(false);
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
