import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Glassmorphic surface (Mantine Card with the project's `.glass` styling). */
@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { class: 'ds-card block' },
})
export class CardComponent {}
