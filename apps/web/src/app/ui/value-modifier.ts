import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NumberInput } from './inputs';
import { Button } from './button';

export interface ValueModifierChangeEvent {
  type: 'INCREASE' | 'DECREASE';
  modifyBy: number;
}

/** Mantine value-modifier popover body: a number field + increase/decrease. */
@Component({
  selector: 'ds-value-modifier',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NumberInput, Button],
  template: `
    <div class="flex flex-col gap-3">
      <ds-number-input
        [label]="label()"
        [(value)]="display"
        [min]="0"
        [autofocus]="true"
      />
      <div class="flex">
        <ds-button
          color="green"
          fullWidth
          class="flex-1"
          (click)="execute('INCREASE')"
          >{{ increaseLabel() }}</ds-button
        >
        <ds-button
          color="red"
          fullWidth
          class="flex-1"
          (click)="execute('DECREASE')"
          >{{ decreaseLabel() }}</ds-button
        >
      </div>
    </div>
  `,
})
export class ValueModifier {
  readonly label = input('');
  readonly increaseLabel = input('Increase');
  readonly decreaseLabel = input('Decrease');
  readonly changed = output<ValueModifierChangeEvent>();

  protected readonly display = signal<number | null>(null);

  protected execute(type: 'INCREASE' | 'DECREASE'): void {
    this.changed.emit({ type, modifyBy: this.display() ?? 0 });
    this.display.set(null);
  }
}
