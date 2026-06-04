import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Mantine `Card` approximation — a frosted-glass panel. */
@Component({
  selector: 'ds-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'glass',
    '[class.ds-card--border]': 'withBorder()',
  },
  styles: [
    `
      :host {
        display: block;
        border-radius: 0.6rem;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      }
      :host(.ds-card--border) {
        border: 1px solid var(--color-dark-4);
      }
    `,
  ],
})
export class Card {
  readonly withBorder = input(false);
}
