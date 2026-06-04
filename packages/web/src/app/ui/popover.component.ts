import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Click-toggled popover with an anchored dropdown (Mantine Popover). Project the
 * trigger with `[popTarget]` and the content with `[popDropdown]`. Closes on
 * outside click; exposes `close()` via `exportAs`.
 */
@Component({
  selector: 'app-popover',
  standalone: true,
  exportAs: 'popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex cursor-pointer" (click)="toggle($event)">
      <ng-content select="[popTarget]" />
    </span>
    @if (open()) {
      <div
        class="ds-card absolute z-[200] mt-2 min-w-[16rem]"
        [class.left-0]="position() === 'left'"
        [class.left-1-2]="position() === 'center'"
        (click)="$event.stopPropagation()"
      >
        <ng-content select="[popDropdown]" />
      </div>
    }
  `,
  host: { class: 'relative inline-flex' },
})
export class PopoverComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly position = input<'left' | 'center'>('left');
  readonly open = signal(false);

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
