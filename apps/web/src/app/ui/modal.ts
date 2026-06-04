import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
} from '@angular/core';

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
        <div class="ds-modal glass" (click)="$event.stopPropagation()">
          <div class="ds-modal-header">
            <div class="ds-modal-title">{{ title() }}</div>
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
        background: rgba(0, 0, 0, 0.55);
        padding: 3rem 1rem;
        overflow-y: auto;
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

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.opened()) this.closed.emit();
  }
}
