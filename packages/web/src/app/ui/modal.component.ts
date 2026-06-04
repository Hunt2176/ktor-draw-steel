import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent } from './icon.component';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * Centered overlay dialog (Mantine Modal). `level` raises the z-index so nested
 * modals (e.g. an upload modal opened from the character editor) stack on top.
 *
 * Hardened with dialog a11y semantics (role/aria-modal, labelled title),
 * Escape-to-close, initial focus + a Tab focus trap, body-scroll lock with a
 * shared ref-count for stacked modals, and a reduced-motion-safe fade/scale
 * entrance animation.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (opened()) {
      <div
        class="ds-modal-backdrop fixed inset-0 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-[8vh]"
        [style.zIndex]="zIndex()"
        (click)="closed.emit()"
        (keydown)="onKeydown($event)"
      >
        <div
          #dialog
          class="ds-modal-dialog ds-card w-full max-w-lg"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title() ? null : 'Dialog'"
          [attr.aria-labelledby]="title() ? titleId : null"
          tabindex="-1"
          (click)="$event.stopPropagation()"
        >
          @if (title()) {
            <div class="mb-3 flex items-center justify-between">
              <h2 [id]="titleId" class="text-lg font-bold">{{ title() }}</h2>
              <button
                type="button"
                aria-label="Close dialog"
                class="text-m-dark-1 hover:text-m-dark-0"
                (click)="closed.emit()"
              >
                <app-icon [name]="xmark" />
              </button>
            </div>
          } @else {
            <div class="flex justify-end">
              <button
                type="button"
                aria-label="Close dialog"
                class="text-m-dark-1 hover:text-m-dark-0"
                (click)="closed.emit()"
              >
                <app-icon [name]="xmark" />
              </button>
            </div>
          }
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: [
    `
      @keyframes ds-modal-backdrop-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes ds-modal-dialog-in {
        from {
          opacity: 0;
          transform: translateY(-0.5rem) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .ds-modal-backdrop {
        animation: ds-modal-backdrop-in 0.15s ease-out;
      }
      .ds-modal-dialog {
        animation: ds-modal-dialog-in 0.18s ease-out;
      }
      .ds-modal-dialog:focus {
        outline: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-modal-backdrop,
        .ds-modal-dialog {
          animation: none;
        }
      }
    `,
  ],
})
export class ModalComponent implements OnDestroy {
  private static openCount = 0;
  private static priorBodyOverflow: string | null = null;

  readonly opened = input(false);
  readonly title = input<string>();
  readonly level = input(0);
  readonly closed = output<void>();
  protected readonly xmark = faXmark;

  readonly zIndex = computed(() => 100 + this.level() * 10);

  private static nextId = 0;
  protected readonly titleId = `ds-modal-title-${ModalComponent.nextId++}`;

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly injector = inject(Injector);

  /** Tracks whether this instance currently holds a body-scroll lock. */
  private locked = false;

  constructor() {
    // React to open/close: lock body scroll and move focus into the dialog.
    effect(() => {
      const isOpen = this.opened();
      this.setScrollLock(isOpen);
      if (isOpen) {
        // The dialog is rendered after the @if flips; focus on next render.
        afterNextRender(() => this.focusFirst(), { injector: this.injector });
      }
    });
  }

  ngOnDestroy(): void {
    // Release any lock this instance still holds (e.g. destroyed while open).
    this.setScrollLock(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /** Locks document body scroll using a shared ref-count for stacked modals. */
  private setScrollLock(lock: boolean): void {
    if (typeof document === 'undefined') return;
    if (lock === this.locked) return;
    this.locked = lock;
    if (lock) {
      if (ModalComponent.openCount === 0) {
        ModalComponent.priorBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      ModalComponent.openCount++;
    } else {
      ModalComponent.openCount = Math.max(0, ModalComponent.openCount - 1);
      if (ModalComponent.openCount === 0) {
        document.body.style.overflow = ModalComponent.priorBodyOverflow ?? '';
        ModalComponent.priorBodyOverflow = null;
      }
    }
  }

  /** Returns the focusable descendants of the dialog, in document order. */
  private focusable(host: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(host.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
  }

  /** Moves initial focus to the first focusable child, or the dialog itself. */
  private focusFirst(): void {
    const host = this.dialog()?.nativeElement;
    if (!host) return;
    const items = this.focusable(host);
    (items[0] ?? host).focus();
  }

  /** Keeps Tab navigation cycling within the dialog. */
  private trapFocus(event: KeyboardEvent): void {
    const host = this.dialog()?.nativeElement;
    if (!host) return;
    const items = this.focusable(host);
    if (items.length === 0) {
      // Nothing focusable — keep focus on the dialog container.
      event.preventDefault();
      host.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || active === host || !host.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
