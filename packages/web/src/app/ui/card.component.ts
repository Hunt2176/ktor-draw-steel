import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

/** Glassmorphic surface (Mantine Card with the project's `.glass` styling). */
@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'ds-card block',
    '[class.cursor-pointer]': 'interactive()',
    '[class.transition-colors]': 'interactive()',
    '[class.hover:border-ds-accent]': 'interactive()',
    '[class.focus-visible:outline-none]': 'interactive()',
    '[class.focus-visible:ring-2]': 'interactive()',
    '[class.focus-visible:ring-ds-accent]': 'interactive()',
    '[class.focus-visible:ring-offset-2]': 'interactive()',
    '[class.focus-visible:ring-offset-m-dark-7]': 'interactive()',
    '[attr.role]': "interactive() ? 'button' : null",
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onActivate($event)',
    '(keydown.space)': 'onActivate($event)',
  },
})
export class CardComponent {
  /** When true, the card becomes a keyboard-operable button surface. */
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly clicked = output<Event>();

  onClick(event: MouseEvent): void {
    if (!this.interactive()) return;
    this.clicked.emit(event);
  }

  onActivate(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    event.preventDefault();
    this.clicked.emit(event);
  }
}
