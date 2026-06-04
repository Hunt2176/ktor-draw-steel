import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
      <div dsDropdown class="ds-cp" style="min-width: 14rem">
        @if (title()) {
          <div class="ds-cp__title">{{ title() }}</div>
        }
        @if (message()) {
          <div class="ds-cp__message">{{ message() }}</div>
        }
        <div class="ds-cp__actions">
          <span class="ds-cp__action">
            <ds-button
              color="gray"
              variant="subtle"
              fullWidth
              (click)="cancel()"
              aria-label="Cancel"
            >
              Cancel
            </ds-button>
          </span>
          <span #confirmHost class="ds-cp__action">
            <ds-button
              color="red"
              fullWidth
              (click)="confirm()"
              aria-label="Confirm"
            >
              Confirm
            </ds-button>
          </span>
        </div>
      </div>
    </ds-popover>
  `,
  styles: [
    `
      .ds-cp {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .ds-cp__title {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--color-dark-0, #fff);
      }
      .ds-cp__message {
        font-size: 0.85rem;
        line-height: 1.4;
        color: var(--color-dark-2, #c1c2c5);
      }
      .ds-cp__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-top: 0.15rem;
      }
      .ds-cp__action {
        display: block;
      }
    `,
  ],
})
export class ConfirmationPopover {
  readonly title = input('');
  readonly message = input('');
  readonly accept = output<void>();
  readonly cancel_ = output<void>({ alias: 'cancelled' });

  protected readonly opened = signal(false);

  private readonly confirmHost =
    viewChild<ElementRef<HTMLElement>>('confirmHost');

  constructor() {
    // When the popover opens, focus the Confirm button so Enter confirms.
    effect(() => {
      if (!this.opened()) return;
      // Defer so the CDK overlay (and the view query) have rendered/settled.
      queueMicrotask(() => {
        const host = this.confirmHost()?.nativeElement;
        host?.querySelector('button')?.focus();
      });
    });
  }

  protected cancel(): void {
    this.opened.set(false);
    this.cancel_.emit();
  }

  protected confirm(): void {
    this.opened.set(false);
    this.accept.emit();
  }
}
