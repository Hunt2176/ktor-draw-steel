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
        [attr.autofocus]="autofocus() ? '' : null"
        (input)="onInput($any($event.target).value)"
      />
    </label>
  `,
})
export class NumberInput {
  readonly value = model<number | null>(null);
  readonly label = input('');
  readonly placeholder = input('');
  readonly min = input<number | null>(null);
  readonly autofocus = input(false);

  protected onInput(raw: string): void {
    if (raw.trim() === '') {
      this.value.set(null);
      return;
    }
    const n = Number.parseInt(raw, 10);
    this.value.set(Number.isNaN(n) ? null : n);
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
      .ds-switch input {
        display: none;
      }
      .ds-switch-track {
        width: 36px;
        height: 20px;
        border-radius: 999px;
        background: var(--color-dark-4);
        position: relative;
        transition: background 0.15s;
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
        transition: transform 0.15s;
      }
      .ds-switch input:checked + .ds-switch-track {
        background: var(--color-brand-blue);
      }
      .ds-switch input:checked + .ds-switch-track::after {
        transform: translateX(16px);
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
        accent-color: var(--color-brand-blue);
      }
    `,
  ],
})
export class Checkbox {
  readonly checked = model<boolean>(false);
  readonly label = input('');
}
