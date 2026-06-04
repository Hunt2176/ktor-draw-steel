import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonComponent } from '../../ui/button.component';

/**
 * Inline confirm/cancel popover anchored to a trigger (Mantine ConfirmationPopover).
 *
 * Opens on a click of the projected trigger and closes on Cancel/Confirm, on an
 * outside click, or on Escape (mirroring `app-popover`). The trigger stops the
 * opening click from propagating so the same document-click handler that closes
 * on outside clicks does not immediately re-close it. The Confirm action defaults
 * to danger (red) styling since these confirmations are destructive.
 */
@Component({
  selector: 'app-confirmation-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <span class="inline-flex cursor-pointer" (click)="onTriggerClick($event)">
      <ng-content />
    </span>
    @if (open()) {
      <div
        class="ds-confirm-pop ds-card absolute right-0 z-[200] mt-2 w-max"
        (click)="$event.stopPropagation()"
      >
        <div class="flex flex-col gap-2">
          <span class="font-display text-sm font-semibold text-m-dark-0">{{ title() }}</span>
          <span class="text-sm text-m-dark-1">{{ message() }}</span>
          <div class="grid grid-cols-2 gap-2">
            <app-button color="gray" variant="subtle" (clicked)="cancel()">Cancel</app-button>
            <app-button color="red" (clicked)="accept()">Confirm</app-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @keyframes ds-confirm-pop-in {
        from {
          opacity: 0;
          transform: scale(0.97) translateY(-0.25rem);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .ds-confirm-pop {
        animation: ds-confirm-pop-in 0.15s ease-out;
        transform-origin: top right;
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-confirm-pop {
          animation: none;
        }
      }
    `,
  ],
  host: { class: 'relative inline-flex' },
})
export class ConfirmationPopoverComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly title = input('');
  readonly message = input('');
  readonly accepted = output<void>();
  readonly cancelled = output<void>();
  readonly open = signal(false);

  /** Toggle open; stop propagation so the document-click guard doesn't re-close. */
  onTriggerClick(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  accept(): void {
    this.open.set(false);
    this.accepted.emit();
  }

  cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }
}
