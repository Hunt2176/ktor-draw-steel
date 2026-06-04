import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Mantine glass "anchored" pill used for section headers. */
@Component({
  selector: 'ds-anchored',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'glass',
    '[class.left-anchored]': "position() === 'left'",
    '[class.right-anchored]': "position() === 'right'",
  },
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        width: fit-content;
      }
    `,
  ],
})
export class Anchored {
  readonly position = input<'left' | 'right'>('left');
}
