import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
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
    <div class="flex flex-col gap-3" (keydown.enter)="onEnter()">
      <ds-number-input
        [label]="label()"
        [(value)]="display"
        [min]="0"
        [autofocus]="true"
      />
      <div class="ds-vm-presets">
        @for (preset of presets; track preset) {
          <button
            type="button"
            class="ds-vm-chip"
            (click)="setPreset(preset)"
          >
            {{ preset }}
          </button>
        }
      </div>
      <div class="flex">
        <ds-button
          color="green"
          fullWidth
          class="flex-1"
          [disabled]="!hasValue()"
          (click)="execute('INCREASE')"
          >{{ increaseLabel() }}</ds-button
        >
        <ds-button
          color="red"
          fullWidth
          class="flex-1"
          [disabled]="!hasValue()"
          (click)="execute('DECREASE')"
          >{{ decreaseLabel() }}</ds-button
        >
      </div>
    </div>
  `,
  styles: [
    `
      .ds-vm-presets {
        display: flex;
        gap: 0.35rem;
        flex-wrap: wrap;
      }
      .ds-vm-chip {
        flex: 1;
        min-width: 2.2rem;
        padding: 0.2rem 0.4rem;
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1.2;
        color: var(--color-dark-1, #c9c9c9);
        background: color-mix(
          in srgb,
          var(--color-dark-4, #424242) 35%,
          transparent
        );
        border: 1px solid var(--color-dark-4);
        border-radius: 0.4rem;
        cursor: pointer;
        transition:
          background 0.12s,
          color 0.12s,
          border-color 0.12s;
      }
      .ds-vm-chip:hover {
        color: var(--color-dark-0, #fff);
        background: color-mix(
          in srgb,
          var(--color-brand-blue, #228be6) 22%,
          transparent
        );
        border-color: var(--color-brand-blue, #228be6);
      }
    `,
  ],
})
export class ValueModifier {
  readonly label = input('');
  readonly increaseLabel = input('Increase');
  readonly decreaseLabel = input('Decrease');
  readonly changed = output<ValueModifierChangeEvent>();

  protected readonly display = signal<number | null>(null);

  /** Quick-set chips for common increments. */
  protected readonly presets: readonly number[] = [1, 5, 10];

  /** Buttons are submittable only when there is a non-zero amount. */
  protected readonly hasValue = computed(() => {
    const v = this.display();
    return v != null && v !== 0;
  });

  protected setPreset(value: number): void {
    this.display.set(value);
  }

  protected onEnter(): void {
    // Enter applies the common case: an increase.
    if (this.hasValue()) this.execute('INCREASE');
  }

  protected execute(type: 'INCREASE' | 'DECREASE'): void {
    if (!this.hasValue()) return;
    this.changed.emit({ type, modifyBy: this.display() ?? 0 });
    this.display.set(null);
  }
}
