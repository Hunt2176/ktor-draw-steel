import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { IconComponent } from './icon.component';

/**
 * Centred empty-state placeholder: a large muted icon, a title, a message, and
 * an optional projected action (e.g. a button) via the default `<ng-content>`.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="ds-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      @if (icon(); as i) {
        <span class="text-4xl text-m-dark-3"><app-icon [name]="i" /></span>
      }
      <h3 class="font-display text-lg font-bold text-m-dark-0">{{ title() }}</h3>
      @if (message()) {
        <p class="max-w-sm text-sm text-m-dark-2">{{ message() }}</p>
      }
      <div class="empty-action"><ng-content /></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .empty-action:empty {
        display: none;
      }
    `,
  ],
})
export class EmptyStateComponent {
  /** Optional FontAwesome icon shown above the title. */
  readonly icon = input<IconDefinition | undefined>(undefined);
  /** Headline text. */
  readonly title = input.required<string>();
  /** Optional supporting message. */
  readonly message = input<string>('');
}
