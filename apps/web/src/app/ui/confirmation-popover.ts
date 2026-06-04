import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Popover } from './popover';
import { Button } from './button';

/** Mantine confirmation popover. Project the trigger with the `cpTrigger` attribute. */
@Component({
  selector: 'ds-confirmation-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Popover, Button],
  template: `
    <ds-popover [(opened)]="opened" width="auto">
      <span dsTrigger>
        <ng-content select="[cpTrigger]" />
      </span>
      <div dsDropdown class="flex flex-col gap-2" style="min-width: 13rem">
        <div class="font-semibold">{{ title() }}</div>
        <div>{{ message() }}</div>
        <div class="grid grid-cols-2 gap-2">
          <ds-button color="gray" (click)="cancel()">Cancel</ds-button>
          <ds-button color="red" (click)="confirm()">Confirm</ds-button>
        </div>
      </div>
    </ds-popover>
  `,
})
export class ConfirmationPopover {
  readonly title = input('');
  readonly message = input('');
  readonly accept = output<void>();
  readonly cancel_ = output<void>({ alias: 'cancelled' });

  protected readonly opened = signal(false);

  protected cancel(): void {
    this.opened.set(false);
    this.cancel_.emit();
  }

  protected confirm(): void {
    this.opened.set(false);
    this.accept.emit();
  }
}
