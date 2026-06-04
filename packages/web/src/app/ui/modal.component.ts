import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon.component';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * Centered overlay dialog (Mantine Modal). `level` raises the z-index so nested
 * modals (e.g. an upload modal opened from the character editor) stack on top.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (opened()) {
      <div
        class="fixed inset-0 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-[8vh]"
        [style.zIndex]="zIndex()"
        (click)="closed.emit()"
      >
        <div
          class="ds-card w-full max-w-lg"
          (click)="$event.stopPropagation()"
        >
          @if (title()) {
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-lg font-bold">{{ title() }}</h2>
              <button class="text-m-dark-1 hover:text-m-dark-0" (click)="closed.emit()">
                <app-icon [name]="xmark" />
              </button>
            </div>
          } @else {
            <div class="flex justify-end">
              <button class="text-m-dark-1 hover:text-m-dark-0" (click)="closed.emit()">
                <app-icon [name]="xmark" />
              </button>
            </div>
          }
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly opened = input(false);
  readonly title = input<string>();
  readonly level = input(0);
  readonly closed = output<void>();
  protected readonly xmark = faXmark;

  readonly zIndex = computed(() => 100 + this.level() * 10);
}
