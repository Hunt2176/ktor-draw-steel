import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ButtonComponent } from '../../ui/button.component';

export interface ValueModifierChangeEvent {
  type: 'INCREASE' | 'DECREASE';
  modifyBy: number;
}

/** Numeric +/- control used inside popovers (Mantine ValueModifier). */
@Component({
  selector: 'app-value-modifier',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col gap-2">
      @if (label()) {
        <label class="ds-label">{{ label() }}</label>
      }
      <input
        class="ds-input"
        type="number"
        min="0"
        [value]="display() === 0 ? '' : display()"
        (input)="onInput($event)"
      />
      <div class="flex">
        <app-button
          class="flex-1"
          color="green"
          fullWidth
          (clicked)="execute('INCREASE')"
          >{{ increaseLabel() }}</app-button
        >
        <app-button
          class="flex-1"
          color="red"
          fullWidth
          (clicked)="execute('DECREASE')"
          >{{ decreaseLabel() }}</app-button
        >
      </div>
    </div>
  `,
})
export class ValueModifierComponent {
  readonly label = input<string>();
  readonly increaseLabel = input('Increase');
  readonly decreaseLabel = input('Decrease');
  readonly changed = output<ValueModifierChangeEvent>();

  readonly display = signal(0);

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = Number.parseFloat(raw);
    this.display.set(Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed)));
  }

  execute(type: 'INCREASE' | 'DECREASE'): void {
    this.changed.emit({ type, modifyBy: this.display() });
    this.display.set(0);
  }
}
