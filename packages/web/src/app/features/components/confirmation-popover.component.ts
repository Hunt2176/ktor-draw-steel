import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ButtonComponent } from '../../ui/button.component';

/** Inline confirm/cancel popover anchored to a trigger (Mantine ConfirmationPopover). */
@Component({
  selector: 'app-confirmation-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <span class="inline-flex" (click)="open.set(true)">
      <ng-content />
    </span>
    @if (open()) {
      <div class="ds-card absolute z-[200] mt-2 w-max" (click)="$event.stopPropagation()">
        <div class="flex flex-col gap-2">
          <span class="font-semibold">{{ title() }}</span>
          <span>{{ message() }}</span>
          <div class="grid grid-cols-2 gap-2">
            <app-button (clicked)="cancel()">Cancel</app-button>
            <app-button (clicked)="accept()">Confirm</app-button>
          </div>
        </div>
      </div>
    }
  `,
  host: { class: 'relative inline-flex' },
})
export class ConfirmationPopoverComponent {
  readonly title = input('');
  readonly message = input('');
  readonly accepted = output<void>();
  readonly cancelled = output<void>();
  readonly open = signal(false);

  accept(): void {
    this.open.set(false);
    this.accepted.emit();
  }

  cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }
}
