import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Mantine `TextInput` approximation. */
@Component({
  selector: 'ds-text-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ds-field">
      @if (label()) {
        <span class="ds-label">{{ label() }}</span>
      }
      <input
        class="ds-input"
        [type]="type()"
        [value]="value() ?? ''"
        [placeholder]="placeholder()"
        [attr.autofocus]="autofocus() ? '' : null"
        (input)="value.set($any($event.target).value)"
      />
    </label>
  `,
})
export class TextInput {
  readonly value = model<string>('');
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input('text');
  readonly autofocus = input(false);
}

/** Mantine `NumberInput` approximation (emits number | null). */
@Component({
  selector: 'ds-number-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ds-field">
      @if (label()) {
        <span class="ds-label">{{ label() }}</span>
      }
      <input
        class="ds-input"
        type="number"
        [value]="value() ?? ''"
        [placeholder]="placeholder()"
        [attr.min]="min()"
        [attr.step]="step()"
        [attr.autofocus]="autofocus() ? '' : null"
        (input)="onInput($any($event.target).value)"
        (wheel)="onWheel($event)"
      />
    </label>
  `,
})
export class NumberInput {
  readonly value = model<number | null>(null);
  readonly label = input('');
  readonly placeholder = input('');
  readonly min = input<number | null>(null);
  /** Increment used by native steppers/arrow keys. Defaults to 1. */
  readonly step = input<number>(1);
  readonly autofocus = input(false);

  protected onInput(raw: string): void {
    if (raw.trim() === '') {
      this.value.set(null);
      return;
    }
    const n = Number.parseInt(raw, 10);
    this.value.set(Number.isNaN(n) ? null : n);
  }

  /**
   * Guard against accidental value changes when scrolling the page over a
   * focused number input. The native control normally increments/decrements on
   * wheel; we suppress that so the page scrolls instead.
   */
  protected onWheel(event: WheelEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && document.activeElement === target) {
      target.blur();
    }
  }
}

/** Mantine `Textarea` approximation. */
@Component({
  selector: 'ds-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ds-field">
      @if (label()) {
        <span class="ds-label">{{ label() }}</span>
      }
      <textarea
        class="ds-input"
        rows="3"
        [value]="value() ?? ''"
        (input)="value.set($any($event.target).value)"
      ></textarea>
    </label>
  `,
})
export class Textarea {
  readonly value = model<string>('');
  readonly label = input('');
}

/** Mantine `Select` approximation. */
@Component({
  selector: 'ds-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ds-field">
      @if (label()) {
        <span class="ds-label">{{ label() }}</span>
      }
      <select
        class="ds-input"
        [value]="value()"
        (change)="value.set($any($event.target).value)"
      >
        @for (opt of options(); track opt) {
          <option [value]="opt">{{ opt }}</option>
        }
      </select>
    </label>
  `,
})
export class Select {
  readonly value = model<string>('');
  readonly label = input('');
  readonly options = input<readonly string[]>([]);
}

/** Mantine `Switch` approximation. */
@Component({
  selector: 'ds-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ds-switch">
      <input
        type="checkbox"
        class="ds-switch-input"
        [checked]="checked()"
        (change)="checked.set($any($event.target).checked)"
      />
      <span class="ds-switch-track"></span>
      @if (label()) {
        <span class="ds-switch-label">{{ label() }}</span>
      }
    </label>
  `,
  styles: [
    `
      .ds-switch {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
      /* Real, focusable checkbox kept in the layout but visually hidden so it
       * stays keyboard-accessible (space toggles, focus reaches it). */
      .ds-switch-input {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: 0;
        padding: 0;
        border: 0;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        overflow: hidden;
        white-space: nowrap;
      }
      .ds-switch-track {
        width: 36px;
        height: 20px;
        flex: none;
        border-radius: 999px;
        background: var(--color-dark-4);
        position: relative;
        transition:
          background 0.15s ease,
          box-shadow 0.15s ease;
      }
      .ds-switch-track::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.15s ease;
      }
      .ds-switch-input:checked + .ds-switch-track {
        background: var(--color-brand-blue);
      }
      .ds-switch-input:checked + .ds-switch-track::after {
        transform: translateX(16px);
      }
      /* Mirror the global brand-blue :focus-visible ring on the visible track. */
      .ds-switch-input:focus-visible + .ds-switch-track {
        outline: 2px solid var(--color-brand-blue);
        outline-offset: 2px;
      }
      .ds-switch-label {
        font-size: 0.9rem;
      }
    `,
  ],
})
export class Switch {
  readonly checked = model<boolean>(false);
  readonly label = input('');
}

/** Mantine `Checkbox` approximation. */
@Component({
  selector: 'ds-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ds-checkbox">
      <input
        type="checkbox"
        [checked]="checked()"
        (change)="checked.set($any($event.target).checked)"
      />
      <span>{{ label() }}</span>
    </label>
  `,
  styles: [
    `
      .ds-checkbox {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
      }
      .ds-checkbox input {
        width: 16px;
        height: 16px;
        flex: none;
        /* Brand-blue fill in the checked state with a crisp themed border. */
        accent-color: var(--color-brand-blue);
        border-radius: 0.25rem;
        cursor: pointer;
      }
      /* Mirror the global brand-blue :focus-visible ring. */
      .ds-checkbox input:focus-visible {
        outline: 2px solid var(--color-brand-blue);
        outline-offset: 2px;
      }
    `,
  ],
})
export class Checkbox {
  readonly checked = model<boolean>(false);
  readonly label = input('');
}
