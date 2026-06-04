import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Shared body-scroll-lock state so that nested/stacked modals don't fight over
 * `document.body.style.overflow`. We only lock when the count goes 0 -> 1 and
 * only restore the saved value when it returns to 0. This guarantees the body
 * is never left permanently locked as long as every lock is balanced by an
 * unlock (callers must always unlock on close/destroy).
 */
let bodyScrollLockCount = 0;
let savedBodyOverflow = '';

function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (bodyScrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyScrollLockCount++;
}

function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (bodyScrollLockCount === 0) return;
  bodyScrollLockCount--;
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    savedBodyOverflow = '';
  }
}

/** Mantine `Modal` approximation — centered glass dialog with a backdrop. */
@Component({
  selector: 'ds-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (opened()) {
      <div
        class="ds-modal-overlay"
        [style.z-index]="zIndex()"
        (click)="closed.emit()"
      >
        <div
          #panel
          class="ds-modal glass"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title() ? null : 'Dialog'"
          [attr.aria-labelledby]="title() ? titleId : null"
          tabindex="-1"
          (click)="$event.stopPropagation()"
          (keydown)="onTab($event)"
        >
          <div class="ds-modal-header">
            <div class="ds-modal-title" [id]="titleId">{{ title() }}</div>
            <button class="ds-modal-close" type="button" (click)="closed.emit()">
              &times;
            </button>
          </div>
          <div class="ds-modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ds-modal-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        padding: 3rem 1rem;
        overflow-y: auto;
        animation: ds-modal-backdrop-in 0.18s ease-out both;
      }
      .ds-modal {
        width: 100%;
        max-width: 520px;
        border-radius: 0.75rem;
        border: 1px solid var(--color-dark-4);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        transform-origin: center top;
        animation: ds-modal-panel-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      .ds-modal:focus {
        outline: none;
      }
      @keyframes ds-modal-backdrop-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes ds-modal-panel-in {
        from {
          opacity: 0;
          transform: translateY(-0.75rem) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-modal-overlay {
          animation: ds-modal-backdrop-in 0.15s ease-out both;
        }
        .ds-modal {
          animation: ds-modal-fade-in 0.15s ease-out both;
        }
        @keyframes ds-modal-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      }
      .ds-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--color-dark-5);
      }
      .ds-modal-title {
        font-weight: 700;
        font-size: 1.05rem;
      }
      .ds-modal-close {
        background: transparent;
        border: none;
        color: var(--color-dark-1);
        font-size: 1.4rem;
        line-height: 1;
        cursor: pointer;
        padding: 0 0.25rem;
      }
      .ds-modal-close:hover {
        color: #fff;
      }
      .ds-modal-body {
        padding: 1rem;
        overflow-y: auto;
      }
    `,
  ],
})
export class Modal {
  readonly opened = input(false);
  readonly title = input('');
  /** Stacking level; nested modals should pass a higher number. */
  readonly level = input(0);
  readonly closed = output<void>();

  protected readonly zIndex = computed(() => 200 + this.level() * 10);

  /** Stable id linking the visible title to the dialog via aria-labelledby. */
  protected readonly titleId = `ds-modal-title-${nextModalId++}`;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Element that had focus before the modal opened, restored on close. */
  private previouslyFocused: HTMLElement | null = null;
  /** Whether this instance currently holds a body-scroll lock. */
  private scrollLocked = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      // Always release a held lock so the body can never be left locked.
      if (this.scrollLocked) {
        unlockBodyScroll();
        this.scrollLocked = false;
      }
    });

    // React to open/close transitions: lock scroll + move focus on open,
    // restore on close. Reading opened() registers the dependency.
    effect(() => {
      if (this.opened()) {
        this.onOpened();
      } else {
        this.onClosed();
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.opened()) this.closed.emit();
  }

  /** Keep Tab focus cycling within the dialog. */
  protected onTab(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panel()?.nativeElement;
    if (!panel) return;

    const focusable = this.getFocusable(panel);
    if (focusable.length === 0) {
      // Nothing focusable inside — keep focus on the panel itself.
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || active === panel || !panel.contains(active)) {
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

  private onOpened(): void {
    if (typeof document !== 'undefined') {
      this.previouslyFocused = document.activeElement as HTMLElement | null;
    }

    if (!this.scrollLocked) {
      lockBodyScroll();
      this.scrollLocked = true;
    }

    // Defer focus until the @if has rendered the panel into the DOM.
    queueMicrotask(() => {
      if (!this.opened()) return;
      const panel = this.panel()?.nativeElement;
      if (!panel) return;
      const focusable = this.getFocusable(panel);
      (focusable[0] ?? panel).focus();
    });
  }

  private onClosed(): void {
    if (this.scrollLocked) {
      unlockBodyScroll();
      this.scrollLocked = false;
    }

    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (target && typeof target.focus === 'function' && target.isConnected) {
      target.focus();
    }
  }

  private getFocusable(root: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-hidden') !== 'true' &&
        // Visible (not display:none / detached): offsetParent is null for
        // hidden elements, but is also null for position:fixed — the panel
        // itself isn't in this list, so this filter is safe for contents.
        (el.offsetParent !== null ||
          el.getClientRects().length > 0),
    );
  }
}

let nextModalId = 0;
